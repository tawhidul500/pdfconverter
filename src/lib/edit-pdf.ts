import {
  degrees,
  PDFDocument,
  PDFName,
  PDFString,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import {
  clampNumber,
  getVisualPageGeometry,
  hexToRgbTuple,
  rotateVector,
  visualToPagePoint,
  type Point,
} from "./watermark-pdf";

export type EditPdfObjectType =
  | "text"
  | "image"
  | "rectangle"
  | "ellipse"
  | "line"
  | "highlight"
  | "underline"
  | "freehand"
  | "link";

export type EditPdfFontFamily = "helvetica" | "times" | "courier";
export type EditPdfTextAlign = "left" | "center" | "right";
export type EditPdfImageType = "png" | "jpg";

export type EditPdfAssetInput = {
  id: string;
  bytes: ArrayBuffer | Uint8Array;
  imageType: EditPdfImageType;
};

/**
 * Object x/y are normalized visual-page centre coordinates measured from top-left.
 * Width/height are normalized against the visual page width/height.
 * Freehand points are normalized inside the object's own unrotated box.
 */
export type EditPdfObject = {
  id: string;
  pageNumber: number;
  type: EditPdfObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  text?: string;
  url?: string;
  assetId?: string;
  fontFamily?: EditPdfFontFamily;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  align?: EditPdfTextAlign;
  color?: string;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  points?: Array<{ x: number; y: number }>;
};

export type EditPdfSettings = {
  assets: EditPdfAssetInput[];
  objects: EditPdfObject[];
};

export type EditPdfResult = {
  bytes: Uint8Array;
  pageCount: number;
  editedPageCount: number;
  objectCount: number;
};

type FontSet = {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
};

type ObjectGeometry = {
  page: PDFPage;
  visualWidth: number;
  visualHeight: number;
  pageRotation: number;
  crop: { x: number; y: number; width: number; height: number };
  center: Point;
  width: number;
  height: number;
  rotation: number;
  visualAnchor: Point;
  pageAnchor: Point;
};

function normalizeBytes(bytes: ArrayBuffer | Uint8Array) {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

function normalizedObjectGeometry(page: PDFPage, object: EditPdfObject): ObjectGeometry {
  const { crop, pageRotation, visualWidth, visualHeight } = getVisualPageGeometry(page);
  const center = {
    x: clampNumber(object.x, 0, 1) * visualWidth,
    y: (1 - clampNumber(object.y, 0, 1)) * visualHeight,
  };
  const width = Math.max(2, clampNumber(object.width, 0.002, 0.98) * visualWidth);
  const height = Math.max(2, clampNumber(object.height, 0.002, 0.98) * visualHeight);
  const rotation = clampNumber(object.rotation, -180, 180);
  const centerOffset = rotateVector({ x: width / 2, y: height / 2 }, rotation);
  const visualAnchor = { x: center.x - centerOffset.x, y: center.y - centerOffset.y };
  const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);
  return {
    page,
    visualWidth,
    visualHeight,
    pageRotation,
    crop,
    center,
    width,
    height,
    rotation,
    visualAnchor,
    pageAnchor,
  };
}

function color(value: string | undefined, fallback = "#111827") {
  const [red, green, blue] = hexToRgbTuple(value ?? fallback);
  return rgb(red, green, blue);
}

function selectFont(fonts: Record<EditPdfFontFamily, FontSet>, object: EditPdfObject) {
  const family = object.fontFamily ?? "helvetica";
  const set = fonts[family];
  if (object.bold && object.italic) return set.boldItalic;
  if (object.bold) return set.bold;
  if (object.italic) return set.italic;
  return set.regular;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function localPointToPage(geometry: ObjectGeometry, local: Point) {
  const rotated = rotateVector(local, geometry.rotation);
  const visual = {
    x: geometry.visualAnchor.x + rotated.x,
    y: geometry.visualAnchor.y + rotated.y,
  };
  return visualToPagePoint(visual, geometry.pageRotation, geometry.crop);
}

function addLinkAnnotation(document: PDFDocument, geometry: ObjectGeometry, url: string) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  const corners = [
    localPointToPage(geometry, { x: 0, y: 0 }),
    localPointToPage(geometry, { x: geometry.width, y: 0 }),
    localPointToPage(geometry, { x: geometry.width, y: geometry.height }),
    localPointToPage(geometry, { x: 0, y: geometry.height }),
  ];
  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  const action = document.context.obj({
    S: PDFName.of("URI"),
    URI: PDFString.of(trimmed),
  });
  const annotation = document.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    Border: [0, 0, 0],
    A: action,
  });
  const reference = document.context.register(annotation);
  geometry.page.node.addAnnot(reference);
  return true;
}

function drawTextObject(
  geometry: ObjectGeometry,
  object: EditPdfObject,
  fonts: Record<EditPdfFontFamily, FontSet>,
) {
  const text = object.text ?? "";
  if (!text.trim()) return false;
  const font = selectFont(fonts, object);
  const requestedSize = clampNumber(object.fontSize ?? 18, 6, 160);
  try {
    font.encodeText(text.replace(/\r?\n/g, " "));
  } catch {
    throw new Error("This Edit PDF build supports standard Latin text. Remove unsupported characters and try again.");
  }

  const padding = Math.max(3, Math.min(14, requestedSize * 0.35));
  const availableWidth = Math.max(4, geometry.width - padding * 2);
  let size = requestedSize;
  let lines = wrapText(text, font, size, availableWidth);
  const lineHeightFactor = 1.22;
  const maximumHeight = Math.max(4, geometry.height - padding * 2);
  const requiredHeight = () => lines.length * size * lineHeightFactor;
  if (requiredHeight() > maximumHeight && lines.length > 0) {
    size = Math.max(6, size * maximumHeight / requiredHeight());
    lines = wrapText(text, font, size, availableWidth);
  }

  const fillOpacity = clampNumber(object.opacity, 0.02, 1);
  const borderWidth = clampNumber(object.borderWidth ?? 0, 0, 24);
  if ((object.fillColor && object.fillColor !== "transparent") || borderWidth > 0) {
    geometry.page.drawRectangle({
      x: geometry.pageAnchor.x,
      y: geometry.pageAnchor.y,
      width: geometry.width,
      height: geometry.height,
      rotate: degrees(geometry.rotation + geometry.pageRotation),
      color: object.fillColor && object.fillColor !== "transparent" ? color(object.fillColor, "#ffffff") : undefined,
      opacity: object.fillColor && object.fillColor !== "transparent" ? fillOpacity : undefined,
      borderColor: borderWidth > 0 ? color(object.borderColor, "#cbd5e1") : undefined,
      borderWidth,
      borderOpacity: borderWidth > 0 ? fillOpacity : undefined,
    });
  }

  const align = object.align ?? "left";
  const lineHeight = size * lineHeightFactor;
  const contentHeight = lines.length * lineHeight;
  const topBaseline = Math.max(padding + size * 0.2, geometry.height - padding - size);
  const startY = Math.min(topBaseline, (geometry.height + contentHeight) / 2 - lineHeight + size * 0.15);

  lines.forEach((line, index) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    const localX = align === "center"
      ? (geometry.width - lineWidth) / 2
      : align === "right"
        ? geometry.width - padding - lineWidth
        : padding;
    const localY = startY - index * lineHeight;
    const point = localPointToPage(geometry, { x: localX, y: localY });
    geometry.page.drawText(line, {
      x: point.x,
      y: point.y,
      size,
      font,
      color: color(object.color),
      opacity: fillOpacity,
      rotate: degrees(geometry.rotation + geometry.pageRotation),
    });
  });
  return true;
}

function drawImageObject(geometry: ObjectGeometry, object: EditPdfObject, image: PDFImage | undefined) {
  if (!image) return false;
  geometry.page.drawImage(image, {
    x: geometry.pageAnchor.x,
    y: geometry.pageAnchor.y,
    width: geometry.width,
    height: geometry.height,
    opacity: clampNumber(object.opacity, 0.02, 1),
    rotate: degrees(geometry.rotation + geometry.pageRotation),
  });
  return true;
}

function drawShapeObject(geometry: ObjectGeometry, object: EditPdfObject) {
  const opacity = clampNumber(object.opacity, 0.02, 1);
  const borderWidth = clampNumber(object.borderWidth ?? 1.5, 0, 24);
  if (object.type === "ellipse") {
    const pageCenter = visualToPagePoint(geometry.center, geometry.pageRotation, geometry.crop);
    geometry.page.drawEllipse({
      x: pageCenter.x,
      y: pageCenter.y,
      xScale: geometry.width / 2,
      yScale: geometry.height / 2,
      rotate: degrees(geometry.rotation + geometry.pageRotation),
      color: object.fillColor && object.fillColor !== "transparent" ? color(object.fillColor, "#dff8f3") : undefined,
      opacity: object.fillColor && object.fillColor !== "transparent" ? opacity : undefined,
      borderColor: borderWidth > 0 ? color(object.borderColor, "#0f766e") : undefined,
      borderWidth,
      borderOpacity: borderWidth > 0 ? opacity : undefined,
    });
    return true;
  }

  geometry.page.drawRectangle({
    x: geometry.pageAnchor.x,
    y: geometry.pageAnchor.y,
    width: geometry.width,
    height: geometry.height,
    rotate: degrees(geometry.rotation + geometry.pageRotation),
    color: object.fillColor && object.fillColor !== "transparent" ? color(object.fillColor, object.type === "highlight" ? "#fde047" : "#dff8f3") : undefined,
    opacity: object.fillColor && object.fillColor !== "transparent" ? opacity : undefined,
    borderColor: borderWidth > 0 ? color(object.borderColor, "#0f766e") : undefined,
    borderWidth,
    borderOpacity: borderWidth > 0 ? opacity : undefined,
  });
  return true;
}

function drawLineObject(geometry: ObjectGeometry, object: EditPdfObject) {
  const start = localPointToPage(geometry, { x: 0, y: geometry.height / 2 });
  const end = localPointToPage(geometry, { x: geometry.width, y: geometry.height / 2 });
  geometry.page.drawLine({
    start,
    end,
    thickness: clampNumber(object.borderWidth ?? 2, 0.5, 36),
    color: color(object.color ?? object.borderColor, object.type === "underline" ? "#ef4444" : "#111827"),
    opacity: clampNumber(object.opacity, 0.02, 1),
  });
  return true;
}

function drawFreehandObject(geometry: ObjectGeometry, object: EditPdfObject) {
  const points = object.points ?? [];
  if (points.length < 2) return false;
  const stroke = color(object.color ?? object.borderColor, "#111827");
  const thickness = clampNumber(object.borderWidth ?? 2.5, 0.5, 36);
  const opacity = clampNumber(object.opacity, 0.02, 1);
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const start = localPointToPage(geometry, {
      x: clampNumber(previous.x, 0, 1) * geometry.width,
      y: (1 - clampNumber(previous.y, 0, 1)) * geometry.height,
    });
    const end = localPointToPage(geometry, {
      x: clampNumber(current.x, 0, 1) * geometry.width,
      y: (1 - clampNumber(current.y, 0, 1)) * geometry.height,
    });
    geometry.page.drawLine({ start, end, thickness, color: stroke, opacity });
  }
  return true;
}

export async function applyPdfEdits(
  sourceBytes: ArrayBuffer | Uint8Array,
  settings: EditPdfSettings,
): Promise<EditPdfResult> {
  const document = await PDFDocument.load(sourceBytes, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  const pages = document.getPages();
  if (pages.length === 0) throw new Error("This PDF does not contain any pages.");

  const objects = settings.objects
    .filter((object) => Number.isInteger(object.pageNumber) && object.pageNumber >= 1 && object.pageNumber <= pages.length)
    .sort((left, right) => left.pageNumber - right.pageNumber || left.zIndex - right.zIndex);
  if (objects.length === 0) throw new Error("Add at least one edit before saving the PDF.");

  const fonts: Record<EditPdfFontFamily, FontSet> = {
    helvetica: {
      regular: await document.embedFont(StandardFonts.Helvetica),
      bold: await document.embedFont(StandardFonts.HelveticaBold),
      italic: await document.embedFont(StandardFonts.HelveticaOblique),
      boldItalic: await document.embedFont(StandardFonts.HelveticaBoldOblique),
    },
    times: {
      regular: await document.embedFont(StandardFonts.TimesRoman),
      bold: await document.embedFont(StandardFonts.TimesRomanBold),
      italic: await document.embedFont(StandardFonts.TimesRomanItalic),
      boldItalic: await document.embedFont(StandardFonts.TimesRomanBoldItalic),
    },
    courier: {
      regular: await document.embedFont(StandardFonts.Courier),
      bold: await document.embedFont(StandardFonts.CourierBold),
      italic: await document.embedFont(StandardFonts.CourierOblique),
      boldItalic: await document.embedFont(StandardFonts.CourierBoldOblique),
    },
  };

  const images = new Map<string, PDFImage>();
  for (const asset of settings.assets) {
    const bytes = normalizeBytes(asset.bytes);
    if (!bytes.length) continue;
    try {
      images.set(asset.id, asset.imageType === "png" ? await document.embedPng(bytes) : await document.embedJpg(bytes));
    } catch {
      throw new Error("One of the edit images is invalid. Use PNG, JPG, or JPEG.");
    }
  }

  const editedPages = new Set<number>();
  let objectCount = 0;

  for (const object of objects) {
    const page = pages[object.pageNumber - 1];
    const geometry = normalizedObjectGeometry(page, object);
    let drawn = false;

    if (object.type === "text") drawn = drawTextObject(geometry, object, fonts);
    else if (object.type === "image") drawn = drawImageObject(geometry, object, object.assetId ? images.get(object.assetId) : undefined);
    else if (object.type === "rectangle" || object.type === "ellipse" || object.type === "highlight") drawn = drawShapeObject(geometry, object);
    else if (object.type === "line" || object.type === "underline") drawn = drawLineObject(geometry, object);
    else if (object.type === "freehand") drawn = drawFreehandObject(geometry, object);
    else if (object.type === "link") {
      if ((object.fillColor && object.fillColor !== "transparent") || (object.borderWidth ?? 0) > 0) {
        drawShapeObject(geometry, { ...object, type: "rectangle" });
      }
      drawn = addLinkAnnotation(document, geometry, object.url ?? "");
    }

    if (drawn) {
      editedPages.add(object.pageNumber);
      objectCount += 1;
    }
  }

  if (objectCount === 0) throw new Error("No valid edits could be added to this PDF.");

  const saved = await document.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
  const bytes = new Uint8Array(saved.length);
  bytes.set(saved);
  return {
    bytes,
    pageCount: pages.length,
    editedPageCount: editedPages.size,
    objectCount,
  };
}
