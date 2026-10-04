/* eslint-disable @next/next/no-img-element */
"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  BoxSelect,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  CloudUpload,
  Copy,
  FilePenLine,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Minus,
  MousePointer2,
  PenLine,
  RotateCcw,
  RotateCw,
  Save,
  Square,
  Trash2,
  Type,
  Underline,
  UploadCloud,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { WorkspaceInteractionOverlay } from "@/components/workspace-interaction-overlay";
import { WorkspaceResultCard, type WorkspaceDownload } from "@/components/workspace-result-card";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { type PdfTool } from "@/data/tools";
import { useWorkspaceHistory } from "@/hooks/use-workspace-history";
import {
  applyPdfEdits,
  type EditPdfAssetInput,
  type EditPdfFontFamily,
  type EditPdfImageType,
  type EditPdfObject,
  type EditPdfObjectType,
  type EditPdfTextAlign,
} from "@/lib/edit-pdf";
import {
  WORKSPACE_FILE_TRANSFER_EVENT,
  transferWorkspaceFiles,
  type WorkspaceFileTransferDetail,
} from "@/lib/workspace-file-transfer";
import {
  constrainAspectSize,
  snapNormalizedBox,
  type InteractionGuideState,
} from "@/lib/workspace-interaction-guides";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_PAGES = 300;
const PDF_ACCEPT = ".pdf,application/pdf";
const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

type ProcessStatus = "idle" | "reading" | "processing" | "success" | "error";

type LoadedPdf = {
  file: File;
  pageCount: number;
  pages: Array<{ pageNumber: number; width: number; height: number }>;
};

type PagePreview = {
  url: string;
  width: number;
  height: number;
  zoomBucket?: number;
};

type EditAsset = {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  imageType: EditPdfImageType;
};

type EditResult = {
  url: string;
  name: string;
  size: number;
  file: File;
  editedPageCount: number;
  objectCount: number;
};

type Selection = { objectId: string; pageNumber: number } | null;

type EditAlignmentGuides = InteractionGuideState;

type EditHistoryState = {
  objects: EditPdfObject[];
  selection: Selection;
};

type PointerState = {
  pointerId: number;
  mode: "move" | "resize";
  objectId: string;
  pageNumber: number;
  startClientX: number;
  startClientY: number;
  startObject: EditPdfObject;
  pageWidth: number;
  pageHeight: number;
  stageRect: DOMRect;
};

type DraftStroke = {
  pageNumber: number;
  points: Array<{ x: number; y: number }>;
};

const TOOL_BUTTONS: Array<{
  type: EditPdfObjectType;
  label: string;
  icon: typeof Type;
}> = [
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: ImagePlus },
  { type: "rectangle", label: "Rectangle", icon: Square },
  { type: "ellipse", label: "Ellipse", icon: Circle },
  { type: "line", label: "Line", icon: Minus },
  { type: "highlight", label: "Highlight", icon: Highlighter },
  { type: "underline", label: "Underline", icon: Underline },
  { type: "freehand", label: "Draw", icon: PenLine },
  { type: "link", label: "Link", icon: Link2 },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function cloneHistory(value: EditHistoryState): EditHistoryState {
  return {
    objects: value.objects.map((object) => ({
      ...object,
      points: object.points?.map((point) => ({ ...point })),
    })),
    selection: value.selection ? { ...value.selection } : null,
  };
}

function rotatePoint(point: { x: number; y: number }, degrees: number) {
  const radians = degrees * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
}

function normalizeAngle(value: number) {
  let angle = value;
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

function defaultEditObject(type: EditPdfObjectType, pageNumber: number, zIndex: number): EditPdfObject {
  const base: EditPdfObject = {
    id: createId(type),
    pageNumber,
    type,
    x: 0.5,
    y: 0.32,
    width: 0.28,
    height: 0.1,
    rotation: 0,
    opacity: type === "highlight" ? 0.38 : 1,
    zIndex,
    color: "#111827",
    fillColor: "transparent",
    borderColor: "#0f766e",
    borderWidth: 1.5,
  };

  if (type === "text") return {
    ...base,
    text: "Add your text",
    width: 0.36,
    height: 0.13,
    fontFamily: "helvetica",
    fontSize: 20,
    align: "left",
    fillColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 0.8,
  };
  if (type === "rectangle") return { ...base, width: 0.3, height: 0.16, fillColor: "#dff8f3" };
  if (type === "ellipse") return { ...base, width: 0.24, height: 0.15, fillColor: "#dff8f3" };
  if (type === "line") return { ...base, width: 0.32, height: 0.035, borderWidth: 2.5, borderColor: "#111827" };
  if (type === "highlight") return { ...base, width: 0.38, height: 0.07, fillColor: "#fde047", borderWidth: 0 };
  if (type === "underline") return { ...base, width: 0.34, height: 0.03, borderWidth: 2.5, color: "#ef4444" };
  if (type === "link") return {
    ...base,
    width: 0.34,
    height: 0.08,
    url: "https://example.com",
    fillColor: "#dbeafe",
    borderColor: "#2563eb",
    borderWidth: 1,
    opacity: 0.35,
  };
  return base;
}

function previewFontFamily(family: EditPdfFontFamily | undefined) {
  if (family === "times") return 'Georgia, "Times New Roman", serif';
  if (family === "courier") return '"Courier New", Courier, monospace';
  return 'Arial, Helvetica, sans-serif';
}

function wrapPreviewText(text: string, width: number, fontSize: number) {
  const maxCharacters = Math.max(2, Math.floor(width / Math.max(4, fontSize * 0.54)));
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
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxCharacters || !current) current = next;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.slice(0, 20);
}

async function imageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("The selected image could not be read."));
    image.src = url;
  });
}

async function normalizeImage(file: File) {
  if (file.size > MAX_IMAGE_SIZE) throw new Error(`${file.name} is larger than the 15 MB image limit.`);
  const sourceUrl = URL.createObjectURL(file);
  try {
    const dimensions = await imageDimensions(sourceUrl);
    if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
      throw new Error("This image is too large. Use an image below 40 million pixels.");
    }
    const lower = file.name.toLowerCase();
    const isJpeg = file.type === "image/jpeg" || /\.jpe?g$/i.test(lower);
    const isPng = file.type === "image/png" || lower.endsWith(".png");
    if (isJpeg || isPng) {
      return {
        file,
        width: dimensions.width,
        height: dimensions.height,
        imageType: isJpeg ? "jpg" as const : "png" as const,
      };
    }

    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not prepare this image.");
    context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("The browser could not convert this image.")), "image/png");
    });
    return {
      file: new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "edit-image"}.png`, { type: "image/png" }),
      width: dimensions.width,
      height: dimensions.height,
      imageType: "png" as const,
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function objectLabel(type: EditPdfObjectType) {
  return TOOL_BUTTONS.find((item) => item.type === type)?.label ?? type;
}

export function EditPdfWorkspace({
  activeTool,
  onToolChange,
  startInWorkspace,
  isActive,
  onExitWorkspace,
}: {
  activeTool: PdfTool;
  onToolChange: (tool: PdfTool) => void;
  startInWorkspace: boolean;
  isActive: boolean;
  onExitWorkspace: () => void;
}) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const documentScrollRef = useRef<HTMLDivElement>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLElement>());
  const thumbnailRefs = useRef(new Map<number, HTMLButtonElement>());
  const stageRefs = useRef(new Map<number, HTMLDivElement>());
  const pointerStateRef = useRef<PointerState | null>(null);
  const drawingPointerRef = useRef<number | null>(null);
  const pendingInsertPageRef = useRef<number | null>(null);
  const objectsRef = useRef<EditPdfObject[]>([]);
  const resultRef = useRef<EditResult | null>(null);
  const assetsRef = useRef<EditAsset[]>([]);
  const mainPreviewUrlsRef = useRef(new Set<string>());

  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<number, PagePreview>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [mainPreviews, setMainPreviews] = useState<Record<number, PagePreview>>({});
  const [objects, setObjects] = useState<EditPdfObject[]>([]);
  const [assets, setAssets] = useState<EditAsset[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [drawingMode, setDrawingMode] = useState(false);
  const [draftStroke, setDraftStroke] = useState<DraftStroke | null>(null);
  const [draggingUpload, setDraggingUpload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [outputName, setOutputName] = useState("edited-document");
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<EditResult | null>(null);
  const [replaceImageTargetId, setReplaceImageTargetId] = useState<string | null>(null);
  const [clipboardObject, setClipboardObject] = useState<EditPdfObject | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [alignmentGuides, setAlignmentGuides] = useState<EditAlignmentGuides>(null);

  objectsRef.current = objects;

  const history = useWorkspaceHistory<EditHistoryState>(cloneHistory, 120);

  const selectedObject = useMemo(() => {
    if (!selection) return null;
    return objects.find((object) => object.id === selection.objectId && object.pageNumber === selection.pageNumber) ?? null;
  }, [objects, selection]);

  const resultDownloads = useMemo<WorkspaceDownload[]>(() => result ? [{
    url: result.url,
    name: result.name,
    detail: `${result.editedPageCount} edited page${result.editedPageCount === 1 ? "" : "s"} · ${formatBytes(result.size)}`,
  }] : [], [result]);

  const currentFiles = useMemo(() => {
    if (result?.file) return [result.file];
    return loaded ? [loaded.file] : [];
  }, [loaded, result]);

  const historyState = useCallback((): EditHistoryState => ({
    objects,
    selection,
  }), [objects, selection]);

  const applyHistory = useCallback((value: EditHistoryState) => {
    setObjects(value.objects);
    setSelection(value.selection);
  }, []);

  function checkpoint() {
    history.checkpoint(historyState());
  }

  function undo() {
    history.undo(historyState(), applyHistory);
  }

  function redo() {
    history.redo(historyState(), applyHistory);
  }

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(() => () => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
    for (const asset of assetsRef.current) URL.revokeObjectURL(asset.previewUrl);
    for (const url of mainPreviewUrlsRef.current) URL.revokeObjectURL(url);
    mainPreviewUrlsRef.current.clear();
  }, []);

  const clearResult = useCallback(() => {
    setResult((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  const clearAssets = useCallback(() => {
    setAssets((current) => {
      for (const asset of current) URL.revokeObjectURL(asset.previewUrl);
      return [];
    });
  }, []);

  const clearMainPreviews = useCallback(() => {
    setMainPreviews((current) => {
      for (const preview of Object.values(current)) {
        URL.revokeObjectURL(preview.url);
        mainPreviewUrlsRef.current.delete(preview.url);
      }
      return {};
    });
  }, []);

  const resetEditorState = useCallback(() => {
    setObjects([]);
    setSelection(null);
    setClipboardObject(null);
    setAlignmentGuides(null);
    setActivePageNumber(1);
    setZoom(100);
    setDrawingMode(false);
    setDraftStroke(null);
    setMessage("");
    setProgress(0);
    setStatus("idle");
    setOutputName("edited-document");
    setThumbnails({});
    setThumbnailErrors({});
    clearMainPreviews();
    clearAssets();
    clearResult();
    history.reset();
  }, [clearAssets, clearMainPreviews, clearResult, history]);

  function startOver() {
    setLoaded(null);
    setSidebarOpen(false);
    resetEditorState();
  }

  function goHome() {
    setSidebarOpen(false);
    onExitWorkspace();
    window.requestAnimationFrame(() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function loadPdf(file: File) {
    if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      setStatus("error");
      setMessage("Choose a PDF file for Edit PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus("error");
      setMessage(`${file.name} is larger than the 50 MB limit.`);
      return;
    }

    resetEditorState();
    setStatus("reading");
    setMessage("Reading PDF pages…");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await task.promise;
      if (pdf.numPages > MAX_PAGES) throw new Error(`This PDF has ${pdf.numPages} pages. The current limit is ${MAX_PAGES}.`);
      const pages: LoadedPdf["pages"] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        pages.push({ pageNumber, width: viewport.width, height: viewport.height });
      }
      setLoaded({ file, pageCount: pdf.numPages, pages });
      setOutputName(`${file.name.replace(/\.pdf$/i, "") || "document"}-edited`);
      setStatus("idle");
      setMessage("");
    } catch (error) {
      setLoaded(null);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "This PDF could not be opened.");
    }
  }

  function onPdfInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void loadPdf(file);
  }

  function onPdfDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingUpload(false);
    const file = Array.from(event.dataTransfer.files).find((item) => item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf"));
    if (file) void loadPdf(file);
    else {
      setStatus("error");
      setMessage("Drop one PDF file here.");
    }
  }

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      const file = detail.files.at(-1);
      if (file) void loadPdf(file);
      else startOver();
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
  // The listener intentionally uses the current loader without resubscribing for every editor state update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  useEffect(() => {
    if (!startInWorkspace || !isActive || loaded) return;
    const frame = window.requestAnimationFrame(() => setStatus("idle"));
    return () => window.cancelAnimationFrame(frame);
  }, [isActive, loaded, startInWorkspace]);

  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    async function renderThumbnails() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data: new Uint8Array(await loaded!.file.arrayBuffer()) });
        const pdf = await task.promise;
        for (let pageNumber = 1; pageNumber <= loaded!.pageCount; pageNumber += 1) {
          if (cancelled) break;
          try {
            const page = await pdf.getPage(pageNumber);
            const base = page.getViewport({ scale: 1 });
            const scale = Math.max(0.18, Math.min(0.52, 220 / Math.max(base.width, base.height)));
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d", { alpha: false });
            if (!context) throw new Error("Canvas unavailable");
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            if (cancelled) break;
            setThumbnails((current) => ({
              ...current,
              [pageNumber]: { url: canvas.toDataURL("image/png"), width: viewport.width, height: viewport.height },
            }));
          } catch {
            setThumbnailErrors((current) => ({ ...current, [pageNumber]: true }));
          }
        }
        await task.destroy();
      } catch {
        if (!cancelled) setMessage("Some page previews could not be rendered. PDF export can still work.");
      }
    }
    void renderThumbnails();
    return () => { cancelled = true; };
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    const neighborhood = [activePageNumber - 1, activePageNumber, activePageNumber + 1]
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= loaded.pageCount);
    const zoomBucket = Math.max(50, Math.min(200, Math.round(zoom / 10) * 10));
    const missing = neighborhood.filter((pageNumber) => mainPreviews[pageNumber]?.zoomBucket !== zoomBucket);
    if (missing.length === 0) return;
    let cancelled = false;

    async function renderNeighborhood() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data: new Uint8Array(await loaded!.file.arrayBuffer()) });
        const pdf = await task.promise;
        for (const pageNumber of missing) {
          if (cancelled) break;
          const page = await pdf.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          const desiredWidth = Math.min(2200, Math.max(900, base.width * zoomBucket / 100 * 1.65));
          const scale = desiredWidth / base.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) continue;
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
          if (!blob || cancelled) continue;
          const url = URL.createObjectURL(blob);
          mainPreviewUrlsRef.current.add(url);
          setMainPreviews((current) => {
            const previous = current[pageNumber];
            if (previous?.url) {
              URL.revokeObjectURL(previous.url);
              mainPreviewUrlsRef.current.delete(previous.url);
            }
            return {
              ...current,
              [pageNumber]: { url, width: viewport.width, height: viewport.height, zoomBucket },
            };
          });
        }
        await task.destroy();
      } catch {
        // Low-resolution thumbnails remain available as the preview fallback.
      }
    }
    void renderNeighborhood();
    return () => { cancelled = true; };
  }, [activePageNumber, loaded, mainPreviews, zoom]);

  function maxZIndex() {
    return objects.reduce((maximum, object) => Math.max(maximum, object.zIndex), 0);
  }

  function activatePage(pageNumber: number) {
    if (!loaded || pageNumber < 1 || pageNumber > loaded.pageCount) return;
    setActivePageNumber(pageNumber);
    syncThumbnail(pageNumber);
  }

  function selectObject(object: EditPdfObject) {
    setSelection({ objectId: object.id, pageNumber: object.pageNumber });
    activatePage(object.pageNumber);
    setDrawingMode(false);
  }

  function addObject(type: EditPdfObjectType) {
    if (!loaded) return;
    if (type === "image") {
      pendingInsertPageRef.current = activePageNumber;
      imageInputRef.current?.click();
      return;
    }
    if (type === "freehand") {
      const nextDrawingMode = !drawingMode;
      setDrawingMode(nextDrawingMode);
      setSelection(null);
      setMessage(nextDrawingMode ? "Draw directly on the active PDF page. Press Escape to stop drawing." : "");
      return;
    }
    checkpoint();
    const object = defaultEditObject(type, activePageNumber, maxZIndex() + 1);
    setObjects((current) => [...current, object]);
    setSelection({ objectId: object.id, pageNumber: object.pageNumber });
    clearResult();
  }

  async function addImage(file: File, replaceObjectId?: string | null) {
    try {
      const normalized = await normalizeImage(file);
      const asset: EditAsset = {
        id: createId("image"),
        file: normalized.file,
        previewUrl: URL.createObjectURL(normalized.file),
        width: normalized.width,
        height: normalized.height,
        imageType: normalized.imageType,
      };
      checkpoint();
      setAssets((current) => [...current, asset]);
      if (replaceObjectId) {
        setObjects((current) => current.map((object) => object.id === replaceObjectId ? { ...object, assetId: asset.id } : object));
      } else {
        const targetPageNumber = pendingInsertPageRef.current ?? activePageNumber;
        pendingInsertPageRef.current = null;
        const page = loaded?.pages.find((item) => item.pageNumber === targetPageNumber);
        const aspect = normalized.width / Math.max(1, normalized.height);
        const pageAspect = page ? page.width / page.height : 1;
        const width = Math.min(0.46, aspect > 1 ? 0.34 : 0.24);
        const height = Math.min(0.46, width * pageAspect / Math.max(0.2, aspect));
        const object: EditPdfObject = {
          ...defaultEditObject("image", targetPageNumber, maxZIndex() + 1),
          assetId: asset.id,
          width,
          height,
          fillColor: "transparent",
          borderWidth: 0,
        };
        setObjects((current) => [...current, object]);
        setSelection({ objectId: object.id, pageNumber: object.pageNumber });
      }
      clearResult();
      setMessage("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The image could not be added.");
    }
  }

  function onImageInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void addImage(file);
  }

  function onReplaceImageInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const target = replaceImageTargetId;
    setReplaceImageTargetId(null);
    if (file && target) void addImage(file, target);
  }

  function updateSelected(patch: Partial<EditPdfObject>, withCheckpoint = true) {
    if (!selectedObject) return;
    if (withCheckpoint) checkpoint();
    setObjects((current) => current.map((object) => object.id === selectedObject.id ? { ...object, ...patch } : object));
    clearResult();
  }

  function deleteSelected() {
    if (!selectedObject) return;
    checkpoint();
    setObjects((current) => current.filter((object) => object.id !== selectedObject.id));
    setSelection(null);
    clearResult();
  }

  function duplicateSelected() {
    if (!selectedObject) return;
    checkpoint();
    const duplicate: EditPdfObject = {
      ...selectedObject,
      id: createId(selectedObject.type),
      x: Math.min(0.96, selectedObject.x + 0.025),
      y: Math.min(0.96, selectedObject.y + 0.025),
      zIndex: maxZIndex() + 1,
      points: selectedObject.points?.map((point) => ({ ...point })),
    };
    setObjects((current) => [...current, duplicate]);
    setSelection({ objectId: duplicate.id, pageNumber: duplicate.pageNumber });
    clearResult();
  }

  function moveLayer(direction: "front" | "back") {
    if (!selectedObject) return;
    checkpoint();
    const pageObjects = objects.filter((object) => object.pageNumber === selectedObject.pageNumber);
    const zValues = pageObjects.map((object) => object.zIndex);
    const target = direction === "front" ? Math.max(...zValues) + 1 : Math.min(...zValues) - 1;
    setObjects((current) => current.map((object) => object.id === selectedObject.id ? { ...object, zIndex: target } : object));
    clearResult();
  }

  function beginPointer(event: ReactPointerEvent<SVGElement>, object: EditPdfObject, mode: PointerState["mode"]) {
    if (drawingMode) return;
    event.stopPropagation();
    const stage = stageRefs.current.get(object.pageNumber);
    const page = loaded?.pages.find((item) => item.pageNumber === object.pageNumber);
    if (!stage || !page) return;
    checkpoint();
    selectObject(object);
    pointerStateRef.current = {
      pointerId: event.pointerId,
      mode,
      objectId: object.id,
      pageNumber: object.pageNumber,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startObject: { ...object, points: object.points?.map((point) => ({ ...point })) },
      pageWidth: page.width,
      pageHeight: page.height,
      stageRect: stage.getBoundingClientRect(),
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  useEffect(() => {
    function pointerMove(event: PointerEvent) {
      const state = pointerStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;
      const dxSvg = (event.clientX - state.startClientX) / Math.max(1, state.stageRect.width) * state.pageWidth;
      const dySvg = (event.clientY - state.startClientY) / Math.max(1, state.stageRect.height) * state.pageHeight;
      const start = state.startObject;

      if (state.mode === "move") {
        const halfWidth = Math.max(0.5 / state.pageWidth, start.width / 2);
        const halfHeight = Math.max(0.5 / state.pageHeight, start.height / 2);
        let box = {
          x: Math.max(halfWidth, Math.min(1 - halfWidth, start.x + dxSvg / state.pageWidth)),
          y: Math.max(halfHeight, Math.min(1 - halfHeight, start.y + dySvg / state.pageHeight)),
          width: start.width,
          height: start.height,
        };
        let guideX: number | null = null;
        let guideY: number | null = null;
        if (snapEnabled) {
          const peers = objectsRef.current
            .filter((object) => object.pageNumber === state.pageNumber && object.id !== state.objectId)
            .map((object) => ({ x: object.x, y: object.y, width: object.width, height: object.height }));
          const snapped = snapNormalizedBox(box, peers);
          box = snapped.box;
          guideX = snapped.guideX;
          guideY = snapped.guideY;
        }
        setAlignmentGuides({ pageNumber: state.pageNumber, box, guideX, guideY, mode: "move" });
        setObjects((current) => current.map((object) => object.id === state.objectId ? { ...object, x: box.x, y: box.y } : object));
      } else {
        setAlignmentGuides(null);
        const localDelta = rotatePoint({ x: dxSvg, y: dySvg }, -start.rotation);
        const startWidth = start.width * state.pageWidth;
        const startHeight = start.height * state.pageHeight;
        const minimumWidth = 1;
        const minimumHeight = 1;
        const constrained = constrainAspectSize({
          startWidth,
          startHeight,
          width: startWidth + localDelta.x,
          height: startHeight + localDelta.y,
          minimumWidth,
          minimumHeight,
          maximumWidth: state.pageWidth * 0.98,
          maximumHeight: state.pageHeight * 0.98,
          lockAspect: start.type === "image" || event.shiftKey,
        });
        const nextWidth = constrained.width;
        const nextHeight = constrained.height;
        const startCenter = { x: start.x * state.pageWidth, y: start.y * state.pageHeight };
        const topLeftOffset = rotatePoint({ x: -startWidth / 2, y: -startHeight / 2 }, start.rotation);
        const topLeft = { x: startCenter.x + topLeftOffset.x, y: startCenter.y + topLeftOffset.y };
        const nextCenterOffset = rotatePoint({ x: nextWidth / 2, y: nextHeight / 2 }, start.rotation);
        const nextCenter = { x: topLeft.x + nextCenterOffset.x, y: topLeft.y + nextCenterOffset.y };
        const nextBox = {
          width: Math.min(0.98, nextWidth / state.pageWidth),
          height: Math.min(0.98, nextHeight / state.pageHeight),
          x: Math.max(0.01, Math.min(0.99, nextCenter.x / state.pageWidth)),
          y: Math.max(0.01, Math.min(0.99, nextCenter.y / state.pageHeight)),
        };
        const resizePeers = objectsRef.current
          .filter((object) => object.pageNumber === state.pageNumber && object.id !== state.objectId)
          .map((object) => ({ x: object.x, y: object.y, width: object.width, height: object.height }));
        const visualGuides = snapEnabled ? snapNormalizedBox(nextBox, resizePeers) : null;
        setAlignmentGuides({
          pageNumber: state.pageNumber,
          box: nextBox,
          guideX: visualGuides?.guideX ?? null,
          guideY: visualGuides?.guideY ?? null,
          mode: "resize",
        });
        setObjects((current) => current.map((object) => object.id === state.objectId ? {
          ...object,
          ...nextBox,
        } : object));
      }
      clearResult();
    }

    function pointerUp(event: PointerEvent) {
      if (pointerStateRef.current?.pointerId === event.pointerId) {
        pointerStateRef.current = null;
        setAlignmentGuides(null);
      }
    }

    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    return () => {
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
    };
  }, [clearResult, snapEnabled]);

  function pointerPosition(event: ReactPointerEvent<SVGSVGElement>, pageNumber: number) {
    const stage = stageRefs.current.get(pageNumber);
    if (!stage) return null;
    const rectangle = stage.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rectangle.left) / Math.max(1, rectangle.width))),
      y: Math.max(0, Math.min(1, (event.clientY - rectangle.top) / Math.max(1, rectangle.height))),
    };
  }

  function drawPointerDown(event: ReactPointerEvent<SVGSVGElement>, pageNumber: number) {
    if (!drawingMode) {
      setSelection(null);
      return;
    }
    const point = pointerPosition(event, pageNumber);
    if (!point) return;
    checkpoint();
    drawingPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftStroke({ pageNumber, points: [point] });
  }

  function drawPointerMove(event: ReactPointerEvent<SVGSVGElement>, pageNumber: number) {
    if (!drawingMode || drawingPointerRef.current !== event.pointerId || draftStroke?.pageNumber !== pageNumber) return;
    const point = pointerPosition(event, pageNumber);
    if (!point) return;
    setDraftStroke((current) => current ? { ...current, points: [...current.points, point] } : current);
  }

  function finishDrawing(event: ReactPointerEvent<SVGSVGElement>) {
    if (drawingPointerRef.current !== event.pointerId) return;
    drawingPointerRef.current = null;
    const stroke = draftStroke;
    setDraftStroke(null);
    if (!stroke || stroke.points.length < 2) return;
    const xs = stroke.points.map((point) => point.x);
    const ys = stroke.points.map((point) => point.y);
    const minX = Math.max(0, Math.min(...xs) - 0.004);
    const maxX = Math.min(1, Math.max(...xs) + 0.004);
    const minY = Math.max(0, Math.min(...ys) - 0.004);
    const maxY = Math.min(1, Math.max(...ys) + 0.004);
    const width = Math.max(0.015, maxX - minX);
    const height = Math.max(0.015, maxY - minY);
    const object: EditPdfObject = {
      ...defaultEditObject("freehand", stroke.pageNumber, maxZIndex() + 1),
      x: minX + width / 2,
      y: minY + height / 2,
      width,
      height,
      color: "#111827",
      borderWidth: 2.5,
      points: stroke.points.map((point) => ({
        x: (point.x - minX) / width,
        y: (point.y - minY) / height,
      })),
    };
    setObjects((current) => [...current, object]);
    setSelection({ objectId: object.id, pageNumber: object.pageNumber });
    clearResult();
  }

  function scrollToPage(pageNumber: number, behavior: ScrollBehavior = "smooth") {
    const target = pageRefs.current.get(pageNumber);
    const container = documentScrollRef.current;
    if (!target || !container) return;
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const top = targetRect.top - containerRect.top + container.scrollTop - Math.max(12, (container.clientHeight - targetRect.height) / 2);
    const left = targetRect.left - containerRect.left + container.scrollLeft - Math.max(0, (container.clientWidth - targetRect.width) / 2);
    container.scrollTo({ top: Math.max(0, top), left: Math.max(0, left), behavior });
    activatePage(pageNumber);
  }

  function syncThumbnail(pageNumber: number) {
    const target = thumbnailRefs.current.get(pageNumber);
    const container = thumbnailScrollRef.current;
    if (!target || !container) return;
    const top = target.offsetTop - (container.clientHeight - target.clientHeight) / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function onDocumentScroll() {
    const container = documentScrollRef.current;
    if (!container || pointerStateRef.current) return;
    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + container.clientWidth / 2;
    const centerY = containerRect.top + container.clientHeight / 2;
    let best = activePageNumber;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const [pageNumber, element] of pageRefs.current.entries()) {
      const rect = element.getBoundingClientRect();
      const overlapWidth = Math.max(0, Math.min(rect.right, containerRect.right) - Math.max(rect.left, containerRect.left));
      const overlapHeight = Math.max(0, Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top));
      if (overlapWidth <= 0 || overlapHeight <= 0) continue;
      const dx = rect.left + rect.width / 2 - centerX;
      const dy = rect.top + rect.height / 2 - centerY;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = pageNumber;
      }
    }
    if (best !== activePageNumber) {
      setActivePageNumber(best);
      syncThumbnail(best);
    }
  }

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target;
      const editingText = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (loaded && objects.length > 0 && status !== "processing") void savePdf();
        return;
      }
      if (modifier && event.key.toLowerCase() === "o") {
        event.preventDefault();
        pdfInputRef.current?.click();
        return;
      }
      if (editingText) return;
      if (event.key === "Escape") {
        setDrawingMode(false);
        setDraftStroke(null);
        setSelection(null);
        setMessage("");
        return;
      }
      if (!selectedObject) return;
      if (modifier && event.key.toLowerCase() === "c") {
        event.preventDefault();
        setClipboardObject({ ...selectedObject, points: selectedObject.points?.map((point) => ({ ...point })) });
        return;
      }
      if (modifier && event.key.toLowerCase() === "x") {
        event.preventDefault();
        setClipboardObject({ ...selectedObject, points: selectedObject.points?.map((point) => ({ ...point })) });
        deleteSelected();
        return;
      }
      if (modifier && event.key.toLowerCase() === "v" && clipboardObject) {
        event.preventDefault();
        checkpoint();
        const duplicate: EditPdfObject = {
          ...clipboardObject,
          id: createId(clipboardObject.type),
          pageNumber: activePageNumber,
          x: Math.min(0.96, clipboardObject.x + 0.025),
          y: Math.min(0.96, clipboardObject.y + 0.025),
          zIndex: maxZIndex() + 1,
          points: clipboardObject.points?.map((point) => ({ ...point })),
        };
        setObjects((current) => [...current, duplicate]);
        setSelection({ objectId: duplicate.id, pageNumber: duplicate.pageNumber });
        clearResult();
        return;
      }
      if (modifier && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelected();
        return;
      }
      if (event.key === "]") {
        event.preventDefault();
        moveLayer("front");
        return;
      }
      if (event.key === "[") {
        event.preventDefault();
        moveLayer("back");
        return;
      }
      const movement = event.shiftKey ? 0.015 : 0.005;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        checkpoint();
        const patch: Partial<EditPdfObject> = {};
        if (event.altKey) {
          if (event.key === "ArrowLeft") patch.width = Math.max(0.001, selectedObject.width - movement);
          if (event.key === "ArrowRight") patch.width = Math.min(0.98, selectedObject.width + movement);
          if (event.key === "ArrowUp") patch.height = Math.max(0.001, selectedObject.height - movement);
          if (event.key === "ArrowDown") patch.height = Math.min(0.98, selectedObject.height + movement);
        } else {
          if (event.key === "ArrowLeft") patch.x = Math.max(0.01, selectedObject.x - movement);
          if (event.key === "ArrowRight") patch.x = Math.min(0.99, selectedObject.x + movement);
          if (event.key === "ArrowUp") patch.y = Math.max(0.01, selectedObject.y - movement);
          if (event.key === "ArrowDown") patch.y = Math.min(0.99, selectedObject.y + movement);
        }
        setObjects((current) => current.map((object) => object.id === selectedObject.id ? { ...object, ...patch } : object));
        clearResult();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  // Keyboard commands intentionally read the current editor callbacks and selection on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageNumber, clearResult, clipboardObject, loaded, objects.length, redo, selectedObject, status, undo]);

  async function savePdf() {
    if (!loaded || objects.length === 0) {
      setStatus("error");
      setMessage("Add at least one edit before saving the PDF.");
      return;
    }
    setStatus("processing");
    setProgress(12);
    setMessage("Embedding edits into a new PDF…");
    clearResult();
    try {
      const assetInputs: EditPdfAssetInput[] = await Promise.all(assets.map(async (asset) => ({
        id: asset.id,
        bytes: await asset.file.arrayBuffer(),
        imageType: asset.imageType,
      })));
      setProgress(42);
      const output = await applyPdfEdits(await loaded.file.arrayBuffer(), { assets: assetInputs, objects });
      setProgress(86);
      const name = `${(outputName.trim() || "edited-document").replace(/[\\/:*?"<>|]+/g, "-").replace(/\.pdf$/i, "")}.pdf`;
      const blob = new Blob([output.bytes as BlobPart], { type: "application/pdf" });
      const file = new File([blob], name, { type: "application/pdf" });
      const next: EditResult = {
        url: URL.createObjectURL(blob),
        name,
        size: blob.size,
        file,
        editedPageCount: output.editedPageCount,
        objectCount: output.objectCount,
      };
      setResult(next);
      setProgress(100);
      setStatus("success");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : "The edited PDF could not be created.");
    }
  }

  function renderObject(object: EditPdfObject, page: LoadedPdf["pages"][number]) {
    const selected = selection?.objectId === object.id;
    const asset = object.assetId ? assets.find((item) => item.id === object.assetId) : undefined;
    const centerX = object.x * page.width;
    const centerY = object.y * page.height;
    const width = object.width * page.width;
    const height = object.height * page.height;
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    const strokeColor = object.color ?? object.borderColor ?? "#111827";
    const borderColor = object.borderColor ?? "#0f766e";
    const fillColor = object.fillColor === "transparent" ? "none" : (object.fillColor ?? "none");
    const opacity = Math.max(0.02, Math.min(1, object.opacity));
    const pointerCursor = drawingMode ? "crosshair" : "move";

    let content: ReactNode = null;
    if (object.type === "text") {
      const size = object.fontSize ?? 20;
      const lines = wrapPreviewText(object.text ?? "", Math.max(1, width - 12), size);
      const anchor = object.align === "center" ? "middle" : object.align === "right" ? "end" : "start";
      const x = object.align === "center" ? centerX : object.align === "right" ? left + width - 6 : left + 6;
      content = (
        <>
          <rect x={left} y={top} width={width} height={height} rx={2} fill={fillColor} fillOpacity={fillColor === "none" ? 0 : opacity} stroke={object.borderWidth ? borderColor : "none"} strokeWidth={object.borderWidth ?? 0} />
          <text
            x={x}
            y={top + Math.max(size, 8)}
            textAnchor={anchor}
            fill={object.color ?? "#111827"}
            fillOpacity={opacity}
            fontFamily={previewFontFamily(object.fontFamily)}
            fontSize={size}
            fontWeight={object.bold ? 700 : 400}
            fontStyle={object.italic ? "italic" : "normal"}
          >
            {lines.map((line, index) => <tspan key={`${object.id}-line-${index}`} x={x} dy={index === 0 ? 0 : size * 1.22}>{line || " "}</tspan>)}
          </text>
        </>
      );
    } else if (object.type === "image" && asset) {
      content = <image href={asset.previewUrl} x={left} y={top} width={width} height={height} preserveAspectRatio="none" opacity={opacity} />;
    } else if (object.type === "ellipse") {
      content = <ellipse cx={centerX} cy={centerY} rx={width / 2} ry={height / 2} fill={fillColor} fillOpacity={fillColor === "none" ? 0 : opacity} stroke={object.borderWidth ? borderColor : "none"} strokeWidth={object.borderWidth ?? 0} />;
    } else if (object.type === "rectangle" || object.type === "highlight" || object.type === "link") {
      content = (
        <>
          <rect x={left} y={top} width={width} height={height} rx={object.type === "link" ? 3 : 1} fill={fillColor} fillOpacity={fillColor === "none" ? 0 : opacity} stroke={object.borderWidth ? borderColor : "none"} strokeWidth={object.borderWidth ?? 0} />
          {object.type === "link" && <text x={left + 6} y={top + Math.min(height - 4, 16)} fill="#1d4ed8" fontSize={Math.min(12, height * 0.42)} fontWeight={700}>Link</text>}
        </>
      );
    } else if (object.type === "line" || object.type === "underline") {
      content = <line x1={left} y1={centerY} x2={left + width} y2={centerY} stroke={strokeColor} strokeOpacity={opacity} strokeWidth={object.borderWidth ?? 2.5} strokeLinecap="round" />;
    } else if (object.type === "freehand") {
      const points = (object.points ?? []).map((point) => `${left + point.x * width},${top + point.y * height}`).join(" ");
      content = <polyline points={points} fill="none" stroke={strokeColor} strokeOpacity={opacity} strokeWidth={object.borderWidth ?? 2.5} strokeLinecap="round" strokeLinejoin="round" />;
    }

    return (
      <g key={object.id} transform={`rotate(${object.rotation} ${centerX} ${centerY})`}>
        <g
          className={`edit-object ${selected ? "edit-object-selected" : ""}`}
          style={{ cursor: pointerCursor } as CSSProperties}
          onPointerDown={(event) => beginPointer(event, object, "move")}
          onDoubleClick={() => selectObject(object)}
        >
          <rect x={left} y={top} width={width} height={height} fill="transparent" stroke="transparent" strokeWidth={10} />
          {content}
        </g>
        {selected && !drawingMode && (
          <g className="edit-selection-frame">
            <rect x={left} y={top} width={width} height={height} fill="none" stroke="#0f766e" strokeWidth={1.7} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
            <circle cx={left + width} cy={top + height} r={13} fill="transparent" stroke="transparent" onPointerDown={(event) => beginPointer(event, object, "resize")} style={{ cursor: "nwse-resize" }} />
            <circle cx={left + width} cy={top + height} r={7} fill="#ffffff" stroke="#0f766e" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" />
          </g>
        )}
      </g>
    );
  }

  function renderDraft(page: LoadedPdf["pages"][number]) {
    if (!draftStroke || draftStroke.pageNumber !== page.pageNumber) return null;
    return <polyline points={draftStroke.points.map((point) => `${point.x * page.width},${point.y * page.height}`).join(" ")} fill="none" stroke="#111827" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
  }

  function sidebarNumberInput(label: string, value: number, patch: keyof EditPdfObject, min: number, max: number, step = 1) {
    return (
      <label className="edit-field-label">
        <span>{label}</span>
        <input type="number" min={min} max={max} step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => updateSelected({ [patch]: Number(event.target.value) } as Partial<EditPdfObject>)} />
      </label>
    );
  }

  return (
    <div className="organize-editor-shell edit-editor-shell" role="dialog" aria-modal="true" aria-label="Edit PDF workspace">
      <input ref={pdfInputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onPdfInput} />
      <input ref={imageInputRef} type="file" className="sr-only" accept={IMAGE_ACCEPT} onChange={onImageInput} />
      <input ref={replaceImageInputRef} type="file" className="sr-only" accept={IMAGE_ACCEPT} onChange={onReplaceImageInput} />

      <header className="organize-editor-header">
        <button type="button" className="workspace-header-start-over" onClick={startOver} aria-label="Start over"><RotateCcw className="size-5" /></button>
        <h1 className="workspace-header-title">Edit PDF</h1>
        {loaded && <button type="button" className="edit-header-file-button" onClick={() => pdfInputRef.current?.click()}><UploadCloud className="size-4" /> Replace PDF</button>}
      </header>

      <div className={`organize-editor-body edit-editor-body ${loaded ? "edit-editor-loaded" : ""}`}>
        <WorkspaceToolRail
          activeTool={activeTool}
          onToolChange={(tool) => {
            transferWorkspaceFiles(tool, currentFiles);
            onToolChange(tool);
          }}
          onExitWorkspace={goHome}
          onOpenControls={() => setSidebarOpen((value) => !value)}
        />

        {!loaded ? (
          <main className="edit-empty-area">
            <div
              className={`workspace-empty-upload ${draggingUpload ? "workspace-empty-upload-active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => pdfInputRef.current?.click()}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") pdfInputRef.current?.click(); }}
              onDragEnter={(event) => { event.preventDefault(); setDraggingUpload(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDraggingUpload(false)}
              onDrop={onPdfDrop}
            >
              <span><CloudUpload className="size-8" /></span>
              <strong>Upload a PDF to edit</strong>
              <p>Add text, images, shapes, highlights, links, and freehand drawing in your browser.</p>
              <em>Choose a PDF</em>
            </div>
            {status === "reading" && <div className="edit-reading-message"><LoaderCircle className="size-4 animate-spin" /> {message}</div>}
            {status === "error" && message && <div className="organize-error-box edit-empty-error"><CircleAlert className="size-5" /> {message}</div>}
          </main>
        ) : (
          <>
            <aside className="edit-page-strip">
              <div className="sign-page-strip-heading"><strong>Pages</strong><span>{loaded.pageCount}</span></div>
              <div ref={thumbnailScrollRef} className="edit-page-strip-scroll">
                {loaded.pages.map((page) => {
                  const preview = thumbnails[page.pageNumber];
                  const active = page.pageNumber === activePageNumber;
                  const pageEdits = objects.filter((object) => object.pageNumber === page.pageNumber).length;
                  return (
                    <button
                      key={page.pageNumber}
                      ref={(element) => { if (element) thumbnailRefs.current.set(page.pageNumber, element); else thumbnailRefs.current.delete(page.pageNumber); }}
                      type="button"
                      className={`sign-page-thumb ${active ? "active" : ""}`}
                      onClick={() => scrollToPage(page.pageNumber)}
                    >
                      <span className="sign-page-thumb-preview" style={{ aspectRatio: `${page.width} / ${page.height}` }}>
                        {preview ? <img src={preview.url} alt={`Page ${page.pageNumber}`} /> : thumbnailErrors[page.pageNumber] ? <em>Preview unavailable</em> : <LoaderCircle className="size-4 animate-spin" />}
                      </span>
                      <small>Page {page.pageNumber}</small>
                      {pageEdits > 0 && <em className="edit-page-count">{pageEdits}</em>}
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="edit-document-area">
              <div className="edit-top-toolbar">
                <div className="edit-tool-palette" role="toolbar" aria-label="Edit PDF tools">
                  {TOOL_BUTTONS.map((tool) => {
                    const Icon = tool.icon;
                    const active = tool.type === "freehand" && drawingMode;
                    return <button key={tool.type} type="button" className={active ? "active" : ""} onClick={() => addObject(tool.type)} title={tool.label}><Icon className="size-4" /><span>{tool.label}</span></button>;
                  })}
                </div>
                <WorkspaceZoomControls
                    active={isActive} value={zoom} onChange={setZoom} canUndo={history.canUndo} canRedo={history.canRedo} onUndo={undo} onRedo={redo} currentPage={activePageNumber} pageCount={loaded.pageCount} onPageChange={scrollToPage} />
              </div>

              <div ref={documentScrollRef} className={`edit-document-scroll ${drawingMode ? "edit-drawing-mode" : ""}`} onScroll={onDocumentScroll}>
                <div className="edit-document-pages">
                  {loaded.pages.map((page) => {
                    const main = mainPreviews[page.pageNumber];
                    const fallback = thumbnails[page.pageNumber];
                    const preview = main ?? fallback;
                    const pageObjects = objects.filter((object) => object.pageNumber === page.pageNumber).sort((left, right) => left.zIndex - right.zIndex);
                    const displayWidth = page.width * zoom / 100;
                    return (
                      <section
                        key={page.pageNumber}
                        ref={(element) => { if (element) pageRefs.current.set(page.pageNumber, element); else pageRefs.current.delete(page.pageNumber); }}
                        className={`edit-document-page ${page.pageNumber === activePageNumber ? "active" : ""}`}
                        style={{ width: `${displayWidth}px` }}
                        data-page-number={page.pageNumber}
                        data-novapdf-view-page={page.pageNumber}
                        onPointerDownCapture={() => activatePage(page.pageNumber)}
                        aria-current={page.pageNumber === activePageNumber ? "page" : undefined}
                      >
                        <div
                          ref={(element) => { if (element) stageRefs.current.set(page.pageNumber, element); else stageRefs.current.delete(page.pageNumber); }}
                          className="edit-page-stage"
                          style={{ aspectRatio: `${page.width} / ${page.height}` }}
                        >
                          {preview ? <img src={preview.url} alt={`PDF page ${page.pageNumber}`} draggable={false} /> : <div className="edit-page-loading"><LoaderCircle className="size-5 animate-spin" /> Rendering page</div>}
                          <svg
                            viewBox={`0 0 ${page.width} ${page.height}`}
                            preserveAspectRatio="none"
                            aria-label={`Editable layer for page ${page.pageNumber}`}
                            onPointerDown={(event) => drawPointerDown(event, page.pageNumber)}
                            onPointerMove={(event) => drawPointerMove(event, page.pageNumber)}
                            onPointerUp={finishDrawing}
                            onPointerCancel={finishDrawing}
                          >
                            {alignmentGuides?.pageNumber === page.pageNumber && (
                              <WorkspaceInteractionOverlay pageWidth={page.width} pageHeight={page.height} state={alignmentGuides} />
                            )}
                            {pageObjects.map((object) => renderObject(object, page))}
                            {renderDraft(page)}
                          </svg>
                        </div>
                        <footer>Page {page.pageNumber}</footer>
                      </section>
                    );
                  })}
                </div>
              </div>
              <div className="sign-document-pagebar sign-document-pagebar-bottom">
                <button type="button" disabled={activePageNumber <= 1} onClick={() => scrollToPage(activePageNumber - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
                <span>Page {activePageNumber} of {loaded.pageCount}</span>
                <button type="button" disabled={activePageNumber >= loaded.pageCount} onClick={() => scrollToPage(activePageNumber + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
              </div>
            </main>

            <aside className={`organize-sidebar edit-sidebar ${sidebarOpen ? "organize-sidebar-open" : ""}`}>
              <div className="organize-sidebar-scroll">
                <div className="edit-sidebar-heading">
                  <div><p>NovaPDF editor</p><h2>Edit PDF</h2></div>
                  <button type="button" className="organize-sidebar-close lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close controls"><X className="size-4" /></button>
                </div>

                <section className="organize-side-section">
                  <div className="organize-side-heading"><h3>Document</h3><span>{objects.length}</span></div>
                  <div className="organize-source-row">
                    <span className="organize-source-letter"><FilePenLine className="size-4" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-slate-700">{loaded.file.name}</p><p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">{loaded.pageCount} pages · {formatBytes(loaded.file.size)}</p></div>
                  </div>
                </section>

                <section className="organize-side-section">
                  <div className="organize-side-heading"><h3>Selected object</h3>{selectedObject && <span>{objectLabel(selectedObject.type)}</span>}</div>
                  {!selectedObject ? (
                    <div className="split-editor-info"><MousePointer2 className="size-4" /> Select an object on the page, or add a new edit from the toolbar.</div>
                  ) : (
                    <div className="edit-selected-controls">
                      <div className="edit-object-actions">
                        <button type="button" onClick={() => updateSelected({ rotation: normalizeAngle(selectedObject.rotation + 15) })}><RotateCw className="size-4" /> Rotate</button>
                        <button type="button" onClick={duplicateSelected}><Copy className="size-4" /> Duplicate</button>
                        <button type="button" onClick={() => moveLayer("front")}><ArrowUpToLine className="size-4" /> Front</button>
                        <button type="button" onClick={() => moveLayer("back")}><ArrowDownToLine className="size-4" /> Back</button>
                        <button type="button" className="danger" onClick={deleteSelected}><Trash2 className="size-4" /> Delete</button>
                      </div>

                      {selectedObject.type === "text" && (
                        <>
                          <label className="edit-field-label"><span>Text</span><textarea value={selectedObject.text ?? ""} rows={4} onChange={(event) => updateSelected({ text: event.target.value })} /></label>
                          <div className="edit-control-grid">
                            <label className="edit-field-label"><span>Font</span><select value={selectedObject.fontFamily ?? "helvetica"} onChange={(event) => updateSelected({ fontFamily: event.target.value as EditPdfFontFamily })}><option value="helvetica">Helvetica</option><option value="times">Times</option><option value="courier">Courier</option></select></label>
                            {sidebarNumberInput("Size", selectedObject.fontSize ?? 20, "fontSize", 6, 160)}
                          </div>
                          <div className="edit-toggle-row">
                            <button type="button" className={selectedObject.bold ? "active" : ""} onClick={() => updateSelected({ bold: !selectedObject.bold })}><Bold className="size-4" /> Bold</button>
                            <button type="button" className={selectedObject.italic ? "active" : ""} onClick={() => updateSelected({ italic: !selectedObject.italic })}><Italic className="size-4" /> Italic</button>
                          </div>
                          <div className="edit-toggle-row" role="group" aria-label="Text alignment">
                            {(["left", "center", "right"] as EditPdfTextAlign[]).map((align) => {
                              const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                              return <button key={align} type="button" className={(selectedObject.align ?? "left") === align ? "active" : ""} onClick={() => updateSelected({ align })}><Icon className="size-4" /> {align}</button>;
                            })}
                          </div>
                          <div className="edit-control-grid">
                            <label className="edit-field-label"><span>Text color</span><input type="color" value={selectedObject.color ?? "#111827"} onChange={(event) => updateSelected({ color: event.target.value })} /></label>
                            <label className="edit-field-label"><span>Box fill</span><input type="color" value={selectedObject.fillColor === "transparent" ? "#ffffff" : selectedObject.fillColor ?? "#ffffff"} onChange={(event) => updateSelected({ fillColor: event.target.value })} /></label>
                          </div>
                        </>
                      )}

                      {selectedObject.type === "image" && (
                        <button type="button" className="watermark-image-upload" onClick={() => { setReplaceImageTargetId(selectedObject.id); replaceImageInputRef.current?.click(); }}><span><ImagePlus className="size-5" /></span><span><strong>Replace image</strong><small>PNG, JPG, JPEG, or WebP</small></span></button>
                      )}

                      {selectedObject.type === "link" && (
                        <label className="edit-field-label"><span>Link address</span><input type="url" value={selectedObject.url ?? ""} placeholder="https://example.com" onChange={(event) => updateSelected({ url: event.target.value })} /></label>
                      )}

                      {["rectangle", "ellipse", "highlight", "link"].includes(selectedObject.type) && (
                        <div className="edit-control-grid">
                          <label className="edit-field-label"><span>Fill</span><input type="color" value={selectedObject.fillColor === "transparent" ? "#ffffff" : selectedObject.fillColor ?? "#dff8f3"} onChange={(event) => updateSelected({ fillColor: event.target.value })} /></label>
                          <label className="edit-field-label"><span>Border</span><input type="color" value={selectedObject.borderColor ?? "#0f766e"} onChange={(event) => updateSelected({ borderColor: event.target.value })} /></label>
                        </div>
                      )}

                      {["line", "underline", "freehand"].includes(selectedObject.type) && (
                        <label className="edit-field-label"><span>Stroke color</span><input type="color" value={selectedObject.color ?? selectedObject.borderColor ?? "#111827"} onChange={(event) => updateSelected({ color: event.target.value })} /></label>
                      )}

                      <div className="edit-control-grid">
                        {sidebarNumberInput("Rotation", selectedObject.rotation, "rotation", -180, 180)}
                        <label className="edit-field-label"><span>Opacity %</span><input type="number" min={2} max={100} step={1} value={Math.round(selectedObject.opacity * 100)} onChange={(event) => updateSelected({ opacity: Math.max(0.02, Math.min(1, Number(event.target.value) / 100)) })} /></label>
                      </div>
                      <div className="edit-control-grid">
                        {sidebarNumberInput("Border / stroke", selectedObject.borderWidth ?? 0, "borderWidth", 0, 36, 0.5)}
                        <label className="edit-field-label"><span>Layer</span><input type="number" value={selectedObject.zIndex} onChange={(event) => updateSelected({ zIndex: Number(event.target.value) })} /></label>
                      </div>
                      <label className="edit-snap-toggle"><input type="checkbox" checked={snapEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} /><span>Snap to page and object alignment guides</span></label>
                      <p className="edit-control-note">Drag to move with alignment rulers and live distance measurements. Use the bottom-right handle to resize; hold Shift to preserve the current aspect ratio. Arrow keys move precisely; Shift+Arrow moves farther; Alt+Arrow resizes; [ and ] change layers.</p>
                    </div>
                  )}
                </section>

                <section className="organize-side-section">
                  <div className="organize-side-heading"><h3>Output</h3></div>
                  <label className="edit-field-label"><span>Filename</span><div className="organize-filename-field"><input value={outputName} onChange={(event) => setOutputName(event.target.value)} /><span>.pdf</span></div></label>
                  {status === "processing" && <div className="organize-progress-box"><div><span>{message}</span><strong>{progress}%</strong></div><div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div></div>}
                  {status === "error" && message && <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>}
                  {result && <WorkspaceResultCard title="Edited PDF ready" summary={`${result.objectCount} edit${result.objectCount === 1 ? "" : "s"} added without overwriting the source file.`} downloads={resultDownloads} />}
                  {!result && <div className="organize-sidebar-action"><button type="button" className="organize-primary-action" disabled={status === "processing" || objects.length === 0} onClick={() => void savePdf()}>{status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Save edited PDF</button></div>}
                </section>

                <div className="organize-privacy-note"><LockKeyhole className="size-4" /> Editing and PDF generation stay in this browser.</div>
                <div className="edit-limit-note"><BoxSelect className="size-4" /><span>Current limit: one unlocked PDF, 50 MB, 300 pages. Added edits are flattened into a new PDF.</span></div>
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
