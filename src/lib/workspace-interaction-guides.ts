export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type InteractionGuideState = {
  pageNumber: number;
  box: NormalizedBox;
  guideX: number | null;
  guideY: number | null;
  mode: "move" | "resize";
} | null;

type SnapAnchor = {
  value: number;
  kind: "page" | "object";
};

export type SnapResult = {
  box: NormalizedBox;
  guideX: number | null;
  guideY: number | null;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function axisAnchors(center: number, size: number) {
  return [
    { value: center - size / 2, offset: -size / 2 },
    { value: center, offset: 0 },
    { value: center + size / 2, offset: size / 2 },
  ];
}

function targetAnchors(peers: NormalizedBox[], axis: "x" | "y"): SnapAnchor[] {
  const page: SnapAnchor[] = [0, 0.1, 0.5, 0.9, 1].map((value) => ({ value, kind: "page" }));
  const objects = peers.flatMap((peer) => {
    const center = axis === "x" ? peer.x : peer.y;
    const size = axis === "x" ? peer.width : peer.height;
    return axisAnchors(center, size).map(({ value }) => ({ value, kind: "object" as const }));
  });
  return [...page, ...objects];
}

function snapAxis(center: number, size: number, targets: SnapAnchor[], threshold: number) {
  let bestDelta = Number.POSITIVE_INFINITY;
  let guide: number | null = null;
  for (const moving of axisAnchors(center, size)) {
    for (const target of targets) {
      const delta = target.value - moving.value;
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        bestDelta = delta;
        guide = target.value;
      }
    }
  }
  if (!Number.isFinite(bestDelta) || Math.abs(bestDelta) > threshold) {
    return { center, guide: null };
  }
  return { center: center + bestDelta, guide };
}

export function snapNormalizedBox(
  box: NormalizedBox,
  peers: NormalizedBox[],
  threshold = 0.012,
): SnapResult {
  const horizontal = snapAxis(box.x, box.width, targetAnchors(peers, "x"), threshold);
  const vertical = snapAxis(box.y, box.height, targetAnchors(peers, "y"), threshold);
  const halfWidth = Math.min(0.5, box.width / 2);
  const halfHeight = Math.min(0.5, box.height / 2);
  return {
    box: {
      ...box,
      x: clamp(horizontal.center, halfWidth, 1 - halfWidth),
      y: clamp(vertical.center, halfHeight, 1 - halfHeight),
    },
    guideX: horizontal.guide,
    guideY: vertical.guide,
  };
}

export function constrainAspectSize({
  startWidth,
  startHeight,
  width,
  height,
  minimumWidth,
  minimumHeight,
  maximumWidth,
  maximumHeight,
  lockAspect,
}: {
  startWidth: number;
  startHeight: number;
  width: number;
  height: number;
  minimumWidth: number;
  minimumHeight: number;
  maximumWidth: number;
  maximumHeight: number;
  lockAspect: boolean;
}) {
  let nextWidth = clamp(width, minimumWidth, maximumWidth);
  let nextHeight = clamp(height, minimumHeight, maximumHeight);
  if (!lockAspect || startWidth <= 0 || startHeight <= 0) return { width: nextWidth, height: nextHeight };

  // Project the requested pointer size onto the original aspect vector.
  // Unlike choosing the dominant axis, this changes continuously while the
  // pointer crosses a diagonal and prevents the resize from feeling snapped.
  const denominator = startWidth * startWidth + startHeight * startHeight;
  const requestedScale = denominator > 0
    ? (nextWidth * startWidth + nextHeight * startHeight) / denominator
    : 1;
  const minimumScale = Math.max(minimumWidth / startWidth, minimumHeight / startHeight);
  const maximumScale = Math.min(maximumWidth / startWidth, maximumHeight / startHeight);
  const scale = clamp(requestedScale, minimumScale, maximumScale);
  nextWidth = startWidth * scale;
  nextHeight = startHeight * scale;
  return { width: nextWidth, height: nextHeight };
}
