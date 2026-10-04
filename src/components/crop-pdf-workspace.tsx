"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CloudUpload,
  Crop,
  FileText,
  Focus,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  RotateCcw,
  Save,
  UploadCloud,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { WorkspaceInteractionOverlay } from "@/components/workspace-interaction-overlay";
import { WorkspaceResultCard, type WorkspaceDownload } from "@/components/workspace-result-card";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { useWorkspaceHistory } from "@/hooks/use-workspace-history";
import { type PdfTool } from "@/data/tools";
import {
  applyPdfCrop,
  clampCropNumber,
  cropRectFromOriginalPageAspect,
  getCropVisualPageGeometry,
  normalizeCropRect,
  type CropAspectMode,
  type NormalizedCropRect,
} from "@/lib/crop-pdf";
import {
  WORKSPACE_FILE_TRANSFER_EVENT,
  transferWorkspaceFiles,
  type WorkspaceFileTransferDetail,
} from "@/lib/workspace-file-transfer";
import {
  snapNormalizedBox,
  type InteractionGuideState,
} from "@/lib/workspace-interaction-guides";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_PAGES = 300;
const PDF_ACCEPT = ".pdf,application/pdf";
const MINIMUM_CROP_POINTS = 24;

type ProcessStatus = "idle" | "reading" | "processing" | "success" | "error";
type TargetMode = "current" | "selected" | "all" | "odd" | "even" | "custom";
type AspectMode = CropAspectMode;
type DragKind = "move" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type PageMeta = {
  pageNumber: number;
  visualWidth: number;
  visualHeight: number;
  rotation: number;
};

type LoadedPdf = {
  file: File;
  pageCount: number;
  pages: PageMeta[];
};

type Thumbnail = {
  url: string;
  width: number;
  height: number;
};

type CropResult = {
  url: string;
  name: string;
  size: number;
  file: File;
};

type DragState = {
  kind: DragKind;
  startClientX: number;
  startClientY: number;
  rect: NormalizedCropRect;
  bounds: DOMRect;
};

type CropHistoryState = {
  cropRect: NormalizedCropRect;
  aspectMode: AspectMode;
  freeFormCrop: boolean;
  pageCropRects: Record<number, NormalizedCropRect>;
  pageAspectModes: Record<number, AspectMode>;
  selectedPages: Set<number>;
  targetMode: TargetMode;
  customFrom: number;
  customTo: number;
  currentPage: number;
};

function cloneCropHistory(value: CropHistoryState): CropHistoryState {
  return {
    ...value,
    cropRect: { ...value.cropRect },
    pageCropRects: Object.fromEntries(
      Object.entries(value.pageCropRects).map(([pageNumber, rect]) => [Number(pageNumber), { ...rect }]),
    ),
    pageAspectModes: { ...value.pageAspectModes },
    selectedPages: new Set(value.selectedPages),
  };
}

const DEFAULT_RECT: NormalizedCropRect = { x: 0, y: 0, width: 1, height: 1 };

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function hasPdfHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return new TextDecoder("latin1").decode(bytes).includes("%PDF-");
}

function cleanBaseName(value: string) {
  return (
    value
      .trim()
      .replace(/\.pdf$/i, "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 86)
      .trim() || "NovaPDF-cropped"
  );
}

function clampInteger(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function desiredPhysicalRatio(mode: AspectMode, page: PageMeta) {
  if (mode === "free") return null;
  if (mode === "original") return page.visualWidth / page.visualHeight;
  if (mode === "square") return 1;
  const landscape = page.visualWidth > page.visualHeight;
  if (mode === "a4") return landscape ? 297 / 210 : 210 / 297;
  return landscape ? 11 / 8.5 : 8.5 / 11;
}

function fitRectToAspect(rect: NormalizedCropRect, mode: AspectMode, page: PageMeta) {
  const physicalRatio = desiredPhysicalRatio(mode, page);
  if (!physicalRatio) return normalizeCropRect(rect);
  const normalizedRatio = physicalRatio * (page.visualHeight / page.visualWidth);
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  let width = rect.width;
  let height = rect.height;

  if (width / height > normalizedRatio) width = height * normalizedRatio;
  else height = width / normalizedRatio;

  width = clampCropNumber(width, 0.04, 1);
  height = clampCropNumber(height, 0.04, 1);
  const x = clampCropNumber(centerX - width / 2, 0, 1 - width);
  const y = clampCropNumber(centerY - height / 2, 0, 1 - height);
  return normalizeCropRect({ x, y, width, height });
}

function rectFromMargins(page: PageMeta, top: number, right: number, bottom: number, left: number) {
  const maximumHorizontal = Math.max(0, page.visualWidth - MINIMUM_CROP_POINTS);
  const maximumVertical = Math.max(0, page.visualHeight - MINIMUM_CROP_POINTS);
  const safeLeft = clampCropNumber(left, 0, maximumHorizontal);
  const safeRight = clampCropNumber(right, 0, Math.max(0, maximumHorizontal - safeLeft));
  const safeTop = clampCropNumber(top, 0, maximumVertical);
  const safeBottom = clampCropNumber(bottom, 0, Math.max(0, maximumVertical - safeTop));
  return normalizeCropRect({
    x: safeLeft / page.visualWidth,
    y: safeTop / page.visualHeight,
    width: (page.visualWidth - safeLeft - safeRight) / page.visualWidth,
    height: (page.visualHeight - safeTop - safeBottom) / page.visualHeight,
  });
}

function marginsFromRect(page: PageMeta, rect: NormalizedCropRect) {
  return {
    top: rect.y * page.visualHeight,
    right: (1 - rect.x - rect.width) * page.visualWidth,
    bottom: (1 - rect.y - rect.height) * page.visualHeight,
    left: rect.x * page.visualWidth,
  };
}

function preserveDraggedAspect(
  drag: DragState,
  next: NormalizedCropRect,
  page: PageMeta,
) {
  if (drag.kind === "move") return next;
  const source = drag.rect;
  const minimumWidth = Math.min(0.25, MINIMUM_CROP_POINTS / Math.max(1, page.visualWidth));
  const minimumHeight = Math.min(0.25, MINIMUM_CROP_POINTS / Math.max(1, page.visualHeight));
  const widthScale = next.width / Math.max(source.width, Number.EPSILON);
  const heightScale = next.height / Math.max(source.height, Number.EPSILON);
  const horizontalHandle = drag.kind.includes("e") || drag.kind.includes("w");
  const verticalHandle = drag.kind.includes("n") || drag.kind.includes("s");
  let requestedScale = horizontalHandle && !verticalHandle
    ? widthScale
    : verticalHandle && !horizontalHandle
      ? heightScale
      : Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale;

  const centerX = source.x + source.width / 2;
  const centerY = source.y + source.height / 2;
  const maxWidth = drag.kind.includes("w")
    ? source.x + source.width
    : drag.kind.includes("e")
      ? 1 - source.x
      : 2 * Math.min(centerX, 1 - centerX);
  const maxHeight = drag.kind.includes("n")
    ? source.y + source.height
    : drag.kind.includes("s")
      ? 1 - source.y
      : 2 * Math.min(centerY, 1 - centerY);
  const minimumScale = Math.max(minimumWidth / source.width, minimumHeight / source.height);
  const maximumScale = Math.min(maxWidth / source.width, maxHeight / source.height);
  requestedScale = clampCropNumber(requestedScale, minimumScale, Math.max(minimumScale, maximumScale));

  const width = source.width * requestedScale;
  const height = source.height * requestedScale;
  const x = drag.kind.includes("w")
    ? source.x + source.width - width
    : drag.kind.includes("e")
      ? source.x
      : centerX - width / 2;
  const y = drag.kind.includes("n")
    ? source.y + source.height - height
    : drag.kind.includes("s")
      ? source.y
      : centerY - height / 2;
  return normalizeCropRect({ x, y, width, height });
}

function updateRectForDrag(
  drag: DragState,
  clientX: number,
  clientY: number,
  aspectMode: AspectMode,
  page: PageMeta,
  preserveAspect: boolean,
) {
  const dx = (clientX - drag.startClientX) / Math.max(1, drag.bounds.width);
  const dy = (clientY - drag.startClientY) / Math.max(1, drag.bounds.height);
  const source = drag.rect;
  let left = source.x;
  let top = source.y;
  let right = source.x + source.width;
  let bottom = source.y + source.height;
  const minimumWidth = Math.min(0.25, MINIMUM_CROP_POINTS / Math.max(1, page.visualWidth));
  const minimumHeight = Math.min(0.25, MINIMUM_CROP_POINTS / Math.max(1, page.visualHeight));

  if (drag.kind === "move") {
    left = clampCropNumber(source.x + dx, 0, 1 - source.width);
    top = clampCropNumber(source.y + dy, 0, 1 - source.height);
    return { ...source, x: left, y: top };
  }

  if (drag.kind.includes("w")) left = clampCropNumber(source.x + dx, 0, right - minimumWidth);
  if (drag.kind.includes("e")) right = clampCropNumber(source.x + source.width + dx, left + minimumWidth, 1);
  if (drag.kind.includes("n")) top = clampCropNumber(source.y + dy, 0, bottom - minimumHeight);
  if (drag.kind.includes("s")) bottom = clampCropNumber(source.y + source.height + dy, top + minimumHeight, 1);

  let next = normalizeCropRect({ x: left, y: top, width: right - left, height: bottom - top });
  if (preserveAspect) next = preserveDraggedAspect(drag, next, page);
  else if (aspectMode !== "free") next = fitRectToAspect(next, aspectMode, page);
  return next;
}

export function CropPdfWorkspace({
  activeTool,
  onToolChange,
  startInWorkspace = false,
  isActive = true,
  onExitWorkspace,
}: {
  activeTool: PdfTool;
  onToolChange: (tool: PdfTool) => void;
  startInWorkspace?: boolean;
  isActive?: boolean;
  onExitWorkspace?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusSvgRef = useRef<SVGSVGElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const history = useWorkspaceHistory<CropHistoryState>(cloneCropHistory, 100);
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdf | null>(null);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [interactionGuides, setInteractionGuides] = useState<InteractionGuideState>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [outputName, setOutputName] = useState("NovaPDF-cropped");
  const [currentPage, setCurrentPage] = useState(1);
  const [focusedPage, setFocusedPage] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set([1]));
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [customFrom, setCustomFrom] = useState(1);
  const [customTo, setCustomTo] = useState(1);
  const [cropRect, setCropRect] = useState<NormalizedCropRect>(DEFAULT_RECT);
  const [aspectMode, setAspectMode] = useState<AspectMode>("original");
  const [freeFormCrop, setFreeFormCrop] = useState(false);
  const [pageCropRects, setPageCropRects] = useState<Record<number, NormalizedCropRect>>({});
  const [pageAspectModes, setPageAspectModes] = useState<Record<number, AspectMode>>({});
  const [thumbnails, setThumbnails] = useState<Record<number, Thumbnail>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<CropResult | null>(null);

  const editorOpen = workspaceStarted || startInWorkspace;
  const currentMeta = loadedPdf?.pages[currentPage - 1] ?? null;
  const currentCropRect = freeFormCrop ? pageCropRects[currentPage] ?? cropRect : cropRect;
  const currentAspectMode = freeFormCrop ? pageAspectModes[currentPage] ?? aspectMode : aspectMode;
  const effectiveCustomFrom = loadedPdf ? clampInteger(customFrom, 1, loadedPdf.pageCount) : 1;
  const effectiveCustomTo = loadedPdf ? clampInteger(customTo, effectiveCustomFrom, loadedPdf.pageCount) : 1;

  const targetedPages = useMemo(() => {
    const targets = new Set<number>();
    if (!loadedPdf) return targets;
    for (let pageNumber = 1; pageNumber <= loadedPdf.pageCount; pageNumber += 1) {
      const targeted =
        targetMode === "current"
          ? pageNumber === currentPage
          : targetMode === "selected"
            ? selectedPages.has(pageNumber)
            : targetMode === "all"
              ? true
              : targetMode === "odd"
                ? pageNumber % 2 === 1
                : targetMode === "even"
                  ? pageNumber % 2 === 0
                  : pageNumber >= effectiveCustomFrom && pageNumber <= effectiveCustomTo;
      if (targeted) targets.add(pageNumber);
    }
    return targets;
  }, [currentPage, effectiveCustomFrom, effectiveCustomTo, loadedPdf, selectedPages, targetMode]);

  const effectiveCropPages = useMemo(() => {
    const pages = new Set(targetedPages);
    if (freeFormCrop) {
      for (const pageNumber of Object.keys(pageCropRects).map(Number)) {
        if (loadedPdf && pageNumber >= 1 && pageNumber <= loadedPdf.pageCount) pages.add(pageNumber);
      }
    }
    return pages;
  }, [freeFormCrop, loadedPdf, pageCropRects, targetedPages]);

  const currentMargins = useMemo(
    () => (currentMeta ? marginsFromRect(currentMeta, currentCropRect) : { top: 0, right: 0, bottom: 0, left: 0 }),
    [currentCropRect, currentMeta],
  );

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [editorOpen, isActive]);

  useEffect(() => () => {
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result]);

  useEffect(() => {
    if (!loadedPdf) return;
    const current = loadedPdf;
    let cancelled = false;

    async function renderPreviews() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data: new Uint8Array(await current.file.arrayBuffer()) });
        const pdf = await task.promise;
        for (let pageIndex = 0; pageIndex < current.pageCount; pageIndex += 1) {
          if (cancelled || thumbnails[pageIndex] || thumbnailErrors[pageIndex]) continue;
          try {
            const page = await pdf.getPage(pageIndex + 1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({
              scale: Math.max(Math.min(0.9, 300 / Math.max(base.width, base.height)), 0.2),
            });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d", { alpha: false });
            if (!context) throw new Error("Canvas unavailable");
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            if (!cancelled) {
              setThumbnails((existing) => ({
                ...existing,
                [pageIndex]: {
                  url: canvas.toDataURL("image/png"),
                  width: base.width,
                  height: base.height,
                },
              }));
            }
            page.cleanup();
          } catch {
            if (!cancelled) setThumbnailErrors((existing) => ({ ...existing, [pageIndex]: true }));
          }
        }
        await task.destroy();
      } catch {
        if (!cancelled) setMessage("Page previews could not be rendered, but cropping may still work.");
      }
    }

    void renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [loadedPdf, thumbnailErrors, thumbnails]);

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      resetFields();
      setWorkspaceStarted(true);
      const file = [...detail.files].reverse().find(isPdfFile);
      if (file) void loadPdf(file);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function resetFields() {
    clearResult();
    setLoadedPdf(null);
    setOutputName("NovaPDF-cropped");
    setCurrentPage(1);
    setFocusedPage(null);
    setSelectedPages(new Set([1]));
    setTargetMode("all");
    setCustomFrom(1);
    setCustomTo(1);
    setCropRect(DEFAULT_RECT);
    setAspectMode("original");
    setFreeFormCrop(false);
    setPageCropRects({});
    setPageAspectModes({});
    setThumbnails({});
    setThumbnailErrors({});
    setMessage("");
    setStatus("idle");
    setSidebarOpen(false);
    setZoom(100);
    setInteractionGuides(null);
    dragStateRef.current = null;
    history.reset();
  }

  function startOver() {
    resetFields();
    setWorkspaceStarted(true);
  }

  function goHome() {
    setSidebarOpen(false);
    setWorkspaceStarted(false);
    onExitWorkspace?.();
    window.requestAnimationFrame(() =>
      document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  async function loadPdf(file: File) {
    clearResult();
    setMessage("");
    setStatus("reading");
    setProgress(8);
    setWorkspaceStarted(true);

    if (!isPdfFile(file)) {
      setStatus("error");
      setMessage("Please choose a PDF file.");
      return;
    }
    if (!file.size) {
      setStatus("error");
      setMessage("This PDF is empty.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus("error");
      setMessage("This PDF is larger than the current 50 MB browser limit.");
      return;
    }

    try {
      if (!(await hasPdfHeader(file))) throw new Error("invalid PDF");
      const { PDFDocument } = await import("pdf-lib");
      const document = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false,
        throwOnInvalidObject: true,
      });
      const pages = document.getPages();
      if (pages.length < 1) throw new Error("empty PDF");
      if (pages.length > MAX_PAGES) {
        setStatus("error");
        setMessage(`This browser build supports up to ${MAX_PAGES} pages at a time.`);
        return;
      }
      const metadata = pages.map((page, index) => {
        const geometry = getCropVisualPageGeometry(page);
        return {
          pageNumber: index + 1,
          visualWidth: geometry.visualWidth,
          visualHeight: geometry.visualHeight,
          rotation: geometry.rotation,
        };
      });
      setLoadedPdf({ file, pageCount: pages.length, pages: metadata });
      setCurrentPage(1);
      setFocusedPage(null);
      setSelectedPages(new Set([1]));
      setTargetMode("all");
      setCustomFrom(1);
      setCustomTo(pages.length);
      setCropRect(DEFAULT_RECT);
      setAspectMode("original");
      setFreeFormCrop(false);
      setPageCropRects({});
      setPageAspectModes({});
      history.reset();
      setOutputName(`${cleanBaseName(file.name)}-cropped`);
      setThumbnails({});
      setThumbnailErrors({});
      setStatus("idle");
      setProgress(0);
    } catch (error) {
      const detail = error instanceof Error ? error.message.toLowerCase() : "";
      setLoadedPdf(null);
      setStatus("error");
      setProgress(0);
      setMessage(
        detail.includes("encrypt") || detail.includes("password")
          ? "This PDF is password-protected. Unlock it before cropping."
          : "This PDF is invalid, damaged, or unsupported.",
      );
    }
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadPdf(file);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = Array.from(event.dataTransfer.files).find(isPdfFile);
    if (file) void loadPdf(file);
    else {
      setStatus("error");
      setMessage("Drop one PDF file here.");
    }
  }

  function currentCropHistory(): CropHistoryState {
    return {
      cropRect,
      aspectMode,
      freeFormCrop,
      pageCropRects,
      pageAspectModes,
      selectedPages,
      targetMode,
      customFrom,
      customTo,
      currentPage,
    };
  }

  function applyCropHistory(snapshot: CropHistoryState) {
    setCropRect(snapshot.cropRect);
    setAspectMode(snapshot.aspectMode);
    setFreeFormCrop(snapshot.freeFormCrop);
    setPageCropRects(snapshot.pageCropRects);
    setPageAspectModes(snapshot.pageAspectModes);
    setSelectedPages(snapshot.selectedPages);
    setTargetMode(snapshot.targetMode);
    setCustomFrom(snapshot.customFrom);
    setCustomTo(snapshot.customTo);
    setCurrentPage(snapshot.currentPage);
    clearResult();
    setMessage("");
  }

  function undoCrop() { history.undo(currentCropHistory(), applyCropHistory); }
  function redoCrop() { history.redo(currentCropHistory(), applyCropHistory); }

  function updateSetting(callback: () => void) {
    clearResult();
    setMessage("");
    callback();
  }

  function rectForPage(pageNumber: number) {
    return freeFormCrop ? pageCropRects[pageNumber] ?? cropRect : cropRect;
  }

  function setActiveCropRect(nextRect: NormalizedCropRect) {
    const normalized = normalizeCropRect(nextRect);
    if (freeFormCrop) {
      setPageCropRects((current) => ({ ...current, [currentPage]: normalized }));
    } else {
      setCropRect(normalized);
    }
  }

  function setActiveAspectMode(nextMode: AspectMode) {
    if (freeFormCrop) {
      setPageAspectModes((current) => ({ ...current, [currentPage]: nextMode }));
    } else {
      setAspectMode(nextMode);
    }
  }

  function toggleFreeFormCrop(enabled: boolean) {
    history.checkpoint(currentCropHistory());
    updateSetting(() => {
      if (enabled) {
        setPageCropRects((current) => ({
          ...current,
          [currentPage]: current[currentPage] ?? { ...cropRect },
        }));
        setPageAspectModes((current) => ({
          ...current,
          [currentPage]: current[currentPage] ?? aspectMode,
        }));
        setFreeFormCrop(true);
      } else {
        setCropRect(pageCropRects[currentPage] ?? cropRect);
        setAspectMode(pageAspectModes[currentPage] ?? aspectMode);
        setFreeFormCrop(false);
      }
    });
  }

  function applyMarginPreset(points: number) {
    if (!currentMeta) return;
    history.checkpoint(currentCropHistory());
    updateSetting(() => {
      setActiveAspectMode("free");
      setActiveCropRect(rectFromMargins(currentMeta, points, points, points, points));
    });
  }

  function updateMargin(side: "top" | "right" | "bottom" | "left", value: number) {
    if (!currentMeta) return;
    history.checkpoint(currentCropHistory());
    const next = { ...currentMargins, [side]: Math.max(0, value || 0) };
    updateSetting(() => {
      setActiveAspectMode("free");
      setActiveCropRect(rectFromMargins(currentMeta, next.top, next.right, next.bottom, next.left));
    });
  }

  function setAspect(nextMode: AspectMode) {
    if (!currentMeta) return;
    history.checkpoint(currentCropHistory());
    updateSetting(() => {
      setActiveAspectMode(nextMode);
      setActiveCropRect(
        cropRectFromOriginalPageAspect(
          nextMode,
          currentMeta.visualWidth,
          currentMeta.visualHeight,
          currentCropRect,
        ),
      );
    });
  }

  function toggleSelectedPage(pageNumber: number) {
    history.checkpoint(currentCropHistory());
    clearResult();
    setSelectedPages((current) => {
      const next = new Set(current);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
    setCurrentPage(pageNumber);
    setTargetMode("selected");
  }

  function openFocusedPage(pageNumber: number) {
    setCurrentPage(pageNumber);
    setFocusedPage(pageNumber);
  }

  function beginCropDrag(event: ReactPointerEvent<SVGElement>, kind: DragKind) {
    if (!currentMeta || !focusSvgRef.current) return;
    history.checkpoint(currentCropHistory());
    event.preventDefault();
    event.stopPropagation();
    focusSvgRef.current.setPointerCapture?.(event.pointerId);
    dragStateRef.current = {
      kind,
      startClientX: event.clientX,
      startClientY: event.clientY,
      rect: currentCropRect,
      bounds: focusSvgRef.current.getBoundingClientRect(),
    };
    setInteractionGuides({
      pageNumber: currentMeta.pageNumber,
      box: {
        x: currentCropRect.x + currentCropRect.width / 2,
        y: currentCropRect.y + currentCropRect.height / 2,
        width: currentCropRect.width,
        height: currentCropRect.height,
      },
      guideX: null,
      guideY: null,
      mode: kind === "move" ? "move" : "resize",
    });
  }

  function moveCropDrag(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragStateRef.current;
    if (!drag || !currentMeta) return;
    event.preventDefault();
    let next = updateRectForDrag(drag, event.clientX, event.clientY, currentAspectMode, currentMeta, event.shiftKey);
    let box = {
      x: next.x + next.width / 2,
      y: next.y + next.height / 2,
      width: next.width,
      height: next.height,
    };
    let guideX: number | null = null;
    let guideY: number | null = null;
    if (snapEnabled) {
      const snapped = snapNormalizedBox(box, []);
      guideX = snapped.guideX;
      guideY = snapped.guideY;
      if (drag.kind === "move") {
        box = snapped.box;
        next = normalizeCropRect({
          x: box.x - box.width / 2,
          y: box.y - box.height / 2,
          width: box.width,
          height: box.height,
        });
      }
    }
    setActiveCropRect(next);
    setInteractionGuides({
      pageNumber: currentMeta.pageNumber,
      box,
      guideX,
      guideY,
      mode: drag.kind === "move" ? "move" : "resize",
    });
    clearResult();
  }

  function endCropDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragStateRef.current) return;
    focusSvgRef.current?.releasePointerCapture?.(event.pointerId);
    dragStateRef.current = null;
    setInteractionGuides(null);
  }

  const handleCropKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (!editorOpen || !isActive || !loadedPdf || event.defaultPrevented) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return;
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier && key === "z") { event.preventDefault(); if (event.shiftKey) redoCrop(); else undoCrop(); return; }
    if (modifier && key === "y") { event.preventDefault(); redoCrop(); return; }
    if (modifier && key === "o") { event.preventDefault(); inputRef.current?.click(); return; }
    if (modifier && key === "s") { event.preventDefault(); if (status !== "processing" && status !== "reading" && effectiveCropPages.size > 0) void createCroppedPdf(); return; }
    if (modifier && key === "a") {
      event.preventDefault();
      history.checkpoint(currentCropHistory());
      setSelectedPages(new Set(Array.from({ length: loadedPdf.pageCount }, (_, index) => index + 1)));
      setTargetMode("selected");
      return;
    }
    if ((event.key === "ArrowLeft" || event.key === "ArrowUp") && focusedPage === null) {
      event.preventDefault();
      setCurrentPage((page) => Math.max(1, page - 1));
      return;
    }
    if ((event.key === "ArrowRight" || event.key === "ArrowDown") && focusedPage === null) {
      event.preventDefault();
      setCurrentPage((page) => Math.min(loadedPdf.pageCount, page + 1));
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (focusedPage !== null) setFocusedPage(null);
      else if (selectedPages.size > 0) {
        history.checkpoint(currentCropHistory());
        setSelectedPages(new Set());
      }
    }
  });

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    document.addEventListener("keydown", handleCropKeyboard, true);
    return () => document.removeEventListener("keydown", handleCropKeyboard, true);
  }, [editorOpen, isActive]);

  async function createCroppedPdf() {
    if (!loadedPdf) {
      setStatus("error");
      setMessage("Choose a PDF first.");
      return;
    }
    if (effectiveCropPages.size === 0) {
      setStatus("error");
      setMessage(targetMode === "selected" ? "Select at least one page first." : "No pages match the current target.");
      return;
    }

    clearResult();
    setStatus("processing");
    setProgress(10);
    setMessage("");
    try {
      const rectByPageNumber = freeFormCrop
        ? Object.fromEntries([...effectiveCropPages].map((pageNumber) => [pageNumber, rectForPage(pageNumber)]))
        : undefined;
      const generated = await applyPdfCrop(await loadedPdf.file.arrayBuffer(), {
        rect: cropRect,
        rectByPageNumber,
        targetPageNumbers: [...effectiveCropPages],
      });
      setProgress(88);
      const bytes = new Uint8Array(generated.bytes.length);
      bytes.set(generated.bytes);
      const name = `${cleanBaseName(outputName)}.pdf`;
      const file = new File([bytes], name, { type: "application/pdf", lastModified: Date.now() });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResult({ url: URL.createObjectURL(blob), name, size: blob.size, file });
      setProgress(100);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : "PDF cropping failed.");
    }
  }

  function switchTool(tool: PdfTool) {
    if (loadedPdf) transferWorkspaceFiles(tool, [result?.file ?? loadedPdf.file]);
    onToolChange(tool);
  }

  const downloads: WorkspaceDownload[] = useMemo(
    () =>
      result
        ? [
            {
              url: result.url,
              name: result.name,
              detail: `${effectiveCropPages.size} cropped page${effectiveCropPages.size === 1 ? "" : "s"} · ${formatBytes(result.size)}`,
              label: "Download cropped PDF",
            },
          ]
        : [],
    [effectiveCropPages.size, result],
  );

  function cropOverlay(
    width: number,
    height: number,
    rect: NormalizedCropRect,
    interactive = false,
  ) {
    const x = rect.x * width;
    const y = rect.y * height;
    const cropWidth = rect.width * width;
    const cropHeight = rect.height * height;
    const handle = Math.max(7, Math.min(width, height) * 0.022);
    const path = `M0 0H${width}V${height}H0Z M${x} ${y}H${x + cropWidth}V${y + cropHeight}H${x}Z`;
    const handles: Array<{ kind: DragKind; x: number; y: number }> = [
      { kind: "nw", x, y },
      { kind: "n", x: x + cropWidth / 2, y },
      { kind: "ne", x: x + cropWidth, y },
      { kind: "e", x: x + cropWidth, y: y + cropHeight / 2 },
      { kind: "se", x: x + cropWidth, y: y + cropHeight },
      { kind: "s", x: x + cropWidth / 2, y: y + cropHeight },
      { kind: "sw", x, y: y + cropHeight },
      { kind: "w", x, y: y + cropHeight / 2 },
    ];
    return (
      <>
        <path d={path} fill="rgba(15, 23, 42, 0.48)" fillRule="evenodd" pointerEvents="none" />
        <rect x={x} y={y} width={cropWidth} height={cropHeight} fill="transparent" stroke="#14b8a6" strokeWidth={Math.max(2, handle / 3)} strokeDasharray={`${handle} ${handle * 0.55}`} pointerEvents="none" />
        {interactive && (
          <>
            <rect x={x} y={y} width={cropWidth} height={cropHeight} fill="transparent" className="crop-move-hitbox" onPointerDown={(event) => beginCropDrag(event, "move")} />
            {handles.map((item) => (
              <rect
                key={item.kind}
                x={item.x - handle / 2}
                y={item.y - handle / 2}
                width={handle}
                height={handle}
                rx={handle * 0.2}
                fill="#ffffff"
                stroke="#0f766e"
                strokeWidth={Math.max(1.5, handle / 5)}
                className={`crop-handle crop-handle-${item.kind}`}
                onPointerDown={(event) => beginCropDrag(event, item.kind)}
              />
            ))}
          </>
        )}
      </>
    );
  }

  if (editorOpen) {
    const cardWidth = Math.max(9, 12.5 * zoom / 100);
    const previewHeight = Math.max(11.5, 16 * zoom / 100);
    const zoomStyle = {
      "--split-card-width": `${cardWidth}rem`,
      "--split-preview-height": `${previewHeight}rem`,
    } as CSSProperties;
    const focusedMeta = focusedPage ? loadedPdf?.pages[focusedPage - 1] : null;
    const focusedThumbnail = focusedPage ? thumbnails[focusedPage - 1] : null;
    const focusedCropRect = focusedPage ? rectForPage(focusedPage) : cropRect;

    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onFileInput} />
        <header className="organize-editor-header">
          <button type="button" className="workspace-header-start-over" onClick={startOver} aria-label="Start over"><RotateCcw className="size-5" /></button>
          <h1 className="workspace-header-title">{activeTool.name}</h1>
        </header>

        <div className="organize-editor-body">
          <WorkspaceToolRail activeTool={activeTool} onToolChange={switchTool} onExitWorkspace={goHome} onOpenControls={() => setSidebarOpen((value) => !value)} />

          <main className="organize-canvas-area">
            {!loadedPdf ? (
              <div className="workspace-empty-canvas">
                <div
                  className={`workspace-empty-upload ${dragging ? "workspace-empty-upload-active" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
                  onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  <span><CloudUpload className="size-8" /></span>
                  <strong>Upload a PDF to crop</strong>
                  <p>Draw a crop area, enter exact margins, and apply it to selected or grouped pages.</p>
                  <em>Choose PDF</em>
                </div>
              </div>
            ) : focusedPage && focusedMeta ? (
              <div className="crop-focus-shell" onClick={() => setFocusedPage(null)}>
                <div className="organize-floating-toolbar crop-focus-toolbar" onClick={(event) => event.stopPropagation()}>
                  <button type="button" className="crop-back-grid" onClick={() => setFocusedPage(null)}><ArrowLeft className="size-4" /> Back to grid</button>
                  <span className="split-editor-mode-label">Editing page {focusedPage} · {effectiveCropPages.has(focusedPage) ? "targeted" : "not targeted"}</span>
                  <div className="crop-focus-navigation">
                    <button type="button" disabled={focusedPage <= 1} onClick={() => { const next = Math.max(1, focusedPage - 1); setFocusedPage(next); setCurrentPage(next); }}><ChevronLeft className="size-4" /></button>
                    <button type="button" disabled={focusedPage >= loadedPdf.pageCount} onClick={() => { const next = Math.min(loadedPdf.pageCount, focusedPage + 1); setFocusedPage(next); setCurrentPage(next); }}><ChevronRight className="size-4" /></button>
                  </div>
                </div>
                <div className="crop-focus-page-wrap">
                  <div className="crop-focus-page" onClick={(event) => event.stopPropagation()} style={{ aspectRatio: `${focusedMeta.visualWidth} / ${focusedMeta.visualHeight}` }}>
                    {focusedThumbnail ? (
                      <svg
                        ref={focusSvgRef}
                        viewBox={`0 0 ${focusedMeta.visualWidth} ${focusedMeta.visualHeight}`}
                        preserveAspectRatio="xMidYMid meet"
                        onPointerMove={moveCropDrag}
                        onPointerUp={endCropDrag}
                        onPointerCancel={endCropDrag}
                        role="img"
                        aria-label={`Crop editor for page ${focusedPage}`}
                      >
                        <image href={focusedThumbnail.url} x="0" y="0" width={focusedMeta.visualWidth} height={focusedMeta.visualHeight} preserveAspectRatio="none" />
                        {cropOverlay(focusedMeta.visualWidth, focusedMeta.visualHeight, focusedCropRect, true)}
                        {interactionGuides?.pageNumber === focusedMeta.pageNumber && (
                          <WorkspaceInteractionOverlay pageWidth={focusedMeta.visualWidth} pageHeight={focusedMeta.visualHeight} state={interactionGuides} />
                        )}
                      </svg>
                    ) : thumbnailErrors[focusedPage - 1] ? (
                      <span className="crop-focus-loading"><FileText className="size-8" /> Preview unavailable</span>
                    ) : (
                      <span className="crop-focus-loading"><LoaderCircle className="size-7 animate-spin" /> Rendering page…</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar">
                  <span className="split-editor-mode-label">{effectiveCropPages.size} targeted · {loadedPdf.pageCount} pages</span>
                  <span className="crop-toolbar-help"><Focus className="size-4" /> Click a page to edit its crop area</span>
                  <WorkspaceZoomControls
                    active={isActive}
                    value={zoom}
                    onChange={setZoom}
                    canUndo={history.canUndo}
                    canRedo={history.canRedo}
                    onUndo={undoCrop}
                    onRedo={redoCrop}
                    pageCount={loadedPdf.pageCount}
                  />
                </div>
                <div className="organize-pages-scroll" style={zoomStyle}>
                  <div className="split-editor-grid">
                    {loadedPdf.pages.map((page) => {
                      const thumbnail = thumbnails[page.pageNumber - 1];
                      const targeted = effectiveCropPages.has(page.pageNumber);
                      const active = currentPage === page.pageNumber;
                      const width = thumbnail?.width ?? page.visualWidth;
                      const height = thumbnail?.height ?? page.visualHeight;
                      return (
                        <div
                          key={page.pageNumber}
                          data-novapdf-view-page={page.pageNumber}
                          className={`split-editor-page crop-editor-page ${targeted ? "crop-editor-page-targeted rotate-editor-page-selected" : ""} ${active ? "crop-editor-page-active" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => openFocusedPage(page.pageNumber)}
                          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openFocusedPage(page.pageNumber); }}
                        >
                          <button type="button" className="rotate-page-check" aria-label={`Select page ${page.pageNumber}`} aria-pressed={targeted} onClick={(event) => { event.stopPropagation(); toggleSelectedPage(page.pageNumber); }}>
                            {targeted && <Check className="size-3.5" />}
                          </button>
                          <span className="split-editor-preview crop-preview-surface">
                            {thumbnail ? (
                              <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Preview of page ${page.pageNumber}`}>
                                <image href={thumbnail.url} x="0" y="0" width={width} height={height} preserveAspectRatio="none" />
                                {targeted && cropOverlay(width, height, rectForPage(page.pageNumber))}
                              </svg>
                            ) : thumbnailErrors[page.pageNumber - 1] ? (
                              <span><FileText className="size-7" /> Preview unavailable</span>
                            ) : (
                              <span><LoaderCircle className="size-6 animate-spin" /> Rendering page…</span>
                            )}
                          </span>
                          <span className="split-editor-page-number">Page {page.pageNumber}</span>
                          <span className="crop-edit-hint"><Maximize2 className="size-3" /> Edit</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </main>

          <aside className={`organize-sidebar ${sidebarOpen ? "organize-sidebar-open" : ""}`}>
            <div className="organize-sidebar-scroll">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-strong)]">NovaPDF workspace</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--ink)]">{activeTool.name}</h2>
              </div>

              {!loadedPdf ? (
                <div className="organize-side-section"><div className="split-editor-info">Use the upload box in the middle to choose one PDF.</div></div>
              ) : (
                <>
                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>PDF document</h3><span>{loadedPdf.pageCount}</span></div>
                    <div className="organize-source-row">
                      <span className="organize-source-letter">A</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold text-slate-700">{loadedPdf.file.name}</p>
                        <p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">{loadedPdf.pageCount} pages · {formatBytes(loadedPdf.file.size)}</p>
                      </div>
                    </div>
                    <button type="button" className="organize-add-file-button" onClick={() => inputRef.current?.click()}><UploadCloud className="size-4" /> Replace PDF</button>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Apply crop to</h3><span>{effectiveCropPages.size}</span></div>
                    <div className="crop-target-grid">
                      {([
                        ["current", "Current page"],
                        ["selected", "Selected"],
                        ["all", "All pages"],
                        ["odd", "Odd pages"],
                        ["even", "Even pages"],
                        ["custom", "Custom range"],
                      ] as Array<[TargetMode, string]>).map(([mode, label]) => (
                        <button type="button" key={mode} className={targetMode === mode ? "active" : ""} onClick={() => updateSetting(() => setTargetMode(mode))}>{label}</button>
                      ))}
                    </div>
                    {targetMode === "custom" && (
                      <div className="page-number-input-grid mt-2">
                        <label><span>From</span><input type="number" min={1} max={loadedPdf.pageCount} value={customFrom} onChange={(event) => updateSetting(() => { const value = clampInteger(Number(event.target.value) || 1, 1, loadedPdf.pageCount); setCustomFrom(value); setCustomTo((current) => Math.max(current, value)); })} /></label>
                        <label><span>To</span><input type="number" min={customFrom} max={loadedPdf.pageCount} value={customTo} onChange={(event) => updateSetting(() => setCustomTo(clampInteger(Number(event.target.value) || customFrom, customFrom, loadedPdf.pageCount)))} /></label>
                      </div>
                    )}
                    <label className="crop-free-form-toggle">
                      <input type="checkbox" checked={freeFormCrop} onChange={(event) => toggleFreeFormCrop(event.target.checked)} />
                      <span><strong>Free-form crop</strong><em>Keep every edited page targeted with its own crop area and aspect ratio.</em></span>
                    </label>
                    <label className="edit-snap-toggle"><input type="checkbox" checked={snapEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} /><span>Snap the crop area to page alignment guides</span></label>
                    <p className="workspace-interaction-help">Moving or resizing shows alignment rulers and live distances. Hold Shift while dragging any resize handle to preserve the current aspect ratio.</p>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Crop preset</h3><span>pt</span></div>
                    <div className="crop-preset-grid">
                      <button type="button" onClick={() => applyMarginPreset(0)}>Full page</button>
                      <button type="button" onClick={() => applyMarginPreset(12)}>Small</button>
                      <button type="button" onClick={() => applyMarginPreset(24)}>Medium</button>
                      <button type="button" onClick={() => applyMarginPreset(48)}>Large</button>
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Exact margins</h3><span>Page {currentPage}</span></div>
                    <div className="crop-margin-grid">
                      {(["top", "right", "bottom", "left"] as const).map((side) => (
                        <label key={side}><span>{side[0].toUpperCase() + side.slice(1)}</span><input type="number" min={0} step={1} value={Math.round(currentMargins[side])} onChange={(event) => updateMargin(side, Number(event.target.value))} /><em>pt</em></label>
                      ))}
                    </div>
                    <button type="button" className="crop-open-editor" onClick={() => setFocusedPage(currentPage)}><Crop className="size-4" /> Open large crop editor</button>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Aspect ratio</h3></div>
                    <div className="crop-ratio-grid">
                      {([
                        ["free", "Free"],
                        ["original", "Original"],
                        ["a4", "A4"],
                        ["letter", "Letter"],
                        ["square", "Square"],
                      ] as Array<[AspectMode, string]>).map(([mode, label]) => (
                        <button type="button" key={mode} className={currentAspectMode === mode ? "active" : ""} onClick={() => setAspect(mode)}>{label}</button>
                      ))}
                    </div>
                    <div className="split-editor-info mt-2">{freeFormCrop ? `Page ${currentPage} keeps its own crop. Previously edited pages stay cropped when you open and edit another page.` : "One proportional crop area is copied to every targeted page. Aspect presets always restart from the original page, not the previously selected ratio."}</div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Output filename</h3></div>
                    <label className="organize-filename-field"><input value={outputName} onChange={(event) => updateSetting(() => setOutputName(event.target.value))} maxLength={86} /><span>.pdf</span></label>
                  </div>
                </>
              )}

              {(status === "reading" || status === "processing") && (
                <div className="organize-progress-box">
                  <div><span>{status === "reading" ? "Reading PDF…" : "Cropping pages…"}</span><strong>{progress}%</strong></div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>}

              {status === "success" && result && (
                <WorkspaceResultCard title={`${activeTool.name} result ready`} summary={`${effectiveCropPages.size} cropped page${effectiveCropPages.size === 1 ? "" : "s"} · ${loadedPdf?.pageCount ?? 0} total pages`} downloads={downloads} />
              )}

              {!result && loadedPdf && (
                <div className="organize-sidebar-action">
                  <button type="button" className="organize-primary-action" onClick={() => void createCroppedPdf()} disabled={status === "reading" || status === "processing" || effectiveCropPages.size === 0}>
                    {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Crop PDF
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              <div className="organize-privacy-note"><LockKeyhole className="size-4" /> This PDF is cropped inside your browser during this build.</div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div id="workspace" className="hero-workspace scroll-mt-28">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[var(--brand-strong)]"><Crop className="size-5" /></span>
          <div><p className="text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p><p className="text-xs text-slate-500">Crop page margins with a live visual editor</p></div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onFileInput} />
        <div
          className={`upload-zone ${dragging ? "upload-zone-active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="upload-icon"><CloudUpload className="size-7" /></span>
          <p className="mt-4 text-lg font-extrabold text-[var(--ink)]">Drop a PDF here</p>
          <p className="mt-1 text-sm text-slate-500">Draw a crop rectangle or enter exact top, right, bottom, and left margins.</p>
          <span className="button button-primary pointer-events-none mt-5"><UploadCloud className="size-4" /> Choose PDF</span>
        </div>
        {message && <div className="mt-4 flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{message}</span></div>}
      </div>
    </div>
  );
}
