export type RotateTargetMode = "selected" | "all" | "odd" | "even" | "custom";

export function isRotatePageTargeted({
  mode,
  pageIndex,
  selected,
  customFrom,
  customTo,
}: {
  mode: RotateTargetMode;
  pageIndex: number;
  selected: boolean;
  customFrom: number;
  customTo: number;
}) {
  const pageNumber = pageIndex + 1;
  if (mode === "all") return true;
  if (mode === "selected") return selected;
  if (mode === "odd") return pageNumber % 2 === 1;
  if (mode === "even") return pageNumber % 2 === 0;
  return pageNumber >= customFrom && pageNumber <= customTo;
}
