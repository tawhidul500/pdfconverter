import JSZip from "jszip";

export type PdfToWordLayoutMode = "visual" | "editable";

export type PdfToWordSource = {
  name: string;
  bytes: Uint8Array;
  pageNumbers: number[];
};

export type PdfToWordProgress = {
  completedPages: number;
  totalPages: number;
  sourceName: string;
  pageNumber: number;
  phase: "loading" | "rendering" | "extracting" | "packaging";
};

export type PdfToWordResult = {
  bytes: Uint8Array;
  pageCount: number;
  extractedCharacterCount: number;
  emptyTextPageCount: number;
  layoutMode: PdfToWordLayoutMode;
};

type EditableParagraph = {
  text: string;
  fontSizePoints: number;
  bold: boolean;
  italic: boolean;
  spaceBeforePoints: number;
};

type VisualWordPage = {
  kind: "visual";
  widthPoints: number;
  heightPoints: number;
  imageBytes: Uint8Array;
  imageType: "jpeg";
};

type EditableWordPage = {
  kind: "editable";
  widthPoints: number;
  heightPoints: number;
  paragraphs: EditableParagraph[];
};

type WordPage = VisualWordPage | EditableWordPage;

type PdfTextItemLike = {
  str: string;
  width: number;
  height: number;
  transform: number[];
  fontName?: string;
  hasEOL?: boolean;
};

type PdfPageLike = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  getTextContent: (options?: Record<string, unknown>) => Promise<{ items: unknown[] }>;
  render: (options: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
  cleanup: () => void;
};

type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
};

type PdfLoadingTaskLike = {
  promise: Promise<PdfDocumentLike>;
  destroy: () => Promise<void>;
};

const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const VISUAL_MARGIN_TWIPS = 240;
const EDITABLE_MARGIN_TWIPS = 720;
const MAX_RENDER_LONG_EDGE = 2400;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizePageNumbers(pageNumbers: number[], pageCount: number) {
  return [...new Set(pageNumbers)]
    .filter((pageNumber) => Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= pageCount)
    .sort((first, second) => first - second);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function pageSizeTwips(widthPoints: number, heightPoints: number) {
  return {
    width: Math.round(clamp(widthPoints * 20, 1440, 31680)),
    height: Math.round(clamp(heightPoints * 20, 1440, 31680)),
  };
}

function sectionProperties(page: WordPage, nextPage = false) {
  const size = pageSizeTwips(page.widthPoints, page.heightPoints);
  const margin = page.kind === "visual" ? VISUAL_MARGIN_TWIPS : EDITABLE_MARGIN_TWIPS;
  return `<w:sectPr>${nextPage ? '<w:type w:val="nextPage"/>' : ""}<w:pgSz w:w="${size.width}" w:h="${size.height}"/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="0" w:footer="0" w:gutter="0"/><w:cols w:space="720"/><w:docGrid w:linePitch="360"/></w:sectPr>`;
}

function sectionBreakParagraph(page: WordPage) {
  return `<w:p><w:pPr>${sectionProperties(page, true)}</w:pPr></w:p>`;
}

function visualPageXml(page: VisualWordPage, imageIndex: number) {
  const size = pageSizeTwips(page.widthPoints, page.heightPoints);
  const usableWidthPoints = Math.max(24, (size.width - VISUAL_MARGIN_TWIPS * 2) / 20);
  const usableHeightPoints = Math.max(24, (size.height - VISUAL_MARGIN_TWIPS * 2) / 20);
  const scale = Math.min(usableWidthPoints / page.widthPoints, usableHeightPoints / page.heightPoints);
  const widthEmu = Math.max(1, Math.round(page.widthPoints * scale * 12700));
  const heightEmu = Math.max(1, Math.round(page.heightPoints * scale * 12700));
  const relationshipId = `rIdImage${imageIndex}`;

  return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${imageIndex}" name="PDF page ${imageIndex}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${imageIndex}" name="page-${imageIndex}.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function editableParagraphXml(paragraph: EditableParagraph) {
  const fontSizeHalfPoints = Math.round(clamp(paragraph.fontSizePoints, 7, 72) * 2);
  const spaceBeforeTwips = Math.round(clamp(paragraph.spaceBeforePoints, 0, 72) * 20);
  const lineTwips = Math.round(clamp(paragraph.fontSizePoints * 1.25, 10, 90) * 20);
  const runProperties = `${paragraph.bold ? "<w:b/>" : ""}${paragraph.italic ? "<w:i/>" : ""}<w:sz w:val="${fontSizeHalfPoints}"/><w:szCs w:val="${fontSizeHalfPoints}"/>`;
  const text = paragraph.text.length ? escapeXml(paragraph.text) : " ";
  return `<w:p><w:pPr><w:spacing w:before="${spaceBeforeTwips}" w:after="0" w:line="${lineTwips}" w:lineRule="atLeast"/></w:pPr><w:r><w:rPr>${runProperties}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function documentXml(pages: WordPage[]) {
  let imageIndex = 0;
  const body: string[] = [];

  pages.forEach((page, pageIndex) => {
    if (page.kind === "visual") {
      imageIndex += 1;
      body.push(visualPageXml(page, imageIndex));
    } else if (page.paragraphs.length) {
      page.paragraphs.forEach((paragraph) => body.push(editableParagraphXml(paragraph)));
    } else {
      body.push(editableParagraphXml({ text: "", fontSizePoints: 11, bold: false, italic: false, spaceBeforePoints: 0 }));
    }

    if (pageIndex < pages.length - 1) body.push(sectionBreakParagraph(page));
  });

  const finalSection = pages.length ? sectionProperties(pages[pages.length - 1]) : sectionProperties({ kind: "editable", widthPoints: 612, heightPoints: 792, paragraphs: [] });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14"><w:body>${body.join("")}${finalSection}</w:body></w:document>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:widowControl/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:style></w:styles>`;
}

function settingsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
}

function rootRelationshipsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
}

function documentRelationshipsXml(imageCount: number) {
  const images = Array.from({ length: imageCount }, (_, index) => `<Relationship Id="rIdImage${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/page-${index + 1}.jpg"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>${images}</Relationships>`;
}

function corePropertiesXml(title: string) {
  const created = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(title)}</dc:title><dc:creator>NovaPDF</dc:creator><cp:lastModifiedBy>NovaPDF</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`;
}

function appPropertiesXml(pageCount: number) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>NovaPDF</Application><AppVersion>14.1</AppVersion><Pages>${pageCount}</Pages><Company>NovaPDF</Company></Properties>`;
}

export async function buildPdfToWordDocx(pages: WordPage[], title = "NovaPDF Word document") {
  if (!pages.length) throw new Error("No PDF pages were selected for conversion.");
  const zip = new JSZip();
  const visualPages = pages.filter((page): page is VisualWordPage => page.kind === "visual");

  zip.file("[Content_Types].xml", contentTypesXml());
  zip.folder("_rels")?.file(".rels", rootRelationshipsXml());
  zip.folder("docProps")?.file("core.xml", corePropertiesXml(title));
  zip.folder("docProps")?.file("app.xml", appPropertiesXml(pages.length));
  const word = zip.folder("word");
  word?.file("document.xml", documentXml(pages));
  word?.file("styles.xml", stylesXml());
  word?.file("settings.xml", settingsXml());
  word?.folder("_rels")?.file("document.xml.rels", documentRelationshipsXml(visualPages.length));
  const media = word?.folder("media");
  visualPages.forEach((page, index) => media?.file(`page-${index + 1}.jpg`, page.imageBytes));

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType: WORD_MIME,
  });
}

function isTextItem(item: unknown): item is PdfTextItemLike {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Partial<PdfTextItemLike>;
  return typeof candidate.str === "string" && Array.isArray(candidate.transform) && candidate.transform.length >= 6;
}

function lineFontSize(item: PdfTextItemLike) {
  const horizontal = Math.hypot(item.transform[0] ?? 0, item.transform[1] ?? 0);
  const vertical = Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0);
  return clamp(Math.max(horizontal, vertical, item.height || 0, 8), 7, 72);
}

export function pdfTextItemsToEditableParagraphs(items: unknown[]) {
  const textItems = items
    .filter(isTextItem)
    .filter((item) => item.str.length > 0)
    .map((item) => ({
      item,
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
      fontSize: lineFontSize(item),
    }));

  if (!textItems.length) return [];

  const sorted = [...textItems].sort((first, second) => {
    const yDifference = second.y - first.y;
    if (Math.abs(yDifference) > 1.5) return yDifference;
    return first.x - second.x;
  });

  const lines: Array<{ y: number; items: typeof sorted; fontSize: number }> = [];
  for (const entry of sorted) {
    const existing = lines.find((line) => Math.abs(line.y - entry.y) <= Math.max(2, entry.fontSize * 0.35));
    if (existing) {
      existing.items.push(entry);
      existing.y = (existing.y * (existing.items.length - 1) + entry.y) / existing.items.length;
      existing.fontSize = Math.max(existing.fontSize, entry.fontSize);
    } else {
      lines.push({ y: entry.y, items: [entry], fontSize: entry.fontSize });
    }
  }

  lines.sort((first, second) => second.y - first.y);
  const paragraphs: EditableParagraph[] = [];
  let previousLine: typeof lines[number] | null = null;

  for (const line of lines) {
    const ordered = [...line.items].sort((first, second) => first.x - second.x);
    let text = "";
    let previousEnd: number | null = null;
    let boldCount = 0;
    let italicCount = 0;

    ordered.forEach(({ item, x, fontSize }) => {
      const normalized = item.str.replace(/\s+/g, " ");
      if (!normalized) return;
      const averageCharacterWidth = Math.max(1, Math.abs(item.width || 0) / Math.max(1, normalized.length));
      if (previousEnd !== null && x - previousEnd > Math.max(1.5, averageCharacterWidth * 0.45)) text += " ";
      text += normalized;
      previousEnd = x + Math.max(item.width || 0, fontSize * normalized.length * 0.25);
      const fontName = (item.fontName ?? "").toLowerCase();
      if (/bold|black|semibold|demi/.test(fontName)) boldCount += 1;
      if (/italic|oblique/.test(fontName)) italicCount += 1;
    });

    const cleanText = text.trimEnd();
    if (!cleanText) continue;
    const verticalGap = previousLine ? Math.max(0, previousLine.y - line.y - previousLine.fontSize) : 0;
    paragraphs.push({
      text: cleanText,
      fontSizePoints: line.fontSize,
      bold: boldCount > ordered.length / 2,
      italic: italicCount > ordered.length / 2,
      spaceBeforePoints: verticalGap > line.fontSize * 0.75 ? clamp(verticalGap * 0.35, 2, 24) : 0,
    });
    previousLine = line;
  }

  return paragraphs;
}

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("The browser could not render a PDF page for Word."));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      0.92,
    );
  });
}

async function renderVisualPage(page: PdfPageLike, widthPoints: number, heightPoints: number) {
  if (typeof document === "undefined") throw new Error("Preserve-layout conversion requires a browser canvas.");
  const renderScale = clamp(MAX_RENDER_LONG_EDGE / Math.max(widthPoints, heightPoints), 1.25, 2.6);
  const viewport = page.getViewport({ scale: renderScale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  const imageBytes = await canvasToJpeg(canvas);
  canvas.width = 1;
  canvas.height = 1;
  return imageBytes;
}

export async function convertPdfSourcesToDocx(
  sources: PdfToWordSource[],
  options: {
    layoutMode: PdfToWordLayoutMode;
    title?: string;
    workerSrc?: string;
    onProgress?: (progress: PdfToWordProgress) => void;
  },
): Promise<PdfToWordResult> {
  if (!sources.length) throw new Error("Add at least one PDF before conversion.");
  const totalPages = sources.reduce((sum, source) => sum + source.pageNumbers.length, 0);
  if (!totalPages) throw new Error("No PDF pages were selected for conversion.");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = options.workerSrc ?? "/pdf.worker.min.mjs";
  const wordPages: WordPage[] = [];
  let completedPages = 0;
  let extractedCharacterCount = 0;
  let emptyTextPageCount = 0;

  for (const source of sources) {
    options.onProgress?.({ completedPages, totalPages, sourceName: source.name, pageNumber: 0, phase: "loading" });
    const task = pdfjs.getDocument({ data: source.bytes }) as unknown as PdfLoadingTaskLike;
    try {
      const pdf = await task.promise;
      const pageNumbers = normalizePageNumbers(source.pageNumbers, pdf.numPages);
      if (!pageNumbers.length) throw new Error(`${source.name} has no selected pages within its page count.`);

      for (const pageNumber of pageNumbers) {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        if (options.layoutMode === "visual") {
          options.onProgress?.({ completedPages, totalPages, sourceName: source.name, pageNumber, phase: "rendering" });
          const imageBytes = await renderVisualPage(page, baseViewport.width, baseViewport.height);
          wordPages.push({
            kind: "visual",
            widthPoints: baseViewport.width,
            heightPoints: baseViewport.height,
            imageBytes,
            imageType: "jpeg",
          });
        } else {
          options.onProgress?.({ completedPages, totalPages, sourceName: source.name, pageNumber, phase: "extracting" });
          const textContent = await page.getTextContent({ disableNormalization: false, includeMarkedContent: false });
          const paragraphs = pdfTextItemsToEditableParagraphs(textContent.items);
          const characterCount = paragraphs.reduce((sum, paragraph) => sum + paragraph.text.replace(/\s/g, "").length, 0);
          extractedCharacterCount += characterCount;
          if (!characterCount) emptyTextPageCount += 1;
          wordPages.push({
            kind: "editable",
            widthPoints: baseViewport.width,
            heightPoints: baseViewport.height,
            paragraphs,
          });
        }
        page.cleanup();
        completedPages += 1;
        options.onProgress?.({ completedPages, totalPages, sourceName: source.name, pageNumber, phase: options.layoutMode === "visual" ? "rendering" : "extracting" });
      }
    } finally {
      await task.destroy();
    }
  }

  if (options.layoutMode === "editable" && extractedCharacterCount === 0) {
    throw new Error("No editable text was found in the selected pages. Use Preserve layout, or run OCR on the PDF before converting.");
  }

  options.onProgress?.({ completedPages: totalPages, totalPages, sourceName: sources[sources.length - 1]?.name ?? "", pageNumber: 0, phase: "packaging" });
  const bytes = await buildPdfToWordDocx(wordPages, options.title);
  return {
    bytes,
    pageCount: wordPages.length,
    extractedCharacterCount,
    emptyTextPageCount,
    layoutMode: options.layoutMode,
  };
}
