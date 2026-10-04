import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFImage,
} from "pdf-lib";
import {
  clampNumber,
  getVisualPageGeometry,
  getWatermarkPlacementCoordinates,
  hexToRgbTuple,
  rotateVector,
  visualToPagePoint,
} from "./watermark-pdf";

export type SignatureImageType = "png" | "jpg";
export type SignatureFieldType = "signature" | "initials" | "date" | "name" | "text" | "input" | "checkbox" | "stamp";
export type SignatureTextStyle = "regular" | "bold" | "italic";

export type SignatureAssetInput = {
  id: string;
  bytes: ArrayBuffer | Uint8Array;
  imageType: SignatureImageType;
};

/**
 * x/y are normalized visual-page center coordinates measured from top-left.
 * width/height are normalized against the visual page width/height.
 */
export type SignatureObject = {
  id: string;
  pageNumber: number;
  type: SignatureFieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  assetId?: string;
  text?: string;
  color?: string;
  fontSize?: number;
  textStyle?: SignatureTextStyle;
  required?: boolean;
  checked?: boolean;
  checkboxFillColor?: string;
  checkboxStrokeColor?: string;
  checkboxCheckColor?: string;
  checkboxCheckScale?: number;
  checkboxStrokeWidth?: number;
  label?: string;
};

export type SignPdfSettings = {
  assets: SignatureAssetInput[];
  objects: SignatureObject[];
};

export type SignPdfResult = {
  bytes: Uint8Array;
  pageCount: number;
  signedPageCount: number;
  objectCount: number;
};

function selectFont(
  style: SignatureTextStyle,
  regular: PDFFont,
  bold: PDFFont,
  italic: PDFFont,
) {
  if (style === "bold") return bold;
  if (style === "italic") return italic;
  return regular;
}

function normalizeBytes(bytes: ArrayBuffer | Uint8Array) {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

function sanitizeObjects(objects: SignatureObject[], pageCount: number) {
  return objects.filter((object) => (
    Number.isInteger(object.pageNumber)
    && object.pageNumber >= 1
    && object.pageNumber <= pageCount
  ));
}

export async function applyPdfSignatures(
  sourceBytes: ArrayBuffer | Uint8Array,
  settings: SignPdfSettings,
): Promise<SignPdfResult> {
  const document = await PDFDocument.load(sourceBytes, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  const pages = document.getPages();
  if (pages.length === 0) throw new Error("This PDF does not contain any pages.");

  const objects = sanitizeObjects(settings.objects, pages.length);
  if (objects.length === 0) throw new Error("Add at least one signature or signing field before processing.");

  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await document.embedFont(StandardFonts.TimesRomanItalic);

  const embeddedAssets = new Map<string, PDFImage>();
  for (const asset of settings.assets) {
    const bytes = normalizeBytes(asset.bytes);
    if (!bytes.length) continue;
    try {
      const image = asset.imageType === "png"
        ? await document.embedPng(bytes)
        : await document.embedJpg(bytes);
      embeddedAssets.set(asset.id, image);
    } catch {
      throw new Error("One of the signature images is invalid. Use PNG, JPG, or JPEG.");
    }
  }

  const signedPages = new Set<number>();
  let objectCount = 0;

  for (const object of objects) {
    const page = pages[object.pageNumber - 1];
    const { crop, pageRotation, visualWidth, visualHeight } = getVisualPageGeometry(page);
    const center = {
      x: clampNumber(object.x, 0, 1) * visualWidth,
      y: (1 - clampNumber(object.y, 0, 1)) * visualHeight,
    };
    const visualRotation = clampNumber(object.rotation, -180, 180);

    if (object.type === "signature" || object.type === "stamp" || (object.type === "initials" && object.assetId)) {
      if (!object.assetId) continue;
      const image = embeddedAssets.get(object.assetId);
      if (!image) continue;

      const width = Math.max(1, clampNumber(object.width, 0.001, 0.95) * visualWidth);
      const height = Math.max(1, clampNumber(object.height, 0.001, 0.95) * visualHeight);
      const centerOffset = rotateVector({ x: width / 2, y: height / 2 }, visualRotation);
      const visualAnchor = {
        x: center.x - centerOffset.x,
        y: center.y - centerOffset.y,
      };
      const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);

      page.drawImage(image, {
        x: pageAnchor.x,
        y: pageAnchor.y,
        width,
        height,
        rotate: degrees(visualRotation + pageRotation),
      });
      signedPages.add(object.pageNumber);
      objectCount += 1;
      continue;
    }

    if (object.type === "checkbox") {
      const width = Math.max(1, clampNumber(object.width, 0.001, 0.3) * visualWidth);
      const height = Math.max(1, clampNumber(object.height, 0.001, 0.3) * visualHeight);
      const side = Math.min(width, height);
      const centerOffset = rotateVector({ x: side / 2, y: side / 2 }, visualRotation);
      const visualAnchor = { x: center.x - centerOffset.x, y: center.y - centerOffset.y };
      const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);
      const [strokeRed, strokeGreen, strokeBlue] = hexToRgbTuple(object.checkboxStrokeColor ?? object.color ?? "#334155");
      const [fillRed, fillGreen, fillBlue] = hexToRgbTuple(object.checkboxFillColor ?? "#ffffff");
      const [checkRed, checkGreen, checkBlue] = hexToRgbTuple(object.checkboxCheckColor ?? object.color ?? "#0f766e");
      const borderWidth = clampNumber(object.checkboxStrokeWidth ?? 1.4, 0.2, 12);
      page.drawRectangle({
        x: pageAnchor.x,
        y: pageAnchor.y,
        width: side,
        height: side,
        borderWidth,
        borderColor: rgb(strokeRed, strokeGreen, strokeBlue),
        color: rgb(fillRed, fillGreen, fillBlue),
        rotate: degrees(visualRotation + pageRotation),
      });
      if (object.checked) {
        const localToVisual = (x: number, y: number) => {
          const rotated = rotateVector({ x, y }, visualRotation);
          return { x: visualAnchor.x + rotated.x, y: visualAnchor.y + rotated.y };
        };
        const checkScale = clampNumber(object.checkboxCheckScale ?? 1, 0.35, 1.35);
        const scaleCoordinate = (value: number) => 0.5 + (value - 0.5) * checkScale;
        const start = visualToPagePoint(localToVisual(side * scaleCoordinate(0.18), side * scaleCoordinate(0.52)), pageRotation, crop);
        const middle = visualToPagePoint(localToVisual(side * scaleCoordinate(0.42), side * scaleCoordinate(0.76)), pageRotation, crop);
        const end = visualToPagePoint(localToVisual(side * scaleCoordinate(0.84), side * scaleCoordinate(0.24)), pageRotation, crop);
        const checkThickness = Math.max(0.7, side * 0.075 * Math.min(1.2, checkScale));
        page.drawLine({ start, end: middle, thickness: checkThickness, color: rgb(checkRed, checkGreen, checkBlue) });
        page.drawLine({ start: middle, end, thickness: checkThickness, color: rgb(checkRed, checkGreen, checkBlue) });
      }
      signedPages.add(object.pageNumber);
      objectCount += 1;
      continue;
    }

    const text = (object.text ?? "").trim();
    const fontSize = clampNumber(object.fontSize ?? 18, 1, 96);
    const style = object.textStyle ?? (object.type === "initials" ? "bold" : "regular");
    const font = selectFont(style, regularFont, boldFont, italicFont);
    const [red, green, blue] = hexToRgbTuple(object.color ?? "#111827");

    if (object.type === "input") {
      const width = Math.max(1, clampNumber(object.width, 0.001, 0.92) * visualWidth);
      const height = Math.max(1, clampNumber(object.height, 0.001, 0.25) * visualHeight);
      const centerOffset = rotateVector({ x: width / 2, y: height / 2 }, visualRotation);
      const visualAnchor = { x: center.x - centerOffset.x, y: center.y - centerOffset.y };
      const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);
      page.drawRectangle({
        x: pageAnchor.x,
        y: pageAnchor.y,
        width,
        height,
        borderWidth: 0.9,
        borderColor: rgb(0.58, 0.63, 0.7),
        rotate: degrees(visualRotation + pageRotation),
      });
      signedPages.add(object.pageNumber);
      objectCount += 1;
      if (!text) continue;
      try {
        font.encodeText(text);
      } catch {
        throw new Error("This browser build supports standard Latin signing text. Remove unsupported characters and try again.");
      }
      const padding = Math.max(0.5, Math.min(12, height * 0.18, width * 0.12));
      const maxTextWidth = Math.max(0.5, width - padding * 2);
      const measuredAtRequestedSize = font.widthOfTextAtSize(text, fontSize);
      const fittedFontSize = measuredAtRequestedSize > maxTextWidth
        ? Math.max(1, fontSize * maxTextWidth / measuredAtRequestedSize)
        : fontSize;
      const baseline = Math.max(padding, (height - fittedFontSize) / 2 + fittedFontSize * 0.18);
      const localTextPoint = rotateVector({ x: padding, y: baseline }, visualRotation);
      const visualTextPoint = { x: visualAnchor.x + localTextPoint.x, y: visualAnchor.y + localTextPoint.y };
      const pageTextPoint = visualToPagePoint(visualTextPoint, pageRotation, crop);
      page.drawText(text, {
        x: pageTextPoint.x,
        y: pageTextPoint.y,
        size: fittedFontSize,
        font,
        color: rgb(red, green, blue),
        rotate: degrees(visualRotation + pageRotation),
      });
      continue;
    } else if (!text) {
      continue;
    }

    try {
      font.encodeText(text);
    } catch {
      throw new Error("This browser build supports standard Latin signing text. Remove unsupported characters and try again.");
    }
    const coordinates = getWatermarkPlacementCoordinates(page, font, text, {
      fontSize,
      rotation: visualRotation,
      placement: "center",
      margin: 0,
      customPosition: { x: clampNumber(object.x, 0, 1), y: clampNumber(object.y, 0, 1) },
    });

    page.drawText(text, {
      x: coordinates.x,
      y: coordinates.y,
      size: fontSize,
      font,
      color: rgb(red, green, blue),
      rotate: degrees(coordinates.rotation),
    });
    signedPages.add(object.pageNumber);
    objectCount += 1;
  }

  if (objectCount === 0) throw new Error("No valid signing fields could be added to this PDF.");

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
    signedPageCount: signedPages.size,
    objectCount,
  };
}
