import { PDFDocument, degrees } from "pdf-lib";

export type PdfPageRotation = {
  pageIndex: number;
  rotationDelta: number;
};

export function normalizePdfRotation(value: number) {
  return ((Math.round(value) % 360) + 360) % 360;
}

export async function applyPdfRotations(
  source: ArrayBuffer | Uint8Array,
  rotations: PdfPageRotation[],
) {
  const document = await PDFDocument.load(source, {
    updateMetadata: false,
    throwOnInvalidObject: true,
  });
  const byPage = new Map(rotations.map((item) => [item.pageIndex, normalizePdfRotation(item.rotationDelta)]));

  document.getPages().forEach((page, pageIndex) => {
    const delta = byPage.get(pageIndex) ?? 0;
    if (delta === 0) return;
    const current = page.getRotation().angle;
    page.setRotation(degrees(normalizePdfRotation(current + delta)));
  });

  return document.save({ useObjectStreams: true, addDefaultPage: false });
}
