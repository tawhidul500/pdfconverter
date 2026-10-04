"use client";

import type { InteractionGuideState } from "@/lib/workspace-interaction-guides";

function measurementLabel(value: number) {
  const rounded = Math.round(Math.max(0, value) * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} pt`;
}

function labelWidth(text: string, unit: number) {
  return Math.max(unit * 3.2, text.length * unit * 0.58 + unit * 1.25);
}

export function WorkspaceInteractionOverlay({
  pageWidth,
  pageHeight,
  state,
}: {
  pageWidth: number;
  pageHeight: number;
  state: Exclude<InteractionGuideState, null>;
}) {
  const left = state.box.x * pageWidth - state.box.width * pageWidth / 2;
  const right = state.box.x * pageWidth + state.box.width * pageWidth / 2;
  const top = state.box.y * pageHeight - state.box.height * pageHeight / 2;
  const bottom = state.box.y * pageHeight + state.box.height * pageHeight / 2;
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const unit = Math.max(7, Math.min(pageWidth, pageHeight) * 0.014);
  const offset = unit * 1.5;
  const horizontalY = top > offset * 2.2 ? top - offset : Math.min(pageHeight - offset, bottom + offset);
  const verticalX = left > offset * 2.2 ? left - offset : Math.min(pageWidth - offset, right + offset);
  const leftDistance = Math.max(0, left);
  const rightDistance = Math.max(0, pageWidth - right);
  const topDistance = Math.max(0, top);
  const bottomDistance = Math.max(0, pageHeight - bottom);
  const sizeText = `${measurementLabel(width)} × ${measurementLabel(height)}`;
  const sizeWidth = labelWidth(sizeText, unit);
  const sizeX = Math.max(sizeWidth / 2 + 2, Math.min(pageWidth - sizeWidth / 2 - 2, (left + right) / 2));
  const sizeY = Math.max(unit * 1.4, Math.min(pageHeight - unit * 0.5, top - unit * 2.25));

  function horizontalMeasure(start: number, end: number, y: number, text: string, key: string) {
    if (Math.abs(end - start) < unit * 1.25) return null;
    const center = (start + end) / 2;
    const widthValue = labelWidth(text, unit);
    return (
      <g key={key} className="workspace-ruler-measure">
        <line x1={start} x2={end} y1={y} y2={y} className="workspace-ruler-line" />
        <line x1={start} x2={start} y1={y - unit * 0.45} y2={y + unit * 0.45} className="workspace-ruler-cap" />
        <line x1={end} x2={end} y1={y - unit * 0.45} y2={y + unit * 0.45} className="workspace-ruler-cap" />
        <rect x={center - widthValue / 2} y={y - unit * 0.9} width={widthValue} height={unit * 1.8} rx={unit * 0.45} className="workspace-ruler-label-bg" />
        <text x={center} y={y + unit * 0.34} className="workspace-ruler-label" fontSize={unit}>{text}</text>
      </g>
    );
  }

  function verticalMeasure(start: number, end: number, x: number, text: string, key: string) {
    if (Math.abs(end - start) < unit * 1.25) return null;
    const center = (start + end) / 2;
    const widthValue = labelWidth(text, unit);
    return (
      <g key={key} className="workspace-ruler-measure">
        <line x1={x} x2={x} y1={start} y2={end} className="workspace-ruler-line" />
        <line x1={x - unit * 0.45} x2={x + unit * 0.45} y1={start} y2={start} className="workspace-ruler-cap" />
        <line x1={x - unit * 0.45} x2={x + unit * 0.45} y1={end} y2={end} className="workspace-ruler-cap" />
        <rect x={x - widthValue / 2} y={center - unit * 0.9} width={widthValue} height={unit * 1.8} rx={unit * 0.45} className="workspace-ruler-label-bg" />
        <text x={x} y={center + unit * 0.34} className="workspace-ruler-label" fontSize={unit}>{text}</text>
      </g>
    );
  }

  return (
    <g className="workspace-interaction-overlay" aria-hidden="true">
      {state.guideX !== null && <line x1={state.guideX * pageWidth} x2={state.guideX * pageWidth} y1="0" y2={pageHeight} className="workspace-alignment-guide" />}
      {state.guideY !== null && <line x1="0" x2={pageWidth} y1={state.guideY * pageHeight} y2={state.guideY * pageHeight} className="workspace-alignment-guide" />}
      {horizontalMeasure(0, left, horizontalY, measurementLabel(leftDistance), "left")}
      {horizontalMeasure(right, pageWidth, horizontalY, measurementLabel(rightDistance), "right")}
      {verticalMeasure(0, top, verticalX, measurementLabel(topDistance), "top")}
      {verticalMeasure(bottom, pageHeight, verticalX, measurementLabel(bottomDistance), "bottom")}
      <g className="workspace-size-measure">
        <rect x={sizeX - sizeWidth / 2} y={sizeY - unit * 0.9} width={sizeWidth} height={unit * 1.8} rx={unit * 0.45} className="workspace-size-label-bg" />
        <text x={sizeX} y={sizeY + unit * 0.34} className="workspace-size-label" fontSize={unit}>{sizeText}</text>
      </g>
    </g>
  );
}
