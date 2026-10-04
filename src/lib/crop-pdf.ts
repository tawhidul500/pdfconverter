import { PDFDocument, type PDFPage } from "pdf-lib";

export type NormalizedCropRect = {
  /** Left edge as a 0..1 fraction of the visible page width. */
  x: number;
  /** Top edge as a 0..1 fraction of the visible page height. */
  y: number;
  /** Width as a 0..1 fraction of the visible page width. */
  width: number;
  /** Height as a 0..1 fraction of the visible page height. */
  height: number;
};


export type CropAspectMode = "free" | "original" | "a4" | "letter" | "square";

/**
 * Return a fresh maximum-size crop rectangle based on the original visible page.
 * This intentionally ignores a previous aspect rectangle so switching Square -> A4,
 * for example, cannot inherit the Square geometry.
 */
export function cropRectFromOriginalPageAspect(
  mode: CropAspectMode,
  visualWidth: number,
  visualHeight: number,
  currentRect: NormalizedCropRect,
): NormalizedCropRect {
  if (mode === "free") return normalizeCropRect(currentRect);
  if (mode === "original") return { x: 0, y: 0, width: 1, height: 1 };

  const landscape = visualWidth > visualHeight;
  const physicalRatio =
    mode === "square"
      ? 1
      : mode === "a4"
        ? landscape
          ? 297 / 210
          : 210 / 297
        : landscape
          ? 11 / 8.5
          : 8.5 / 11;
  const normalizedRatio = physicalRatio * (visualHeight / visualWidth);
  let width = 1;
  let height = 1;
  if (normalizedRatio < 1) width = normalizedRatio;
  else height = 1 / normalizedRatio;

  width = clampCropNumber(width, 0.04, 1);
  height = clampCropNumber(height, 0.04, 1);
  return normalizeCropRect({
    x: (1 - width) / 2,
    y: (1 - height) / 2,
    width,
    height,
  });
}

export type CropPdfSettings = {
  /** Shared crop rectangle used when a page-specific rectangle is not supplied. */
  rect: NormalizedCropRect;
  /** Optional independent crop rectangles keyed by one-based page number. */
  rectByPageNumber?: Record<number, NormalizedCropRect>;
  targetPageNumbers: number[];
};

export type CropPdfResult = {
  bytes: Uint8Array;
  pageCount: number;
  croppedPageCount: number;
};

type Point = { x: number; y: number };

type VisualPageGeometry = {
  crop: { x: number; y: number; width: number; height: number };
  rotation: 0 | 90 | 180 | 270;
  visualWidth: number;
  visualHeight: number;
};

export function clampCropNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeQuarterTurn(angle: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(angle) % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

export function normalizeCropRect(rect: NormalizedCropRect): NormalizedCropRect {
  const minimum = 0.04;
  const x = clampCropNumber(rect.x, 0, 1 - minimum);
  const y = clampCropNumber(rect.y, 0, 1 - minimum);
  const width = clampCropNumber(rect.width, minimum, 1 - x);
  const height = clampCropNumber(rect.height, minimum, 1 - y);
  return { x, y, width, height };
}

export function getCropVisualPageGeometry(page: PDFPage): VisualPageGeometry {
  const crop = page.getCropBox();
  const rotation = normalizeQuarterTurn(page.getRotation().angle);
  const visualWidth = rotation === 90 || rotation === 270 ? crop.height : crop.width;
  const visualHeight = rotation === 90 || rotation === 270 ? crop.width : crop.height;
  return { crop, rotation, visualWidth, visualHeight };
}

/** Convert a point in the visible page's bottom-left coordinate system into PDF page coordinates. */
export function cropVisualToPagePoint(
  point: Point,
  rotation: number,
  crop: { x: number; y: number; width: number; height: number },
): Point {
  const normalized = normalizeQuarterTurn(rotation);
  let localX = point.x;
  let localY = point.y;

  if (normalized === 90) {
    localX = crop.width - point.y;
    localY = point.x;
  } else if (normalized === 180) {
    localX = crop.width - point.x;
    localY = crop.height - point.y;
  } else if (normalized === 270) {
    localX = point.y;
    localY = crop.height - point.x;
  }

  return { x: crop.x + localX, y: crop.y + localY };
}

export function cropRectToPageBox(page: PDFPage, inputRect: NormalizedCropRect) {
  const rect = normalizeCropRect(inputRect);
  const { crop, rotation, visualWidth, visualHeight } = getCropVisualPageGeometry(page);

  const visualLeft = rect.x * visualWidth;
  const visualRight = (rect.x + rect.width) * visualWidth;
  const visualTop = (1 - rect.y) * visualHeight;
  const visualBottom = (1 - rect.y - rect.height) * visualHeight;

  const corners = [
    cropVisualToPagePoint({ x: visualLeft, y: visualBottom }, rotation, crop),
    cropVisualToPagePoint({ x: visualRight, y: visualBottom }, rotation, crop),
    cropVisualToPagePoint({ x: visualLeft, y: visualTop }, rotation, crop),
    cropVisualToPagePoint({ x: visualRight, y: visualTop }, rotation, crop),
  ];

  const x = Math.min(...corners.map((point) => point.x));
  const y = Math.min(...corners.map((point) => point.y));
  const right = Math.max(...corners.map((point) => point.x));
  const top = Math.max(...corners.map((point) => point.y));
  const width = Math.max(1, right - x);
  const height = Math.max(1, top - y);

  return { x, y, width, height };
}

export async function applyPdfCrop(
  input: ArrayBuffer | Uint8Array,
  settings: CropPdfSettings,
): Promise<CropPdfResult> {
  const document = await PDFDocument.load(input, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  const pages = document.getPages();
  const targets = new Set(
    settings.targetPageNumbers
      .map((value) => Math.round(value))
      .filter((value) => value >= 1 && value <= pages.length),
  );

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    if (!targets.has(pageIndex + 1)) continue;
    const pageNumber = pageIndex + 1;
    const page = pages[pageIndex];
    const rect = settings.rectByPageNumber?.[pageNumber] ?? settings.rect;
    const box = cropRectToPageBox(page, rect);

    // Set all visible-page boxes to the same rectangle so viewers and renderers
    // agree on the cropped page size while the source content remains untouched.
    page.setMediaBox(box.x, box.y, box.width, box.height);
    page.setCropBox(box.x, box.y, box.width, box.height);
    page.setBleedBox(box.x, box.y, box.width, box.height);
    page.setTrimBox(box.x, box.y, box.width, box.height);
    page.setArtBox(box.x, box.y, box.width, box.height);
  }

  return {
    bytes: await document.save({ useObjectStreams: true }),
    pageCount: pages.length,
    croppedPageCount: targets.size,
  };
}
