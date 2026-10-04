import { degrees, PDFDocument, rgb, StandardFonts, type PDFImage, type PDFPage } from "pdf-lib";
import { SignatureFieldType } from "../common/enums";

export type FinalizationField = {
  id: string;
  pageNumber: number;
  type: SignatureFieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  defaultValue: string | null;
  style: Record<string, unknown>;
};

export type FinalizationResponse = Record<string, {
  value?: unknown;
  checked?: unknown;
  assetKey?: unknown;
  mimeType?: unknown;
}>;

export type AssetLoader = (key: string) => Promise<Uint8Array>;

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeRotation(value: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(value) % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

function visualGeometry(page: PDFPage) {
  const crop = page.getCropBox();
  const pageRotation = normalizeRotation(page.getRotation().angle);
  return {
    crop,
    pageRotation,
    visualWidth: pageRotation === 90 || pageRotation === 270 ? crop.height : crop.width,
    visualHeight: pageRotation === 90 || pageRotation === 270 ? crop.width : crop.height,
  };
}

function rotateVector(point: { x: number; y: number }, angleDegrees: number) {
  const radians = angleDegrees * Math.PI / 180;
  return {
    x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
  };
}

function visualToPagePoint(
  point: { x: number; y: number },
  pageRotation: number,
  crop: { x: number; y: number; width: number; height: number },
) {
  const rotation = normalizeRotation(pageRotation);
  let localX = point.x;
  let localY = point.y;
  if (rotation === 90) {
    localX = crop.width - point.y;
    localY = point.x;
  } else if (rotation === 180) {
    localX = crop.width - point.x;
    localY = crop.height - point.y;
  } else if (rotation === 270) {
    localX = point.y;
    localY = crop.height - point.x;
  }
  return { x: crop.x + localX, y: crop.y + localY };
}

function colorFromStyle(style: Record<string, unknown>) {
  const raw = typeof style.color === "string" ? style.color.trim().replace(/^#/, "") : "111827";
  const value = /^[0-9a-fA-F]{6}$/.test(raw) ? raw : "111827";
  return rgb(
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
  );
}

function numberFromStyle(style: Record<string, unknown>, key: string, fallback: number) {
  const value = style[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function textFromResponse(field: FinalizationField, response: FinalizationResponse[string] | undefined) {
  if (typeof response?.value === "string") return response.value.trim();
  return field.defaultValue?.trim() ?? "";
}

async function embedAsset(document: PDFDocument, bytes: Uint8Array, mimeType: string): Promise<PDFImage> {
  if (mimeType === "image/png") return document.embedPng(bytes);
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return document.embedJpg(bytes);
  throw new Error(`Unsupported signing asset type: ${mimeType}`);
}

/**
 * Applies all persisted signer responses to the original PDF. Field x/y values are
 * normalized visual-page centre coordinates measured from the page's top-left,
 * matching NovaPDF's existing self-signing engine.
 */
export async function renderCompletedPdf(
  sourceBytes: Uint8Array,
  fields: FinalizationField[],
  responseByFieldId: FinalizationResponse,
  loadAsset: AssetLoader,
): Promise<{ bytes: Uint8Array; renderedFieldCount: number; pageCount: number }> {
  const document = await PDFDocument.load(sourceBytes, { updateMetadata: false, throwOnInvalidObject: true });
  const pages = document.getPages();
  if (pages.length === 0) throw new Error("This PDF does not contain any pages.");

  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const italic = await document.embedFont(StandardFonts.TimesRomanItalic);
  const assetCache = new Map<string, PDFImage>();
  let renderedFieldCount = 0;

  for (const field of fields) {
    const page = pages[field.pageNumber - 1];
    if (!page) throw new Error(`Signing field ${field.id} references missing page ${field.pageNumber}.`);
    const response = responseByFieldId[field.id];
    const { crop, pageRotation, visualWidth, visualHeight } = visualGeometry(page);
    const center = {
      x: clamp(field.x, 0, 1) * visualWidth,
      y: (1 - clamp(field.y, 0, 1)) * visualHeight,
    };
    const visualRotation = clamp(field.rotation, -180, 180);
    const width = Math.max(8, clamp(field.width, 0.005, 1) * visualWidth);
    const height = Math.max(8, clamp(field.height, 0.005, 1) * visualHeight);
    const centerOffset = rotateVector({ x: width / 2, y: height / 2 }, visualRotation);
    const visualAnchor = { x: center.x - centerOffset.x, y: center.y - centerOffset.y };
    const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);
    const outputRotation = visualRotation + pageRotation;

    const assetKey = typeof response?.assetKey === "string" ? response.assetKey : undefined;
    const mimeType = typeof response?.mimeType === "string" ? response.mimeType : undefined;
    if (assetKey && mimeType && [SignatureFieldType.SIGNATURE, SignatureFieldType.INITIALS, SignatureFieldType.STAMP].includes(field.type)) {
      let image = assetCache.get(assetKey);
      if (!image) {
        image = await embedAsset(document, await loadAsset(assetKey), mimeType);
        assetCache.set(assetKey, image);
      }
      page.drawImage(image, { x: pageAnchor.x, y: pageAnchor.y, width, height, rotate: degrees(outputRotation) });
      renderedFieldCount += 1;
      continue;
    }

    if (field.type === SignatureFieldType.CHECKBOX) {
      const side = Math.min(width, height);
      const color = colorFromStyle(field.style);
      page.drawRectangle({ x: pageAnchor.x, y: pageAnchor.y, width: side, height: side, borderWidth: 1.2, borderColor: color, rotate: degrees(outputRotation) });
      if (response?.checked === true) {
        const localToPage = (x: number, y: number) => {
          const rotated = rotateVector({ x, y }, visualRotation);
          return visualToPagePoint({ x: visualAnchor.x + rotated.x, y: visualAnchor.y + rotated.y }, pageRotation, crop);
        };
        page.drawLine({ start: localToPage(side * 0.2, side * 0.5), end: localToPage(side * 0.43, side * 0.24), thickness: 2, color });
        page.drawLine({ start: localToPage(side * 0.43, side * 0.24), end: localToPage(side * 0.82, side * 0.78), thickness: 2, color });
      }
      renderedFieldCount += 1;
      continue;
    }

    const text = textFromResponse(field, response);
    if (!text) {
      if (field.type === SignatureFieldType.INPUT) {
        page.drawRectangle({ x: pageAnchor.x, y: pageAnchor.y, width, height, borderWidth: 0.9, borderColor: rgb(0.58, 0.63, 0.7), rotate: degrees(outputRotation) });
        renderedFieldCount += 1;
      }
      continue;
    }

    const styleName = typeof field.style.textStyle === "string" ? field.style.textStyle : field.type === SignatureFieldType.INITIALS ? "bold" : "regular";
    const font = styleName === "bold" ? bold : styleName === "italic" ? italic : regular;
    try { font.encodeText(text); } catch { throw new Error(`Field ${field.id} contains characters unsupported by the standard PDF font.`); }
    const requestedFontSize = clamp(numberFromStyle(field.style, "fontSize", 18), 7, 96);
    const color = colorFromStyle(field.style);

    if (field.type === SignatureFieldType.INPUT) {
      page.drawRectangle({ x: pageAnchor.x, y: pageAnchor.y, width, height, borderWidth: 0.9, borderColor: rgb(0.58, 0.63, 0.7), rotate: degrees(outputRotation) });
      const padding = Math.max(4, Math.min(12, height * 0.18));
      const measured = Math.max(1, font.widthOfTextAtSize(text, requestedFontSize));
      const fitted = measured > width - padding * 2 ? Math.max(7, requestedFontSize * (width - padding * 2) / measured) : requestedFontSize;
      const local = rotateVector({ x: padding, y: Math.max(padding, (height - fitted) / 2 + fitted * 0.18) }, visualRotation);
      const point = visualToPagePoint({ x: visualAnchor.x + local.x, y: visualAnchor.y + local.y }, pageRotation, crop);
      page.drawText(text, { x: point.x, y: point.y, size: fitted, font, color, rotate: degrees(outputRotation) });
      renderedFieldCount += 1;
      continue;
    }

    const measuredWidth = Math.max(1, font.widthOfTextAtSize(text, requestedFontSize));
    const measuredHeight = Math.max(1, font.heightAtSize(requestedFontSize, { descender: true }));
    const fitted = Math.max(7, Math.min(requestedFontSize, requestedFontSize * Math.min(width / measuredWidth, height / measuredHeight)));
    const fittedWidth = font.widthOfTextAtSize(text, fitted);
    const fittedHeight = font.heightAtSize(fitted, { descender: true });
    const textOffset = rotateVector({ x: (width - fittedWidth) / 2, y: Math.max(0, (height - fittedHeight) / 2) }, visualRotation);
    const point = visualToPagePoint({ x: visualAnchor.x + textOffset.x, y: visualAnchor.y + textOffset.y }, pageRotation, crop);
    page.drawText(text, { x: point.x, y: point.y, size: fitted, font, color, rotate: degrees(outputRotation) });
    renderedFieldCount += 1;
  }

  const saved = await document.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false });
  return { bytes: new Uint8Array(saved), renderedFieldCount, pageCount: pages.length };
}
