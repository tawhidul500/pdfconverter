from __future__ import annotations

import ctypes
import io
import re
from dataclasses import dataclass
from typing import Literal, Sequence

import cv2
import numpy as np
import pypdfium2 as pdfium
import pypdfium2.raw as pdfium_c
import pytesseract
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_ROW_HEIGHT_RULE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from PIL import Image
from lxml import etree
from pytesseract import Output

LayoutMode = Literal["editable", "visual", "hybrid"]

MAX_FILE_BYTES = 50 * 1024 * 1024
MAX_TOTAL_BYTES = 150 * 1024 * 1024
MAX_TOTAL_PAGES = 250
MIN_NATIVE_TEXT_CHARACTERS = 20
OCR_DPI = 220
HYBRID_DPI = 200
VML_NS = "urn:schemas-microsoft-com:vml"
OFFICE_NS = "urn:schemas-microsoft-com:office:office"


class ConversionError(ValueError):
    pass


@dataclass(frozen=True)
class SourcePdf:
    name: str
    data: bytes
    pages: tuple[int, ...] | None = None


@dataclass(frozen=True)
class AnalysisResult:
    page_count: int
    native_text_pages: tuple[int, ...]
    scanned_pages: tuple[int, ...]


@dataclass(frozen=True)
class ConversionResult:
    data: bytes
    page_count: int
    ocr_page_count: int
    native_text_page_count: int


@dataclass(frozen=True)
class TextLine:
    x: float
    y: float
    width: float
    height: float
    text: str
    font_size: float
    font_name: str
    bold: bool
    italic: bool


@dataclass(frozen=True)
class EditableRun:
    text: str
    font_size: float
    font_name: str
    bold: bool
    italic: bool
    color: tuple[int, int, int]


@dataclass(frozen=True)
class MaskRegion:
    x: float
    y: float
    width: float
    height: float
    color: tuple[int, int, int] | None = None


@dataclass(frozen=True)
class PositionedTextBlock:
    x: float
    y: float
    width: float
    height: float
    runs: tuple[EditableRun, ...]
    mask_regions: tuple[MaskRegion, ...]
    source: Literal["native", "ocr", "form"]

    @property
    def text(self) -> str:
        return "".join(run.text for run in self.runs)


@dataclass(frozen=True)
class ReconstructedPath:
    page_object: object
    x: float
    y: float
    width: float
    height: float
    fill_color: tuple[int, int, int]
    stroke_color: tuple[int, int, int]
    stroke_width: float
    filled: bool
    stroked: bool
    kind: Literal["rect", "roundrect", "line"]

    @property
    def right(self) -> float:
        return self.x + self.width

    @property
    def bottom(self) -> float:
        return self.y + self.height


@dataclass(frozen=True)
class ReconstructedImage:
    page_object: object
    x: float
    y: float
    width: float
    height: float
    data: bytes

    @property
    def right(self) -> float:
        return self.x + self.width

    @property
    def bottom(self) -> float:
        return self.y + self.height


@dataclass(frozen=True)
class ResidualArtwork:
    x: float
    y: float
    width: float
    height: float
    data: bytes


@dataclass(frozen=True)
class ReconstructedTableCell:
    row: int
    column: int
    x: float
    y: float
    width: float
    height: float
    fill_color: tuple[int, int, int]
    stroke_color: tuple[int, int, int]
    stroke_width: float
    filled: bool
    stroked: bool
    blocks: tuple[PositionedTextBlock, ...] = ()


@dataclass(frozen=True)
class ReconstructedTable:
    x: float
    y: float
    width: float
    height: float
    column_widths: tuple[float, ...]
    row_heights: tuple[float, ...]
    cells: tuple[ReconstructedTableCell, ...]
    page_objects: tuple[object, ...] = ()


def _clean_xml_text(value: str) -> str:
    # XML 1.0 permits TAB, LF, CR and characters from U+0020 onward, excluding
    # surrogate code points and noncharacters. Sanitizing every extracted/OCR
    # string prevents Word's unreadable-content recovery dialog.
    return "".join(
        character
        for character in value
        if character in "\t\n\r"
        or (
            ord(character) >= 0x20
            and not 0xD800 <= ord(character) <= 0xDFFF
            and ord(character) not in {0xFFFE, 0xFFFF}
        )
    )


def _safe_filename(value: str) -> str:
    cleaned = re.sub(r"[<>:\"/\\|?*\x00-\x1f]", "-", value).strip().strip(".")
    return cleaned[:120] or "NovaPDF-word"


def _open_pdf(source: SourcePdf) -> pdfium.PdfDocument:
    if not source.data or len(source.data) > MAX_FILE_BYTES:
        raise ConversionError(f"{source.name} is empty or exceeds the 50 MB file limit.")
    try:
        document = pdfium.PdfDocument(source.data)
    except Exception as error:
        # PDFium intentionally exposes a compact error surface. A protected PDF
        # and a damaged PDF can both fail at open time; the user action is the same.
        raise ConversionError(
            f"{source.name} is invalid, damaged, unsupported, or password-protected. Unlock it before conversion."
        ) from error
    if len(document) < 1:
        document.close()
        raise ConversionError(f"{source.name} has no pages.")
    return document


def _selected_pages(source: SourcePdf, page_count: int) -> tuple[int, ...]:
    if source.pages is None:
        return tuple(range(page_count))
    normalized = tuple(sorted({page - 1 for page in source.pages if 1 <= page <= page_count}))
    if not normalized:
        raise ConversionError(f"{source.name} has no valid selected pages.")
    return normalized


def _page_text(page: pdfium.PdfPage) -> str:
    text_page = page.get_textpage()
    try:
        return _clean_xml_text(text_page.get_text_range() or "")
    finally:
        text_page.close()


def _native_character_count(page: pdfium.PdfPage) -> int:
    return len(re.sub(r"\s+", "", _page_text(page)))


def analyze_pdf(source: SourcePdf) -> AnalysisResult:
    document = _open_pdf(source)
    try:
        native: list[int] = []
        scanned: list[int] = []
        for index in range(len(document)):
            page = document[index]
            try:
                page_number = index + 1
                if _native_character_count(page) >= MIN_NATIVE_TEXT_CHARACTERS:
                    native.append(page_number)
                else:
                    scanned.append(page_number)
            finally:
                page.close()
        return AnalysisResult(len(document), tuple(native), tuple(scanned))
    finally:
        document.close()


def _configure_section(section, width_points: float, height_points: float, visual: bool) -> None:
    section.page_width = Pt(max(72, width_points))
    section.page_height = Pt(max(72, height_points))
    margin = Inches(0.14 if visual else 0.42)
    section.top_margin = margin
    section.bottom_margin = margin
    section.left_margin = margin
    section.right_margin = margin
    section.header_distance = Pt(0)
    section.footer_distance = Pt(0)


def _set_cell_margins(cell, top: int = 0, start: int = 0, bottom: int = 0, end: int = 0) -> None:
    cell_properties = cell._tc.get_or_add_tcPr()
    margins = cell_properties.first_child_found_in("w:tcMar")
    if margins is None:
        margins = OxmlElement("w:tcMar")
        cell_properties.append(margins)
    for edge, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = margins.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            margins.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def _fit_image_dimensions(page_width: float, page_height: float, margin_points: float = 20) -> tuple[Pt, Pt]:
    usable_width = max(36.0, page_width - margin_points * 2)
    usable_height = max(36.0, page_height - margin_points * 2)
    scale = min(usable_width / max(1.0, page_width), usable_height / max(1.0, page_height))
    return Pt(page_width * scale), Pt(page_height * scale)


def _render_page_pil(page: pdfium.PdfPage, dpi: int) -> Image.Image:
    scale = max(0.5, dpi / 72.0)
    bitmap = page.render(scale=scale)
    try:
        return bitmap.to_pil().convert("RGB")
    finally:
        bitmap.close()


def _render_page_image(page: pdfium.PdfPage, dpi: int = 180) -> bytes:
    image = _render_page_pil(page, dpi)
    try:
        output = io.BytesIO()
        image.save(output, format="PNG", optimize=True)
        return output.getvalue()
    finally:
        image.close()


def _append_hidden_search_layer(paragraph, lines: Sequence[TextLine]) -> None:
    # Preserve-layout output uses a rendered page image as the visible layer.
    # The OCR/native text is stored in a hidden run in the same paragraph, so
    # Word can search and copy recognized content without changing pagination,
    # image placement, or the visual appearance of the page.
    searchable_text = _clean_xml_text(" ".join(line.text.strip() for line in lines if line.text.strip())).strip()
    if not searchable_text:
        return
    run = paragraph.add_run(searchable_text)
    run.font.name = "Arial"
    run.font.size = Pt(1)
    run.font.hidden = True
    run_properties = run._r.get_or_add_rPr()
    no_proof = OxmlElement("w:noProof")
    run_properties.append(no_proof)


def _append_visual_page(
    document: Document,
    page: pdfium.PdfPage,
    first_page: bool,
    use_ocr: bool,
    language: str,
) -> tuple[bool, bool]:
    page_width, page_height = page.get_size()
    section = document.sections[0] if first_page else document.add_section(WD_SECTION.NEW_PAGE)
    _configure_section(section, page_width, page_height, visual=True)
    image = _render_page_image(page)
    width, height = _fit_image_dimensions(page_width, page_height)
    paragraph = (
        document.paragraphs[0]
        if first_page and len(document.paragraphs) == 1 and not document.paragraphs[0].text
        else document.add_paragraph()
    )
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.alignment = 1
    paragraph.add_run().add_picture(io.BytesIO(image), width=width, height=height)

    if not use_ocr:
        return False, False

    native_text = _native_character_count(page) >= MIN_NATIVE_TEXT_CHARACTERS
    used_ocr = not native_text
    lines = _native_lines(page) if native_text else _ocr_lines(page, language)
    _append_hidden_search_layer(paragraph, lines)
    return used_ocr, native_text


def _font_traits(font_name: str, weight: int) -> tuple[bool, bool]:
    lowered = font_name.lower()
    bold = weight >= 600 or any(token in lowered for token in ("bold", "black", "semibold", "demi"))
    italic = "italic" in lowered or "oblique" in lowered
    return bold, italic


def _word_font_name(font_name: str) -> str:
    cleaned = re.sub(r"^[A-Z]{6}\+", "", (font_name or "").strip())
    normalized = re.sub(r"[^a-z0-9]", "", cleaned.lower())
    if any(token in normalized for token in ("helvetica", "arial", "dejavusans", "liberationsans")):
        return "Arial"
    if any(token in normalized for token in ("times", "liberationserif", "dejavuserif")):
        return "Times New Roman"
    if any(token in normalized for token in ("courier", "liberationmono", "dejavusansmono")):
        return "Courier New"
    return cleaned or "Arial"


def _native_lines(page: pdfium.PdfPage) -> list[TextLine]:
    page_width, page_height = page.get_size()
    text_page = page.get_textpage()
    try:
        character_count = text_page.count_chars()
        lines: list[TextLine] = []
        current: list[tuple[str, tuple[float, float, float, float], float, str, bool, bool]] = []

        def flush() -> None:
            if not current:
                return
            text = _clean_xml_text("".join(item[0] for item in current)).strip()
            if not text:
                current.clear()
                return
            visible = [item for item in current if item[0].strip()]
            metrics = visible or current
            left = min(item[1][0] for item in metrics)
            bottom = min(item[1][1] for item in metrics)
            right = max(item[1][2] for item in metrics)
            top = max(item[1][3] for item in metrics)
            sizes = [item[2] for item in metrics if item[2] > 0]
            fonts = [item[3] for item in metrics if item[3]]
            bold_votes = sum(int(item[4]) for item in metrics)
            italic_votes = sum(int(item[5]) for item in metrics)
            lines.append(
                TextLine(
                    x=max(0.0, left),
                    y=max(0.0, page_height - top),
                    width=max(1.0, right - left),
                    height=max(1.0, top - bottom),
                    text=text,
                    font_size=max(7.0, min(72.0, sum(sizes) / len(sizes) if sizes else 11.0)),
                    font_name=fonts[0] if fonts else "Arial",
                    bold=bold_votes >= max(1, len(metrics) // 2),
                    italic=italic_votes >= max(1, len(metrics) // 2),
                )
            )
            current.clear()

        for index in range(character_count):
            raw_character = text_page.get_text_range(index, 1) or ""
            character = _clean_xml_text(raw_character)
            if character in {"\r", "\n", "\r\n"}:
                flush()
                continue
            if not character:
                continue
            try:
                box = tuple(float(value) for value in text_page.get_charbox(index))
            except Exception:
                box = (0.0, 0.0, page_width, 11.0)
            font_size = 11.0
            raw_font_name = "Arial"
            font_name = "Arial"
            weight = 0
            try:
                text_object = text_page.get_textobj(index)
                if text_object is not None:
                    font_size = float(text_object.get_font_size() or 11.0)
                    font = text_object.get_font()
                    if font is not None:
                        raw_font_name = str(font.get_base_name() or font.get_family_name() or "Arial")
                        font_name = _word_font_name(raw_font_name)
                        weight = int(font.get_weight() or 0)
            except Exception:
                pass
            bold, italic = _font_traits(raw_font_name, weight)
            current.append((character, box, font_size, font_name, bold, italic))
        flush()
        return sorted(lines, key=lambda line: (round(line.y, 1), line.x))
    finally:
        text_page.close()


def _ocr_lines(page: pdfium.PdfPage, language: str) -> list[TextLine]:
    image = _render_page_pil(page, OCR_DPI)
    try:
        data = pytesseract.image_to_data(
            image,
            lang=language,
            config="--oem 1 --psm 3",
            output_type=Output.DICT,
        )
    except pytesseract.TesseractError as error:
        raise ConversionError(
            f"OCR failed for language '{language}'. Install the matching Tesseract language pack or choose English/Bangla."
        ) from error
    finally:
        image.close()

    grouped: dict[tuple[int, int, int], list[int]] = {}
    for index, raw_text in enumerate(data.get("text", [])):
        text = _clean_xml_text(str(raw_text)).strip()
        try:
            confidence = float(data.get("conf", ["-1"])[index])
        except (TypeError, ValueError, IndexError):
            confidence = -1
        if not text or confidence < 20:
            continue
        key = (
            int(data.get("block_num", [0])[index]),
            int(data.get("par_num", [0])[index]),
            int(data.get("line_num", [0])[index]),
        )
        grouped.setdefault(key, []).append(index)

    point_scale = 72.0 / OCR_DPI
    lines: list[TextLine] = []
    for indexes in grouped.values():
        indexes.sort(key=lambda index: int(data["left"][index]))
        text = " ".join(_clean_xml_text(str(data["text"][index])).strip() for index in indexes).strip()
        if not text:
            continue
        left = min(int(data["left"][index]) for index in indexes)
        top = min(int(data["top"][index]) for index in indexes)
        right = max(int(data["left"][index]) + int(data["width"][index]) for index in indexes)
        bottom = max(int(data["top"][index]) + int(data["height"][index]) for index in indexes)
        height = max(1, bottom - top)
        lines.append(
            TextLine(
                x=left * point_scale,
                y=top * point_scale,
                width=max(1.0, (right - left) * point_scale),
                height=height * point_scale,
                text=text,
                font_size=max(7.0, min(32.0, height * point_scale * 0.82)),
                font_name="Arial",
                bold=False,
                italic=False,
            )
        )
    return sorted(lines, key=lambda line: (round(line.y, 1), line.x))


def _character_fill_color(text_page: pdfium.PdfTextPage, index: int) -> tuple[int, int, int]:
    red = ctypes.c_uint(0)
    green = ctypes.c_uint(0)
    blue = ctypes.c_uint(0)
    alpha = ctypes.c_uint(255)
    try:
        ok = pdfium_c.FPDFText_GetFillColor(
            text_page.raw,
            index,
            ctypes.byref(red),
            ctypes.byref(green),
            ctypes.byref(blue),
            ctypes.byref(alpha),
        )
        if ok:
            return int(red.value), int(green.value), int(blue.value)
    except Exception:
        pass
    return 0, 0, 0


def _style_for_character(text_page: pdfium.PdfTextPage, index: int) -> tuple[float, str, bool, bool, tuple[int, int, int]]:
    font_size = 11.0
    raw_font_name = "Arial"
    font_name = "Arial"
    weight = 0
    color = _character_fill_color(text_page, index)
    try:
        text_object = text_page.get_textobj(index)
        if text_object is not None:
            font_size = float(text_object.get_font_size() or 11.0)
            font = text_object.get_font()
            if font is not None:
                raw_font_name = str(font.get_base_name() or font.get_family_name() or "Arial")
                font_name = _word_font_name(raw_font_name)
                weight = int(font.get_weight() or 0)
            object_color = _page_object_color(text_object, fill=True)
            if object_color[3] >= 16:
                color = tuple(int(value) for value in object_color[:3])
    except Exception:
        pass
    # Detect style from the original PDF font name before mapping Helvetica/Times
    # to installed Word fonts. Mapping first discarded suffixes such as -Bold and
    # -Oblique, which caused visible style mismatch in the DOCX.
    bold, italic = _font_traits(raw_font_name, weight)
    return max(4.0, min(192.0, font_size)), font_name, bold, italic, color


def _native_positioned_blocks(page: pdfium.PdfPage) -> list[PositionedTextBlock]:
    page_width, page_height = page.get_size()
    text_page = page.get_textpage()
    try:
        characters: list[dict[str, object]] = []
        blocks: list[PositionedTextBlock] = []

        def flush() -> None:
            nonlocal characters
            if not characters:
                return
            first = next((i for i, item in enumerate(characters) if str(item["character"]).strip()), None)
            last = next((i for i in range(len(characters) - 1, -1, -1) if str(characters[i]["character"]).strip()), None)
            if first is None or last is None:
                characters = []
                return
            selected = characters[first:last + 1]
            visible = [item for item in selected if str(item["character"]).strip()]
            left = min(float(item["left"]) for item in visible)
            top = min(float(item["top"]) for item in visible)
            right = max(float(item["right"]) for item in visible)
            bottom = max(float(item["bottom"]) for item in visible)
            runs: list[EditableRun] = []
            for item in selected:
                style = item["style"]
                assert isinstance(style, tuple)
                size, name, bold, italic, color = style
                character = str(item["character"])
                key = (round(float(size), 1), str(name), bool(bold), bool(italic), color)
                previous_key = None
                if runs:
                    previous_key = (
                        round(runs[-1].font_size, 1),
                        runs[-1].font_name,
                        runs[-1].bold,
                        runs[-1].italic,
                        runs[-1].color,
                    )
                if runs and previous_key == key:
                    previous = runs[-1]
                    runs[-1] = EditableRun(
                        previous.text + character,
                        previous.font_size,
                        previous.font_name,
                        previous.bold,
                        previous.italic,
                        previous.color,
                    )
                else:
                    runs.append(EditableRun(character, float(size), str(name), bool(bold), bool(italic), color))
            mask_regions = tuple(
                MaskRegion(
                    max(0.0, float(item["left"])),
                    max(0.0, float(item["top"])),
                    max(0.5, float(item["right"]) - float(item["left"])),
                    max(0.5, float(item["bottom"]) - float(item["top"])),
                    item["style"][4],
                )
                for item in visible
            )
            if "".join(run.text for run in runs).strip():
                trimmed_runs = list(runs)
                trimmed_runs[0] = EditableRun(
                    trimmed_runs[0].text.lstrip(),
                    trimmed_runs[0].font_size,
                    trimmed_runs[0].font_name,
                    trimmed_runs[0].bold,
                    trimmed_runs[0].italic,
                    trimmed_runs[0].color,
                )
                trimmed_runs[-1] = EditableRun(
                    trimmed_runs[-1].text.rstrip(),
                    trimmed_runs[-1].font_size,
                    trimmed_runs[-1].font_name,
                    trimmed_runs[-1].bold,
                    trimmed_runs[-1].italic,
                    trimmed_runs[-1].color,
                )
                blocks.append(
                    PositionedTextBlock(
                        x=max(0.0, left),
                        y=max(0.0, top),
                        width=max(2.0, right - left),
                        height=max(2.0, bottom - top),
                        runs=tuple(run for run in trimmed_runs if run.text),
                        mask_regions=mask_regions,
                        source="native",
                    )
                )
            characters = []

        previous_visible: dict[str, object] | None = None
        for index in range(text_page.count_chars()):
            character = _clean_xml_text(text_page.get_text_range(index, 1) or "")
            if character in {"\r", "\n", "\r\n"}:
                flush()
                previous_visible = None
                continue
            if not character:
                continue
            try:
                left, bottom_pdf, right, top_pdf = (float(value) for value in text_page.get_charbox(index))
            except Exception:
                left, bottom_pdf, right, top_pdf = 0.0, page_height - 11.0, page_width, page_height
            top = max(0.0, page_height - top_pdf)
            bottom = max(top + 0.5, page_height - bottom_pdf)
            style = _style_for_character(text_page, index)
            current = {
                "character": character,
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
                "style": style,
            }
            if previous_visible is not None and character.strip():
                previous_style = previous_visible["style"]
                assert isinstance(previous_style, tuple)
                previous_size = float(previous_style[0])
                same_line = abs(top - float(previous_visible["top"])) <= max(3.5, max(style[0], previous_size) * 0.75)
                horizontal_gap = left - float(previous_visible["right"])
                split_gap = max(9.0, max(style[0], previous_size) * 1.45)
                if not same_line or horizontal_gap > split_gap:
                    flush()
            characters.append(current)
            if character.strip():
                previous_visible = current
        flush()
        return sorted(blocks, key=lambda block: (round(block.y, 1), block.x))
    finally:
        text_page.close()


def _estimate_foreground_color(image_rgb: np.ndarray, box: tuple[int, int, int, int]) -> tuple[int, int, int]:
    height, width = image_rgb.shape[:2]
    x0, y0, x1, y1 = box
    x0 = max(0, min(width - 1, x0))
    y0 = max(0, min(height - 1, y0))
    x1 = max(x0 + 1, min(width, x1))
    y1 = max(y0 + 1, min(height, y1))
    roi = image_rgb[y0:y1, x0:x1]
    if roi.size == 0:
        return 0, 0, 0
    border = np.concatenate(
        (roi[0].reshape(-1, 3), roi[-1].reshape(-1, 3), roi[:, 0].reshape(-1, 3), roi[:, -1].reshape(-1, 3)),
        axis=0,
    )
    background = np.median(border, axis=0)
    distances = np.linalg.norm(roi.astype(np.float32) - background.astype(np.float32), axis=2)
    threshold = max(18.0, float(np.percentile(distances, 75)))
    foreground = roi[distances >= threshold]
    if foreground.size == 0:
        gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
        index = np.unravel_index(int(np.argmin(gray)), gray.shape)
        color = roi[index]
    else:
        color = np.median(foreground.reshape(-1, 3), axis=0)
    return tuple(int(max(0, min(255, value))) for value in color)


def _ocr_positioned_blocks(image: Image.Image, language: str, dpi: int) -> list[PositionedTextBlock]:
    try:
        data = pytesseract.image_to_data(image, lang=language, config="--oem 1 --psm 3", output_type=Output.DICT)
    except pytesseract.TesseractError as error:
        raise ConversionError(
            f"OCR failed for language '{language}'. Install the matching Tesseract language pack or choose English/Bangla."
        ) from error
    rgb = np.asarray(image.convert("RGB"))
    grouped: dict[tuple[int, int, int], list[int]] = {}
    for index, raw_text in enumerate(data.get("text", [])):
        text = _clean_xml_text(str(raw_text)).strip()
        try:
            confidence = float(data.get("conf", ["-1"])[index])
        except (TypeError, ValueError, IndexError):
            confidence = -1
        if not text or confidence < 28 or not any(character.isalnum() for character in text):
            continue
        key = (
            int(data.get("block_num", [0])[index]),
            int(data.get("par_num", [0])[index]),
            int(data.get("line_num", [0])[index]),
        )
        grouped.setdefault(key, []).append(index)

    point_scale = 72.0 / dpi
    blocks: list[PositionedTextBlock] = []
    for indexes in grouped.values():
        indexes.sort(key=lambda index: int(data["left"][index]))
        clusters: list[list[int]] = []
        cluster: list[int] = []
        previous_right: int | None = None
        median_height = float(np.median([max(1, int(data["height"][index])) for index in indexes]))
        for index in indexes:
            left = int(data["left"][index])
            if cluster and previous_right is not None and left - previous_right > max(20.0, median_height * 2.2):
                clusters.append(cluster)
                cluster = []
            cluster.append(index)
            previous_right = left + int(data["width"][index])
        if cluster:
            clusters.append(cluster)

        for cluster_indexes in clusters:
            words = [_clean_xml_text(str(data["text"][index])).strip() for index in cluster_indexes]
            text = " ".join(word for word in words if word).strip()
            if not text:
                continue
            left = min(int(data["left"][index]) for index in cluster_indexes)
            top = min(int(data["top"][index]) for index in cluster_indexes)
            right = max(int(data["left"][index]) + int(data["width"][index]) for index in cluster_indexes)
            bottom = max(int(data["top"][index]) + int(data["height"][index]) for index in cluster_indexes)
            color = _estimate_foreground_color(rgb, (left, top, right, bottom))
            height_px = max(1, bottom - top)
            font_size = max(6.0, min(44.0, height_px * point_scale * 0.78))
            mask_regions = tuple(
                MaskRegion(
                    int(data["left"][index]) * point_scale,
                    int(data["top"][index]) * point_scale,
                    max(1, int(data["width"][index])) * point_scale,
                    max(1, int(data["height"][index])) * point_scale,
                    _estimate_foreground_color(
                        rgb,
                        (
                            int(data["left"][index]),
                            int(data["top"][index]),
                            int(data["left"][index]) + int(data["width"][index]),
                            int(data["top"][index]) + int(data["height"][index]),
                        ),
                    ),
                )
                for index in cluster_indexes
            )
            blocks.append(
                PositionedTextBlock(
                    x=left * point_scale,
                    y=top * point_scale,
                    width=max(2.0, (right - left) * point_scale),
                    height=max(2.0, height_px * point_scale),
                    runs=(EditableRun(text, font_size, "Arial", False, False, color),),
                    mask_regions=mask_regions,
                    source="ocr",
                )
            )
    return sorted(blocks, key=lambda block: (round(block.y, 1), block.x))


def _overlap_ratio(first: PositionedTextBlock, second: PositionedTextBlock) -> float:
    left = max(first.x, second.x)
    top = max(first.y, second.y)
    right = min(first.x + first.width, second.x + second.width)
    bottom = min(first.y + first.height, second.y + second.height)
    if right <= left or bottom <= top:
        return 0.0
    intersection = (right - left) * (bottom - top)
    return intersection / max(1.0, min(first.width * first.height, second.width * second.height))


def _deduplicate_ocr_blocks(
    native: Sequence[PositionedTextBlock],
    ocr: Sequence[PositionedTextBlock],
) -> list[PositionedTextBlock]:
    accepted: list[PositionedTextBlock] = []
    for candidate in ocr:
        normalized = re.sub(r"\W+", "", candidate.text).lower()
        duplicate = False
        for existing in native:
            if _overlap_ratio(candidate, existing) >= 0.35:
                duplicate = True
                break
            existing_text = re.sub(r"\W+", "", existing.text).lower()
            if (
                normalized
                and existing_text
                and (normalized in existing_text or existing_text in normalized)
                and abs(candidate.y - existing.y) < max(candidate.height, existing.height) * 1.5
            ):
                duplicate = True
                break
        if not duplicate:
            accepted.append(candidate)
    return accepted


def _page_object_color(page_object, fill: bool) -> tuple[int, int, int, int]:
    red = ctypes.c_uint(0)
    green = ctypes.c_uint(0)
    blue = ctypes.c_uint(0)
    alpha = ctypes.c_uint(255)
    function = pdfium_c.FPDFPageObj_GetFillColor if fill else pdfium_c.FPDFPageObj_GetStrokeColor
    try:
        ok = function(
            page_object.raw,
            ctypes.byref(red),
            ctypes.byref(green),
            ctypes.byref(blue),
            ctypes.byref(alpha),
        )
        if ok:
            return int(red.value), int(green.value), int(blue.value), int(alpha.value)
    except Exception:
        pass
    return (255, 255, 255, 0) if fill else (0, 0, 0, 255)


def _path_draw_properties(page_object) -> tuple[bool, bool, float]:
    fill_mode = ctypes.c_int(0)
    stroke_enabled = ctypes.c_int(0)
    stroke_width = ctypes.c_float(1.0)
    try:
        pdfium_c.FPDFPath_GetDrawMode(
            page_object.raw,
            ctypes.byref(fill_mode),
            ctypes.byref(stroke_enabled),
        )
        pdfium_c.FPDFPageObj_GetStrokeWidth(page_object.raw, ctypes.byref(stroke_width))
    except Exception:
        pass
    return fill_mode.value > 0, bool(stroke_enabled.value), max(0.25, float(stroke_width.value or 1.0))


def _path_segment_types(page_object) -> tuple[int, ...]:
    try:
        count = int(pdfium_c.FPDFPath_CountSegments(page_object.raw))
    except Exception:
        return ()
    types: list[int] = []
    for index in range(max(0, count)):
        try:
            segment = pdfium_c.FPDFPath_GetPathSegment(page_object.raw, index)
            if segment:
                types.append(int(pdfium_c.FPDFPathSegment_GetType(segment)))
        except Exception:
            return tuple(types)
    return tuple(types)


def _describe_path_object(page_object, page_height: float) -> ReconstructedPath | None:
    try:
        left, bottom_pdf, right, top_pdf = (float(value) for value in page_object.get_bounds())
    except Exception:
        return None
    width = max(0.0, right - left)
    height = max(0.0, top_pdf - bottom_pdf)
    types = _path_segment_types(page_object)
    if len(types) == 2:
        kind: Literal["rect", "roundrect", "line"] = "line"
    elif len(types) >= 4 and 1 in types:
        kind = "roundrect"
    elif 4 <= len(types) <= 8:
        kind = "rect"
    else:
        return None
    filled, stroked, stroke_width = _path_draw_properties(page_object)
    if kind == "line":
        if max(width, height) < 4.0:
            return None
    elif width < 0.75 or height < 0.75:
        return None
    fill_rgba = _page_object_color(page_object, fill=True)
    stroke_rgba = _page_object_color(page_object, fill=False)
    filled = filled and fill_rgba[3] >= 16
    stroked = stroked and stroke_rgba[3] >= 16
    if kind == "line":
        # PDF line bounds include stroke expansion. Model it as a thin native rectangle
        # because VML line coordinate behavior differs between Word and LibreOffice.
        filled = True
        stroked = False
        fill_rgba = stroke_rgba
    if not filled and not stroked:
        return None
    return ReconstructedPath(
        page_object=page_object,
        x=max(0.0, left),
        y=max(0.0, page_height - top_pdf),
        width=max(stroke_width, 0.25, width),
        height=max(stroke_width, 0.25, height),
        fill_color=tuple(int(value) for value in fill_rgba[:3]),
        stroke_color=tuple(int(value) for value in stroke_rgba[:3]),
        stroke_width=stroke_width,
        filled=filled,
        stroked=stroked,
        kind=kind,
    )


def _cluster_coordinates(values: Sequence[float], tolerance: float = 3.5) -> list[float]:
    clusters: list[list[float]] = []
    for value in sorted(values):
        if not clusters or abs(value - (sum(clusters[-1]) / len(clusters[-1]))) > tolerance:
            clusters.append([value])
        else:
            clusters[-1].append(value)
    return [sum(cluster) / len(cluster) for cluster in clusters]


def _nearest_coordinate_index(values: Sequence[float], target: float) -> int:
    return min(range(len(values)), key=lambda index: abs(values[index] - target))


def _rectangles_touch(first: ReconstructedPath, second: ReconstructedPath, tolerance: float = 4.0) -> bool:
    vertical_overlap = max(0.0, min(first.bottom, second.bottom) - max(first.y, second.y))
    horizontal_overlap = max(0.0, min(first.right, second.right) - max(first.x, second.x))
    horizontal_neighbors = (
        min(abs(first.right - second.x), abs(second.right - first.x)) <= tolerance
        and vertical_overlap >= min(first.height, second.height) * 0.55
    )
    vertical_neighbors = (
        min(abs(first.bottom - second.y), abs(second.bottom - first.y)) <= tolerance
        and horizontal_overlap >= min(first.width, second.width) * 0.55
    )
    return horizontal_neighbors or vertical_neighbors


def _path_components(paths: Sequence[ReconstructedPath]) -> list[list[ReconstructedPath]]:
    remaining = set(range(len(paths)))
    components: list[list[ReconstructedPath]] = []
    while remaining:
        seed = remaining.pop()
        queue = [seed]
        indexes = [seed]
        while queue:
            current = queue.pop()
            neighbors = [index for index in remaining if _rectangles_touch(paths[current], paths[index])]
            for neighbor in neighbors:
                remaining.remove(neighbor)
                queue.append(neighbor)
                indexes.append(neighbor)
        components.append([paths[index] for index in indexes])
    return components


def _table_cell_from_path(row: int, column: int, path: ReconstructedPath) -> ReconstructedTableCell:
    return ReconstructedTableCell(
        row=row,
        column=column,
        x=path.x,
        y=path.y,
        width=path.width,
        height=path.height,
        fill_color=path.fill_color,
        stroke_color=path.stroke_color,
        stroke_width=path.stroke_width,
        filled=path.filled,
        stroked=path.stroked,
    )


def _detect_rectangle_cell_tables(paths: Sequence[ReconstructedPath]) -> tuple[list[ReconstructedTable], set[int]]:
    candidates = [
        path
        for path in paths
        if path.kind == "rect"
        and path.stroked
        and path.width >= 14.0
        and path.height >= 7.0
        and path.width * path.height >= 160.0
    ]
    tables: list[ReconstructedTable] = []
    consumed: set[int] = set()
    for component in _path_components(candidates):
        if len(component) < 4:
            continue
        x_coordinates = _cluster_coordinates([value for path in component for value in (path.x, path.right)])
        y_coordinates = _cluster_coordinates([value for path in component for value in (path.y, path.bottom)])
        column_count = len(x_coordinates) - 1
        row_count = len(y_coordinates) - 1
        if not (2 <= column_count <= 30 and 2 <= row_count <= 100):
            continue
        mapped: dict[tuple[int, int], ReconstructedPath] = {}
        valid = True
        for path in component:
            left_index = _nearest_coordinate_index(x_coordinates, path.x)
            right_index = _nearest_coordinate_index(x_coordinates, path.right)
            top_index = _nearest_coordinate_index(y_coordinates, path.y)
            bottom_index = _nearest_coordinate_index(y_coordinates, path.bottom)
            if right_index - left_index != 1 or bottom_index - top_index != 1:
                valid = False
                break
            key = (top_index, left_index)
            if key in mapped:
                valid = False
                break
            mapped[key] = path
        if not valid:
            continue
        completeness = len(mapped) / max(1, row_count * column_count)
        if completeness < 0.80:
            continue
        cells = tuple(
            _table_cell_from_path(row, column, path)
            for (row, column), path in sorted(mapped.items())
        )
        page_objects = tuple(path.page_object for path in mapped.values())
        table = ReconstructedTable(
            x=x_coordinates[0],
            y=y_coordinates[0],
            width=max(1.0, x_coordinates[-1] - x_coordinates[0]),
            height=max(1.0, y_coordinates[-1] - y_coordinates[0]),
            column_widths=tuple(max(1.0, x_coordinates[index + 1] - x_coordinates[index]) for index in range(column_count)),
            row_heights=tuple(max(1.0, y_coordinates[index + 1] - y_coordinates[index]) for index in range(row_count)),
            cells=cells,
            page_objects=page_objects,
        )
        tables.append(table)
        consumed.update(id(page_object) for page_object in page_objects)
    return sorted(tables, key=lambda table: (table.y, table.x)), consumed


def _line_orientation(path: ReconstructedPath) -> Literal["horizontal", "vertical"] | None:
    if path.kind != "line":
        return None
    if path.width >= 8.0 and path.width >= path.height * 4.0:
        return "horizontal"
    if path.height >= 8.0 and path.height >= path.width * 4.0:
        return "vertical"
    return None


def _line_paths_touch(first: ReconstructedPath, second: ReconstructedPath, tolerance: float = 4.0) -> bool:
    first_orientation = _line_orientation(first)
    second_orientation = _line_orientation(second)
    if first_orientation is None or second_orientation is None:
        return False
    if first_orientation == second_orientation == "horizontal":
        first_y = first.y + first.height / 2.0
        second_y = second.y + second.height / 2.0
        return abs(first_y - second_y) <= tolerance and min(first.right, second.right) + tolerance >= max(first.x, second.x)
    if first_orientation == second_orientation == "vertical":
        first_x = first.x + first.width / 2.0
        second_x = second.x + second.width / 2.0
        return abs(first_x - second_x) <= tolerance and min(first.bottom, second.bottom) + tolerance >= max(first.y, second.y)
    horizontal = first if first_orientation == "horizontal" else second
    vertical = second if first_orientation == "horizontal" else first
    horizontal_y = horizontal.y + horizontal.height / 2.0
    vertical_x = vertical.x + vertical.width / 2.0
    return (
        horizontal.x - tolerance <= vertical_x <= horizontal.right + tolerance
        and vertical.y - tolerance <= horizontal_y <= vertical.bottom + tolerance
    )


def _line_components(paths: Sequence[ReconstructedPath]) -> list[list[ReconstructedPath]]:
    remaining = set(range(len(paths)))
    components: list[list[ReconstructedPath]] = []
    while remaining:
        seed = remaining.pop()
        queue = [seed]
        indexes = [seed]
        while queue:
            current = queue.pop()
            neighbors = [index for index in remaining if _line_paths_touch(paths[current], paths[index])]
            for neighbor in neighbors:
                remaining.remove(neighbor)
                queue.append(neighbor)
                indexes.append(neighbor)
        components.append([paths[index] for index in indexes])
    return components


def _interval_coverage(intervals: Sequence[tuple[float, float]], start: float, end: float) -> float:
    if end <= start:
        return 0.0
    clipped = sorted((max(start, left), min(end, right)) for left, right in intervals if right > start and left < end)
    if not clipped:
        return 0.0
    covered = 0.0
    current_left, current_right = clipped[0]
    for left, right in clipped[1:]:
        if left <= current_right + 2.5:
            current_right = max(current_right, right)
        else:
            covered += max(0.0, current_right - current_left)
            current_left, current_right = left, right
    covered += max(0.0, current_right - current_left)
    return covered / (end - start)


def _aligned_fill_paths(
    paths: Sequence[ReconstructedPath],
    x_coordinates: Sequence[float],
    y_coordinates: Sequence[float],
    excluded_ids: set[int],
    tolerance: float = 4.0,
) -> list[ReconstructedPath]:
    x_min, x_max = x_coordinates[0], x_coordinates[-1]
    y_min, y_max = y_coordinates[0], y_coordinates[-1]

    def aligned(value: float, coordinates: Sequence[float]) -> bool:
        return min(abs(value - coordinate) for coordinate in coordinates) <= tolerance

    fills: list[ReconstructedPath] = []
    for path in paths:
        if id(path.page_object) in excluded_ids or path.kind != "rect" or not path.filled:
            continue
        if path.x < x_min - tolerance or path.right > x_max + tolerance:
            continue
        if path.y < y_min - tolerance or path.bottom > y_max + tolerance:
            continue
        if not all(
            (
                aligned(path.x, x_coordinates),
                aligned(path.right, x_coordinates),
                aligned(path.y, y_coordinates),
                aligned(path.bottom, y_coordinates),
            )
        ):
            continue
        fills.append(path)
    return fills


def _detect_line_grid_tables(
    paths: Sequence[ReconstructedPath],
    already_consumed: set[int],
) -> tuple[list[ReconstructedTable], set[int]]:
    line_paths = [
        path
        for path in paths
        if id(path.page_object) not in already_consumed and _line_orientation(path) is not None
    ]
    tables: list[ReconstructedTable] = []
    consumed: set[int] = set()
    for component in _line_components(line_paths):
        horizontal = [path for path in component if _line_orientation(path) == "horizontal"]
        vertical = [path for path in component if _line_orientation(path) == "vertical"]
        if len(horizontal) < 3 or len(vertical) < 3:
            continue
        x_coordinates = _cluster_coordinates([path.x + path.width / 2.0 for path in vertical], tolerance=3.5)
        y_coordinates = _cluster_coordinates([path.y + path.height / 2.0 for path in horizontal], tolerance=3.5)
        if not (3 <= len(x_coordinates) <= 31 and 3 <= len(y_coordinates) <= 101):
            continue
        x_min, x_max = x_coordinates[0], x_coordinates[-1]
        y_min, y_max = y_coordinates[0], y_coordinates[-1]
        if x_max - x_min < 40.0 or y_max - y_min < 18.0:
            continue

        horizontal_valid = True
        for coordinate in y_coordinates:
            intervals = [
                (path.x, path.right)
                for path in horizontal
                if abs((path.y + path.height / 2.0) - coordinate) <= 3.5
            ]
            if _interval_coverage(intervals, x_min, x_max) < 0.82:
                horizontal_valid = False
                break
        if not horizontal_valid:
            continue
        vertical_valid = True
        for coordinate in x_coordinates:
            intervals = [
                (path.y, path.bottom)
                for path in vertical
                if abs((path.x + path.width / 2.0) - coordinate) <= 3.5
            ]
            if _interval_coverage(intervals, y_min, y_max) < 0.82:
                vertical_valid = False
                break
        if not vertical_valid:
            continue

        component_ids = {id(path.page_object) for path in component}
        fill_paths = _aligned_fill_paths(paths, x_coordinates, y_coordinates, component_ids | already_consumed | consumed)
        stroke_width = float(np.median([path.stroke_width for path in component]))
        stroke_color = tuple(
            int(round(float(np.median([path.fill_color[channel] for path in component]))))
            for channel in range(3)
        )
        cells: list[ReconstructedTableCell] = []
        for row in range(len(y_coordinates) - 1):
            for column in range(len(x_coordinates) - 1):
                x = x_coordinates[column]
                y = y_coordinates[row]
                width = x_coordinates[column + 1] - x
                height = y_coordinates[row + 1] - y
                center_x = x + width / 2.0
                center_y = y + height / 2.0
                covering_fills = [
                    path
                    for path in fill_paths
                    if path.x - 2.5 <= center_x <= path.right + 2.5
                    and path.y - 2.5 <= center_y <= path.bottom + 2.5
                ]
                fill_path = min(covering_fills, key=lambda path: path.width * path.height) if covering_fills else None
                cells.append(
                    ReconstructedTableCell(
                        row=row,
                        column=column,
                        x=x,
                        y=y,
                        width=max(1.0, width),
                        height=max(1.0, height),
                        fill_color=fill_path.fill_color if fill_path is not None else (255, 255, 255),
                        stroke_color=stroke_color,
                        stroke_width=max(0.25, stroke_width),
                        filled=fill_path is not None,
                        stroked=True,
                    )
                )
        page_objects = tuple(path.page_object for path in [*component, *fill_paths])
        tables.append(
            ReconstructedTable(
                x=x_min,
                y=y_min,
                width=x_max - x_min,
                height=y_max - y_min,
                column_widths=tuple(x_coordinates[index + 1] - x_coordinates[index] for index in range(len(x_coordinates) - 1)),
                row_heights=tuple(y_coordinates[index + 1] - y_coordinates[index] for index in range(len(y_coordinates) - 1)),
                cells=tuple(cells),
                page_objects=page_objects,
            )
        )
        consumed.update(id(page_object) for page_object in page_objects)
    return sorted(tables, key=lambda table: (table.y, table.x)), consumed


def _detect_native_tables(paths: Sequence[ReconstructedPath]) -> tuple[list[ReconstructedTable], set[int]]:
    rectangle_tables, rectangle_consumed = _detect_rectangle_cell_tables(paths)
    line_tables, line_consumed = _detect_line_grid_tables(paths, rectangle_consumed)
    return sorted([*rectangle_tables, *line_tables], key=lambda table: (table.y, table.x)), rectangle_consumed | line_consumed


def _extract_pdf_image(page_object, page_height: float, page_width: float) -> ReconstructedImage | None:
    try:
        left, bottom_pdf, right, top_pdf = (float(value) for value in page_object.get_bounds())
    except Exception:
        return None
    width = max(0.0, right - left)
    height = max(0.0, top_pdf - bottom_pdf)
    area_ratio = (width * height) / max(1.0, page_width * page_height)
    # A full-page scan must stay in the page background so OCR can remove its
    # recognized text. Smaller embedded images become independent Word pictures.
    if width < 10.0 or height < 10.0 or area_ratio < 0.001 or area_ratio > 0.72:
        return None
    try:
        bitmap = page_object.get_bitmap(render=True, scale_to_original=True)
        try:
            image = bitmap.to_pil().convert("RGBA")
            output = io.BytesIO()
            image.save(output, format="PNG", optimize=True)
            data = output.getvalue()
            image.close()
        finally:
            bitmap.close()
    except Exception:
        return None
    return ReconstructedImage(
        page_object=page_object,
        x=max(0.0, left),
        y=max(0.0, page_height - top_pdf),
        width=max(1.0, width),
        height=max(1.0, height),
        data=data,
    )


def _analyze_reconstructable_objects(
    page: pdfium.PdfPage,
) -> tuple[list[ReconstructedTable], list[ReconstructedPath], list[ReconstructedImage]]:
    page_width, page_height = page.get_size()
    paths: list[ReconstructedPath] = []
    images: list[ReconstructedImage] = []
    for page_object in page.get_objects():
        if page_object.type == pdfium_c.FPDF_PAGEOBJ_PATH:
            descriptor = _describe_path_object(page_object, page_height)
            if descriptor is not None:
                paths.append(descriptor)
        elif page_object.type == pdfium_c.FPDF_PAGEOBJ_IMAGE:
            descriptor = _extract_pdf_image(page_object, page_height, page_width)
            if descriptor is not None:
                images.append(descriptor)
    tables, table_object_ids = _detect_native_tables(paths)
    shapes = [path for path in paths if id(path.page_object) not in table_object_ids]
    return tables, shapes, sorted(images, key=lambda image: (image.y, image.x))


def _block_center_inside(block: PositionedTextBlock, x: float, y: float, width: float, height: float) -> bool:
    center_x = block.x + block.width / 2.0
    center_y = block.y + block.height / 2.0
    tolerance = 2.5
    return x - tolerance <= center_x <= x + width + tolerance and y - tolerance <= center_y <= y + height + tolerance


def _assign_blocks_to_tables(
    tables: Sequence[ReconstructedTable],
    blocks: Sequence[PositionedTextBlock],
) -> tuple[list[ReconstructedTable], set[int]]:
    assigned_block_ids: set[int] = set()
    reconstructed: list[ReconstructedTable] = []
    for table in tables:
        cells: list[ReconstructedTableCell] = []
        for cell in table.cells:
            cell_blocks = tuple(
                sorted(
                    (
                        block
                        for block in blocks
                        if id(block) not in assigned_block_ids
                        and _block_center_inside(
                            block,
                            cell.x,
                            cell.y,
                            cell.width,
                            cell.height,
                        )
                    ),
                    key=lambda block: (block.y, block.x),
                )
            )
            assigned_block_ids.update(id(block) for block in cell_blocks)
            cells.append(
                ReconstructedTableCell(
                    row=cell.row,
                    column=cell.column,
                    x=cell.x,
                    y=cell.y,
                    width=cell.width,
                    height=cell.height,
                    fill_color=cell.fill_color,
                    stroke_color=cell.stroke_color,
                    stroke_width=cell.stroke_width,
                    filled=cell.filled,
                    stroked=cell.stroked,
                    blocks=cell_blocks,
                )
            )
        reconstructed.append(
            ReconstructedTable(
                table.x,
                table.y,
                table.width,
                table.height,
                table.column_widths,
                table.row_heights,
                tuple(cells),
                table.page_objects,
            )
        )
    return reconstructed, assigned_block_ids


def _block_is_inside_extracted_image(block: PositionedTextBlock, images: Sequence[ReconstructedImage]) -> bool:
    return any(_block_center_inside(block, image.x, image.y, image.width, image.height) for image in images)


def _object_identity(page_object) -> int:
    try:
        return int(ctypes.cast(page_object.raw, ctypes.c_void_p).value or 0)
    except Exception:
        return id(page_object)


def _remove_reconstructed_page_objects(
    page: pdfium.PdfPage,
    reconstructed_objects: Sequence[object],
    remove_native_text: bool,
) -> None:
    objects: list[object] = []
    if remove_native_text:
        objects.extend(page.get_objects(filter=[pdfium_c.FPDF_PAGEOBJ_TEXT]))
    objects.extend(reconstructed_objects)
    seen: set[int] = set()
    removed_any = False
    for page_object in objects:
        identity = _object_identity(page_object)
        if identity in seen:
            continue
        seen.add(identity)
        try:
            page.remove_obj(page_object)
            page_object.close()
            removed_any = True
        except Exception:
            # Leave the object in the rendered background if PDFium refuses to
            # detach it; never risk aborting an otherwise usable conversion.
            continue
    if removed_any:
        page.gen_content()


def _append_floating_picture(
    paragraph,
    image_data: bytes,
    x: float,
    y: float,
    width: float,
    height: float,
    shape_id: int,
    behind_document: bool,
) -> None:
    run = paragraph.add_run()
    inline_shape = run.add_picture(io.BytesIO(image_data), width=Pt(max(1.0, width)), height=Pt(max(1.0, height)))
    anchor = inline_shape._inline
    extent = anchor.extent
    doc_properties = anchor.docPr
    frame_properties = anchor.xpath("./wp:cNvGraphicFramePr")[0]
    graphic = anchor.graphic
    for child in list(anchor):
        anchor.remove(child)
    anchor.tag = qn("wp:anchor")
    anchor.attrib.clear()
    for name, value in (
        ("distT", "0"),
        ("distB", "0"),
        ("distL", "0"),
        ("distR", "0"),
        ("simplePos", "0"),
        ("relativeHeight", "0" if behind_document else "251658240"),
        ("behindDoc", "1" if behind_document else "0"),
        ("locked", "0"),
        ("layoutInCell", "0"),
        ("allowOverlap", "1"),
    ):
        anchor.set(name, value)
    simple_position = OxmlElement("wp:simplePos")
    simple_position.set("x", "0")
    simple_position.set("y", "0")
    anchor.append(simple_position)
    horizontal = OxmlElement("wp:positionH")
    horizontal.set("relativeFrom", "page")
    horizontal_offset = OxmlElement("wp:posOffset")
    horizontal_offset.text = str(int(round(x * 12700)))
    horizontal.append(horizontal_offset)
    anchor.append(horizontal)
    vertical = OxmlElement("wp:positionV")
    vertical.set("relativeFrom", "page")
    vertical_offset = OxmlElement("wp:posOffset")
    vertical_offset.text = str(int(round(y * 12700)))
    vertical.append(vertical_offset)
    anchor.append(vertical)
    anchor.append(extent)
    effect_extent = OxmlElement("wp:effectExtent")
    for edge in ("l", "t", "r", "b"):
        effect_extent.set(edge, "0")
    anchor.append(effect_extent)
    anchor.append(OxmlElement("wp:wrapNone"))
    doc_properties.set("id", str(max(1, shape_id)))
    doc_properties.set("name", f"NovaPDFPicture{shape_id}")
    anchor.append(doc_properties)
    anchor.append(frame_properties)
    anchor.append(graphic)


def _append_native_shape(paragraph, shape: ReconstructedPath, shape_id: int) -> None:
    pict = etree.Element(qn("w:pict"), nsmap={"v": VML_NS, "o": OFFICE_NS})
    element_name = "roundrect" if shape.kind == "roundrect" else "rect"
    element = etree.SubElement(pict, f"{{{VML_NS}}}{element_name}")
    element.set("id", f"NovaPDFShape{shape_id}")
    element.set(f"{{{OFFICE_NS}}}allowincell", "f")
    element.set("filled", "t" if shape.filled else "f")
    element.set("stroked", "t" if shape.stroked else "f")
    if shape.filled:
        element.set("fillcolor", "#{:02X}{:02X}{:02X}".format(*shape.fill_color))
    if shape.stroked:
        element.set("strokecolor", "#{:02X}{:02X}{:02X}".format(*shape.stroke_color))
        element.set("strokeweight", f"{shape.stroke_width:.2f}pt")
    if shape.kind == "roundrect":
        element.set("arcsize", "10%")
    element.set(
        "style",
        ";".join(
            (
                "position:absolute",
                f"margin-left:{shape.x:.2f}pt",
                f"margin-top:{shape.y:.2f}pt",
                f"width:{shape.width:.2f}pt",
                f"height:{shape.height:.2f}pt",
                "z-index:100",
                "mso-position-horizontal-relative:page",
                "mso-position-vertical-relative:page",
                "mso-wrap-style:none",
                "mso-wrap-distance-left:0",
                "mso-wrap-distance-right:0",
                "mso-wrap-distance-top:0",
                "mso-wrap-distance-bottom:0",
            )
        ),
    )
    paragraph.add_run()._r.append(pict)


def _set_word_cell_border(cell, color: tuple[int, int, int], width_points: float) -> None:
    properties = cell._tc.get_or_add_tcPr()
    borders = properties.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        properties.append(borders)
    color_value = "{:02X}{:02X}{:02X}".format(*color)
    size = str(max(2, min(96, int(round(width_points * 8)))))
    for edge in ("top", "start", "bottom", "end"):
        border = borders.find(qn(f"w:{edge}"))
        if border is None:
            border = OxmlElement(f"w:{edge}")
            borders.append(border)
        border.set(qn("w:val"), "single")
        border.set(qn("w:sz"), size)
        border.set(qn("w:space"), "0")
        border.set(qn("w:color"), color_value)


def _set_word_cell_fill(cell, color: tuple[int, int, int]) -> None:
    properties = cell._tc.get_or_add_tcPr()
    shading = properties.first_child_found_in("w:shd")
    if shading is None:
        shading = OxmlElement("w:shd")
        properties.append(shading)
    shading.set(qn("w:val"), "clear")
    shading.set(qn("w:color"), "auto")
    shading.set(qn("w:fill"), "{:02X}{:02X}{:02X}".format(*color))


def _clear_paragraph(paragraph) -> None:
    for child in list(paragraph._p):
        if child.tag != qn("w:pPr"):
            paragraph._p.remove(child)


def _append_table_block(
    cell,
    block: PositionedTextBlock,
    first: bool,
    cell_x: float,
    cell_width: float,
) -> None:
    paragraph = cell.paragraphs[0] if first else cell.add_paragraph()
    _clear_paragraph(paragraph)
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.line_spacing = 1.0
    inner_x = max(0.0, block.x - cell_x - 3.0)
    paragraph.paragraph_format.left_indent = Pt(min(max(0.0, cell_width - 8.0), inner_x))
    for editable_run in block.runs:
        if not editable_run.text:
            continue
        run = paragraph.add_run(_clean_xml_text(editable_run.text))
        word_font = _word_font_name(editable_run.font_name)
        run.font.name = word_font
        run.font.size = Pt(max(4.0, min(192.0, editable_run.font_size)))
        run.bold = editable_run.bold
        run.italic = editable_run.italic
        run.font.color.rgb = RGBColor(*editable_run.color)
        run_properties = run._r.get_or_add_rPr()
        fonts = run_properties.find(qn("w:rFonts"))
        if fonts is None:
            fonts = OxmlElement("w:rFonts")
            run_properties.insert(0, fonts)
        for attribute in ("ascii", "hAnsi", "eastAsia", "cs"):
            fonts.set(qn(f"w:{attribute}"), word_font)
        if editable_run.bold and run_properties.find(qn("w:bCs")) is None:
            run_properties.append(OxmlElement("w:bCs"))
        if editable_run.italic and run_properties.find(qn("w:iCs")) is None:
            run_properties.append(OxmlElement("w:iCs"))


def _append_native_table(document: Document, table_model: ReconstructedTable) -> None:
    row_count = len(table_model.row_heights)
    column_count = len(table_model.column_widths)
    if row_count < 1 or column_count < 1:
        return
    table = document.add_table(rows=row_count, cols=column_count)
    table.autofit = False
    table.style = None
    properties = table._tbl.tblPr
    positioning = OxmlElement("w:tblpPr")
    for name, value in (
        ("leftFromText", "0"),
        ("rightFromText", "0"),
        ("topFromText", "0"),
        ("bottomFromText", "0"),
        ("vertAnchor", "page"),
        ("horzAnchor", "page"),
        ("tblpX", str(int(round(table_model.x * 20)))),
        ("tblpY", str(int(round(table_model.y * 20)))),
    ):
        positioning.set(qn(f"w:{name}"), value)
    properties.insert(0, positioning)
    layout = properties.first_child_found_in("w:tblLayout")
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        properties.append(layout)
    layout.set(qn("w:type"), "fixed")
    width = properties.first_child_found_in("w:tblW")
    if width is None:
        width = OxmlElement("w:tblW")
        properties.append(width)
    width.set(qn("w:type"), "dxa")
    width.set(qn("w:w"), str(int(round(table_model.width * 20))))
    overlap = properties.first_child_found_in("w:tblOverlap")
    if overlap is None:
        overlap = OxmlElement("w:tblOverlap")
        properties.append(overlap)
    overlap.set(qn("w:val"), "overlap")

    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for column_width in table_model.column_widths:
        grid_column = OxmlElement("w:gridCol")
        grid_column.set(qn("w:w"), str(int(round(column_width * 20))))
        grid.append(grid_column)

    cell_models = {(cell.row, cell.column): cell for cell in table_model.cells}
    for row_index, row in enumerate(table.rows):
        row.height = Pt(table_model.row_heights[row_index])
        row.height_rule = WD_ROW_HEIGHT_RULE.EXACTLY
        row_properties = row._tr.get_or_add_trPr()
        cannot_split = OxmlElement("w:cantSplit")
        row_properties.append(cannot_split)
        for column_index, cell in enumerate(row.cells):
            column_width = table_model.column_widths[column_index]
            cell.width = Pt(column_width)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            _set_cell_margins(cell, top=25, start=45, bottom=25, end=45)
            cell_properties = cell._tc.get_or_add_tcPr()
            cell_width = cell_properties.first_child_found_in("w:tcW")
            if cell_width is None:
                cell_width = OxmlElement("w:tcW")
                cell_properties.append(cell_width)
            cell_width.set(qn("w:type"), "dxa")
            cell_width.set(qn("w:w"), str(int(round(column_width * 20))))
            model = cell_models.get((row_index, column_index))
            if model is None:
                continue
            if model.filled:
                _set_word_cell_fill(cell, model.fill_color)
            if model.stroked:
                _set_word_cell_border(cell, model.stroke_color, model.stroke_width)
            if model.blocks:
                for block_index, block in enumerate(model.blocks):
                    _append_table_block(
                        cell,
                        block,
                        first=block_index == 0,
                        cell_x=model.x,
                        cell_width=model.width,
                    )
            else:
                paragraph = cell.paragraphs[0]
                _clear_paragraph(paragraph)
                paragraph.paragraph_format.space_before = Pt(0)
                paragraph.paragraph_format.space_after = Pt(0)



def _pixel_box(
    x: float,
    y: float,
    width: float,
    height: float,
    scale: float,
    image_width: int,
    image_height: int,
    padding: int = 2,
) -> tuple[int, int, int, int]:
    x0 = max(0, int(np.floor(x * scale)) - padding)
    y0 = max(0, int(np.floor(y * scale)) - padding)
    x1 = min(image_width, int(np.ceil((x + width) * scale)) + padding)
    y1 = min(image_height, int(np.ceil((y + height) * scale)) + padding)
    return x0, y0, x1, y1


def _render_residual_artwork(
    page: pdfium.PdfPage,
    text_blocks: Sequence[PositionedTextBlock],
    tables: Sequence[ReconstructedTable],
    shapes: Sequence[ReconstructedPath],
    images: Sequence[ReconstructedImage],
    dpi: int = HYBRID_DPI,
) -> list[ResidualArtwork]:
    """Render only unsupported visual residue for a native PDF page.

    The previous implementation inserted a page-sized PDF render behind the
    editable Word objects and depended on PDFium object deletion to remove the
    originals. Some PDFs wrap content in form objects or reject detachment, so
    Word still showed the original page under the editable text and tables.

    This routine starts from the original render, makes the page background
    transparent, and explicitly erases every reconstructed text/table/shape/
    picture region. Only unsupported residual artwork is returned, cropped into
    small anchored pictures. A fully reconstructable page receives no background
    picture at all.
    """
    image = _render_page_pil(page, dpi)
    try:
        rgb = np.asarray(image.convert("RGB"), dtype=np.uint8).copy()
    finally:
        image.close()
    image_height, image_width = rgb.shape[:2]
    scale = dpi / 72.0
    alpha = np.full((image_height, image_width), 255, dtype=np.uint8)

    # Remove the uniform paper color. Corner samples are deliberately used
    # instead of assuming pure white so off-white and lightly tinted pages do
    # not become a selectable page-sized picture in Word.
    sample_size = max(4, min(24, image_width // 20, image_height // 20))
    corner_samples = np.concatenate(
        (
            rgb[:sample_size, :sample_size].reshape(-1, 3),
            rgb[:sample_size, -sample_size:].reshape(-1, 3),
            rgb[-sample_size:, :sample_size].reshape(-1, 3),
            rgb[-sample_size:, -sample_size:].reshape(-1, 3),
        ),
        axis=0,
    )
    background = np.median(corner_samples, axis=0).astype(np.float32)
    corner_spread = np.median(
        np.linalg.norm(corner_samples.astype(np.float32) - background, axis=1)
    )
    if corner_spread <= 20.0:
        distance = np.linalg.norm(rgb.astype(np.float32) - background, axis=2)
        alpha[distance <= max(7.0, corner_spread * 2.4 + 4.0)] = 0

    erase = np.zeros((image_height, image_width), dtype=np.uint8)
    if text_blocks:
        text_mask = _build_text_mask(rgb, text_blocks, dpi)
        # Two light dilation passes remove antialiased edge pixels that otherwise
        # appear as a duplicate shadow behind the editable Word glyphs.
        text_mask = cv2.dilate(text_mask, np.ones((3, 3), np.uint8), iterations=2)
        erase = np.maximum(erase, text_mask)

    for table in tables:
        x0, y0, x1, y1 = _pixel_box(
            table.x, table.y, table.width, table.height,
            scale, image_width, image_height, padding=4,
        )
        erase[y0:y1, x0:x1] = 255
    for shape in shapes:
        padding = max(3, int(np.ceil(shape.stroke_width * scale)) + 2)
        x0, y0, x1, y1 = _pixel_box(
            shape.x, shape.y, shape.width, shape.height,
            scale, image_width, image_height, padding=padding,
        )
        erase[y0:y1, x0:x1] = 255
    for extracted_image in images:
        x0, y0, x1, y1 = _pixel_box(
            extracted_image.x, extracted_image.y,
            extracted_image.width, extracted_image.height,
            scale, image_width, image_height, padding=3,
        )
        erase[y0:y1, x0:x1] = 255

    alpha[erase > 0] = 0
    visible = alpha > 0
    # Suppress isolated compression/antialiasing specks. These are not useful
    # artwork and are the source of many apparent black spots.
    component_mask = (visible.astype(np.uint8) * 255)
    component_mask = cv2.morphologyEx(
        component_mask,
        cv2.MORPH_OPEN,
        np.ones((2, 2), np.uint8),
    )
    count, labels, stats, _ = cv2.connectedComponentsWithStats(component_mask, connectivity=8)
    components: list[tuple[int, int, int, int]] = []
    minimum_area = max(12, int(image_width * image_height * 0.000004))
    for label in range(1, count):
        x, y, width, height, area = (int(value) for value in stats[label])
        if area < minimum_area or width < 2 or height < 2:
            continue
        components.append((x, y, width, height))

    if not components:
        return []

    # A page with many tiny unsupported vector fragments is more stable as one
    # cropped residual picture than dozens of anchors. Normally reconstructable
    # business PDFs produce zero or only a few components.
    if len(components) > 48:
        left = min(item[0] for item in components)
        top = min(item[1] for item in components)
        right = max(item[0] + item[2] for item in components)
        bottom = max(item[1] + item[3] for item in components)
        components = [(left, top, right - left, bottom - top)]

    rgba = np.dstack((rgb, alpha))
    artwork: list[ResidualArtwork] = []
    for x, y, width, height in sorted(components, key=lambda item: (item[1], item[0])):
        x0 = max(0, x - 2)
        y0 = max(0, y - 2)
        x1 = min(image_width, x + width + 2)
        y1 = min(image_height, y + height + 2)
        crop = rgba[y0:y1, x0:x1].copy()
        # Keep only pixels belonging to this component plus the small edge pad.
        if not np.any(crop[:, :, 3]):
            continue
        output = io.BytesIO()
        Image.fromarray(crop, mode="RGBA").save(output, format="PNG", optimize=True)
        artwork.append(
            ResidualArtwork(
                x=x0 / scale,
                y=y0 / scale,
                width=max(1.0, (x1 - x0) / scale),
                height=max(1.0, (y1 - y0) / scale),
                data=output.getvalue(),
            )
        )
    return artwork

def _render_object_reconstruction_background(
    page: pdfium.PdfPage,
    ocr_blocks: Sequence[PositionedTextBlock],
    dpi: int = HYBRID_DPI,
) -> bytes:
    image = _render_page_pil(page, dpi)
    try:
        rgb = np.asarray(image, dtype=np.uint8).copy()
        if ocr_blocks:
            mask = _build_text_mask(rgb, ocr_blocks, dpi)
            scale = dpi / 72.0
            # Uniform regions such as white paper, colored headers, and table cells
            # are restored with their sampled background color. This avoids the
            # dark/gray Telea artifacts that appeared as black spots in Word.
            for block in ocr_blocks:
                for region in block.mask_regions:
                    x0 = max(0, int(region.x * scale) - 3)
                    y0 = max(0, int(region.y * scale) - 3)
                    x1 = min(rgb.shape[1], int((region.x + region.width) * scale) + 4)
                    y1 = min(rgb.shape[0], int((region.y + region.height) * scale) + 4)
                    if x1 <= x0 or y1 <= y0:
                        continue
                    roi = rgb[y0:y1, x0:x1]
                    local_mask = mask[y0:y1, x0:x1]
                    if roi.size == 0 or not local_mask.any():
                        continue
                    border = np.concatenate(
                        (
                            roi[0].reshape(-1, 3),
                            roi[-1].reshape(-1, 3),
                            roi[:, 0].reshape(-1, 3),
                            roi[:, -1].reshape(-1, 3),
                        ),
                        axis=0,
                    )
                    background = np.median(border, axis=0)
                    spread = np.median(np.linalg.norm(border.astype(np.float32) - background.astype(np.float32), axis=1))
                    if spread <= 16.0:
                        roi[local_mask > 0] = background.astype(np.uint8)
                        local_mask[local_mask > 0] = 0
            if mask.any():
                bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
                cleaned = cv2.inpaint(bgr, mask, 3, cv2.INPAINT_TELEA)
                rgb = cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)
        output = io.BytesIO()
        Image.fromarray(rgb).save(output, format="PNG", optimize=True)
        return output.getvalue()
    finally:
        image.close()


def _build_text_mask(image_rgb: np.ndarray, blocks: Sequence[PositionedTextBlock], dpi: int) -> np.ndarray:
    height, width = image_rgb.shape[:2]
    scale = dpi / 72.0
    mask = np.zeros((height, width), dtype=np.uint8)
    for block in blocks:
        for region in block.mask_regions:
            x0 = max(0, int(region.x * scale) - 2)
            y0 = max(0, int(region.y * scale) - 2)
            x1 = min(width, int((region.x + region.width) * scale) + 3)
            y1 = min(height, int((region.y + region.height) * scale) + 3)
            if x1 <= x0 or y1 <= y0:
                continue
            roi = image_rgb[y0:y1, x0:x1]
            target = np.array(
                region.color or _estimate_foreground_color(image_rgb, (x0, y0, x1, y1)),
                dtype=np.float32,
            )
            color_distance = np.linalg.norm(roi.astype(np.float32) - target, axis=2)
            border = np.concatenate(
                (roi[0].reshape(-1, 3), roi[-1].reshape(-1, 3), roi[:, 0].reshape(-1, 3), roi[:, -1].reshape(-1, 3)),
                axis=0,
            )
            background = np.median(border, axis=0).astype(np.float32)
            background_distance = np.linalg.norm(roi.astype(np.float32) - background, axis=2)
            if block.source == "ocr":
                local = background_distance >= max(7.0, float(np.percentile(background_distance, 48)))
            else:
                local = (color_distance <= 125.0) & (background_distance >= 6.0)
                if int(local.sum()) < max(3, int(local.size * 0.01)):
                    local = background_distance >= max(14.0, float(np.percentile(background_distance, 65)))
            local_mask = local.astype(np.uint8) * 255
            local_mask = cv2.dilate(
                local_mask,
                np.ones((3, 3), np.uint8),
                iterations=2 if block.source == "ocr" else 1,
            )
            mask[y0:y1, x0:x1] = np.maximum(mask[y0:y1, x0:x1], local_mask)
    return mask


def _render_hybrid_background(
    page: pdfium.PdfPage,
    blocks: Sequence[PositionedTextBlock],
    dpi: int = HYBRID_DPI,
) -> bytes:
    image = _render_page_pil(page, dpi)
    try:
        rgb = np.asarray(image, dtype=np.uint8).copy()
        mask = _build_text_mask(rgb, blocks, dpi)
        if mask.any():
            bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            cleaned = cv2.inpaint(bgr, mask, 4, cv2.INPAINT_TELEA)
            rgb = cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)
        output = io.BytesIO()
        Image.fromarray(rgb).save(output, format="PNG", optimize=True)
        return output.getvalue()
    finally:
        image.close()


def _append_run_properties(run_properties, run: EditableRun, scale: float) -> None:
    fonts = OxmlElement("w:rFonts")
    for attribute in ("ascii", "hAnsi", "eastAsia", "cs"):
        fonts.set(qn(f"w:{attribute}"), _word_font_name(run.font_name))
    run_properties.append(fonts)
    size_value = str(max(12, min(192, int(round(run.font_size * scale * 2)))))
    size = OxmlElement("w:sz")
    size.set(qn("w:val"), size_value)
    run_properties.append(size)
    size_complex = OxmlElement("w:szCs")
    size_complex.set(qn("w:val"), size_value)
    run_properties.append(size_complex)
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "{:02X}{:02X}{:02X}".format(*run.color))
    run_properties.append(color)
    if run.bold:
        run_properties.append(OxmlElement("w:b"))
        run_properties.append(OxmlElement("w:bCs"))
    if run.italic:
        run_properties.append(OxmlElement("w:i"))
        run_properties.append(OxmlElement("w:iCs"))
    run_properties.append(OxmlElement("w:noProof"))


def _append_positioned_textbox(
    paragraph,
    block: PositionedTextBlock,
    scale: float,
    offset_x: float,
    offset_y: float,
    shape_id: int,
) -> None:
    max_font_size = max((run.font_size for run in block.runs), default=11.0) * scale
    left = offset_x + block.x * scale - 0.35
    # PDF character boxes describe the visible glyph bounds, while Word places
    # text from the font em box. A small ascent correction aligns the two without
    # the large upward drift that previously caused lines to collide.
    top = offset_y + block.y * scale - max_font_size * 0.045
    width = max(8.0, block.width * scale + max(2.0, max_font_size * 0.32))
    line_height = max(block.height * scale * 1.12, max_font_size * 1.08)
    height = max(line_height + 1.0, max_font_size * 1.18)

    pict = etree.Element(qn("w:pict"), nsmap={"v": VML_NS, "o": OFFICE_NS})
    shape = etree.SubElement(pict, f"{{{VML_NS}}}shape")
    shape.set("id", f"NovaPDFEditableText{shape_id}")
    shape.set("filled", "f")
    shape.set("stroked", "f")
    shape.set(f"{{{OFFICE_NS}}}allowincell", "f")
    shape.set(
        "style",
        ";".join(
            (
                "position:absolute",
                f"margin-left:{left:.2f}pt",
                f"margin-top:{top:.2f}pt",
                f"width:{width:.2f}pt",
                f"height:{height:.2f}pt",
                "z-index:251659264",
                "visibility:visible",
                "mso-position-horizontal-relative:page",
                "mso-position-vertical-relative:page",
                "mso-wrap-style:none",
                "mso-wrap-distance-left:0",
                "mso-wrap-distance-right:0",
                "mso-wrap-distance-top:0",
                "mso-wrap-distance-bottom:0",
            )
        ),
    )
    textbox = etree.SubElement(shape, f"{{{VML_NS}}}textbox")
    textbox.set("inset", "0,0,0,0")
    textbox.set("style", "mso-fit-shape-to-text:f")
    content = etree.SubElement(textbox, qn("w:txbxContent"))
    text_paragraph = OxmlElement("w:p")
    paragraph_properties = OxmlElement("w:pPr")
    spacing = OxmlElement("w:spacing")
    spacing.set(qn("w:before"), "0")
    spacing.set(qn("w:after"), "0")
    spacing.set(qn("w:line"), str(max(120, int(round(line_height * 20)))))
    spacing.set(qn("w:lineRule"), "exact")
    paragraph_properties.append(spacing)
    text_paragraph.append(paragraph_properties)
    for editable_run in block.runs:
        if not editable_run.text:
            continue
        word_run = OxmlElement("w:r")
        properties = OxmlElement("w:rPr")
        _append_run_properties(properties, editable_run, scale)
        word_run.append(properties)
        text = OxmlElement("w:t")
        text.set(qn("xml:space"), "preserve")
        text.text = _clean_xml_text(editable_run.text)
        word_run.append(text)
        text_paragraph.append(word_run)
    content.append(text_paragraph)
    paragraph.add_run()._r.append(pict)


def _append_hybrid_page(
    document: Document,
    page: pdfium.PdfPage,
    first_page: bool,
    use_ocr: bool,
    language: str,
    shape_counter: int,
) -> tuple[bool, bool, int]:
    page_width, page_height = page.get_size()
    section = document.sections[0] if first_page else document.add_section(WD_SECTION.NEW_PAGE)
    _configure_section(section, page_width, page_height, visual=True)
    # Exact page-relative positioning is more reliable when the reconstructed
    # page has no artificial document margins.
    section.top_margin = Pt(0)
    section.bottom_margin = Pt(0)
    section.left_margin = Pt(0)
    section.right_margin = Pt(0)

    native_blocks = _native_positioned_blocks(page)
    tables, shapes, images = _analyze_reconstructable_objects(page)

    rendered_for_ocr = _render_page_pil(page, HYBRID_DPI) if use_ocr else None
    try:
        ocr_blocks = _ocr_positioned_blocks(rendered_for_ocr, language, HYBRID_DPI) if rendered_for_ocr is not None else []
    finally:
        if rendered_for_ocr is not None:
            rendered_for_ocr.close()
    accepted_ocr = [
        block
        for block in _deduplicate_ocr_blocks(native_blocks, ocr_blocks)
        if not _block_is_inside_extracted_image(block, images)
    ]

    all_blocks = sorted([*native_blocks, *accepted_ocr], key=lambda block: (round(block.y, 1), block.x))
    tables, table_block_ids = _assign_blocks_to_tables(tables, all_blocks)
    positioned_blocks = [block for block in all_blocks if id(block) not in table_block_ids]
    ocr_background_blocks = [block for block in accepted_ocr if id(block) not in table_block_ids]

    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.line_spacing = Pt(1)

    if native_blocks:
        # Native pages must not carry a page-sized PDF screenshot behind the
        # editable objects. Preserve only unsupported visual residue, cropped to
        # its own bounds; fully reconstructable pages receive no fallback image.
        residual_artwork = _render_residual_artwork(
            page,
            [*native_blocks, *ocr_background_blocks],
            tables,
            shapes,
            images,
        )
        for residual in residual_artwork:
            _append_floating_picture(
                paragraph,
                residual.data,
                x=residual.x,
                y=residual.y,
                width=residual.width,
                height=residual.height,
                shape_id=shape_counter,
                behind_document=True,
            )
            shape_counter += 1
    else:
        # A scan is itself the visual source. OCR can make its text editable, but
        # the raster page must remain until semantic scan reconstruction exists.
        background = _render_object_reconstruction_background(page, ocr_background_blocks)
        _append_floating_picture(
            paragraph,
            background,
            x=0.0,
            y=0.0,
            width=page_width,
            height=page_height,
            shape_id=shape_counter,
            behind_document=True,
        )
        shape_counter += 1

    for shape in shapes:
        _append_native_shape(paragraph, shape, shape_counter)
        shape_counter += 1
    for image in images:
        _append_floating_picture(
            paragraph,
            image.data,
            x=image.x,
            y=image.y,
            width=image.width,
            height=image.height,
            shape_id=shape_counter,
            behind_document=False,
        )
        shape_counter += 1
    for table in tables:
        _append_native_table(document, table)
    for block in positioned_blocks:
        _append_positioned_textbox(paragraph, block, 1.0, 0.0, 0.0, shape_counter)
        shape_counter += 1
    return bool(accepted_ocr), bool(native_blocks), shape_counter

def _append_editable_page(
    document: Document,
    page: pdfium.PdfPage,
    first_page: bool,
    use_ocr: bool,
    language: str,
) -> bool:
    page_width, page_height = page.get_size()
    section = document.sections[0] if first_page else document.add_section(WD_SECTION.NEW_PAGE)
    _configure_section(section, page_width, page_height, visual=False)
    native_count = _native_character_count(page)
    used_ocr = use_ocr and native_count < MIN_NATIVE_TEXT_CHARACTERS
    lines = _ocr_lines(page, language) if used_ocr else _native_lines(page)

    if not lines:
        paragraph = document.paragraphs[0] if first_page and len(document.paragraphs) == 1 else document.add_paragraph()
        paragraph.add_run("[No extractable text found on this page]").italic = True
        return used_ocr

    content_width = max(72.0, page_width - 60.0)
    previous_bottom = 0.0
    for line_index, line in enumerate(lines):
        paragraph = (
            document.paragraphs[0]
            if first_page and line_index == 0 and len(document.paragraphs) == 1 and not document.paragraphs[0].text
            else document.add_paragraph()
        )
        paragraph.paragraph_format.left_indent = Pt(max(0.0, min(content_width - 12.0, line.x - 30.0)))
        vertical_gap = max(0.0, line.y - previous_bottom)
        paragraph.paragraph_format.space_before = Pt(min(24.0, vertical_gap * 0.45))
        paragraph.paragraph_format.space_after = Pt(0)
        paragraph.paragraph_format.line_spacing = 1.0
        run = paragraph.add_run(line.text)
        run.font.name = line.font_name or "Arial"
        run.font.size = Pt(line.font_size)
        run.bold = line.bold
        run.italic = line.italic
        previous_bottom = max(previous_bottom, line.y + line.height)
    return used_ocr


def convert_sources(
    sources: Sequence[SourcePdf],
    layout_mode: LayoutMode,
    use_ocr: bool = False,
    ocr_language: str = "eng",
    title: str = "NovaPDF Word document",
) -> ConversionResult:
    if not sources:
        raise ConversionError("Add at least one PDF before conversion.")
    if sum(len(source.data) for source in sources) > MAX_TOTAL_BYTES:
        raise ConversionError("The selected PDFs exceed the 150 MB batch limit.")
    if layout_mode not in {"editable", "visual", "hybrid"}:
        raise ConversionError("Unsupported PDF to Word layout mode.")
    if not re.fullmatch(r"[a-z]{3}(?:\+[a-z]{3})*", ocr_language):
        raise ConversionError("Unsupported OCR language value.")

    document = Document()
    document.core_properties.title = _clean_xml_text(title)
    document.core_properties.author = "NovaPDF"
    document.core_properties.last_modified_by = "NovaPDF"
    normal = document.styles["Normal"]
    normal.font.name = "Arial"
    normal.font.size = Pt(11)

    page_count = 0
    ocr_page_count = 0
    native_text_page_count = 0
    opened_documents: list[pdfium.PdfDocument] = []
    shape_counter = 1
    try:
        selections: list[tuple[SourcePdf, pdfium.PdfDocument, tuple[int, ...]]] = []
        for source in sources:
            pdf = _open_pdf(source)
            opened_documents.append(pdf)
            pages = _selected_pages(source, len(pdf))
            selections.append((source, pdf, pages))
            page_count += len(pages)
        if page_count > MAX_TOTAL_PAGES:
            raise ConversionError(f"The selected PDFs exceed the {MAX_TOTAL_PAGES}-page conversion limit.")

        current_page = 0
        for _, pdf, pages in selections:
            for page_index in pages:
                page = pdf[page_index]
                try:
                    first_page = current_page == 0
                    if layout_mode == "visual":
                        used_ocr, native = _append_visual_page(
                            document,
                            page,
                            first_page,
                            use_ocr,
                            ocr_language,
                        )
                        native_text_page_count += int(native)
                        ocr_page_count += int(used_ocr)
                    elif layout_mode == "hybrid":
                        used_ocr, native, shape_counter = _append_hybrid_page(
                            document,
                            page,
                            first_page,
                            use_ocr,
                            ocr_language,
                            shape_counter,
                        )
                        native_text_page_count += int(native)
                        ocr_page_count += int(used_ocr)
                    else:
                        native = _native_character_count(page) >= MIN_NATIVE_TEXT_CHARACTERS
                        used_ocr = _append_editable_page(document, page, first_page, use_ocr, ocr_language)
                        native_text_page_count += int(native)
                        ocr_page_count += int(used_ocr)
                    current_page += 1
                finally:
                    page.close()

        output = io.BytesIO()
        document.save(output)
        data = output.getvalue()
        if not data.startswith(b"PK\x03\x04"):
            raise ConversionError("The Word document package could not be finalized.")
        return ConversionResult(data, page_count, ocr_page_count, native_text_page_count)
    finally:
        for pdf in opened_documents:
            pdf.close()


def suggested_download_name(value: str) -> str:
    return f"{_safe_filename(value)}.docx"
