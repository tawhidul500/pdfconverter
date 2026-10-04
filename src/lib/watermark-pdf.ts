import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type WatermarkPlacement =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type WatermarkFontWeight = "regular" | "bold";
export type WatermarkImageType = "png" | "jpg";
export type WatermarkObjectScope = "all" | "page";

/** Normalized visual-page position measured from the top-left corner. */
export type WatermarkCustomPosition = {
  x: number;
  y: number;
};

/** One transformable watermark object. Style/content stays shared by the active tool mode. */
export type WatermarkInstance = {
  id: string;
  scope: WatermarkObjectScope;
  pageNumber?: number;
  placement: WatermarkPlacement;
  customPosition?: WatermarkCustomPosition | null;
  rotation: number;
  hiddenPages?: number[];
  /** Optional per-object text override. Page-scoped edits use this without changing other pages. */
  text?: string;
  /** Optional per-object style overrides used by This page only editing. */
  fontSize?: number;
  fontWeight?: WatermarkFontWeight;
  color?: string;
  opacity?: number;
  margin?: number;
  scalePercent?: number;
};

type SharedWatermarkSettings = {
  opacity: number;
  margin: number;
  rangeStart: number;
  rangeEnd: number;
  instances?: WatermarkInstance[];
  /** Legacy single-object fields retained for project/test compatibility. */
  rotation?: number;
  placement?: WatermarkPlacement;
  customPosition?: WatermarkCustomPosition | null;
};

export type TextWatermarkSettings = SharedWatermarkSettings & {
  text: string;
  fontSize: number;
  fontWeight: WatermarkFontWeight;
  color: string;
};

export type ImageWatermarkSettings = SharedWatermarkSettings & {
  imageBytes: ArrayBuffer | Uint8Array;
  imageType: WatermarkImageType;
  scalePercent: number;
};

export type WatermarkResult = {
  bytes: Uint8Array;
  pageCount: number;
  watermarkedPageCount: number;
};

export type Point = { x: number; y: number };

export type PlacementCoordinates = {
  x: number;
  y: number;
  rotation: number;
};

export type VisualPageGeometry = {
  crop: { x: number; y: number; width: number; height: number };
  pageRotation: 0 | 90 | 180 | 270;
  visualWidth: number;
  visualHeight: number;
};

export function clampNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export type FontVerticalMetrics = {
  ascent: number;
  descent: number;
  height: number;
};

/** Standard-font vertical metrics shared by SVG previews and PDF output. */
export function getFontVerticalMetrics(font: PDFFont, fontSize: number): FontVerticalMetrics {
  const ascent = Math.max(1, font.heightAtSize(fontSize, { descender: false }));
  const fullHeight = Math.max(ascent, font.heightAtSize(fontSize, { descender: true }));
  const descent = Math.max(0, fullHeight - ascent);
  return { ascent, descent, height: ascent + descent };
}

export function normalizePageRotation(angle: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(angle) % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

export function hexToRgbTuple(value: string): [number, number, number] {
  const normalized = value.trim().replace(/^#/, "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return [0.067, 0.094, 0.153];

  return [
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255,
  ];
}

export function rotateVector(point: Point, angleDegrees: number): Point {
  const radians = (angleDegrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
}

/** Convert a point from the visual page's bottom-left coordinate system into the PDF page coordinate system. */
export function visualToPagePoint(
  visualPoint: Point,
  pageRotation: number,
  crop: { x: number; y: number; width: number; height: number },
): Point {
  const rotation = normalizePageRotation(pageRotation);
  let localX = visualPoint.x;
  let localY = visualPoint.y;

  if (rotation === 90) {
    localX = crop.width - visualPoint.y;
    localY = visualPoint.x;
  } else if (rotation === 180) {
    localX = crop.width - visualPoint.x;
    localY = crop.height - visualPoint.y;
  } else if (rotation === 270) {
    localX = visualPoint.y;
    localY = crop.height - visualPoint.x;
  }

  return { x: crop.x + localX, y: crop.y + localY };
}

export function getPlacementCenter(
  placement: WatermarkPlacement,
  pageWidth: number,
  pageHeight: number,
  boxWidth: number,
  boxHeight: number,
  margin: number,
  customPosition?: WatermarkCustomPosition | null,
): Point {
  const halfWidth = Math.min(boxWidth, pageWidth) / 2;
  const halfHeight = Math.min(boxHeight, pageHeight) / 2;

  if (customPosition) {
    const requestedX = clampNumber(customPosition.x, 0, 1) * pageWidth;
    const requestedY = (1 - clampNumber(customPosition.y, 0, 1)) * pageHeight;
    return {
      x: clampNumber(requestedX, halfWidth, Math.max(halfWidth, pageWidth - halfWidth)),
      y: clampNumber(requestedY, halfHeight, Math.max(halfHeight, pageHeight - halfHeight)),
    };
  }

  const safeMargin = Math.max(0, margin);
  const horizontal = placement.endsWith("left")
    ? safeMargin + halfWidth
    : placement.endsWith("right")
      ? pageWidth - safeMargin - halfWidth
      : pageWidth / 2;

  const vertical = placement.startsWith("top")
    ? pageHeight - safeMargin - halfHeight
    : placement.startsWith("bottom")
      ? safeMargin + halfHeight
      : pageHeight / 2;

  return {
    x: clampNumber(horizontal, halfWidth, Math.max(halfWidth, pageWidth - halfWidth)),
    y: clampNumber(vertical, halfHeight, Math.max(halfHeight, pageHeight - halfHeight)),
  };
}

export function getVisualPageGeometry(page: PDFPage): VisualPageGeometry {
  const crop = page.getCropBox();
  const pageRotation = normalizePageRotation(page.getRotation().angle);
  const visualWidth = pageRotation === 90 || pageRotation === 270 ? crop.height : crop.width;
  const visualHeight = pageRotation === 90 || pageRotation === 270 ? crop.width : crop.height;
  return { crop, pageRotation, visualWidth, visualHeight };
}

function legacyInstance(settings: SharedWatermarkSettings): WatermarkInstance {
  return {
    id: "legacy-watermark",
    scope: "all",
    placement: settings.placement ?? "center",
    customPosition: settings.customPosition ?? null,
    rotation: settings.rotation ?? 0,
    hiddenPages: [],
  };
}

function normalizedInstances(settings: SharedWatermarkSettings) {
  return settings.instances?.length ? settings.instances : [legacyInstance(settings)];
}

function instancesForPage(settings: SharedWatermarkSettings, pageNumber: number) {
  return normalizedInstances(settings).filter((instance) => {
    if (instance.scope === "page") return instance.pageNumber === pageNumber;
    return !(instance.hiddenPages ?? []).includes(pageNumber);
  });
}

export function getWatermarkPlacementCoordinates(
  page: PDFPage,
  font: PDFFont,
  text: string,
  settings: Pick<TextWatermarkSettings, "fontSize"> & Pick<WatermarkInstance, "rotation" | "placement" | "customPosition"> & { margin: number },
): PlacementCoordinates {
  const { crop, pageRotation, visualWidth, visualHeight } = getVisualPageGeometry(page);
  const fontSize = clampNumber(settings.fontSize, 8, 160);
  const visualRotation = clampNumber(settings.rotation, -180, 180);
  const textWidth = Math.max(1, font.widthOfTextAtSize(text, fontSize));
  const verticalMetrics = getFontVerticalMetrics(font, fontSize);
  const textHeight = verticalMetrics.height;
  const radians = (visualRotation * Math.PI) / 180;
  const boxWidth = Math.abs(Math.cos(radians)) * textWidth + Math.abs(Math.sin(radians)) * textHeight;
  const boxHeight = Math.abs(Math.sin(radians)) * textWidth + Math.abs(Math.cos(radians)) * textHeight;
  const center = getPlacementCenter(
    settings.placement,
    visualWidth,
    visualHeight,
    boxWidth,
    boxHeight,
    clampNumber(settings.margin, 0, Math.max(visualWidth, visualHeight)),
    settings.customPosition,
  );
  const centerOffset = rotateVector(
    { x: textWidth / 2, y: (verticalMetrics.ascent - verticalMetrics.descent) / 2 },
    visualRotation,
  );
  const visualAnchor = {
    x: center.x - centerOffset.x,
    y: center.y - centerOffset.y,
  };
  const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);

  return {
    x: pageAnchor.x,
    y: pageAnchor.y,
    rotation: visualRotation + pageRotation,
  };
}

async function saveWatermarkedDocument(document: PDFDocument, pageCount: number, watermarkedPageCount: number) {
  const saved = await document.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
  const bytes = new Uint8Array(saved.length);
  bytes.set(saved);
  return { bytes, pageCount, watermarkedPageCount } satisfies WatermarkResult;
}

export async function applyTextWatermark(
  sourceBytes: ArrayBuffer | Uint8Array,
  settings: TextWatermarkSettings,
): Promise<WatermarkResult> {
  const defaultText = settings.text.trim();
  const availableText = normalizedInstances(settings).some((instance) => (instance.text ?? defaultText).trim());
  if (!availableText) throw new Error("Enter watermark text before processing.");

  const document = await PDFDocument.load(sourceBytes, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  const pages = document.getPages();
  if (pages.length === 0) throw new Error("This PDF does not contain any pages.");

  const rangeStart = Math.round(clampNumber(settings.rangeStart, 1, pages.length));
  const rangeEnd = Math.round(clampNumber(settings.rangeEnd, rangeStart, pages.length));
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const uniqueTexts = Array.from(new Set(
    normalizedInstances(settings)
      .map((instance) => (instance.text ?? defaultText).trim())
      .filter(Boolean),
  ));
  try {
    for (const text of uniqueTexts) {
      regularFont.encodeText(text);
      boldFont.encodeText(text);
    }
  } catch {
    throw new Error("This browser build supports standard Latin watermark text. Remove unsupported characters and try again.");
  }
  const watermarkedPages = new Set<number>();

  for (let pageNumber = rangeStart; pageNumber <= rangeEnd; pageNumber += 1) {
    const page = pages[pageNumber - 1];
    const pageInstances = instancesForPage(settings, pageNumber);
    for (const instance of pageInstances) {
      const text = (instance.text ?? defaultText).trim();
      if (!text) continue;
      const instanceFontSize = clampNumber(instance.fontSize ?? settings.fontSize, 8, 160);
      const instanceFontWeight = instance.fontWeight ?? settings.fontWeight;
      const instanceFont = instanceFontWeight === "bold" ? boldFont : regularFont;
      const [red, green, blue] = hexToRgbTuple(instance.color ?? settings.color);
      const instanceOpacity = clampNumber(instance.opacity ?? settings.opacity, 0.05, 1);
      const instanceMargin = clampNumber(
        instance.margin ?? settings.margin,
        0,
        Math.max(getVisualPageGeometry(page).visualWidth, getVisualPageGeometry(page).visualHeight),
      );
      const coordinates = getWatermarkPlacementCoordinates(page, instanceFont, text, {
        fontSize: instanceFontSize,
        rotation: instance.rotation,
        placement: instance.placement,
        margin: instanceMargin,
        customPosition: instance.customPosition,
      });

      page.drawText(text, {
        x: coordinates.x,
        y: coordinates.y,
        size: instanceFontSize,
        font: instanceFont,
        color: rgb(red, green, blue),
        opacity: instanceOpacity,
        rotate: degrees(coordinates.rotation),
      });
      watermarkedPages.add(pageNumber);
    }
  }

  return saveWatermarkedDocument(document, pages.length, watermarkedPages.size);
}

export async function applyImageWatermark(
  sourceBytes: ArrayBuffer | Uint8Array,
  settings: ImageWatermarkSettings,
): Promise<WatermarkResult> {
  const document = await PDFDocument.load(sourceBytes, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  const pages = document.getPages();
  if (pages.length === 0) throw new Error("This PDF does not contain any pages.");

  const imageBytes = settings.imageBytes instanceof Uint8Array
    ? settings.imageBytes
    : new Uint8Array(settings.imageBytes);
  if (!imageBytes.length) throw new Error("Choose a watermark image before processing.");

  let embeddedImage;
  try {
    embeddedImage = settings.imageType === "png"
      ? await document.embedPng(imageBytes)
      : await document.embedJpg(imageBytes);
  } catch {
    throw new Error("The watermark image is invalid or unsupported. Use PNG, JPG, or JPEG.");
  }

  const rangeStart = Math.round(clampNumber(settings.rangeStart, 1, pages.length));
  const rangeEnd = Math.round(clampNumber(settings.rangeEnd, rangeStart, pages.length));
  const watermarkedPages = new Set<number>();

  for (let pageNumber = rangeStart; pageNumber <= rangeEnd; pageNumber += 1) {
    const page = pages[pageNumber - 1];
    const { crop, pageRotation, visualWidth, visualHeight } = getVisualPageGeometry(page);
    const pageInstances = instancesForPage(settings, pageNumber);
    for (const instance of pageInstances) {
      const instanceScalePercent = clampNumber(instance.scalePercent ?? settings.scalePercent, 5, 95);
      let imageWidth = visualWidth * instanceScalePercent / 100;
      let imageHeight = imageWidth * embeddedImage.height / embeddedImage.width;
      const maximumHeight = visualHeight * 0.95;
      if (imageHeight > maximumHeight) {
        const scale = maximumHeight / imageHeight;
        imageWidth *= scale;
        imageHeight *= scale;
      }
      const visualRotation = clampNumber(instance.rotation, -180, 180);
      const radians = (visualRotation * Math.PI) / 180;
      const boxWidth = Math.abs(Math.cos(radians)) * imageWidth + Math.abs(Math.sin(radians)) * imageHeight;
      const boxHeight = Math.abs(Math.sin(radians)) * imageWidth + Math.abs(Math.cos(radians)) * imageHeight;
      const center = getPlacementCenter(
        instance.placement,
        visualWidth,
        visualHeight,
        boxWidth,
        boxHeight,
        clampNumber(instance.margin ?? settings.margin, 0, Math.max(visualWidth, visualHeight)),
        instance.customPosition,
      );
      const centerOffset = rotateVector({ x: imageWidth / 2, y: imageHeight / 2 }, visualRotation);
      const visualAnchor = {
        x: center.x - centerOffset.x,
        y: center.y - centerOffset.y,
      };
      const pageAnchor = visualToPagePoint(visualAnchor, pageRotation, crop);

      page.drawImage(embeddedImage, {
        x: pageAnchor.x,
        y: pageAnchor.y,
        width: imageWidth,
        height: imageHeight,
        opacity: clampNumber(instance.opacity ?? settings.opacity, 0.05, 1),
        rotate: degrees(visualRotation + pageRotation),
      });
      watermarkedPages.add(pageNumber);
    }
  }

  return saveWatermarkedDocument(document, pages.length, watermarkedPages.size);
}
