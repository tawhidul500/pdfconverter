/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowRight,
  Bold,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CloudUpload,
  Copy,
  FileText,
  Grid2X2,
  Image as ImageIcon,
  ImagePlus,
  Keyboard,
  LoaderCircle,
  LockKeyhole,
  MousePointer2,
  PencilLine,
  Plus,
  Replace,
  RotateCcw,
  RotateCw,
  Save,
  Stamp,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
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
  WORKSPACE_FILE_TRANSFER_EVENT,
  transferWorkspaceFiles,
  type WorkspaceFileTransferDetail,
} from "@/lib/workspace-file-transfer";
import {
  applyImageWatermark,
  applyTextWatermark,
  clampNumber,
  getPlacementCenter,
  type WatermarkFontWeight,
  type WatermarkImageType,
  type WatermarkInstance,
  type WatermarkPlacement,
} from "@/lib/watermark-pdf";
import {
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
type RangeMode = "all" | "custom";
type WatermarkMode = "text" | "image";
type EditScope = "all" | "page";

type LoadedPdf = {
  file: File;
  pageCount: number;
};

type ThumbnailPreview = {
  url: string;
  width: number;
  height: number;
};

type LoadedWatermarkImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  imageType: WatermarkImageType;
};

type PdfResult = {
  url: string;
  name: string;
  size: number;
  file: File;
  watermarkedPageCount: number;
};

type TextMetrics = {
  width: number;
  ascent: number;
  descent: number;
  height: number;
};

type WatermarkSelection = {
  objectId: string;
  pageNumber: number;
};

type DraggedWatermark = {
  pointerId: number;
  objectId: string;
  pageNumber: number;
  offsetX: number;
  offsetY: number;
};

type WatermarkHistoryState = {
  objects: WatermarkInstance[];
  selection: WatermarkSelection | null;
  editScope: EditScope;
  watermarkMode: WatermarkMode;
  watermarkText: string;
  watermarkImage: LoadedWatermarkImage | null;
  imageScale: number;
  rangeMode: RangeMode;
  rangeStart: number;
  rangeEnd: number;
  fontSize: number;
  margin: number;
  fontWeight: WatermarkFontWeight;
  watermarkColor: string;
  opacity: number;
  outputName: string;
};

function cloneWatermarkHistory(value: WatermarkHistoryState): WatermarkHistoryState {
  return {
    objects: value.objects.map((object) => ({
      ...object,
      hiddenPages: [...(object.hiddenPages ?? [])],
      customPosition: object.customPosition ? { ...object.customPosition } : null,
    })),
    selection: value.selection ? { ...value.selection } : null,
    editScope: value.editScope,
    watermarkMode: value.watermarkMode,
    watermarkText: value.watermarkText,
    watermarkImage: value.watermarkImage ? { ...value.watermarkImage } : null,
    imageScale: value.imageScale,
    rangeMode: value.rangeMode,
    rangeStart: value.rangeStart,
    rangeEnd: value.rangeEnd,
    fontSize: value.fontSize,
    margin: value.margin,
    fontWeight: value.fontWeight,
    watermarkColor: value.watermarkColor,
    opacity: value.opacity,
    outputName: value.outputName,
  };
}

const PLACEMENTS: Array<{ id: WatermarkPlacement; label: string }> = [
  { id: "top-left", label: "Top left" },
  { id: "top-center", label: "Top center" },
  { id: "top-right", label: "Top right" },
  { id: "center-left", label: "Center left" },
  { id: "center", label: "Center" },
  { id: "center-right", label: "Center right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom-center", label: "Bottom center" },
  { id: "bottom-right", label: "Bottom right" },
];

const WATERMARK_COLORS = [
  { name: "Charcoal", value: "#111827" },
  { name: "Gray", value: "#64748b" },
  { name: "Teal", value: "#0f766e" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Red", value: "#b91c1c" },
  { name: "Orange", value: "#c2410c" },
];

function createInitialObject(): WatermarkInstance {
  return {
    id: "watermark-1",
    scope: "all",
    placement: "center",
    customPosition: null,
    rotation: -45,
    hiddenPages: [],
    text: "CONFIDENTIAL",
  };
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isWatermarkImageFile(file: File) {
  return /\.(png|jpe?g|webp)$/i.test(file.name) || ["image/png", "image/jpeg", "image/webp"].includes(file.type);
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
      .trim() || "NovaPDF-watermarked"
  );
}

function clampInteger(value: number, minimum: number, maximum: number) {
  return Math.round(clampNumber(value, minimum, maximum));
}

function normalizeObjectRotation(value: number) {
  const normalized = ((Math.round(value) + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The image could not be converted."));
    }, "image/png");
  });
}

async function prepareWatermarkImage(file: File): Promise<LoadedWatermarkImage> {
  if (!isWatermarkImageFile(file)) throw new Error("Choose a PNG, JPG, JPEG, or WebP image.");
  if (!file.size) throw new Error("This image is empty.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("The watermark image is larger than the current 15 MB limit.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This watermark image is invalid or unsupported.");
  }

  try {
    if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
      throw new Error("The watermark image dimensions are too large for this browser workspace.");
    }

    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const isJpeg = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);
    let normalizedFile = file;
    let imageType: WatermarkImageType = isPng ? "png" : "jpg";

    if (!isPng && !isJpeg) {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("The image conversion canvas is unavailable.");
      context.drawImage(bitmap, 0, 0);
      const blob = await canvasToPngBlob(canvas);
      normalizedFile = new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "watermark"}.png`, {
        type: "image/png",
        lastModified: Date.now(),
      });
      imageType = "png";
    }

    return {
      file: normalizedFile,
      previewUrl: URL.createObjectURL(normalizedFile),
      width: bitmap.width,
      height: bitmap.height,
      imageType,
    };
  } finally {
    bitmap.close();
  }
}

function rotatedBox(width: number, height: number, rotation: number) {
  const radians = rotation * Math.PI / 180;
  return {
    width: Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height,
    height: Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height,
  };
}

function getPreviewObjectSize(
  mode: WatermarkMode,
  pageWidth: number,
  pageHeight: number,
  metrics: TextMetrics,
  image: LoadedWatermarkImage | null,
  imageScale: number,
) {
  if (mode === "image" && image) {
    let width = pageWidth * clampNumber(imageScale, 5, 95) / 100;
    let height = width * image.height / image.width;
    if (height > pageHeight * 0.95) {
      const scale = pageHeight * 0.95 / height;
      width *= scale;
      height *= scale;
    }
    return { width, height };
  }

  return {
    width: Math.max(1, Math.min(pageWidth * 0.95, metrics.width)),
    height: Math.max(1, metrics.height),
  };
}

function objectAppearsOnPage(object: WatermarkInstance, pageNumber: number) {
  if (object.scope === "page") return object.pageNumber === pageNumber;
  return !(object.hiddenPages ?? []).includes(pageNumber);
}

function objectsForPage(objects: WatermarkInstance[], pageNumber: number) {
  return objects.filter((object) => objectAppearsOnPage(object, pageNumber));
}

export function WatermarkPdfWorkspace({
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
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);
  const watermarkTextRef = useRef<HTMLTextAreaElement>(null);
  const processButtonRef = useRef<HTMLButtonElement>(null);
  const draggedWatermarkRef = useRef<DraggedWatermark | null>(null);
  const objectIdCounterRef = useRef(1);
  const objectsRef = useRef<WatermarkInstance[]>([createInitialObject()]);
  const editScopeRef = useRef<EditScope>("all");
  const selectionRef = useRef<WatermarkSelection | null>(null);
  const pendingAddPageRef = useRef<number | null>(null);
  const pendingAddScopeRef = useRef<EditScope | null>(null);
  const pendingPlacementRef = useRef<WatermarkPlacement | null>(null);
  const watermarkImageUrlsRef = useRef(new Set<string>());
  const clipboardRef = useRef<WatermarkInstance | null>(null);
  const stageRefs = useRef(new Map<number, SVGSVGElement>());
  const history = useWorkspaceHistory<WatermarkHistoryState>(cloneWatermarkHistory, 120);

  const [loadedPdf, setLoadedPdf] = useState<LoadedPdf | null>(null);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [outputName, setOutputName] = useState("NovaPDF-watermarked");
  const [watermarkMode, setWatermarkMode] = useState<WatermarkMode>("text");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkImage, setWatermarkImage] = useState<LoadedWatermarkImage | null>(null);
  const [imageScale, setImageScale] = useState(28);
  const [rangeMode, setRangeMode] = useState<RangeMode>("all");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [fontSize, setFontSize] = useState(48);
  const [margin, setMargin] = useState(36);
  const [fontWeight, setFontWeight] = useState<WatermarkFontWeight>("bold");
  const [watermarkColor, setWatermarkColor] = useState("#64748b");
  const [opacity, setOpacity] = useState(0.28);
  const [objects, setObjects] = useState<WatermarkInstance[]>([createInitialObject()]);
  const [editScope, setEditScope] = useState<EditScope>("all");
  const [selection, setSelection] = useState<WatermarkSelection | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [interactionGuides, setInteractionGuides] = useState<InteractionGuideState>(null);
  const [textMetrics, setTextMetrics] = useState<TextMetrics>({ width: 330, ascent: 35, descent: 10, height: 45 });
  const [thumbnails, setThumbnails] = useState<Record<number, ThumbnailPreview>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<PdfResult | null>(null);
  const [zoom, setZoom] = useState(100);
  const [watermarkDragging, setWatermarkDragging] = useState(false);
  const [focusedPageNumber, setFocusedPageNumber] = useState<number | null>(null);
  const [activePageNumber, setActivePageNumber] = useState(1);

  const editorOpen = workspaceStarted || startInWorkspace;
  const effectiveStart = loadedPdf
    ? rangeMode === "all"
      ? 1
      : clampInteger(rangeStart, 1, loadedPdf.pageCount)
    : 1;
  const effectiveEnd = loadedPdf
    ? rangeMode === "all"
      ? loadedPdf.pageCount
      : clampInteger(rangeEnd, effectiveStart, loadedPdf.pageCount)
    : 1;
  const selectedPageNumber = loadedPdf ? clampInteger(selection?.pageNumber ?? activePageNumber, 1, loadedPdf.pageCount) : 1;
  const selectedObject = selection ? objects.find((object) => object.id === selection.objectId) ?? null : null;
  const selectedObjectText = selectedObject?.text ?? watermarkText;
  const editorText = editScope === "page" && selectedObject ? selectedObjectText : watermarkText;
  const selectedFontSize = selectedObject?.fontSize ?? fontSize;
  const selectedFontWeight = selectedObject?.fontWeight ?? fontWeight;
  const selectedColor = selectedObject?.color ?? watermarkColor;
  const selectedOpacity = selectedObject?.opacity ?? opacity;
  const selectedMargin = selectedObject?.margin ?? margin;
  const selectedImageScale = selectedObject?.scalePercent ?? imageScale;
  const selectedThumbnail = thumbnails[selectedPageNumber - 1];
  const selectedPageWidth = selectedThumbnail?.width ?? 612;
  const selectedPageHeight = selectedThumbnail?.height ?? 792;
  const contentReady = watermarkMode === "text"
    ? objects.some((object) => Boolean((object.text ?? watermarkText).trim()))
    : Boolean(watermarkImage);
  const watermarkedPageCount = loadedPdf
    ? Array.from({ length: Math.max(0, effectiveEnd - effectiveStart + 1) }, (_, index) => effectiveStart + index)
        .filter((pageNumber) => objectsForPage(objects, pageNumber).length > 0).length
    : 0;
  const watermarkReady = contentReady && watermarkedPageCount > 0;
  const activePageHasWatermark = loadedPdf
    ? objectsForPage(objects, selectedPageNumber).length > 0
    : false;

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    editScopeRef.current = editScope;
  }, [editScope]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

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

  useEffect(() => () => {
    for (const url of watermarkImageUrlsRef.current) URL.revokeObjectURL(url);
    watermarkImageUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function measureText() {
      try {
        const { PDFDocument, StandardFonts } = await import("pdf-lib");
        const document = await PDFDocument.create();
        const font = await document.embedFont(
          fontWeight === "bold" ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
        );
        const text = watermarkText.trim() || " ";
        font.encodeText(text);
        const ascent = Math.max(1, font.heightAtSize(fontSize, { descender: false }));
        const fullHeight = Math.max(ascent, font.heightAtSize(fontSize, { descender: true }));
        const descent = Math.max(0, fullHeight - ascent);
        const next = {
          width: Math.max(1, font.widthOfTextAtSize(text, fontSize)),
          ascent,
          descent,
          height: ascent + descent,
        };
        if (!cancelled) setTextMetrics(next);
      } catch {
        if (!cancelled) {
          const ascent = Math.max(8, fontSize * 0.72);
          const descent = Math.max(0, fontSize * 0.2);
          setTextMetrics({
            width: Math.max(fontSize, watermarkText.length * fontSize * 0.56),
            ascent,
            descent,
            height: ascent + descent,
          });
        }
      }
    }
    void measureText();
    return () => {
      cancelled = true;
    };
  }, [fontSize, fontWeight, watermarkText]);

  useEffect(() => {
    if (!loadedPdf) return;
    const currentPdf = loadedPdf;
    let cancelled = false;

    async function renderPreviews() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data: new Uint8Array(await currentPdf.file.arrayBuffer()) });
        const pdf = await task.promise;

        for (let pageIndex = 0; pageIndex < currentPdf.pageCount; pageIndex += 1) {
          if (cancelled || thumbnails[pageIndex] || thumbnailErrors[pageIndex]) continue;
          try {
            const page = await pdf.getPage(pageIndex + 1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({
              scale: Math.max(Math.min(1.15, 420 / Math.max(base.width, base.height)), 0.35),
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
              setThumbnails((current) => ({
                ...current,
                [pageIndex]: {
                  url: canvas.toDataURL("image/png"),
                  width: base.width,
                  height: base.height,
                },
              }));
            }
            page.cleanup();
          } catch {
            if (!cancelled) setThumbnailErrors((current) => ({ ...current, [pageIndex]: true }));
          }
        }
        await task.destroy();
      } catch {
        if (!cancelled) setMessage("Page previews could not be rendered, but watermarking may still work.");
      }
    }

    void renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [loadedPdf, thumbnailErrors, thumbnails]);

  function currentHistoryState(): WatermarkHistoryState {
    return {
      objects: objectsRef.current,
      selection: selectionRef.current,
      editScope: editScopeRef.current,
      watermarkMode,
      watermarkText,
      watermarkImage,
      imageScale,
      rangeMode,
      rangeStart,
      rangeEnd,
      fontSize,
      margin,
      fontWeight,
      watermarkColor,
      opacity,
      outputName,
    };
  }

  function applyHistoryState(snapshot: WatermarkHistoryState) {
    objectsRef.current = snapshot.objects;
    setObjects(snapshot.objects);
    const restoredSelection = snapshot.selection && snapshot.objects.some((object) => object.id === snapshot.selection?.objectId)
      ? snapshot.selection
      : null;
    selectionRef.current = restoredSelection;
    setSelection(restoredSelection);
    editScopeRef.current = snapshot.editScope;
    setEditScope(snapshot.editScope);
    setWatermarkMode(snapshot.watermarkMode);
    setWatermarkText(snapshot.watermarkText);
    setWatermarkImage(snapshot.watermarkImage);
    setImageScale(snapshot.imageScale);
    setRangeMode(snapshot.rangeMode);
    setRangeStart(snapshot.rangeStart);
    setRangeEnd(snapshot.rangeEnd);
    setFontSize(snapshot.fontSize);
    setMargin(snapshot.margin);
    setFontWeight(snapshot.fontWeight);
    setWatermarkColor(snapshot.watermarkColor);
    setOpacity(snapshot.opacity);
    setOutputName(snapshot.outputName);
    clearResult();
    setMessage("");
  }

  function checkpointObjects() {
    history.checkpoint(currentHistoryState());
  }

  function undoObjects() {
    history.undo(currentHistoryState(), applyHistoryState);
  }

  function redoObjects() {
    history.redo(currentHistoryState(), applyHistoryState);
  }

  function commitObjects(next: WatermarkInstance[]) {
    objectsRef.current = next;
    setObjects(next);
  }

  function selectWatermark(next: WatermarkSelection | null) {
    selectionRef.current = next;
    setSelection(next);
    if (next) setActivePageNumber(next.pageNumber);
  }

  function nextObjectId() {
    objectIdCounterRef.current += 1;
    return `watermark-${objectIdCounterRef.current}`;
  }

  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function clearWatermarkImage() {
    setWatermarkImage(null);
  }

  function resetFields() {
    clearResult();
    clearWatermarkImage();
    for (const url of watermarkImageUrlsRef.current) URL.revokeObjectURL(url);
    watermarkImageUrlsRef.current.clear();
    const initial = createInitialObject();
    objectIdCounterRef.current = 1;
    commitObjects([initial]);
    selectWatermark(null);
    setEditScope("all");
    editScopeRef.current = "all";
    setLoadedPdf(null);
    setOutputName("NovaPDF-watermarked");
    setWatermarkMode("text");
    setWatermarkText("CONFIDENTIAL");
    setImageScale(28);
    setRangeMode("all");
    setRangeStart(1);
    setRangeEnd(1);
    setFontSize(48);
    setMargin(36);
    setFontWeight("bold");
    setWatermarkColor("#64748b");
    setOpacity(0.28);
    setThumbnails({});
    setThumbnailErrors({});
    setMessage("");
    setStatus("idle");
    setSidebarOpen(false);
    setZoom(100);
    setWatermarkDragging(false);
    setInteractionGuides(null);
    setFocusedPageNumber(null);
    setActivePageNumber(1);
    draggedWatermarkRef.current = null;
    pendingAddPageRef.current = null;
    pendingAddScopeRef.current = null;
    pendingPlacementRef.current = null;
    clipboardRef.current = null;
    stageRefs.current.clear();
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
      const pageCount = document.getPageCount();
      if (pageCount < 1) throw new Error("empty PDF");
      if (pageCount > MAX_PAGES) {
        setStatus("error");
        setMessage(`This browser build supports up to ${MAX_PAGES} pages at a time.`);
        return;
      }

      const initial = createInitialObject();
      objectIdCounterRef.current = 1;
      commitObjects([initial]);
      selectWatermark(null);
      history.reset();
      pendingAddPageRef.current = null;
      pendingAddScopeRef.current = null;
      pendingPlacementRef.current = null;
      clipboardRef.current = null;
      setFocusedPageNumber(null);
      setActivePageNumber(1);
      setEditScope("all");
      editScopeRef.current = "all";
      setLoadedPdf({ file, pageCount });
      setRangeMode("all");
      setRangeStart(1);
      setRangeEnd(pageCount);
      setOutputName(`${cleanBaseName(file.name)}-watermarked`);
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
          ? "This PDF is password-protected. Unlock it before adding a watermark."
          : "This PDF is invalid, damaged, or unsupported.",
      );
    }
  }

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      resetFields();
      setWorkspaceStarted(true);
      const file = detail.files.find(isPdfFile);
      if (file) void loadPdf(file);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    // The transfer listener intentionally uses the current loader without re-subscribing on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadPdf(file);
    event.target.value = "";
  }

  async function onWatermarkImageInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      pendingAddPageRef.current = null;
      pendingAddScopeRef.current = null;
      return;
    }
    clearResult();
    setMessage("");
    try {
      const prepared = await prepareWatermarkImage(file);
      checkpointObjects();
      watermarkImageUrlsRef.current.add(prepared.previewUrl);
      const targetPage = clampInteger(
        pendingAddPageRef.current ?? focusedPageNumber ?? selectionRef.current?.pageNumber ?? activePageNumber ?? effectiveStart,
        effectiveStart,
        effectiveEnd,
      );
      const requestedScope = pendingAddScopeRef.current ?? editScopeRef.current;
      pendingAddPageRef.current = null;
      pendingAddScopeRef.current = null;
      clearWatermarkImage();
      setWatermarkImage(prepared);
      setWatermarkMode("image");
      let targetObjectId = setEditingScope(
        requestedScope,
        targetPage,
        selectionRef.current?.objectId ?? null,
        false,
      );
      if (!targetObjectId && loadedPdf) {
        targetObjectId = addWatermarkObject(targetPage, requestedScope, false);
      }
      const pendingPlacement = pendingPlacementRef.current;
      pendingPlacementRef.current = null;
      if (targetObjectId && pendingPlacement) {
        updateObject(targetObjectId, (object) => ({ ...object, placement: pendingPlacement, customPosition: null }));
        selectWatermark({ objectId: targetObjectId, pageNumber: targetPage });
      }
      setStatus("idle");
    } catch (error) {
      pendingAddPageRef.current = null;
      pendingAddScopeRef.current = null;
      pendingPlacementRef.current = null;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The watermark image could not be loaded.");
    }
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

  function updateSetting(callback: () => void) {
    checkpointObjects();
    clearResult();
    setMessage("");
    callback();
  }

  function updateScopedStyle(
    updater: (object: WatermarkInstance) => WatermarkInstance,
    updateSharedDefaults?: () => void,
  ) {
    if (!loadedPdf) return;
    checkpointObjects();
    clearResult();
    setMessage("");
    const pageNumber = pageForEditing(selectionRef.current?.pageNumber);
    let actionId = setEditingScope(
      editScopeRef.current,
      pageNumber,
      selectionRef.current?.objectId ?? null,
      false,
    );
    if (!actionId) actionId = addWatermarkObject(pageNumber, editScopeRef.current, false);
    if (!actionId) return;

    if (editScopeRef.current === "all") {
      updateSharedDefaults?.();
      commitObjects(objectsRef.current.map(updater));
    } else {
      updateObject(actionId, updater);
    }
    selectWatermark({ objectId: actionId, pageNumber });
  }

  function pageForEditing(pageOverride?: number) {
    if (!loadedPdf) return 1;
    return clampInteger(
      pageOverride ?? focusedPageNumber ?? selectionRef.current?.pageNumber ?? activePageNumber ?? effectiveStart,
      effectiveStart,
      effectiveEnd,
    );
  }

  function objectForScopeOnPage(pageNumber: number, scope: EditScope, preferredObjectId?: string | null) {
    const preferred = preferredObjectId
      ? objectsRef.current.find((object) => object.id === preferredObjectId) ?? null
      : null;
    if (scope === "all") {
      if (preferred?.scope === "all" && objectAppearsOnPage(preferred, pageNumber)) return preferred;
      return objectsRef.current.find((object) => object.scope === "all" && objectAppearsOnPage(object, pageNumber)) ?? null;
    }
    if (preferred?.scope === "page" && preferred.pageNumber === pageNumber) return preferred;
    return objectsRef.current.find((object) => object.scope === "page" && object.pageNumber === pageNumber) ?? null;
  }

  function setEditingScope(scope: EditScope, pageOverride?: number, preferredObjectId?: string | null, recordHistory = true) {
    if (!loadedPdf) {
      editScopeRef.current = scope;
      setEditScope(scope);
      return null;
    }

    const pageNumber = pageForEditing(pageOverride);
    const current = objectsRef.current;
    const preferred = preferredObjectId
      ? current.find((object) => object.id === preferredObjectId) ?? null
      : selectionRef.current
        ? current.find((object) => object.id === selectionRef.current?.objectId) ?? null
        : null;
    let next = current;
    let target = objectForScopeOnPage(pageNumber, scope, preferred?.id);
    let changed = scope !== editScopeRef.current;

    if (scope === "all") {
      if (!target) {
        const hiddenShared = current.find((object) => object.scope === "all") ?? null;
        if (hiddenShared) {
          const preferredPageObjectId = preferred?.scope === "page" && preferred.pageNumber === pageNumber
            ? preferred.id
            : null;
          next = current
            .filter((object) => object.id !== preferredPageObjectId)
            .map((object) => object.id === hiddenShared.id
              ? { ...object, hiddenPages: (object.hiddenPages ?? []).filter((page) => page !== pageNumber) }
              : object);
          target = next.find((object) => object.id === hiddenShared.id) ?? null;
          changed = true;
        } else if (preferred) {
          next = current
            .filter((object) => object.scope !== "page" || object.pageNumber !== pageNumber || object.id === preferred.id)
            .map((object) => object.id === preferred.id
              ? { ...object, scope: "all" as const, pageNumber: undefined, hiddenPages: [] }
              : object);
          target = next.find((object) => object.id === preferred.id) ?? null;
          changed = true;
        }
      }
    } else if (!target) {
      const source = preferred && objectAppearsOnPage(preferred, pageNumber)
        ? preferred
        : current.find((object) => object.scope === "all" && objectAppearsOnPage(object, pageNumber))
          ?? current.find((object) => object.scope === "all")
          ?? null;
      if (source) {
        const cloneId = nextObjectId();
        const clone: WatermarkInstance = {
          ...source,
          id: cloneId,
          scope: "page",
          pageNumber,
          hiddenPages: [],
          customPosition: source.customPosition ? { ...source.customPosition } : null,
          text: source.text ?? watermarkText,
        };
        next = current.map((object) => object.id === source.id && source.scope === "all"
          ? { ...object, hiddenPages: Array.from(new Set([...(object.hiddenPages ?? []), pageNumber])) }
          : object);
        next.push(clone);
        target = clone;
        changed = true;
      }
    }

    if (changed && recordHistory) checkpointObjects();
    if (next !== current) commitObjects(next);
    editScopeRef.current = scope;
    setEditScope(scope);
    const nextSelection = target ? { objectId: target.id, pageNumber } : null;
    selectWatermark(nextSelection);
    return target?.id ?? null;
  }

  function textForObject(object: WatermarkInstance) {
    return object.text ?? watermarkText;
  }

  function textMetricsForObject(object: WatermarkInstance): TextMetrics {
    const objectText = textForObject(object);
    const objectFontSize = object.fontSize ?? fontSize;
    const objectFontWeight = object.fontWeight ?? fontWeight;
    const sourceLength = Math.max(1, watermarkText.length);
    const targetLength = Math.max(1, objectText.length);
    const sizeRatio = objectFontSize / Math.max(1, fontSize);
    const weightRatio = objectFontWeight === fontWeight ? 1 : objectFontWeight === "bold" ? 1.035 : 0.97;
    return {
      width: Math.max(objectFontSize, textMetrics.width * targetLength / sourceLength * sizeRatio * weightRatio),
      ascent: Math.max(1, textMetrics.ascent * sizeRatio),
      descent: Math.max(0, textMetrics.descent * sizeRatio),
      height: Math.max(1, textMetrics.height * sizeRatio),
    };
  }

  function previewGeometry(
    object: WatermarkInstance,
    pageWidth: number,
    pageHeight: number,
  ) {
    const objectTextMetrics = textMetricsForObject(object);
    const objectSize = getPreviewObjectSize(
      watermarkMode,
      pageWidth,
      pageHeight,
      objectTextMetrics,
      watermarkImage,
      object.scalePercent ?? imageScale,
    );
    const box = rotatedBox(objectSize.width, objectSize.height, object.rotation);
    const pdfCenter = getPlacementCenter(
      object.placement,
      pageWidth,
      pageHeight,
      box.width,
      box.height,
      object.margin ?? margin,
      object.customPosition,
    );
    return {
      objectSize,
      box,
      textMetrics: objectTextMetrics,
      center: { x: pdfCenter.x, y: pageHeight - pdfCenter.y },
    };
  }

  function updateObject(objectId: string, updater: (object: WatermarkInstance) => WatermarkInstance) {
    const next = objectsRef.current.map((object) => object.id === objectId ? updater(object) : object);
    commitObjects(next);
  }

  function addWatermarkObject(
    pageOverride?: number,
    forcedScope?: EditScope,
    recordHistory = true,
  ) {
    if (!loadedPdf) return null;
    const pageNumber = clampInteger(
      pageOverride ?? focusedPageNumber ?? selectionRef.current?.pageNumber ?? activePageNumber ?? effectiveStart,
      effectiveStart,
      effectiveEnd,
    );
    if (recordHistory) checkpointObjects();
    const objectId = nextObjectId();
    const source = selectionRef.current
      ? objectsRef.current.find((object) => object.id === selectionRef.current?.objectId) ?? null
      : null;
    const scope = forcedScope ?? editScopeRef.current;
    const next: WatermarkInstance = {
      id: objectId,
      scope: scope === "page" ? "page" : "all",
      pageNumber: scope === "page" ? pageNumber : undefined,
      placement: source?.placement ?? "center",
      customPosition: source?.customPosition ? { ...source.customPosition } : null,
      rotation: source?.rotation ?? -45,
      hiddenPages: [],
      text: source?.text ?? watermarkText,
      fontSize: source?.fontSize ?? fontSize,
      fontWeight: source?.fontWeight ?? fontWeight,
      color: source?.color ?? watermarkColor,
      opacity: source?.opacity ?? opacity,
      margin: source?.margin ?? margin,
      scalePercent: source?.scalePercent ?? imageScale,
    };
    commitObjects([...objectsRef.current, next]);
    selectWatermark({ objectId, pageNumber });
    clearResult();
    setMessage("");
    window.requestAnimationFrame(() => stageRefs.current.get(pageNumber)?.focus({ preventScroll: true }));
    return objectId;
  }

  function requestAddWatermark(pageNumber: number, requestedScope: EditScope = editScopeRef.current) {
    if (watermarkMode === "image" && !watermarkImage) {
      pendingAddPageRef.current = pageNumber;
      pendingAddScopeRef.current = requestedScope;
      watermarkImageInputRef.current?.click();
      return;
    }
    addWatermarkObject(pageNumber, requestedScope);
  }

  function selectPlacement(nextPlacement: WatermarkPlacement) {
    if (!loadedPdf) return;
    const pageNumber = pageForEditing();
    if (watermarkMode === "image" && !watermarkImage) {
      pendingAddPageRef.current = pageNumber;
      pendingAddScopeRef.current = editScopeRef.current;
      pendingPlacementRef.current = nextPlacement;
      watermarkImageInputRef.current?.click();
      return;
    }

    updateScopedStyle((item) => ({ ...item, placement: nextPlacement, customPosition: null }));
  }

  function setSelectedRotation(value: number) {
    updateScopedStyle((object) => ({ ...object, rotation: normalizeObjectRotation(value) }));
  }

  function resetSelectedPosition() {
    updateScopedStyle((object) => ({ ...object, customPosition: null }));
  }

  function beginWatermarkDrag(
    event: ReactPointerEvent<SVGElement>,
    object: WatermarkInstance,
    pageNumber: number,
    pageWidth: number,
    pageHeight: number,
  ) {
    event.preventDefault();
    event.stopPropagation();
    clearResult();
    setMessage("");
    const scopedObjectId = setEditingScope(editScopeRef.current, pageNumber, object.id);
    const selectedObjectId = scopedObjectId ?? object.id;

    if (focusedPageNumber !== pageNumber) {
      selectWatermark({ objectId: selectedObjectId, pageNumber });
      setFocusedPageNumber(pageNumber);
      window.requestAnimationFrame(() => stageRefs.current.get(pageNumber)?.focus({ preventScroll: true }));
      return;
    }

    checkpointObjects();
    const svg = event.currentTarget.ownerSVGElement;
    svg?.focus({ preventScroll: true });
    svg?.setPointerCapture(event.pointerId);
    const actionId = selectedObjectId;
    selectWatermark({ objectId: actionId, pageNumber });
    const activeObject = objectsRef.current.find((item) => item.id === actionId) ?? object;
    const geometry = previewGeometry(activeObject, pageWidth, pageHeight);
    const matrix = svg?.getScreenCTM();
    let pointerX = geometry.center.x;
    let pointerY = geometry.center.y;
    if (svg && matrix) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(matrix.inverse());
      pointerX = local.x;
      pointerY = local.y;
    }
    draggedWatermarkRef.current = {
      pointerId: event.pointerId,
      objectId: actionId,
      pageNumber,
      offsetX: pointerX / pageWidth - geometry.center.x / pageWidth,
      offsetY: pointerY / pageHeight - geometry.center.y / pageHeight,
    };
    setInteractionGuides({
      pageNumber,
      box: {
        x: geometry.center.x / pageWidth,
        y: geometry.center.y / pageHeight,
        width: geometry.box.width / pageWidth,
        height: geometry.box.height / pageHeight,
      },
      guideX: null,
      guideY: null,
      mode: "move",
    });
    setWatermarkDragging(true);
  }

  function updateCustomPosition(
    event: ReactPointerEvent<SVGSVGElement>,
    pageWidth: number,
    pageHeight: number,
  ) {
    const dragged = draggedWatermarkRef.current;
    if (!dragged || dragged.pointerId !== event.pointerId) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = event.currentTarget.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    const activeObject = objectsRef.current.find((item) => item.id === dragged.objectId);
    if (!activeObject) return;
    const geometry = previewGeometry(activeObject, pageWidth, pageHeight);
    let box = {
      x: clampNumber(local.x / pageWidth - dragged.offsetX, 0, 1),
      y: clampNumber(local.y / pageHeight - dragged.offsetY, 0, 1),
      width: geometry.box.width / pageWidth,
      height: geometry.box.height / pageHeight,
    };
    let guideX: number | null = null;
    let guideY: number | null = null;
    if (snapEnabled) {
      const peers = objectsRef.current
        .filter((item) => item.id !== dragged.objectId && objectAppearsOnPage(item, dragged.pageNumber))
        .map((item) => {
          const peerGeometry = previewGeometry(item, pageWidth, pageHeight);
          return {
            x: peerGeometry.center.x / pageWidth,
            y: peerGeometry.center.y / pageHeight,
            width: peerGeometry.box.width / pageWidth,
            height: peerGeometry.box.height / pageHeight,
          };
        });
      const snapped = snapNormalizedBox(box, peers);
      box = snapped.box;
      guideX = snapped.guideX;
      guideY = snapped.guideY;
    }
    const customPosition = { x: box.x, y: box.y };
    setInteractionGuides({ pageNumber: dragged.pageNumber, box, guideX, guideY, mode: "move" });
    updateObject(dragged.objectId, (object) => ({ ...object, customPosition }));
  }

  function finishWatermarkDrag(event: ReactPointerEvent<SVGSVGElement>) {
    const dragged = draggedWatermarkRef.current;
    if (!dragged || dragged.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    draggedWatermarkRef.current = null;
    setInteractionGuides(null);
    setWatermarkDragging(false);
  }

  function moveSelectedByPoints(pageNumber: number, pageWidth: number, pageHeight: number, dx: number, dy: number) {
    const currentSelection = selectionRef.current;
    if (!currentSelection || currentSelection.pageNumber !== pageNumber) return;
    checkpointObjects();
    clearResult();
    setMessage("");
    const actionId = setEditingScope(editScopeRef.current, pageNumber, currentSelection.objectId, false);
    if (!actionId) return;
    const object = objectsRef.current.find((item) => item.id === actionId);
    if (!object) return;
    const geometry = previewGeometry(object, pageWidth, pageHeight);
    const nextPosition = {
      x: clampNumber(geometry.center.x / pageWidth + dx / pageWidth, 0, 1),
      y: clampNumber(geometry.center.y / pageHeight + dy / pageHeight, 0, 1),
    };
    updateObject(actionId, (item) => ({ ...item, customPosition: nextPosition }));
    selectWatermark({ objectId: actionId, pageNumber });
  }

  function rotateSelected(pageNumber: number, amount = 15) {
    const currentSelection = selectionRef.current;
    if (!currentSelection || currentSelection.pageNumber !== pageNumber) return;
    checkpointObjects();
    clearResult();
    setMessage("");
    const actionId = setEditingScope(editScopeRef.current, pageNumber, currentSelection.objectId, false);
    if (!actionId) return;
    updateObject(actionId, (object) => ({
      ...object,
      rotation: normalizeObjectRotation(object.rotation + amount),
    }));
    selectWatermark({ objectId: actionId, pageNumber });
  }

  function duplicateSelected(pageNumber: number, pageWidth: number, pageHeight: number) {
    const currentSelection = selectionRef.current;
    if (!currentSelection || currentSelection.pageNumber !== pageNumber) return;
    checkpointObjects();
    clearResult();
    setMessage("");
    const sourceId = setEditingScope(editScopeRef.current, pageNumber, currentSelection.objectId, false);
    const source = sourceId ? objectsRef.current.find((object) => object.id === sourceId) ?? null : null;
    if (!source) return;
    const geometry = previewGeometry(source, pageWidth, pageHeight);
    const duplicateId = nextObjectId();
    const pageOnly = editScopeRef.current === "page" || source.scope === "page";
    const duplicate: WatermarkInstance = {
      ...source,
      id: duplicateId,
      scope: pageOnly ? "page" : "all",
      pageNumber: pageOnly ? pageNumber : undefined,
      hiddenPages: [],
      customPosition: {
        x: clampNumber(geometry.center.x / pageWidth + 0.035, 0, 1),
        y: clampNumber(geometry.center.y / pageHeight + 0.035, 0, 1),
      },
    };
    commitObjects([...objectsRef.current, duplicate]);
    selectWatermark({ objectId: duplicateId, pageNumber });
    stageRefs.current.get(pageNumber)?.focus({ preventScroll: true });
  }

  function deleteSelected(pageNumber: number) {
    const currentSelection = selectionRef.current;
    if (!currentSelection || currentSelection.pageNumber !== pageNumber) return;
    checkpointObjects();
    clearResult();
    setMessage("");
    const sourceId = setEditingScope(editScopeRef.current, pageNumber, currentSelection.objectId, false);
    const source = sourceId ? objectsRef.current.find((object) => object.id === sourceId) ?? null : null;
    if (!source) return;

    let next: WatermarkInstance[];
    if (editScopeRef.current === "page" && source.scope === "all") {
      next = objectsRef.current.map((object) =>
        object.id === source.id
          ? { ...object, hiddenPages: Array.from(new Set([...(object.hiddenPages ?? []), pageNumber])) }
          : object,
      );
    } else {
      next = objectsRef.current.filter((object) => object.id !== source.id);
    }
    commitObjects(next);
    const fallback = objectsForPage(next, pageNumber)[0];
    selectWatermark(fallback ? { objectId: fallback.id, pageNumber } : null);
  }

  function copySelected() {
    const currentSelection = selectionRef.current;
    if (!currentSelection) return false;
    const source = objectsRef.current.find((object) => object.id === currentSelection.objectId);
    if (!source) return false;
    clipboardRef.current = {
      ...source,
      hiddenPages: [...(source.hiddenPages ?? [])],
      customPosition: source.customPosition ? { ...source.customPosition } : null,
    };
    return true;
  }

  function pasteWatermark(pageNumber: number, pageWidth: number, pageHeight: number) {
    const source = clipboardRef.current;
    if (!source) return;
    checkpointObjects();
    const geometry = previewGeometry(source, pageWidth, pageHeight);
    const objectId = nextObjectId();
    const pageOnly = editScopeRef.current === "page" || source.scope === "page";
    const next: WatermarkInstance = {
      ...source,
      id: objectId,
      scope: pageOnly ? "page" : "all",
      pageNumber: pageOnly ? pageNumber : undefined,
      hiddenPages: [],
      customPosition: {
        x: clampNumber(geometry.center.x / pageWidth + 0.035, 0, 1),
        y: clampNumber(geometry.center.y / pageHeight + 0.035, 0, 1),
      },
    };
    commitObjects([...objectsRef.current, next]);
    selectWatermark({ objectId, pageNumber });
    clearResult();
    setMessage("");
  }

  function changeWatermarkText(nextText: string) {
    checkpointObjects();
    clearResult();
    setMessage("");

    if (editScopeRef.current === "page") {
      const pageNumber = pageForEditing(selectionRef.current?.pageNumber);
      let objectId = setEditingScope("page", pageNumber, selectionRef.current?.objectId ?? null, false);
      if (!objectId) objectId = addWatermarkObject(pageNumber, "page", false);
      if (!objectId) return;
      updateObject(objectId, (object) => ({ ...object, text: nextText }));
      selectWatermark({ objectId, pageNumber });
      return;
    }

    setWatermarkText(nextText);
    commitObjects(objectsRef.current.map((object) => ({ ...object, text: nextText })));
  }

  function focusTextEditor(pageNumber: number) {
    setActivePageNumber(pageNumber);
    setSidebarOpen(true);
    if (watermarkMode !== "text") updateSetting(() => setWatermarkMode("text"));
    setEditingScope(editScopeRef.current, pageNumber, selectionRef.current?.objectId ?? null);
    window.requestAnimationFrame(() => {
      watermarkTextRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      watermarkTextRef.current?.focus({ preventScroll: true });
      watermarkTextRef.current?.select();
    });
  }

  function closeFocusedPage() {
    setFocusedPageNumber(null);
    draggedWatermarkRef.current = null;
    setWatermarkDragging(false);
  }

  function focusPage(pageNumber: number) {
    if (!loadedPdf) return;
    const nextPage = clampInteger(pageNumber, 1, loadedPdf.pageCount);
    setActivePageNumber(nextPage);
    const fallback = objectForScopeOnPage(nextPage, editScopeRef.current)
      ?? objectsForPage(objectsRef.current, nextPage)[0];
    setFocusedPageNumber(nextPage);
    selectWatermark(fallback ? { objectId: fallback.id, pageNumber: nextPage } : null);
    window.requestAnimationFrame(() => stageRefs.current.get(nextPage)?.focus({ preventScroll: true }));
  }

  function handleStageKeyDown(
    event: ReactKeyboardEvent<SVGSVGElement> | KeyboardEvent,
    pageNumber: number,
    pageWidth: number,
    pageHeight: number,
  ) {
    const currentSelection = selectionRef.current;
    if (!currentSelection || currentSelection.pageNumber !== pageNumber) return;
    const step = event.shiftKey ? 12 : 4;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelectedByPoints(pageNumber, pageWidth, pageHeight, -step, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSelectedByPoints(pageNumber, pageWidth, pageHeight, step, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelectedByPoints(pageNumber, pageWidth, pageHeight, 0, -step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelectedByPoints(pageNumber, pageWidth, pageHeight, 0, step);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteSelected(pageNumber);
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelected(pageNumber, pageWidth, pageHeight);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (focusedPageNumber !== null) closeFocusedPage();
      else selectWatermark(null);
    }
  }

  const handleDocumentKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!loadedPdf || event.defaultPrevented) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return;

    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redoObjects();
      else undoObjects();
      return;
    }
    if (modifier && key === "y") {
      event.preventDefault();
      redoObjects();
      return;
    }
    if (modifier && key === "o") {
      event.preventDefault();
      inputRef.current?.click();
      return;
    }
    if (modifier && key === "s") {
      event.preventDefault();
      if (watermarkReady && status !== "processing") processButtonRef.current?.click();
      return;
    }
    if (modifier && (key === "0" || event.code === "Numpad0")) {
      event.preventDefault();
      setZoom(100);
      return;
    }
    if (modifier && (key === "+" || key === "=")) {
      event.preventDefault();
      setZoom((value) => Math.min(200, value + 10));
      return;
    }
    if (modifier && key === "-") {
      event.preventDefault();
      setZoom((value) => Math.max(50, value - 10));
      return;
    }

    const currentSelection = selectionRef.current;
    const pageNumber = currentSelection?.pageNumber ?? focusedPageNumber ?? effectiveStart;
    const thumbnail = thumbnails[pageNumber - 1];
    const pageWidth = thumbnail?.width ?? 612;
    const pageHeight = thumbnail?.height ?? 792;

    if (modifier && key === "a") {
      event.preventDefault();
      setEditingScope("all", pageNumber, currentSelection?.objectId ?? null);
      return;
    }
    if (modifier && key === "c") {
      if (currentSelection) {
        event.preventDefault();
        copySelected();
      }
      return;
    }
    if (modifier && key === "x") {
      if (currentSelection) {
        event.preventDefault();
        if (copySelected()) deleteSelected(pageNumber);
      }
      return;
    }
    if (modifier && key === "v") {
      if (clipboardRef.current) {
        event.preventDefault();
        pasteWatermark(pageNumber, pageWidth, pageHeight);
      }
      return;
    }
    if (modifier && key === "d") {
      if (currentSelection) {
        event.preventDefault();
        duplicateSelected(pageNumber, pageWidth, pageHeight);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (focusedPageNumber !== null) closeFocusedPage();
      else selectWatermark(null);
      return;
    }
    if (!currentSelection) return;
    handleStageKeyDown(event, pageNumber, pageWidth, pageHeight);
  });

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [editorOpen, isActive]);

  async function createWatermarkedPdf() {
    if (!loadedPdf) {
      setStatus("error");
      setMessage("Choose a PDF first.");
      return;
    }
    if (!contentReady) {
      setStatus("error");
      setMessage(watermarkMode === "text" ? "Enter watermark text before processing." : "Choose a watermark image before processing.");
      return;
    }
    if (!watermarkedPageCount) {
      setStatus("error");
      setMessage("Add at least one watermark object before processing.");
      return;
    }

    clearResult();
    setStatus("processing");
    setMessage("");
    setProgress(10);

    try {
      const sourceBytes = await loadedPdf.file.arrayBuffer();
      const shared = {
        opacity,
        margin,
        rangeStart: effectiveStart,
        rangeEnd: effectiveEnd,
        instances: objects,
      };
      const generated = watermarkMode === "text"
        ? await applyTextWatermark(sourceBytes, {
            ...shared,
            text: watermarkText,
            fontSize,
            fontWeight,
            color: watermarkColor,
          })
        : await applyImageWatermark(sourceBytes, {
            ...shared,
            imageBytes: await watermarkImage!.file.arrayBuffer(),
            imageType: watermarkImage!.imageType,
            scalePercent: imageScale,
          });
      setProgress(92);
      const name = `${cleanBaseName(outputName)}.pdf`;
      const outputBytes = new Uint8Array(generated.bytes.length);
      outputBytes.set(generated.bytes);
      const file = new File([outputBytes], name, { type: "application/pdf" });
      const blob = new Blob([outputBytes], { type: "application/pdf" });
      setResult({
        url: URL.createObjectURL(blob),
        name,
        size: blob.size,
        file,
        watermarkedPageCount: generated.watermarkedPageCount,
      });
      setProgress(100);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : "Watermarking failed.");
    }
  }

  function switchTool(tool: PdfTool) {
    if (loadedPdf) transferWorkspaceFiles(tool, [result?.file ?? loadedPdf.file]);
    onToolChange(tool);
  }

  const downloads: WorkspaceDownload[] = useMemo(
    () => result ? [{
      url: result.url,
      name: result.name,
      detail: `${result.watermarkedPageCount} watermarked page${result.watermarkedPageCount === 1 ? "" : "s"} · ${formatBytes(result.size)}`,
      label: "Download watermarked PDF",
    }] : [],
    [result],
  );

  if (editorOpen) {
    const cardWidth = Math.max(9, 12.5 * zoom / 100);
    const previewHeight = Math.max(11.5, 16 * zoom / 100);
    const zoomStyle = {
      "--split-card-width": `${cardWidth}rem`,
      "--split-preview-height": `${previewHeight}rem`,
    } as CSSProperties;
    const selectedCustomPosition = selectedObject?.customPosition ?? null;
    const selectedPlacement = selectedObject?.placement ?? "center";
    const selectedRotation = selectedObject?.rotation ?? -45;

    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onFileInput} />
        <input ref={watermarkImageInputRef} type="file" className="sr-only" accept={IMAGE_ACCEPT} onChange={onWatermarkImageInput} />
        <header className="organize-editor-header">
          <button type="button" className="workspace-header-start-over" onClick={startOver} aria-label="Start over">
            <RotateCcw className="size-5" />
          </button>
          <h1 className="workspace-header-title">{activeTool.name}</h1>
        </header>

        <div className="organize-editor-body">
          <WorkspaceToolRail
            activeTool={activeTool}
            onToolChange={switchTool}
            onExitWorkspace={goHome}
            onOpenControls={() => setSidebarOpen((value) => !value)}
          />

          <main className="organize-canvas-area">
            {!loadedPdf ? (
              <div className="workspace-empty-canvas">
                <div
                  className={`workspace-empty-upload ${dragging ? "workspace-empty-upload-active" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  <span><CloudUpload className="size-8" /></span>
                  <strong>Upload a PDF to watermark</strong>
                  <p>Add a text or image watermark while keeping the source PDF intact.</p>
                  <em>Choose a PDF</em>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar">
                  <div className="flex items-center gap-2">
                    {focusedPageNumber !== null ? (
                      <>
                        <button type="button" className="watermark-grid-return" onClick={closeFocusedPage}>
                          <Grid2X2 className="size-4" /> Back to grid
                        </button>
                        <button type="button" className="watermark-focus-nav" onClick={() => focusPage(focusedPageNumber - 1)} disabled={focusedPageNumber <= 1} aria-label="Previous page">
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="split-editor-mode-label">Page {focusedPageNumber} editing</span>
                        <button type="button" className="watermark-focus-nav" onClick={() => focusPage(focusedPageNumber + 1)} disabled={focusedPageNumber >= loadedPdf.pageCount} aria-label="Next page">
                          <ChevronRight className="size-4" />
                        </button>
                      </>
                    ) : (
                      <span className="split-editor-mode-label">
                        {watermarkedPageCount} of {loadedPdf.pageCount} pages watermarked
                      </span>
                    )}
                  </div>
                  <WorkspaceZoomControls
                    active={isActive}
                    value={zoom}
                    onChange={setZoom}
                    canUndo={history.canUndo}
                    canRedo={history.canRedo}
                    onUndo={undoObjects}
                    onRedo={redoObjects}
                    currentPage={selectedPageNumber}
                    pageCount={loadedPdf.pageCount}
                    onPageChange={focusPage}
                  />
                </div>

                <div
                  className={`organize-pages-scroll ${focusedPageNumber !== null ? "watermark-focus-scroll" : ""}`}
                  style={zoomStyle}
                  onPointerDown={(event) => {
                    if (focusedPageNumber !== null && event.currentTarget === event.target) closeFocusedPage();
                  }}
                >
                  <div
                    className={`split-editor-grid ${focusedPageNumber !== null ? "watermark-editor-grid-focused" : ""}`}
                    onPointerDown={(event) => {
                      if (focusedPageNumber !== null && event.currentTarget === event.target) closeFocusedPage();
                    }}
                  >
                    {Array.from({ length: loadedPdf.pageCount }, (_, pageIndex) => {
                      const pageNumber = pageIndex + 1;
                      if (focusedPageNumber !== null && focusedPageNumber !== pageNumber) return null;
                      const inRange = pageNumber >= effectiveStart && pageNumber <= effectiveEnd;
                      const thumbnail = thumbnails[pageIndex];
                      const pageWidth = thumbnail?.width ?? 612;
                      const pageHeight = thumbnail?.height ?? 792;
                      const pageObjects = inRange && contentReady ? objectsForPage(objects, pageNumber) : [];
                      return (
                        <div
                          key={pageIndex}
                          data-novapdf-view-page={pageNumber}
                          className={`split-editor-page watermark-editor-page ${pageObjects.length ? "watermark-editor-page-active" : ""} ${focusedPageNumber === pageNumber ? "watermark-editor-page-focused" : ""}`}
                          onPointerDown={(event) => {
                            setActivePageNumber(pageNumber);
                            if (event.currentTarget === event.target) selectWatermark(null);
                          }}
                        >
                          <span className="split-editor-preview watermark-preview-surface">
                            {thumbnail ? (
                              <svg
                                ref={(element) => {
                                  if (element) stageRefs.current.set(pageNumber, element);
                                  else stageRefs.current.delete(pageNumber);
                                }}
                                className={`watermark-page-stage ${watermarkDragging ? "watermark-page-stage-dragging" : ""}`}
                                viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                                preserveAspectRatio="xMidYMid meet"
                                role="img"
                                tabIndex={0}
                                aria-label={`Preview of page ${pageNumber}. Select a watermark and use arrow keys to move it.`}
                                onPointerMove={(event) => updateCustomPosition(event, pageWidth, pageHeight)}
                                onPointerUp={finishWatermarkDrag}
                                onPointerCancel={finishWatermarkDrag}
                                onPointerDown={(event) => {
                                  setActivePageNumber(pageNumber);
                                  if (event.currentTarget === event.target) selectWatermark(null);
                                }}
                              >
                                <image href={thumbnail.url} x="0" y="0" width={pageWidth} height={pageHeight} preserveAspectRatio="none" />
                                {interactionGuides?.pageNumber === pageNumber && (
                                  <WorkspaceInteractionOverlay pageWidth={pageWidth} pageHeight={pageHeight} state={interactionGuides} />
                                )}
                                {pageObjects.map((object) => {
                                  const geometry = previewGeometry(object, pageWidth, pageHeight);
                                  const isSelected = selection?.objectId === object.id
                                    && (editScope === "all" && object.scope === "all"
                                      ? objectAppearsOnPage(object, pageNumber)
                                      : selection.pageNumber === pageNumber);
                                  const outlinePadding = Math.max(3, Math.min(pageWidth, pageHeight) * 0.008);
                                  const toolbarHeight = Math.max(28, Math.min(pageWidth, pageHeight) * 0.055);
                                  const toolbarWidth = toolbarHeight * (watermarkMode === "text" ? 4.2 : 3.15);
                                  const toolbarX = clampNumber(geometry.center.x - toolbarWidth / 2, 2, Math.max(2, pageWidth - toolbarWidth - 2));
                                  const toolbarY = clampNumber(
                                    geometry.center.y - geometry.box.height / 2 - toolbarHeight - 5,
                                    2,
                                    Math.max(2, pageHeight - toolbarHeight - 2),
                                  );
                                  return (
                                    <g key={object.id}>
                                      <g transform={`rotate(${-object.rotation} ${geometry.center.x} ${geometry.center.y})`}>
                                        {isSelected && (
                                          <rect
                                            className="watermark-selection-outline"
                                            x={geometry.center.x - geometry.objectSize.width / 2 - outlinePadding}
                                            y={geometry.center.y - geometry.objectSize.height / 2 - outlinePadding}
                                            width={geometry.objectSize.width + outlinePadding * 2}
                                            height={geometry.objectSize.height + outlinePadding * 2}
                                            rx={outlinePadding}
                                          />
                                        )}
                                        {watermarkMode === "text" ? (
                                          <text
                                            className="watermark-svg-object watermark-svg-text"
                                            x={geometry.center.x - geometry.objectSize.width / 2}
                                            y={geometry.center.y + (geometry.textMetrics.ascent - geometry.textMetrics.descent) / 2}
                                            fill={object.color ?? watermarkColor}
                                            fillOpacity={object.opacity ?? opacity}
                                            fontFamily="Helvetica, Arial, sans-serif"
                                            fontSize={object.fontSize ?? fontSize}
                                            fontWeight={(object.fontWeight ?? fontWeight) === "bold" ? 700 : 400}
                                            textLength={geometry.objectSize.width}
                                            lengthAdjust="spacingAndGlyphs"
                                          >
                                            {textForObject(object)}
                                          </text>
                                        ) : watermarkImage ? (
                                          <image
                                            className="watermark-svg-object watermark-svg-image"
                                            href={watermarkImage.previewUrl}
                                            x={geometry.center.x - geometry.objectSize.width / 2}
                                            y={geometry.center.y - geometry.objectSize.height / 2}
                                            width={geometry.objectSize.width}
                                            height={geometry.objectSize.height}
                                            opacity={object.opacity ?? opacity}
                                            preserveAspectRatio="xMidYMid meet"
                                          />
                                        ) : null}
                                        <rect
                                          className="watermark-object-hitbox"
                                          x={geometry.center.x - geometry.objectSize.width / 2 - outlinePadding}
                                          y={geometry.center.y - geometry.objectSize.height / 2 - outlinePadding}
                                          width={geometry.objectSize.width + outlinePadding * 2}
                                          height={geometry.objectSize.height + outlinePadding * 2}
                                          rx={outlinePadding}
                                          aria-label={`Select and drag watermark on page ${pageNumber}`}
                                          onPointerDown={(event) => beginWatermarkDrag(event, object, pageNumber, pageWidth, pageHeight)}
                                        />
                                      </g>
                                      {isSelected && focusedPageNumber === pageNumber && (
                                        <g
                                          className="watermark-svg-toolbar"
                                          transform={`translate(${toolbarX} ${toolbarY})`}
                                          aria-label="Watermark actions"
                                        >
                                          <rect
                                            className="watermark-svg-toolbar-shell"
                                            x="0"
                                            y="0"
                                            width={toolbarWidth}
                                            height={toolbarHeight}
                                            rx={toolbarHeight * 0.18}
                                          />
                                          {watermarkMode === "text" && (
                                            <g
                                              className="watermark-svg-toolbar-button"
                                              role="button"
                                              tabIndex={0}
                                              aria-label="Edit watermark text"
                                              onPointerDown={(event) => event.stopPropagation()}
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                focusTextEditor(pageNumber);
                                              }}
                                              onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                  event.preventDefault();
                                                  focusTextEditor(pageNumber);
                                                }
                                              }}
                                            >
                                              <rect x="3" y="3" width={toolbarHeight - 6} height={toolbarHeight - 6} rx={toolbarHeight * 0.14} />
                                              <svg x={toolbarHeight * 0.22} y={toolbarHeight * 0.22} width={toolbarHeight * 0.56} height={toolbarHeight * 0.56} viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                              </svg>
                                            </g>
                                          )}
                                          <g
                                            className="watermark-svg-toolbar-button"
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Rotate watermark 15 degrees"
                                            transform={`translate(${toolbarHeight * (watermarkMode === "text" ? 1.05 : 0)} 0)`}
                                            onPointerDown={(event) => event.stopPropagation()}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              rotateSelected(pageNumber);
                                            }}
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                rotateSelected(pageNumber);
                                              }
                                            }}
                                          >
                                            <rect x="3" y="3" width={toolbarHeight - 6} height={toolbarHeight - 6} rx={toolbarHeight * 0.14} />
                                            <svg x={toolbarHeight * 0.22} y={toolbarHeight * 0.22} width={toolbarHeight * 0.56} height={toolbarHeight * 0.56} viewBox="0 0 24 24" aria-hidden="true">
                                              <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
                                              <path d="M21 3v5h-5" />
                                            </svg>
                                          </g>
                                          <g
                                            className="watermark-svg-toolbar-button"
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Duplicate watermark"
                                            transform={`translate(${toolbarHeight * (watermarkMode === "text" ? 2.1 : 1.05)} 0)`}
                                            onPointerDown={(event) => event.stopPropagation()}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              duplicateSelected(pageNumber, pageWidth, pageHeight);
                                            }}
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                duplicateSelected(pageNumber, pageWidth, pageHeight);
                                              }
                                            }}
                                          >
                                            <rect x="3" y="3" width={toolbarHeight - 6} height={toolbarHeight - 6} rx={toolbarHeight * 0.14} />
                                            <svg x={toolbarHeight * 0.22} y={toolbarHeight * 0.22} width={toolbarHeight * 0.56} height={toolbarHeight * 0.56} viewBox="0 0 24 24" aria-hidden="true">
                                              <rect width="13" height="13" x="9" y="9" rx="2" />
                                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                          </g>
                                          <g
                                            className="watermark-svg-toolbar-button danger"
                                            role="button"
                                            tabIndex={0}
                                            aria-label={editScope === "page" && object.scope === "all" ? "Remove watermark from this page" : "Delete watermark"}
                                            transform={`translate(${toolbarHeight * (watermarkMode === "text" ? 3.15 : 2.1)} 0)`}
                                            onPointerDown={(event) => event.stopPropagation()}
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              deleteSelected(pageNumber);
                                            }}
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                deleteSelected(pageNumber);
                                              }
                                            }}
                                          >
                                            <rect x="3" y="3" width={toolbarHeight - 6} height={toolbarHeight - 6} rx={toolbarHeight * 0.14} />
                                            <svg x={toolbarHeight * 0.22} y={toolbarHeight * 0.22} width={toolbarHeight * 0.56} height={toolbarHeight * 0.56} viewBox="0 0 24 24" aria-hidden="true">
                                              <path d="M3 6h18" />
                                              <path d="M19 6l-1 14H6L5 6" />
                                              <path d="M8 6V4h8v2" />
                                              <path d="M10 11v5M14 11v5" />
                                            </svg>
                                          </g>
                                        </g>
                                      )}
                                    </g>
                                  );
                                })}
                              </svg>
                            ) : thumbnailErrors[pageIndex] ? (
                              <span><FileText className="size-7" /> Preview unavailable</span>
                            ) : (
                              <span><LoaderCircle className="size-6 animate-spin" /> Rendering page…</span>
                            )}
                            {inRange && pageObjects.length === 0 && (
                              <button
                                type="button"
                                className={`watermark-empty-page-action ${focusedPageNumber === pageNumber ? "" : "watermark-empty-page-action-grid"}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  requestAddWatermark(pageNumber, editScopeRef.current);
                                }}
                              >
                                <Plus className="size-5" /> Add {watermarkMode === "text" ? "text" : "image"} watermark
                              </button>
                            )}
                          </span>
                          <span className="split-editor-page-number">Page {pageNumber}</span>
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
                <div className="organize-side-section">
                  <div className="split-editor-info">Use the upload box in the middle to choose one PDF.</div>
                </div>
              ) : (
                <>
                  <div className="organize-side-section">
                    <div className="organize-source-row">
                      <span className="organize-source-letter">A</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-extrabold text-slate-700">{loadedPdf.file.name}</p>
                        <p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">
                          {loadedPdf.pageCount} pages · {formatBytes(loadedPdf.file.size)}
                        </p>
                      </div>
                      <button type="button" onClick={() => inputRef.current?.click()} aria-label="Replace PDF">
                        <Replace className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Watermark type</h3></div>
                    <div className="jpg-option-grid">
                      <button type="button" className={watermarkMode === "text" ? "active" : ""} onClick={() => updateSetting(() => setWatermarkMode("text"))}>
                        <FileText className="size-4" /> Text
                      </button>
                      <button type="button" className={watermarkMode === "image" ? "active" : ""} onClick={() => updateSetting(() => setWatermarkMode("image"))}>
                        <ImageIcon className="size-4" /> Image
                      </button>
                    </div>
                  </div>

                  {watermarkMode === "text" ? (
                    <div className="organize-side-section">
                      <div className="organize-side-heading"><h3>Watermark text</h3></div>
                      <label className="watermark-text-field">
                        <textarea ref={watermarkTextRef} value={editorText} maxLength={120} onChange={(event) => changeWatermarkText(event.target.value)} />
                        <span>{editorText.length}/120</span>
                      </label>
                    </div>
                  ) : (
                    <div className="organize-side-section">
                      <div className="organize-side-heading"><h3>Watermark image</h3></div>
                      {watermarkImage ? (
                        <div className="watermark-image-source">
                          <span><img src={watermarkImage.previewUrl} alt="Selected watermark" /></span>
                          <div>
                            <strong>{watermarkImage.file.name}</strong>
                            <small>{watermarkImage.width} × {watermarkImage.height}px · {formatBytes(watermarkImage.file.size)}</small>
                          </div>
                          <button type="button" onClick={() => updateSetting(clearWatermarkImage)} aria-label="Remove watermark image"><Trash2 className="size-4" /></button>
                        </div>
                      ) : (
                        <button type="button" className="watermark-image-upload" onClick={() => { pendingAddPageRef.current = selectedPageNumber; pendingAddScopeRef.current = editScopeRef.current; watermarkImageInputRef.current?.click(); }}>
                          <ImagePlus className="size-5" />
                          <span><strong>Choose an image</strong><small>PNG, JPG, JPEG, or WebP</small></span>
                        </button>
                      )}
                      {watermarkImage && (
                        <button type="button" className="organize-add-file-button mt-2" onClick={() => { pendingAddPageRef.current = selectedPageNumber; pendingAddScopeRef.current = editScopeRef.current; watermarkImageInputRef.current?.click(); }}>
                          <Replace className="size-4" /> Replace image
                        </button>
                      )}
                    </div>
                  )}

                  {!activePageHasWatermark && selectedPageNumber >= effectiveStart && selectedPageNumber <= effectiveEnd && (
                    <div className="organize-side-section watermark-empty-object-panel">
                      <strong>Page {selectedPageNumber} has no watermark</strong>
                      <p>{editScope === "all"
                        ? `Add a new ${watermarkMode === "text" ? "text" : "image"} watermark across every affected page.`
                        : `Add a new ${watermarkMode === "text" ? "text" : "image"} watermark only to this page.`}</p>
                      <button type="button" className="organize-add-file-button" onClick={() => requestAddWatermark(selectedPageNumber, editScopeRef.current)}>
                        <Plus className="size-4" /> Add to page {selectedPageNumber}
                      </button>
                    </div>
                  )}

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Page range</h3><span>{watermarkedPageCount}</span></div>
                    <div className="jpg-option-grid">
                      <button type="button" className={rangeMode === "all" ? "active" : ""} onClick={() => updateSetting(() => setRangeMode("all"))}>All pages</button>
                      <button type="button" className={rangeMode === "custom" ? "active" : ""} onClick={() => updateSetting(() => setRangeMode("custom"))}>Custom</button>
                    </div>
                    {rangeMode === "custom" && (
                      <div className="page-number-input-grid mt-2">
                        <label><span>From</span><input type="number" min={1} max={loadedPdf.pageCount} value={rangeStart} onChange={(event) => updateSetting(() => {
                          const next = clampInteger(Number(event.target.value), 1, loadedPdf.pageCount);
                          setRangeStart(next);
                          setRangeEnd((current) => Math.max(current, next));
                          setActivePageNumber(next);
                          const current = selectionRef.current;
                          selectWatermark(current ? { ...current, pageNumber: next } : null);
                        })} /></label>
                        <label><span>To</span><input type="number" min={effectiveStart} max={loadedPdf.pageCount} value={rangeEnd} onChange={(event) => updateSetting(() => setRangeEnd(clampInteger(Number(event.target.value), effectiveStart, loadedPdf.pageCount)))} /></label>
                      </div>
                    )}
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Edit scope</h3><span>{editScope === "all" ? "Together" : `Page ${selectedPageNumber}`}</span></div>
                    <div className="jpg-option-grid">
                      <button type="button" className={editScope === "all" ? "active" : ""} onClick={() => setEditingScope("all")}>All pages</button>
                      <button type="button" className={editScope === "page" ? "active" : ""} onClick={() => setEditingScope("page")}>This page only</button>
                    </div>
                    <div className="watermark-scope-note">
                      {editScope === "all"
                        ? "The linked watermark is selected on every affected page. Position, rotation, duplication, and deletion apply to all of them."
                        : "Only the active page watermark is selected. Position, rotation, duplication, and deletion stay on this page."}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Position</h3><span>{selectedCustomPosition ? "Free" : "Preset"}</span></div>
                    <div className="page-number-position-grid watermark-position-grid">
                      {PLACEMENTS.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={!selectedCustomPosition && selectedPlacement === option.id ? "active" : ""}
                          onClick={() => selectPlacement(option.id)}
                          title={option.label}
                          aria-label={option.label}
                        >
                          <span className={`page-number-position-dot ${option.id}`} />
                        </button>
                      ))}
                    </div>
                    <div className="watermark-drag-note">
                      <MousePointer2 className="size-4" /> Click a watermark to select it. Drag it with the mouse, or use the keyboard arrow keys for precise movement.
                    </div>
                    <label className="edit-snap-toggle"><input type="checkbox" checked={snapEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} /><span>Snap to page and watermark alignment guides</span></label>
                    <div className="watermark-keyboard-note">
                      <Keyboard className="size-4" /> Dragging shows alignment rulers and live distances · Ctrl+Z undo · Ctrl+Y redo · Ctrl+C/X/V · Ctrl+D duplicate · Arrow move · Delete remove
                    </div>
                    {selectedCustomPosition && (
                      <button type="button" className="watermark-reset-position" onClick={resetSelectedPosition}>
                        Reset selected object to preset
                      </button>
                    )}
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Selected watermark</h3><span>{objects.length}</span></div>
                    <div className="watermark-object-actions mt-2">
                      {watermarkMode === "text" && (
                        <button type="button" onClick={() => focusTextEditor(selectedPageNumber)} disabled={!selection}><PencilLine className="size-4" /> Edit text</button>
                      )}
                      <button type="button" onClick={() => rotateSelected(selectedPageNumber)} disabled={!selection}><RotateCw className="size-4" /> Rotate</button>
                      <button type="button" onClick={() => duplicateSelected(selectedPageNumber, selectedPageWidth, selectedPageHeight)} disabled={!selection}><Copy className="size-4" /> Duplicate</button>
                      <button type="button" className="danger" onClick={() => deleteSelected(selectedPageNumber)} disabled={!selection}><Trash2 className="size-4" /> Delete</button>
                    </div>
                    <button type="button" className="organize-add-file-button mt-2" onClick={() => requestAddWatermark(focusedPageNumber ?? selectedPageNumber, editScope)}>
                      <Plus className="size-4" /> Add another watermark
                    </button>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>{watermarkMode === "text" ? "Text style" : "Image style"}</h3></div>
                    <div className="page-number-input-grid">
                      {watermarkMode === "text" ? (
                        <label><span>Font size</span><input type="number" min={8} max={160} value={selectedFontSize} onChange={(event) => {
                          const next = clampInteger(Number(event.target.value), 8, 160);
                          updateScopedStyle((object) => ({ ...object, fontSize: next }), () => setFontSize(next));
                        }} /></label>
                      ) : (
                        <label><span>Width</span><input type="number" min={5} max={95} value={selectedImageScale} onChange={(event) => {
                          const next = clampInteger(Number(event.target.value), 5, 95);
                          updateScopedStyle((object) => ({ ...object, scalePercent: next }), () => setImageScale(next));
                        }} /></label>
                      )}
                      <label><span>Rotation</span><input type="number" min={-180} max={180} step={5} value={selectedRotation} disabled={!selection} onChange={(event) => setSelectedRotation(clampInteger(Number(event.target.value), -180, 180))} /></label>
                    </div>
                    {watermarkMode === "text" && (
                      <div className="jpg-option-grid mt-2">
                        <button type="button" className={selectedFontWeight === "regular" ? "active" : ""} onClick={() => updateScopedStyle((object) => ({ ...object, fontWeight: "regular" }), () => setFontWeight("regular"))}>Regular</button>
                        <button type="button" className={selectedFontWeight === "bold" ? "active" : ""} onClick={() => updateScopedStyle((object) => ({ ...object, fontWeight: "bold" }), () => setFontWeight("bold"))}><Bold className="size-4" /> Bold</button>
                      </div>
                    )}
                    {watermarkMode === "image" && (
                      <label className="page-number-range-field mt-3">
                        <span>Image width <strong>{selectedImageScale}%</strong></span>
                        <input type="range" min={5} max={95} step={1} value={selectedImageScale} onChange={(event) => {
                          const next = Number(event.target.value);
                          updateScopedStyle((object) => ({ ...object, scalePercent: next }), () => setImageScale(next));
                        }} />
                      </label>
                    )}
                    <label className="page-number-range-field mt-3">
                      <span>Opacity <strong>{Math.round(selectedOpacity * 100)}%</strong></span>
                      <input type="range" min={5} max={100} step={1} value={Math.round(selectedOpacity * 100)} onChange={(event) => {
                        const next = Number(event.target.value) / 100;
                        updateScopedStyle((object) => ({ ...object, opacity: next }), () => setOpacity(next));
                      }} />
                    </label>
                    <label className="page-number-range-field mt-3">
                      <span>Edge offset <strong>{selectedMargin} pt</strong></span>
                      <input type="range" min={0} max={144} step={2} value={selectedMargin} onChange={(event) => {
                        const next = Number(event.target.value);
                        updateScopedStyle((object) => ({ ...object, margin: next }), () => setMargin(next));
                      }} />
                    </label>
                  </div>

                  {watermarkMode === "text" && (
                    <div className="organize-side-section">
                      <div className="organize-side-heading"><h3>Color</h3></div>
                      <div className="page-number-color-grid watermark-color-grid">
                        {WATERMARK_COLORS.map((color) => (
                          <button
                            type="button"
                            key={color.value}
                            className={selectedColor.toLowerCase() === color.value ? "active" : ""}
                            onClick={() => updateScopedStyle((object) => ({ ...object, color: color.value }), () => setWatermarkColor(color.value))}
                            aria-label={`${color.name} watermark color`}
                            title={color.name}
                          >
                            <span style={{ background: color.value }} />
                          </button>
                        ))}
                      </div>
                      <label className="watermark-custom-color mt-2">
                        <span>Custom</span>
                        <input type="color" value={selectedColor} onChange={(event) => {
                          const next = event.target.value;
                          updateScopedStyle((object) => ({ ...object, color: next }), () => setWatermarkColor(next));
                        }} />
                        <strong>{selectedColor.toUpperCase()}</strong>
                      </label>
                    </div>
                  )}

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Output filename</h3></div>
                    <label className="organize-filename-field">
                      <input value={outputName} onChange={(event) => updateSetting(() => setOutputName(event.target.value))} maxLength={86} />
                      <span>.pdf</span>
                    </label>
                  </div>
                </>
              )}

              {(status === "reading" || status === "processing") && (
                <div className="organize-progress-box">
                  <div><span>{status === "reading" ? "Reading PDF…" : "Adding watermark…"}</span><strong>{progress}%</strong></div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && (
                <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>
              )}

              {status === "success" && result && (
                <WorkspaceResultCard
                  title={`${activeTool.name} result is ready`}
                  summary={`${result.watermarkedPageCount} watermarked page${result.watermarkedPageCount === 1 ? "" : "s"} · ${formatBytes(result.size)}`}
                  downloads={downloads}
                />
              )}

              {!result && loadedPdf && (
                <div className="organize-sidebar-action">
                  <button
                    ref={processButtonRef}
                    type="button"
                    className="organize-primary-action"
                    onClick={() => void createWatermarkedPdf()}
                    disabled={status === "processing" || status === "reading" || !watermarkReady}
                  >
                    {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Add watermark
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              <div className="organize-privacy-note">
                <LockKeyhole className="size-4" /> Text and image watermarks are added inside this browser.
              </div>
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
          <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[var(--brand-strong)]">
            <Stamp className="size-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p>
            <p className="text-xs text-slate-500">Live browser text and image watermarking</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onFileInput} />
        <div
          className={`upload-zone ${dragging ? "upload-zone-active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="upload-icon"><CloudUpload className="size-7" /></span>
          <p className="mt-4 text-lg font-extrabold text-[var(--ink)]">Drop one PDF here</p>
          <p className="mt-1 text-sm text-slate-500">Add text or image watermarks, edit all pages together or each page separately, and preview the result before processing.</p>
          <span className="button button-primary pointer-events-none mt-5"><UploadCloud className="size-4" /> Choose a PDF</span>
        </div>
        {message && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
