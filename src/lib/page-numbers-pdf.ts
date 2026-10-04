import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import {
  clampNumber,
  getFontVerticalMetrics,
  getPlacementCenter,
  getVisualPageGeometry,
  rotateVector,
  visualToPagePoint,
  type PlacementCoordinates,
  type WatermarkPlacement,
} from "./watermark-pdf";

export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type PageNumberFormat = "number" | "page-number" | "number-total";
export type PageNumberFontWeight = "regular" | "bold";

export type PageNumberSettings = {
  position: PageNumberPosition;
  rangeStart: number;
  rangeEnd: number;
  startingNumber: number;
  format: PageNumberFormat;
  fontSize: number;
  margin: number;
  fontWeight: PageNumberFontWeight;
  color: [number, number, number];
};

export type PageNumberResult = {
  bytes: Uint8Array;
  pageCount: number;
  numberedPageCount: number;
};

export function formatPageNumberText(value: number, lastValue: number, format: PageNumberFormat) {
  if (format === "page-number") return `Page ${value}`;
  if (format === "number-total") return `${value} / ${lastValue}`;
  return String(value);
}

function positionAsWatermarkPlacement(position: PageNumberPosition): WatermarkPlacement {
  return position;
}

export function getPageNumberPlacementCoordinates(
  page: PDFPage,
  font: PDFFont,
  text: string,
  settings: Pick<PageNumberSettings, "position" | "fontSize" | "margin">,
): PlacementCoordinates {
  const { crop, pageRotation, visualWidth, visualHeight } = getVisualPageGeometry(page);
  const fontSize = clampNumber(settings.fontSize, 8, 36);
  const textWidth = Math.max(1, font.widthOfTextAtSize(text, fontSize));
  const verticalMetrics = getFontVerticalMetrics(font, fontSize);
  const textHeight = verticalMetrics.height;
  const center = getPlacementCenter(
    positionAsWatermarkPlacement(settings.position),
    visualWidth,
    visualHeight,
    textWidth,
    textHeight,
    clampNumber(settings.margin, 0, Math.max(visualWidth, visualHeight)),
    null,
  );
  const centerOffset = rotateVector(
    { x: textWidth / 2, y: (verticalMetrics.ascent - verticalMetrics.descent) / 2 },
    0,
  );
  const visualAnchor = {
    x: center.x - centerOffset.x,
    y: center.y - centerOffset.y,
  };
  const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);

  return {
    x: pageAnchor.x,
    y: pageAnchor.y,
    rotation: pageRotation,
  };
}

export async function applyPageNumbers(
  sourceBytes: ArrayBuffer | Uint8Array,
  settings: PageNumberSettings,
): Promise<PageNumberResult> {
  const document = await PDFDocument.load(sourceBytes, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  const pages = document.getPages();
  if (!pages.length) throw new Error("This PDF does not contain any pages.");

  const rangeStart = Math.round(clampNumber(settings.rangeStart, 1, pages.length));
  const rangeEnd = Math.round(clampNumber(settings.rangeEnd, rangeStart, pages.length));
  const fontSize = clampNumber(settings.fontSize, 8, 36);
  const margin = clampNumber(settings.margin, 0, 144);
  const font = await document.embedFont(
    settings.fontWeight === "bold" ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
  );
  const [red, green, blue] = settings.color;
  const lastValue = settings.startingNumber + Math.max(0, rangeEnd - rangeStart);

  for (let pageNumber = rangeStart; pageNumber <= rangeEnd; pageNumber += 1) {
    const page = pages[pageNumber - 1];
    const displayedNumber = settings.startingNumber + pageNumber - rangeStart;
    const text = formatPageNumberText(displayedNumber, lastValue, settings.format);
    const coordinates = getPageNumberPlacementCoordinates(page, font, text, {
      position: settings.position,
      fontSize,
      margin,
    });

    page.drawText(text, {
      x: coordinates.x,
      y: coordinates.y,
      size: fontSize,
      font,
      color: rgb(red, green, blue),
      rotate: degrees(coordinates.rotation),
    });
  }

  const saved = await document.save({ useObjectStreams: true, addDefaultPage: false });
  const bytes = new Uint8Array(saved.length);
  bytes.set(saved);
  return {
    bytes,
    pageCount: pages.length,
    numberedPageCount: rangeEnd - rangeStart + 1,
  };
}
