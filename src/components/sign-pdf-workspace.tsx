/* eslint-disable @next/next/no-img-element */
"use client";

import {
  BookmarkPlus,
  CalendarDays,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CloudUpload,
  Copy,
  FileSignature,
  FileText,
  GripVertical,
  LoaderCircle,
  LockKeyhole,
  Palette,
  PenLine,
  PencilLine,
  RotateCcw,
  RotateCw,
  Save,
  ShieldCheck,
  Stamp,
  Trash2,
  Type,
  UploadCloud,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useEffect,
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
  applyPdfSignatures,
  type SignatureAssetInput,
  type SignatureFieldType,
  type SignatureImageType,
  type SignatureObject,
  type SignatureTextStyle,
} from "@/lib/sign-pdf";
import { getVisualPageGeometry } from "@/lib/watermark-pdf";
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
const SAVED_SIGNATURES_KEY = "novapdf-saved-signatures-v1";
const SIGNER_PROFILE_KEY = "novapdf-signer-profile-v1";
const SIGNATURE_INK_PALETTE = ["#111827", "#ef4444", "#2563eb", "#16a34a"] as const;

type ProcessStatus = "idle" | "reading" | "processing" | "success" | "error";
type SignatureSourceMode = "draw" | "type" | "upload";
type SignatureAssetKind = "signature" | "initials" | "stamp";
type TypedSignatureStyle = "flowing" | "signature" | "classic" | "casual" | "elegant" | "formal" | "clean" | "bold";
type SignSetupModal = "workflow" | "details" | null;
type SignatureDetailsTab = "signature" | "initials" | "stamp";

const TYPED_SIGNATURE_STYLES: Array<{
  id: TypedSignatureStyle;
  label: string;
  fontFamily: string;
  canvasFamily: string;
  fontStyle: CSSProperties["fontStyle"];
  fontWeight: CSSProperties["fontWeight"];
  letterSpacing: string;
}> = [
  { id: "flowing", label: "Flowing", fontFamily: '"Segoe Script", "Brush Script MT", cursive', canvasFamily: '"Segoe Script", "Brush Script MT", cursive', fontStyle: "normal", fontWeight: 500, letterSpacing: "-0.055em" },
  { id: "signature", label: "Signature", fontFamily: '"Lucida Handwriting", "Segoe Script", cursive', canvasFamily: '"Lucida Handwriting", "Segoe Script", cursive', fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.045em" },
  { id: "classic", label: "Classic", fontFamily: '"Monotype Corsiva", "Segoe Script", cursive', canvasFamily: '"Monotype Corsiva", "Segoe Script", cursive', fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.035em" },
  { id: "casual", label: "Casual", fontFamily: '"Segoe Print", "Comic Sans MS", cursive', canvasFamily: '"Segoe Print", "Comic Sans MS", cursive', fontStyle: "normal", fontWeight: 500, letterSpacing: "-0.025em" },
  { id: "elegant", label: "Elegant", fontFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif', canvasFamily: '"Palatino Linotype", "Book Antiqua", Georgia, serif', fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.02em" },
  { id: "formal", label: "Formal", fontFamily: '"Times New Roman", Times, serif', canvasFamily: '"Times New Roman", Times, serif', fontStyle: "italic", fontWeight: 600, letterSpacing: "0" },
  { id: "clean", label: "Clean", fontFamily: '"Trebuchet MS", Arial, sans-serif', canvasFamily: '"Trebuchet MS", Arial, sans-serif', fontStyle: "normal", fontWeight: 650, letterSpacing: "-0.02em" },
  { id: "bold", label: "Bold", fontFamily: 'Georgia, "Times New Roman", serif', canvasFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontWeight: 800, letterSpacing: "-0.025em" },
];

function signatureStyle(style: TypedSignatureStyle) {
  return TYPED_SIGNATURE_STYLES.find((item) => item.id === style) ?? TYPED_SIGNATURE_STYLES[0];
}

function signatureStylePreview(style: TypedSignatureStyle, color = "#111827"): CSSProperties {
  const item = signatureStyle(style);
  return {
    color,
    fontFamily: item.fontFamily,
    fontStyle: item.fontStyle,
    fontWeight: item.fontWeight,
    letterSpacing: item.letterSpacing,
  };
}

function signatureStyleToPdfTextStyle(style: TypedSignatureStyle): SignatureTextStyle {
  if (style === "clean" || style === "bold") return "bold";
  if (style === "casual") return "regular";
  return "italic";
}

function deriveInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (words.length === 0) return "";
  return words.slice(0, 2).map((word) => Array.from(word)[0] ?? "").join("").toUpperCase();
}

type LoadedPdf = {
  file: File;
  pageCount: number;
  pages: Array<{ pageNumber: number; width: number; height: number }>;
};

type ThumbnailPreview = {
  url: string;
  width: number;
  height: number;
};

type MainPagePreview = ThumbnailPreview & {
  zoomBucket: number;
};

type SignatureAsset = {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  imageType: SignatureImageType;
  label: string;
  kind: SignatureAssetKind;
};

type SavedSignatureRecord = {
  id: string;
  label: string;
  dataUrl: string;
  width: number;
  height: number;
  imageType: SignatureImageType;
  kind: SignatureAssetKind;
  createdAt: number;
};

type SavedSignerProfile = {
  name: string;
  initials: string;
  updatedAt: number;
};

type AlignmentGuides = InteractionGuideState;

type SignSelection = {
  objectId: string;
  pageNumber: number;
};

type SignResult = {
  url: string;
  name: string;
  size: number;
  file: File;
  signedPageCount: number;
  objectCount: number;
};

type SignHistoryState = {
  objects: SignatureObject[];
  selection: SignSelection | null;
  focusedPageNumber: number | null;
  signerName: string;
  signerInitials: string;
  customText: string;
  inkColor: string;
  textStyle: SignatureTextStyle;
};

type PointerObjectState = {
  pointerId: number;
  objectId: string;
  pageNumber: number;
};

type DragState = PointerObjectState & {
  offsetX: number;
  offsetY: number;
};

type ResizeState = PointerObjectState & {
  startLeft: number;
  startTop: number;
  startCenterX: number;
  startCenterY: number;
  startWidth: number;
  startHeight: number;
  startFontSize: number;
  startRotation: number;
  lockAspect: boolean;
};

function cloneHistory(value: SignHistoryState): SignHistoryState {
  return {
    objects: value.objects.map((object) => ({ ...object })),
    selection: value.selection ? { ...value.selection } : null,
    focusedPageNumber: value.focusedPageNumber,
    signerName: value.signerName,
    signerInitials: value.signerInitials,
    customText: value.customText,
    inkColor: value.inkColor,
    textStyle: value.textStyle,
  };
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file: File) {
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
      .trim() || "NovaPDF-signed"
  );
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The signature image could not be prepared."));
    }, "image/png");
  });
}

function trimTransparentCanvas(source: HTMLCanvasElement) {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) return source;
  const pixels = context.getImageData(0, 0, source.width, source.height);
  let left = source.width;
  let top = source.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (pixels.data[(y * source.width + x) * 4 + 3] > 8) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) return source;
  const contentWidth = Math.max(1, right - left + 1);
  const contentHeight = Math.max(1, bottom - top + 1);
  const padding = Math.max(14, Math.round(Math.max(contentWidth, contentHeight) * 0.1));
  const output = document.createElement("canvas");
  output.width = contentWidth + padding * 2;
  output.height = contentHeight + padding * 2;
  output.getContext("2d")?.drawImage(source, left, top, contentWidth, contentHeight, padding, padding, contentWidth, contentHeight);
  return output;
}

function renderTypedInkCanvas(text: string, styleId: TypedSignatureStyle, fontSize: number, color: string) {
  const style = signatureStyle(styleId);
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d", { alpha: true });
  if (!measureContext) return null;
  const font = `${style.fontStyle === "italic" ? "italic " : ""}${style.fontWeight ?? 500} ${fontSize}px ${style.canvasFamily}`;
  measureContext.font = font;
  const metrics = measureContext.measureText(text);
  const left = Math.max(0, Math.ceil(metrics.actualBoundingBoxLeft || 0));
  const right = Math.max(Math.ceil(metrics.width), Math.ceil(metrics.actualBoundingBoxRight || metrics.width));
  const ascent = Math.max(Math.ceil(fontSize * 0.85), Math.ceil(metrics.actualBoundingBoxAscent || 0));
  const descent = Math.max(Math.ceil(fontSize * 0.3), Math.ceil(metrics.actualBoundingBoxDescent || 0));
  const paddingX = Math.max(36, Math.ceil(fontSize * 0.45));
  const paddingY = Math.max(24, Math.ceil(fontSize * 0.3));
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(16384, Math.max(1, left + right + paddingX * 2));
  canvas.height = Math.min(2048, Math.max(1, ascent + descent + paddingY * 2));
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;
  context.font = font;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = color;
  context.fillText(text, paddingX + left, paddingY + ascent);
  return trimTransparentCanvas(canvas);
}

async function prepareUploadedSignature(file: File, removeWhite: boolean): Promise<Omit<SignatureAsset, "id" | "label" | "kind">> {
  if (!isImageFile(file)) throw new Error("Choose a PNG, JPG, JPEG, or WebP image.");
  if (!file.size) throw new Error("This signature image is empty.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("The signature image is larger than the current 15 MB limit.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This signature image is invalid or unsupported.");
  }
  try {
    if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
      throw new Error("The signature image dimensions are too large for this browser workspace.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
    if (!context) throw new Error("The signature image canvas is unavailable.");
    context.drawImage(bitmap, 0, 0);
    if (removeWhite) {
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < image.data.length; index += 4) {
        const red = image.data[index];
        const green = image.data[index + 1];
        const blue = image.data[index + 2];
        const distance = Math.max(red, green, blue) - Math.min(red, green, blue);
        if (red > 238 && green > 238 && blue > 238 && distance < 16) {
          image.data[index + 3] = 0;
        }
      }
      context.putImageData(image, 0, 0);
    }
    const trimmed = trimTransparentCanvas(canvas);
    const blob = await canvasToPngBlob(trimmed);
    const normalized = new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "signature"}.png`, {
      type: "image/png",
      lastModified: Date.now(),
    });
    return {
      file: normalized,
      previewUrl: URL.createObjectURL(normalized),
      width: trimmed.width,
      height: trimmed.height,
      imageType: "png",
    };
  } finally {
    bitmap.close();
  }
}

function estimateTextBox(text: string, fontSize: number, pageWidth: number, pageHeight: number) {
  const safeText = text || "Enter value";
  const widthPoints = Math.max(fontSize * 2.6, safeText.length * fontSize * 0.62) + fontSize * 1.2;
  const heightPoints = fontSize * 1.7;
  return {
    width: Math.min(0.9, Math.max(0.09, widthPoints / pageWidth)),
    height: Math.min(0.3, Math.max(0.042, heightPoints / pageHeight)),
  };
}

function minimumObjectSize(object: SignatureObject, pageWidth: number, pageHeight: number) {
  void object;
  return {
    width: Math.max(0.001, 1 / Math.max(1, pageWidth)),
    height: Math.max(0.001, 1 / Math.max(1, pageHeight)),
  };
}

function inverseRotatePoint(x: number, y: number, centerX: number, centerY: number, angleDegrees: number) {
  const radians = -angleDegrees * Math.PI / 180;
  const dx = x - centerX;
  const dy = y - centerY;
  return {
    x: centerX + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: centerY + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}


function typeLabel(type: SignatureFieldType) {
  if (type === "signature") return "Signature";
  if (type === "stamp") return "Company stamp";
  if (type === "initials") return "Initials";
  if (type === "date") return "Date";
  if (type === "name") return "Name";
  if (type === "input") return "Input";
  if (type === "checkbox") return "Checkbox";
  return "Text";
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("The signature could not be saved in this browser."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, name: string) {
  const [header, encoded] = dataUrl.split(",", 2);
  const mime = header.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const binary = atob(encoded ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], name, { type: mime, lastModified: Date.now() });
}

export function SignPdfWorkspace({
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
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const signatureImageInputRef = useRef<HTMLInputElement>(null);
  const stampImageInputRef = useRef<HTMLInputElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const initialsDrawCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectedTextInputRef = useRef<HTMLInputElement>(null);
  const documentScrollRef = useRef<HTMLDivElement>(null);
  const pageStripScrollRef = useRef<HTMLDivElement>(null);
  const pageElementRefs = useRef<Map<number, HTMLElement>>(new Map());
  const mainPreviewUrlsRef = useRef<Set<string>>(new Set());
  const mainPagePreviewsRef = useRef<Record<number, MainPagePreview>>({});
  const thumbnailElementRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const scrollSyncSourceRef = useRef<"document" | "strip" | null>(null);
  const scrollSyncTimerRef = useRef<number | null>(null);
  const assetsRef = useRef<SignatureAsset[]>([]);
  const resultRef = useRef<SignResult | null>(null);
  const drawingRef = useRef<{ active: boolean; pointerId: number | null }>({ active: false, pointerId: null });
  const history = useWorkspaceHistory<SignHistoryState>(cloneHistory, 120);
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [draggingFile, setDraggingFile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [thumbnails, setThumbnails] = useState<Record<number, ThumbnailPreview>>({});
  const [mainPagePreviews, setMainPagePreviews] = useState<Record<number, MainPagePreview>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [objects, setObjects] = useState<SignatureObject[]>([]);
  const [selection, setSelection] = useState<SignSelection | null>(null);
  const [focusedPageNumber, setFocusedPageNumber] = useState<number | null>(null);
  const [sourceMode, setSourceMode] = useState<SignatureSourceMode>("type");
  const [initialsSourceMode, setInitialsSourceMode] = useState<SignatureSourceMode>("type");
  const [pendingAssetKind, setPendingAssetKind] = useState<SignatureAssetKind>("signature");
  const [savedAssets, setSavedAssets] = useState<SavedSignatureRecord[]>([]);
  const [assets, setAssets] = useState<SignatureAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [signatureAssetId, setSignatureAssetId] = useState<string | null>(null);
  const [initialsAssetId, setInitialsAssetId] = useState<string | null>(null);
  const [stampAssetId, setStampAssetId] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [signatureTypedStyle, setSignatureTypedStyle] = useState<TypedSignatureStyle>("flowing");
  const [initialsTypedStyle, setInitialsTypedStyle] = useState<TypedSignatureStyle>("flowing");
  const [initialsManuallyEdited, setInitialsManuallyEdited] = useState(false);
  const [signerProfileReady, setSignerProfileReady] = useState(false);
  const [removeWhite, setRemoveWhite] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerInitials, setSignerInitials] = useState("");
  const [customText, setCustomText] = useState("");
  const [inkColor, setInkColor] = useState("#111827");
  const [textStyle, setTextStyle] = useState<SignatureTextStyle>("regular");
  const [outputName, setOutputName] = useState("NovaPDF-signed");
  const [result, setResult] = useState<SignResult | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [clipboardObject, setClipboardObject] = useState<SignatureObject | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuides>(null);
  const [setupModal, setSetupModal] = useState<SignSetupModal>(null);
  const [detailsTab, setDetailsTab] = useState<SignatureDetailsTab>("signature");
  const [paletteDragType, setPaletteDragType] = useState<SignatureFieldType | null>(null);
  const [inlineEditorObjectId, setInlineEditorObjectId] = useState<string | null>(null);

  const editorOpen = workspaceStarted || startInWorkspace;
  const activeAsset = useMemo(() => assets.find((asset) => asset.id === activeAssetId) ?? null, [activeAssetId, assets]);
  const signatureAsset = useMemo(() => assets.find((asset) => asset.id === signatureAssetId) ?? [...assets].reverse().find((asset) => asset.kind === "signature") ?? null, [assets, signatureAssetId]);
  const initialsAsset = useMemo(() => assets.find((asset) => asset.id === initialsAssetId) ?? [...assets].reverse().find((asset) => asset.kind === "initials") ?? null, [assets, initialsAssetId]);
  const stampAsset = useMemo(() => assets.find((asset) => asset.id === stampAssetId) ?? [...assets].reverse().find((asset) => asset.kind === "stamp") ?? null, [assets, stampAssetId]);
  const selectedObject = useMemo(() => objects.find((object) => object.id === selection?.objectId) ?? null, [objects, selection]);
  const inlineEditorObject = useMemo(() => objects.find((object) => object.id === inlineEditorObjectId) ?? null, [inlineEditorObjectId, objects]);
  const downloads = useMemo<WorkspaceDownload[]>(() => result ? [{ url: result.url, name: result.name }] : [], [result]);

  const historyState = (): SignHistoryState => ({
    objects,
    selection,
    focusedPageNumber,
    signerName,
    signerInitials,
    customText,
    inkColor,
    textStyle,
  });

  function applyHistoryState(value: SignHistoryState) {
    setObjects(value.objects);
    setSelection(value.selection);
    setFocusedPageNumber(value.focusedPageNumber);
    setSignerName(value.signerName);
    setSignerInitials(value.signerInitials);
    setCustomText(value.customText);
    setInkColor(value.inkColor);
    setTextStyle(value.textStyle);
    clearResult();
  }

  function checkpoint() {
    history.checkpoint(historyState());
  }

  function undo() {
    history.undo(historyState(), applyHistoryState);
  }

  function redo() {
    history.redo(historyState(), applyHistoryState);
  }

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [editorOpen, isActive]);

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => {
    mainPagePreviewsRef.current = mainPagePreviews;
  }, [mainPagePreviews]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const rawAssets = window.localStorage.getItem(SAVED_SIGNATURES_KEY);
        if (rawAssets) {
          const parsed = JSON.parse(rawAssets) as SavedSignatureRecord[];
          setSavedAssets(parsed.filter((item) => item?.id && item?.dataUrl && (item.kind === "signature" || item.kind === "stamp")));
        }
        const rawProfile = window.localStorage.getItem(SIGNER_PROFILE_KEY);
        if (rawProfile) {
          const profile = JSON.parse(rawProfile) as SavedSignerProfile;
          const name = typeof profile?.name === "string" ? profile.name.slice(0, 100) : "";
          const initials = typeof profile?.initials === "string" ? profile.initials.slice(0, 8).toUpperCase() : deriveInitials(name);
          if (name) {
            setSignerName(name);
            setTypedSignature(name.slice(0, 80));
            setSignerInitials(initials || deriveInitials(name));
            setInitialsManuallyEdited(Boolean(initials && initials !== deriveInitials(name)));
          }
        }
      } catch {
        // Invalid browser storage is ignored so signing can still continue.
      } finally {
        setSignerProfileReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!signerProfileReady) return;
    const name = signerName.trim();
    if (!name) {
      window.localStorage.removeItem(SIGNER_PROFILE_KEY);
      return;
    }
    const profile: SavedSignerProfile = {
      name,
      initials: signerInitials.trim() || deriveInitials(name),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(SIGNER_PROFILE_KEY, JSON.stringify(profile));
  }, [signerInitials, signerName, signerProfileReady]);

  useEffect(() => () => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
    for (const asset of assetsRef.current) URL.revokeObjectURL(asset.previewUrl);
    for (const url of mainPreviewUrlsRef.current) URL.revokeObjectURL(url);
    mainPreviewUrlsRef.current.clear();
    if (scrollSyncTimerRef.current !== null) window.clearTimeout(scrollSyncTimerRef.current);
  }, []);

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
          if (cancelled || thumbnails[pageNumber] || thumbnailErrors[pageNumber]) continue;
          try {
            const page = await pdf.getPage(pageNumber);
            const base = page.getViewport({ scale: 1 });
            const scale = Math.max(Math.min(0.9, 330 / Math.max(base.width, base.height)), 0.2);
            const viewport = page.getViewport({ scale });
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
                [pageNumber]: { url: canvas.toDataURL("image/png"), width: base.width, height: base.height },
              }));
            }
            page.cleanup();
          } catch {
            if (!cancelled) setThumbnailErrors((current) => ({ ...current, [pageNumber]: true }));
          }
        }
        await task.destroy();
      } catch {
        if (!cancelled) setMessage("Some previews could not be rendered, but signing may still work.");
      }
    }
    void renderThumbnails();
    return () => {
      cancelled = true;
    };
  }, [loaded, thumbnailErrors, thumbnails]);

  useEffect(() => {
    if (!loaded || !isActive) return;
    let cancelled = false;
    const activePage = Math.min(loaded.pageCount, Math.max(1, focusedPageNumber ?? 1));
    const zoomBucket = Math.round(zoom / 10) * 10;
    const wanted = new Set<number>();
    for (let pageNumber = Math.max(1, activePage - 2); pageNumber <= Math.min(loaded.pageCount, activePage + 2); pageNumber += 1) wanted.add(pageNumber);

    async function renderMainPages() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({ data: new Uint8Array(await loaded!.file.arrayBuffer()) });
        const pdf = await task.promise;
        const deviceScale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
        for (const pageNumber of wanted) {
          if (cancelled) break;
          const existing = mainPagePreviewsRef.current[pageNumber];
          if (existing?.zoomBucket === zoomBucket) continue;
          const page = await pdf.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          const targetLongEdge = Math.min(2400, Math.max(1100, 980 * zoomBucket / 100 * deviceScale));
          const scale = Math.min(3.5, Math.max(1.15, targetLongEdge / Math.max(base.width, base.height)));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Canvas unavailable");
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Preview unavailable")), "image/png"));
          if (cancelled) break;
          const url = URL.createObjectURL(blob);
          mainPreviewUrlsRef.current.add(url);
          setMainPagePreviews((current) => {
            const previous = current[pageNumber];
            if (previous?.url && previous.url !== url) {
              URL.revokeObjectURL(previous.url);
              mainPreviewUrlsRef.current.delete(previous.url);
            }
            const next: Record<number, MainPagePreview> = {};
            for (const [key, value] of Object.entries(current)) {
              const number = Number(key);
              if (Math.abs(number - activePage) <= 4) next[number] = value;
              else {
                URL.revokeObjectURL(value.url);
                mainPreviewUrlsRef.current.delete(value.url);
              }
            }
            next[pageNumber] = { url, width: base.width, height: base.height, zoomBucket };
            mainPagePreviewsRef.current = next;
            return next;
          });
          page.cleanup();
        }
        await task.destroy();
      } catch {
        // Low-resolution thumbnails remain available as a safe fallback.
      }
    }

    const timer = window.setTimeout(() => void renderMainPages(), 90);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [focusedPageNumber, isActive, loaded, zoom]);

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      resetWorkspace();
      setWorkspaceStarted(true);
      const file = detail.files.at(-1);
      if (file) void loadPdf(file);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editingText = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "z" && !editingText) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "y" && !editingText) {
        event.preventDefault();
        redo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (loaded && objects.length > 0 && status !== "processing") void processPdf();
        return;
      }
      if (modifier && event.key.toLowerCase() === "o") {
        event.preventDefault();
        pdfInputRef.current?.click();
        return;
      }
      if (!selectedObject || editingText) {
        if (event.key === "Escape" && focusedPageNumber !== null) setFocusedPageNumber(null);
        return;
      }
      if (modifier && event.key.toLowerCase() === "c") {
        event.preventDefault();
        setClipboardObject({ ...selectedObject });
        return;
      }
      if (modifier && event.key.toLowerCase() === "x") {
        event.preventDefault();
        setClipboardObject({ ...selectedObject });
        checkpoint();
        setObjects((current) => current.filter((object) => object.id !== selectedObject.id));
        setSelection(null);
        clearResult();
        return;
      }
      if (modifier && event.key.toLowerCase() === "v" && clipboardObject) {
        event.preventDefault();
        const pageNumber = focusedPageNumber ?? selectedObject.pageNumber;
        const next = { ...clipboardObject, id: makeId("sign-object"), pageNumber, x: Math.min(0.94, clipboardObject.x + 0.03), y: Math.min(0.94, clipboardObject.y + 0.03) };
        checkpoint();
        setObjects((current) => [...current, next]);
        setSelection({ objectId: next.id, pageNumber });
        clearResult();
        return;
      }
      if (modifier && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateObject(selectedObject.id);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteObject(selectedObject.id);
        return;
      }
      const direction: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      };
      const vector = direction[event.key];
      if (vector) {
        event.preventDefault();
        const page = loaded?.pages[selectedObject.pageNumber - 1];
        if (!page) return;
        const step = event.shiftKey ? 12 : 3;
        checkpoint();
        setObjects((current) => current.map((object) => object.id === selectedObject.id ? {
          ...object,
          x: Math.min(0.98, Math.max(0.02, object.x + vector[0] * step / page.width)),
          y: Math.min(0.98, Math.max(0.02, object.y + vector[1] * step / page.height)),
        } : object));
        clearResult();
      }
      if (event.key === "Escape") setSelection(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipboardObject, editorOpen, focusedPageNumber, isActive, loaded, objects.length, selectedObject, status]);

  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function resetWorkspace() {
    clearResult();
    setLoaded(null);
    setThumbnails({});
    setThumbnailErrors({});
    for (const url of mainPreviewUrlsRef.current) URL.revokeObjectURL(url);
    mainPreviewUrlsRef.current.clear();
    mainPagePreviewsRef.current = {};
    setMainPagePreviews({});
    setObjects([]);
    setSelection(null);
    setFocusedPageNumber(null);
    setMessage("");
    setStatus("idle");
    setZoom(100);
    setOutputName("NovaPDF-signed");
    for (const asset of assetsRef.current) URL.revokeObjectURL(asset.previewUrl);
    setAssets([]);
    setActiveAssetId(null);
    setSignatureAssetId(null);
    setInitialsAssetId(null);
    setStampAssetId(null);
    setSignatureTypedStyle("flowing");
    setInitialsTypedStyle("flowing");
    setCustomText("");
    setAlignmentGuides(null);
    setSetupModal(null);
    setDetailsTab("signature");
    setSourceMode("type");
    setInitialsSourceMode("type");
    setPaletteDragType(null);
    setInlineEditorObjectId(null);
    history.reset();
  }

  function startOver() {
    resetWorkspace();
    setWorkspaceStarted(true);
  }

  function goHome() {
    resetWorkspace();
    setWorkspaceStarted(false);
    onExitWorkspace?.();
  }

  function switchTool(tool: PdfTool) {
    transferWorkspaceFiles(tool, result ? [result.file] : loaded ? [loaded.file] : []);
    onToolChange(tool);
  }

  async function loadPdf(file: File) {
    if (!isPdfFile(file)) {
      setMessage("Choose a valid PDF file.");
      setStatus("error");
      return;
    }
    if (!file.size) {
      setMessage("This PDF is empty.");
      setStatus("error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage("This PDF is larger than the current 50 MB browser limit.");
      setStatus("error");
      return;
    }
    clearResult();
    setStatus("reading");
    setProgress(8);
    setMessage("");
    try {
      if (!(await hasPdfHeader(file))) throw new Error("invalid");
      const { PDFDocument } = await import("pdf-lib");
      const document = await PDFDocument.load(await file.arrayBuffer(), {
        updateMetadata: false,
        throwOnInvalidObject: true,
      });
      const pageCount = document.getPageCount();
      if (pageCount < 1) throw new Error("empty");
      if (pageCount > MAX_PAGES) throw new Error("page-limit");
      const pages = document.getPages().map((page, index) => {
        const geometry = getVisualPageGeometry(page);
        return { pageNumber: index + 1, width: geometry.visualWidth, height: geometry.visualHeight };
      });
      resetWorkspace();
      setLoaded({ file, pageCount, pages });
      setOutputName(`${cleanBaseName(file.name)}-signed`);
      setFocusedPageNumber(1);
      setSetupModal("workflow");
      setWorkspaceStarted(true);
      setProgress(100);
      setStatus("idle");
    } catch (error) {
      const code = error instanceof Error ? error.message : "unknown";
      setStatus("error");
      if (code === "page-limit") setMessage(`This browser build supports up to ${MAX_PAGES} pages in Sign PDF.`);
      else if (code === "empty") setMessage("This PDF does not contain any pages.");
      else setMessage("This PDF could not be opened. Password-protected PDFs must be unlocked first.");
    }
  }

  function onPdfInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void loadPdf(file);
  }

  function onPdfDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingFile(false);
    const file = Array.from(event.dataTransfer.files).find(isPdfFile);
    if (file) void loadPdf(file);
    else {
      setMessage("Drop one valid PDF file here.");
      setStatus("error");
    }
  }

  function addAsset(asset: Omit<SignatureAsset, "id" | "label" | "kind">, label: string, kind: SignatureAssetKind = "signature", makeActive = true) {
    const id = makeId("signature-asset");
    const next = { ...asset, id, label, kind };
    setAssets((current) => [...current, next]);
    if (kind === "signature") setSignatureAssetId(id);
    if (kind === "initials") setInitialsAssetId(id);
    if (kind === "stamp") setStampAssetId(id);
    if (makeActive) setActiveAssetId(id);
    setMessage("");
    setStatus("idle");
    return id;
  }

  async function createDrawnAsset(kind: "signature" | "initials") {
    const canvas = kind === "initials" ? initialsDrawCanvasRef.current : drawCanvasRef.current;
    if (!canvas) return null;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasInk = false;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] > 8) { hasInk = true; break; }
    }
    if (!hasInk) {
      setMessage(`Draw ${kind === "initials" ? "your initials" : "a signature"} before choosing Use drawing.`);
      return null;
    }
    const trimmed = trimTransparentCanvas(canvas);
    const blob = await canvasToPngBlob(trimmed);
    const file = new File([blob], kind === "initials" ? "drawn-initials.png" : "drawn-signature.png", { type: "image/png", lastModified: Date.now() });
    const id = addAsset(
      { file, previewUrl: URL.createObjectURL(file), width: trimmed.width, height: trimmed.height, imageType: "png" },
      kind === "initials" ? "Drawn initials" : "Drawn signature",
      kind,
      kind === "signature",
    );
    if (kind === "initials") setInitialsAssetId(id);
    return id;
  }

  async function createTypedSignatureAsset() {
    const text = typedSignature.trim();
    if (!text) {
      setMessage("Type your signature name first.");
      return null;
    }
    const trimmed = renderTypedInkCanvas(text, signatureTypedStyle, 150, inkColor);
    if (!trimmed) return null;
    const blob = await canvasToPngBlob(trimmed);
    const file = new File([blob], "typed-signature.png", { type: "image/png", lastModified: Date.now() });
    return addAsset({ file, previewUrl: URL.createObjectURL(file), width: trimmed.width, height: trimmed.height, imageType: "png" }, `Typed signature - ${signatureStyle(signatureTypedStyle).label}`, "signature");
  }

  async function createTypedInitialsAsset() {
    const text = signerInitials.trim() || deriveInitials(signerName);
    if (!text) return null;
    const trimmed = renderTypedInkCanvas(text, initialsTypedStyle, 190, inkColor);
    if (!trimmed) return null;
    const blob = await canvasToPngBlob(trimmed);
    const file = new File([blob], "typed-initials.png", { type: "image/png", lastModified: Date.now() });
    if (initialsAssetId) {
      const previous = assetsRef.current.find((asset) => asset.id === initialsAssetId);
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      setAssets((current) => current.filter((asset) => asset.id !== initialsAssetId));
    }
    const id = addAsset({ file, previewUrl: URL.createObjectURL(file), width: trimmed.width, height: trimmed.height, imageType: "png" }, `Initials - ${signatureStyle(initialsTypedStyle).label}`, "initials", false);
    setInitialsAssetId(id);
    return id;
  }

  async function saveActiveAsset(assetOverride?: SignatureAsset) {
    const asset = assetOverride ?? activeAsset;
    if (!asset) return;
    try {
      const record: SavedSignatureRecord = {
        id: makeId("saved-signature"),
        label: asset.label,
        dataUrl: await fileToDataUrl(asset.file),
        width: asset.width,
        height: asset.height,
        imageType: asset.imageType,
        kind: asset.kind,
        createdAt: Date.now(),
      };
      const next = [...savedAssets, record].slice(-12);
      setSavedAssets(next);
      window.localStorage.setItem(SAVED_SIGNATURES_KEY, JSON.stringify(next));
      setMessage(`${asset.kind === "stamp" ? "Stamp" : "Signature"} saved in this browser.`);
      setStatus("idle");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The signature could not be saved in this browser.");
      setStatus("error");
    }
  }

  function restoreSavedAsset(record: SavedSignatureRecord) {
    try {
      const extension = record.imageType === "jpg" ? "jpg" : "png";
      const file = dataUrlToFile(record.dataUrl, `${record.label || record.kind}.${extension}`);
      addAsset({
        file,
        previewUrl: URL.createObjectURL(file),
        width: record.width,
        height: record.height,
        imageType: record.imageType,
      }, record.label, record.kind);
      setPendingAssetKind(record.kind);
      setSourceMode("upload");
    } catch {
      setMessage("This saved signature could not be restored. Remove it and save a new copy.");
      setStatus("error");
    }
  }

  function deleteSavedAsset(id: string) {
    const next = savedAssets.filter((item) => item.id !== id);
    setSavedAssets(next);
    window.localStorage.setItem(SAVED_SIGNATURES_KEY, JSON.stringify(next));
  }

  async function onSignatureImageInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const prepared = await prepareUploadedSignature(file, removeWhite);
      addAsset(prepared, file.name, pendingAssetKind, pendingAssetKind !== "initials");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The signature image could not be prepared.");
      setStatus("error");
    }
  }

  function clearDrawing(kind: "signature" | "initials" = "signature") {
    const canvas = kind === "initials" ? initialsDrawCanvasRef.current : drawCanvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;
    drawingRef.current = { active: true, pointerId: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    context.strokeStyle = inkColor;
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height);
  }

  function drawPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current.active || drawingRef.current.pointerId !== event.pointerId) return;
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineTo((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height);
    context.stroke();
  }

  function drawPointerEnd(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (drawingRef.current.pointerId !== event.pointerId) return;
    drawingRef.current = { active: false, pointerId: null };
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  async function applySignerSetup() {
    if (!signerName.trim()) {
      setMessage("Enter your full name before continuing.");
      setStatus("error");
      return;
    }
    if (!signerInitials.trim()) {
      setMessage("Enter your initials before continuing.");
      setStatus("error");
      return;
    }
    let preparedSignatureId = signatureAsset?.id ?? null;
    if (sourceMode === "type") preparedSignatureId = await createTypedSignatureAsset();
    if (!preparedSignatureId) {
      setDetailsTab("signature");
      setMessage("Create, draw, upload, or choose a signature before continuing.");
      setStatus("error");
      return;
    }
    let preparedInitialsAssetId = initialsAsset?.id ?? null;
    if (initialsSourceMode === "type") preparedInitialsAssetId = await createTypedInitialsAsset();
    if (!preparedInitialsAssetId) {
      setDetailsTab("initials");
      setMessage("Type, draw, or upload valid initials before continuing.");
      setStatus("error");
      return;
    }
    if (selection?.objectId) {
      setObjects((current) => current.map((object) => {
        if (object.id !== selection.objectId) return object;
        if (object.type === "signature") return { ...object, assetId: preparedSignatureId };
        if (object.type === "initials") return { ...object, assetId: preparedInitialsAssetId };
        if (object.type === "stamp" && stampAsset?.id) return { ...object, assetId: stampAsset.id };
        return object;
      }));
      clearResult();
    }
    setMessage("");
    setStatus("idle");
    setFocusedPageNumber((current) => current ?? 1);
    setSetupModal(null);
  }

  function openSignatureDetails(tab: SignatureDetailsTab = "signature") {
    setDetailsTab(tab);
    if (tab === "signature") setSourceMode("type");
    setSetupModal("details");
  }

  function beginPaletteDrag(event: DragEvent<HTMLElement>, type: SignatureFieldType) {
    setPaletteDragType(type);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-novapdf-sign-field", type);
    event.dataTransfer.setData("text/plain", type);
  }

  function finishPaletteDrag() {
    setPaletteDragType(null);
  }

  function targetPageNumber() {
    return focusedPageNumber ?? selection?.pageNumber ?? 1;
  }

  function pageMeta(pageNumber: number) {
    return loaded?.pages[pageNumber - 1] ?? null;
  }

  function addImageObject(type: "signature" | "stamp", pageOverride?: number, position?: { x: number; y: number }) {
    const asset = type === "stamp" ? stampAsset : signatureAsset;
    if (!loaded || !asset) {
      setMessage(type === "stamp" ? "Upload or select a company stamp first." : "Create, type, or upload a signature first.");
      return;
    }
    const pageNumber = pageOverride ?? targetPageNumber();
    const page = pageMeta(pageNumber);
    if (!page) return;
    const width = type === "stamp" ? 0.24 : 0.34;
    const height = Math.min(0.28, Math.max(0.045, width * asset.height / asset.width * page.width / page.height));
    const object: SignatureObject = {
      id: makeId("sign-object"), pageNumber, type, x: position?.x ?? 0.5, y: position?.y ?? 0.5,
      width, height, rotation: 0, assetId: asset.id, required: type === "signature",
      label: type === "stamp" ? "Company stamp" : "Signature",
    };
    checkpoint();
    setObjects((current) => [...current, object]);
    setSelection({ objectId: object.id, pageNumber });
    setFocusedPageNumber(pageNumber);
    clearResult();
  }

  function addSignature(pageOverride?: number, position?: { x: number; y: number }) {
    if (!signatureAsset) {
      openSignatureDetails("signature");
      return;
    }
    addImageObject("signature", pageOverride, position);
  }

  function addStamp(pageOverride?: number, position?: { x: number; y: number }) {
    if (!stampAsset) {
      openSignatureDetails("stamp");
      return;
    }
    addImageObject("stamp", pageOverride, position);
  }

  function addCheckboxObject(pageOverride?: number, position?: { x: number; y: number }) {
    if (!loaded) return null;
    const pageNumber = pageOverride ?? targetPageNumber();
    const object: SignatureObject = {
      id: makeId("sign-object"), pageNumber, type: "checkbox", x: position?.x ?? 0.5, y: position?.y ?? 0.5,
      width: 0.042, height: 0.042, rotation: 0, color: inkColor, checked: true,
      checkboxFillColor: "#ffffff", checkboxStrokeColor: "#334155", checkboxCheckColor: inkColor,
      checkboxCheckScale: 1, checkboxStrokeWidth: 1.4,
      required: false, label: "Checkbox",
    };
    checkpoint();
    setObjects((current) => [...current, object]);
    setSelection({ objectId: object.id, pageNumber });
    setFocusedPageNumber(pageNumber);
    clearResult();
    return object;
  }

  function addTextObject(type: Exclude<SignatureFieldType, "signature" | "stamp" | "checkbox">, pageOverride?: number, position?: { x: number; y: number }) {
    if (!loaded) return null;
    const pageNumber = pageOverride ?? targetPageNumber();
    const page = pageMeta(pageNumber);
    if (!page) return null;
    if (type === "initials" && initialsAsset) {
        const width = 0.16;
        const height = Math.min(0.16, Math.max(0.035, width * initialsAsset.height / initialsAsset.width * page.width / page.height));
        const object: SignatureObject = {
          id: makeId("sign-object"), pageNumber, type, x: position?.x ?? 0.5, y: position?.y ?? 0.5,
          width, height, rotation: 0, assetId: initialsAsset.id, text: signerInitials.trim() || deriveInitials(signerName),
          color: inkColor, fontSize: 24, textStyle: signatureStyleToPdfTextStyle(initialsTypedStyle),
          required: false, label: typeLabel(type),
        };
        checkpoint();
        setObjects((current) => [...current, object]);
        setSelection({ objectId: object.id, pageNumber });
        setFocusedPageNumber(pageNumber);
        clearResult();
        return object;
    }
    const text = type === "initials"
      ? (signerInitials.trim() || deriveInitials(signerName))
      : type === "name"
        ? signerName.trim()
        : type === "date"
          ? new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          : type === "text"
            ? (customText.trim() || "Text")
            : customText.trim();
    if (!text && type !== "input") {
      setMessage(type === "initials" ? "Enter initials or a signer name first." : type === "name" ? "Enter the signer name first." : "Enter the text you want to place.");
      return null;
    }
    const fontSize = type === "initials" ? 24 : type === "date" ? 14 : 18;
    const box = estimateTextBox(text || "Enter value", fontSize, page.width, page.height);
    const object: SignatureObject = {
      id: makeId("sign-object"), pageNumber, type, x: position?.x ?? 0.5, y: position?.y ?? 0.5,
      width: type === "input" ? Math.max(0.24, box.width) : box.width,
      height: type === "input" ? Math.max(0.055, box.height) : box.height,
      rotation: 0, text, color: inkColor,
      fontSize, textStyle: type === "initials" ? signatureStyleToPdfTextStyle(initialsTypedStyle) : textStyle,
      required: type === "input", label: typeLabel(type),
    };
    checkpoint();
    setObjects((current) => [...current, object]);
    setSelection({ objectId: object.id, pageNumber });
    setFocusedPageNumber(pageNumber);
    clearResult();
    return object;
  }

  function addPaletteFieldAt(type: SignatureFieldType, pageNumber: number, position: { x: number; y: number }) {
    if (type === "signature") addSignature(pageNumber, position);
    else if (type === "stamp") addStamp(pageNumber, position);
    else if (type === "checkbox") addCheckboxObject(pageNumber, position);
    else addTextObject(type, pageNumber, position);
  }

  function updateSelected(patch: Partial<SignatureObject>) {
    if (!selectedObject) return;
    const page = pageMeta(selectedObject.pageNumber);
    checkpoint();
    setObjects((current) => current.map((object) => {
      if (object.id !== selectedObject.id) return object;
      const next = { ...object, ...patch };
      if (!page) return next;
      const minimum = minimumObjectSize(next, page.width, page.height);
      return { ...next, width: Math.max(next.width, minimum.width), height: Math.max(next.height, minimum.height) };
    }));
    clearResult();
  }

  function deleteObject(id: string) {
    checkpoint();
    setObjects((current) => current.filter((object) => object.id !== id));
    setSelection((current) => current?.objectId === id ? null : current);
    setInlineEditorObjectId((current) => current === id ? null : current);
    clearResult();
  }

  function duplicateObject(id: string) {
    const source = objects.find((object) => object.id === id);
    if (!source) return;
    const duplicate = { ...source, id: makeId("sign-object"), x: Math.min(0.94, source.x + 0.035), y: Math.min(0.94, source.y + 0.035) };
    checkpoint();
    setObjects((current) => [...current, duplicate]);
    setSelection({ objectId: duplicate.id, pageNumber: duplicate.pageNumber });
    clearResult();
  }

  function rotateObject(id: string) {
    const source = objects.find((object) => object.id === id);
    if (!source) return;
    checkpoint();
    setObjects((current) => current.map((object) => object.id === id ? { ...object, rotation: ((object.rotation + 15 + 180) % 360) - 180 } : object));
    clearResult();
  }

  function beginDrag(event: ReactPointerEvent<SVGRectElement>, object: SignatureObject) {
    event.preventDefault();
    event.stopPropagation();
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const pointerX = (event.clientX - rect.left) / rect.width;
    const pointerY = (event.clientY - rect.top) / rect.height;
    checkpoint();
    setSelection({ objectId: object.id, pageNumber: object.pageNumber });
    setFocusedPageNumber(object.pageNumber);
    setDragState({
      pointerId: event.pointerId,
      objectId: object.id,
      pageNumber: object.pageNumber,
      offsetX: pointerX - object.x,
      offsetY: pointerY - object.y,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<SVGRectElement>) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const svg = event.currentTarget.ownerSVGElement;
    const object = objects.find((item) => item.id === dragState.objectId);
    if (!svg || !object) return;
    const rect = svg.getBoundingClientRect();
    const pointerX = (event.clientX - rect.left) / rect.width;
    const pointerY = (event.clientY - rect.top) / rect.height;
    const page = pageMeta(object.pageNumber);
    const minimum = page ? minimumObjectSize(object, page.width, page.height) : { width: object.width, height: object.height };
    const halfWidth = Math.max(object.width, minimum.width) / 2;
    const halfHeight = Math.max(object.height, minimum.height) / 2;
    let box = {
      x: Math.min(1 - halfWidth, Math.max(halfWidth, pointerX - dragState.offsetX)),
      y: Math.min(1 - halfHeight, Math.max(halfHeight, pointerY - dragState.offsetY)),
      width: Math.max(object.width, minimum.width),
      height: Math.max(object.height, minimum.height),
    };
    let guideX: number | null = null;
    let guideY: number | null = null;
    if (snapEnabled) {
      const peers = objects
        .filter((item) => item.pageNumber === dragState.pageNumber && item.id !== dragState.objectId)
        .map((item) => ({ x: item.x, y: item.y, width: item.width, height: item.height }));
      const snapped = snapNormalizedBox(box, peers);
      box = snapped.box;
      guideX = snapped.guideX;
      guideY = snapped.guideY;
    }
    setAlignmentGuides({ pageNumber: dragState.pageNumber, box, guideX, guideY, mode: "move" });
    setObjects((current) => current.map((item) => item.id === dragState.objectId ? { ...item, x: box.x, y: box.y } : item));
    clearResult();
  }

  function endDrag(event: ReactPointerEvent<SVGRectElement>) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    setDragState(null);
    setAlignmentGuides(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function beginResize(event: ReactPointerEvent<SVGCircleElement>, object: SignatureObject) {
    event.preventDefault();
    event.stopPropagation();
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const page = pageMeta(object.pageNumber);
    const minimum = page ? minimumObjectSize(object, page.width, page.height) : { width: object.width, height: object.height };
    const effectiveWidth = Math.max(object.width, minimum.width);
    const effectiveHeight = Math.max(object.height, minimum.height);
    checkpoint();
    setSelection({ objectId: object.id, pageNumber: object.pageNumber });
    setFocusedPageNumber(object.pageNumber);
    setResizeState({
      pointerId: event.pointerId,
      objectId: object.id,
      pageNumber: object.pageNumber,
      startLeft: object.x - effectiveWidth / 2,
      startTop: object.y - effectiveHeight / 2,
      startCenterX: object.x,
      startCenterY: object.y,
      startWidth: effectiveWidth,
      startHeight: effectiveHeight,
      startFontSize: object.fontSize ?? 18,
      startRotation: object.rotation,
      lockAspect: object.type === "signature" || object.type === "stamp" || object.type === "checkbox" || (object.type === "initials" && Boolean(object.assetId)),
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveResize(event: ReactPointerEvent<SVGCircleElement>) {
    if (!resizeState || resizeState.pointerId !== event.pointerId) return;
    const object = objects.find((item) => item.id === resizeState.objectId);
    const svg = event.currentTarget.ownerSVGElement;
    const page = pageMeta(resizeState.pageNumber);
    if (!object || !svg || !page) return;
    const rect = svg.getBoundingClientRect();
    const pointer = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
    const localPointer = inverseRotatePoint(pointer.x, pointer.y, resizeState.startCenterX, resizeState.startCenterY, resizeState.startRotation);
    const minimum = minimumObjectSize(object, page.width, page.height);
    const constrained = constrainAspectSize({
      startWidth: resizeState.startWidth,
      startHeight: resizeState.startHeight,
      width: localPointer.x - resizeState.startLeft,
      height: localPointer.y - resizeState.startTop,
      minimumWidth: minimum.width,
      minimumHeight: minimum.height,
      maximumWidth: 0.98 - resizeState.startLeft,
      maximumHeight: 0.98 - resizeState.startTop,
      lockAspect: resizeState.lockAspect || event.shiftKey,
    });
    const width = constrained.width;
    const height = constrained.height;
    const x = resizeState.startLeft + width / 2;
    const y = resizeState.startTop + height / 2;
    const resizeBox = { x, y, width, height };
    const resizePeers = objects
      .filter((item) => item.pageNumber === resizeState.pageNumber && item.id !== resizeState.objectId)
      .map((item) => ({ x: item.x, y: item.y, width: item.width, height: item.height }));
    const visualGuides = snapEnabled ? snapNormalizedBox(resizeBox, resizePeers) : null;
    setAlignmentGuides({
      pageNumber: resizeState.pageNumber,
      box: resizeBox,
      guideX: visualGuides?.guideX ?? null,
      guideY: visualGuides?.guideY ?? null,
      mode: "resize",
    });
    const fontScale = Math.max(0.45, height / resizeState.startHeight);
    setObjects((current) => current.map((item) => item.id === resizeState.objectId ? {
      ...item,
      x,
      y,
      width,
      height,
      fontSize: item.type === "signature" || item.type === "stamp" || item.type === "checkbox" || (item.type === "initials" && Boolean(item.assetId))
        ? item.fontSize
        : Math.min(96, Math.max(1, resizeState.startFontSize * fontScale)),
    } : item));
    clearResult();
  }

  function endResize(event: ReactPointerEvent<SVGCircleElement>) {
    if (!resizeState || resizeState.pointerId !== event.pointerId) return;
    setResizeState(null);
    setAlignmentGuides(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function pageObjects(pageNumber: number) {
    return objects.filter((object) => object.pageNumber === pageNumber);
  }

  function releaseScrollSync(delay = 180) {
    if (scrollSyncTimerRef.current !== null) window.clearTimeout(scrollSyncTimerRef.current);
    scrollSyncTimerRef.current = window.setTimeout(() => {
      scrollSyncSourceRef.current = null;
      scrollSyncTimerRef.current = null;
    }, delay);
  }

  function scrollToDocumentPage(pageNumber: number, behavior: ScrollBehavior = "auto") {
    const container = documentScrollRef.current;
    const pageElement = pageElementRefs.current.get(pageNumber);
    if (!container || !pageElement) return;
    scrollSyncSourceRef.current = "strip";
    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const top = pageRect.top - containerRect.top + container.scrollTop - Math.max(12, (container.clientHeight - pageRect.height) / 2);
    const left = pageRect.left - containerRect.left + container.scrollLeft - Math.max(0, (container.clientWidth - pageRect.width) / 2);
    container.scrollTo({ top: Math.max(0, top), left: Math.max(0, left), behavior });
    setFocusedPageNumber(pageNumber);
    releaseScrollSync(120);
  }

  function syncThumbnailToPage(pageNumber: number) {
    const container = pageStripScrollRef.current;
    const element = thumbnailElementRefs.current.get(pageNumber);
    if (!container || !element) return;
    const top = element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 12;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function closestPageNumber<T extends HTMLElement>(container: HTMLElement, elements: Map<number, T>) {
    const containerRect = container.getBoundingClientRect();
    const targetX = containerRect.left + container.clientWidth / 2;
    const targetY = containerRect.top + container.clientHeight / 2;
    let pageNumber = 1;
    let distance = Number.POSITIVE_INFINITY;
    for (const [number, element] of elements) {
      const rect = element.getBoundingClientRect();
      const overlapWidth = Math.max(0, Math.min(rect.right, containerRect.right) - Math.max(rect.left, containerRect.left));
      const overlapHeight = Math.max(0, Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top));
      if (overlapWidth <= 0 || overlapHeight <= 0) continue;
      const nextDistance = Math.hypot(rect.left + rect.width / 2 - targetX, rect.top + rect.height / 2 - targetY);
      if (nextDistance < distance) {
        distance = nextDistance;
        pageNumber = number;
      }
    }
    return pageNumber;
  }

  function handleDocumentScroll() {
    if (scrollSyncSourceRef.current === "strip") return;
    const container = documentScrollRef.current;
    if (!container || pageElementRefs.current.size === 0) return;
    const pageNumber = closestPageNumber(container, pageElementRefs.current);
    if (focusedPageNumber !== pageNumber) {
      setFocusedPageNumber(pageNumber);
      syncThumbnailToPage(pageNumber);
    }
  }


  function handleDocumentWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom((current) => Math.min(200, Math.max(50, current + (event.deltaY < 0 ? 10 : -10))));
  }

  function openObjectEditor(object: SignatureObject) {
    setSelection({ objectId: object.id, pageNumber: object.pageNumber });
    setFocusedPageNumber(object.pageNumber);
    if (object.type === "signature") { openSignatureDetails("signature"); return; }
    if (object.type === "stamp") { openSignatureDetails("stamp"); return; }
    if (object.type === "initials" && object.assetId) { openSignatureDetails("initials"); return; }
    setInlineEditorObjectId(object.id);
    if (object.type === "text" || object.type === "input" || object.type === "name" || object.type === "date" || object.type === "initials") {
      window.requestAnimationFrame(() => { selectedTextInputRef.current?.focus(); selectedTextInputRef.current?.select(); });
    }
  }

  function openObjectColorEditor(object: SignatureObject) {
    if (object.type === "stamp") return;
    setSelection({ objectId: object.id, pageNumber: object.pageNumber });
    setFocusedPageNumber(object.pageNumber);
    if (object.type === "signature") { openSignatureDetails("signature"); return; }
    if (object.type === "initials" && object.assetId) { openSignatureDetails("initials"); return; }
    setInlineEditorObjectId(object.id);
  }

  function openPaletteEditor(type: SignatureFieldType) {
    if (type === "signature") { openSignatureDetails("signature"); return; }
    if (type === "initials") { openSignatureDetails("initials"); return; }
    if (type === "stamp") { openSignatureDetails("stamp"); return; }
    const pageNumber = targetPageNumber();
    const existing = [...objects].reverse().find((object) => object.type === type && object.pageNumber === pageNumber)
      ?? [...objects].reverse().find((object) => object.type === type);
    if (existing) {
      scrollToDocumentPage(existing.pageNumber, "smooth");
      openObjectEditor(existing);
      return;
    }
    if (type === "name" && !signerName.trim()) {
      openSignatureDetails("signature");
      return;
    }
    const created = type === "checkbox" ? addCheckboxObject(pageNumber) : addTextObject(type, pageNumber);
    if (!created) return;
    setInlineEditorObjectId(created.id);
    window.requestAnimationFrame(() => {
      selectedTextInputRef.current?.focus();
      selectedTextInputRef.current?.select();
    });
  }

  async function processPdf() {
    if (!loaded) return;
    if (objects.length === 0) {
      setMessage("Add at least one signature or signing field first.");
      setStatus("error");
      return;
    }
    const incompleteRequired = objects.find((object) => {
      if (!object.required) return false;
      if (object.type === "signature" || object.type === "stamp") return !object.assetId;
      if (object.type === "checkbox") return !object.checked;
      return !(object.text ?? "").trim();
    });
    if (incompleteRequired) {
      setSelection({ objectId: incompleteRequired.id, pageNumber: incompleteRequired.pageNumber });
      setFocusedPageNumber(incompleteRequired.pageNumber);
      setMessage(`Complete the required ${typeLabel(incompleteRequired.type).toLowerCase()} on page ${incompleteRequired.pageNumber}.`);
      setStatus("error");
      return;
    }
    clearResult();
    setStatus("processing");
    setProgress(12);
    setMessage("");
    try {
      const assetInputs: SignatureAssetInput[] = await Promise.all(assets.map(async (asset) => ({
        id: asset.id,
        bytes: await asset.file.arrayBuffer(),
        imageType: asset.imageType,
      })));
      setProgress(42);
      const output = await applyPdfSignatures(await loaded.file.arrayBuffer(), { assets: assetInputs, objects });
      setProgress(88);
      const blob = new Blob([output.bytes as BlobPart], { type: "application/pdf" });
      const name = `${cleanBaseName(outputName)}.pdf`;
      const file = new File([blob], name, { type: "application/pdf", lastModified: Date.now() });
      const next: SignResult = {
        url: URL.createObjectURL(blob), name, size: blob.size, file,
        signedPageCount: output.signedPageCount, objectCount: output.objectCount,
      };
      setResult(next);
      setProgress(100);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The signed PDF could not be created.");
    }
  }

  function renderObject(object: SignatureObject, page: { pageNumber: number; width: number; height: number }, focused: boolean) {
    const centerX = object.x * page.width;
    const centerY = object.y * page.height;
    const minimum = minimumObjectSize(object, page.width, page.height);
    const normalizedWidth = Math.max(object.width, minimum.width);
    const normalizedHeight = Math.max(object.height, minimum.height);
    const width = normalizedWidth * page.width;
    const height = normalizedHeight * page.height;
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    const selected = selection?.objectId === object.id;
    const asset = object.assetId ? assets.find((item) => item.id === object.assetId) : null;
    const imageObject = object.type === "signature" || object.type === "stamp" || (object.type === "initials" && Boolean(object.assetId));
    const displayText = object.type === "input" && !(object.text ?? "").trim() ? "Enter value" : (object.text ?? "");
    return (
      <g key={object.id} transform={`rotate(${object.rotation} ${centerX} ${centerY})`}>
        {imageObject && asset ? (
          <image href={asset.previewUrl} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid meet" />
        ) : object.type === "checkbox" ? (
          <>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={Math.max(1, Math.min(4, width * 0.08))}
              className="sign-checkbox-preview"
              style={{
                fill: object.checkboxFillColor ?? "#ffffff",
                stroke: object.checkboxStrokeColor ?? object.color ?? "#334155",
                strokeWidth: object.checkboxStrokeWidth ?? 1.4,
              }}
            />
            {object.checked && (() => {
              const scale = Math.min(1.35, Math.max(0.35, object.checkboxCheckScale ?? 1));
              const coordinate = (value: number) => 0.5 + (value - 0.5) * scale;
              return <path
                d={`M ${x + width * coordinate(0.18)} ${y + height * coordinate(0.52)} L ${x + width * coordinate(0.42)} ${y + height * coordinate(0.76)} L ${x + width * coordinate(0.84)} ${y + height * coordinate(0.24)}`}
                className="sign-checkbox-check"
                style={{ stroke: object.checkboxCheckColor ?? object.color ?? "#0f766e" }}
              />;
            })()}
          </>
        ) : (
          <>
            {object.type === "input" && <rect x={x} y={y} width={width} height={height} rx={3} className="sign-input-preview" />}
            <text
              x={centerX}
              y={centerY + (object.fontSize ?? 18) * 0.35}
              textAnchor="middle"
              fill={object.type === "input" && !(object.text ?? "").trim() ? "#94a3b8" : (object.color ?? "#111827")}
              fontSize={object.fontSize ?? 18}
              fontWeight={object.textStyle === "bold" ? 800 : 600}
              fontStyle={object.textStyle === "italic" ? "italic" : "normal"}
              fontFamily={object.textStyle === "italic" ? "Georgia, serif" : "Arial, sans-serif"}
              className="sign-preview-text"
            >
              {displayText}
            </text>
          </>
        )}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={Math.min(6, height / 5)}
          className={selected ? "sign-object-hitbox sign-object-hitbox-selected" : "sign-object-hitbox"}
          onPointerDown={(event) => beginDrag(event, object)}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={(event) => {
            event.stopPropagation();
            setSelection({ objectId: object.id, pageNumber: page.pageNumber });
            setFocusedPageNumber(page.pageNumber);
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            setSelection({ objectId: object.id, pageNumber: page.pageNumber });
            setFocusedPageNumber(page.pageNumber);
            openObjectEditor(object);
          }}
        />
        {selected && (
          <>
            <rect x={x} y={y} width={width} height={height} rx={Math.min(6, height / 5)} className="sign-selection-outline" />
            <circle
              cx={x + width}
              cy={y + height}
              r={focused ? 8 : 5}
              className="sign-resize-handle"
              onPointerDown={(event) => beginResize(event, object)}
              onPointerMove={moveResize}
              onPointerUp={endResize}
              onPointerCancel={endResize}
            />
          </>
        )}
      </g>
    );
  }

  if (!editorOpen) {
    return (
      <div id="workspace" className="hero-workspace scroll-mt-28">
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4 sm:px-6">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[var(--brand-strong)]"><FileSignature className="size-5" /></span>
          <div><p className="text-sm font-extrabold text-[var(--ink)]">Sign PDF</p><p className="text-xs text-slate-500">Add signatures and signing fields locally</p></div>
        </div>
        <div className="p-4 sm:p-6">
          <input ref={pdfInputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onPdfInput} />
          <div
            className={`upload-zone ${draggingFile ? "upload-zone-active" : ""}`}
            role="button" tabIndex={0}
            onClick={() => pdfInputRef.current?.click()}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") pdfInputRef.current?.click(); }}
            onDragEnter={(event) => { event.preventDefault(); setDraggingFile(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDraggingFile(false)}
            onDrop={onPdfDrop}
          >
            <span className="upload-icon"><CloudUpload className="size-7" /></span>
            <p className="mt-4 text-lg font-extrabold text-[var(--ink)]">Drop one PDF here</p>
            <p className="mt-1 text-sm text-slate-500">Draw, type, or upload a signature and place fields visually.</p>
            <span className="button button-primary mt-5 pointer-events-none"><UploadCloud className="size-4" /> Choose a PDF</span>
          </div>
          {message && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{message}</p>}
        </div>
      </div>
    );
  }

  const activePageNumber = loaded ? Math.min(loaded.pageCount, Math.max(1, focusedPageNumber ?? 1)) : 1;

  return (
    <div className="organize-editor-shell sign-editor-shell" role="dialog" aria-modal="true" aria-label="Sign PDF workspace">
      <input ref={pdfInputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onPdfInput} />
      <input ref={signatureImageInputRef} type="file" className="sr-only" accept={IMAGE_ACCEPT} onChange={onSignatureImageInput} />
      <input ref={stampImageInputRef} type="file" className="sr-only" accept={IMAGE_ACCEPT} onChange={onSignatureImageInput} />

      <header className="organize-editor-header sign-editor-header">
        <button type="button" className="workspace-header-start-over" onClick={startOver} aria-label="Start over"><RotateCcw className="size-5" /></button>
        <div className="sign-header-copy">
          <h1 className="workspace-header-title">Sign PDF</h1>
          {loaded && <span>{loaded.file.name} · {loaded.pageCount} page{loaded.pageCount === 1 ? "" : "s"}</span>}
        </div>
        {loaded && (
          <div className="sign-header-actions">
            <button type="button" onClick={() => setSetupModal("workflow")}><Users className="size-4" /> Signing workflow</button>
            <button type="button" onClick={() => openSignatureDetails("signature")}><PencilLine className="size-4" /> Signature details</button>
          </div>
        )}
      </header>

      <div className="organize-editor-body sign-editor-body">
        <WorkspaceToolRail
          activeTool={activeTool}
          onToolChange={switchTool}
          onExitWorkspace={goHome}
          onOpenControls={() => setSidebarOpen((value) => !value)}
        />

        {loaded && (
          <aside className="sign-page-strip" aria-label="Document pages">
            <div className="sign-page-strip-heading">
              <strong>Pages</strong>
              <span>{loaded.pageCount}</span>
            </div>
            <div ref={pageStripScrollRef} className="sign-page-strip-scroll">
              {loaded.pages.map((page) => {
                const preview = thumbnails[page.pageNumber];
                const count = pageObjects(page.pageNumber).length;
                const active = activePageNumber === page.pageNumber;
                return (
                  <button
                    key={page.pageNumber}
                    type="button"
                    ref={(element) => { if (element) thumbnailElementRefs.current.set(page.pageNumber, element); else thumbnailElementRefs.current.delete(page.pageNumber); }}
                    className={`sign-page-thumb ${active ? "active" : ""}`}
                    onClick={() => { setSelection(null); scrollToDocumentPage(page.pageNumber); }}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="sign-page-thumb-preview">
                      {preview ? <img src={preview.url} alt="" /> : thumbnailErrors[page.pageNumber] ? <FileText className="size-6" /> : <LoaderCircle className="size-5 animate-spin" />}
                      {count > 0 && <em>{count}</em>}
                    </span>
                    <span>Page {page.pageNumber}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        <main className="organize-canvas-area sign-document-area">
          {loaded && (
            <div className="workspace-generic-zoom sign-document-zoom">
              <WorkspaceZoomControls
                    active={isActive} value={zoom} onChange={setZoom} canUndo={history.canUndo} canRedo={history.canRedo} onUndo={undo} onRedo={redo} currentPage={activePageNumber} pageCount={loaded.pageCount} onPageChange={scrollToDocumentPage} />
            </div>
          )}

          {!loaded ? (
            <div className="workspace-empty-canvas sign-empty-workspace">
              <div
                className={`workspace-empty-upload ${draggingFile ? "workspace-empty-upload-active" : ""}`}
                role="button" tabIndex={0}
                onClick={() => pdfInputRef.current?.click()}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") pdfInputRef.current?.click(); }}
                onDragEnter={(event) => { event.preventDefault(); setDraggingFile(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDraggingFile(false)}
                onDrop={onPdfDrop}
              >
                <span><CloudUpload className="size-8" /></span>
                <strong>Upload a PDF to sign</strong>
                <p>Create a signature, place signing fields, and download a new signed copy.</p>
                <em>Choose a PDF</em>
              </div>
            </div>
          ) : (
            <div
              ref={documentScrollRef}
              className="sign-document-scroll"
              onScroll={handleDocumentScroll}
              onWheel={handleDocumentWheel}
              onClick={() => { setSelection(null); setInlineEditorObjectId(null); }}
            >
              <div className="sign-document-pages">
                {loaded.pages.map((page) => {
                  const preview = thumbnails[page.pageNumber];
                  const mainPreview = mainPagePreviews[page.pageNumber] ?? preview;
                  const pageItems = pageObjects(page.pageNumber);
                  const selectedOnPage = selectedObject?.pageNumber === page.pageNumber ? selectedObject : null;
                  return (
                    <article
                      key={page.pageNumber}
                      ref={(element) => { if (element) pageElementRefs.current.set(page.pageNumber, element); else pageElementRefs.current.delete(page.pageNumber); }}
                      className={`sign-document-page ${paletteDragType ? "sign-document-page-drop-ready" : ""} ${activePageNumber === page.pageNumber ? "active" : ""}`}
                      style={{ width: `${zoom}%`, maxWidth: `${72 * zoom / 100}rem` }}
                      data-page-number={page.pageNumber}
                      data-novapdf-view-page={page.pageNumber}
                      onClick={(event) => { event.stopPropagation(); setFocusedPageNumber(page.pageNumber); setSelection(null); setInlineEditorObjectId(null); }}
                    >
                      <div
                        className="sign-document-paper"
                        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
                        onDrop={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const type = (event.dataTransfer.getData("application/x-novapdf-sign-field") || event.dataTransfer.getData("text/plain") || paletteDragType) as SignatureFieldType | null;
                          if (!type) return;
                          const svg = event.currentTarget.querySelector("svg");
                          if (!svg) return;
                          const rect = svg.getBoundingClientRect();
                          const x = Math.min(0.96, Math.max(0.04, (event.clientX - rect.left) / rect.width));
                          const y = Math.min(0.96, Math.max(0.04, (event.clientY - rect.top) / rect.height));
                          addPaletteFieldAt(type, page.pageNumber, { x, y });
                          setPaletteDragType(null);
                        }}
                      >
                        {mainPreview ? (
                          <svg
                            className="watermark-page-stage sign-page-stage"
                            viewBox={`0 0 ${page.width} ${page.height}`}
                            preserveAspectRatio="xMidYMid meet"
                            aria-label={`Signing preview for page ${page.pageNumber}`}
                            onClick={(event) => { event.stopPropagation(); setFocusedPageNumber(page.pageNumber); setSelection(null); setInlineEditorObjectId(null); }}
                            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const type = (event.dataTransfer.getData("application/x-novapdf-sign-field") || event.dataTransfer.getData("text/plain") || paletteDragType) as SignatureFieldType | null;
                              if (!type) return;
                              const rect = event.currentTarget.getBoundingClientRect();
                              const x = Math.min(0.96, Math.max(0.04, (event.clientX - rect.left) / rect.width));
                              const y = Math.min(0.96, Math.max(0.04, (event.clientY - rect.top) / rect.height));
                              addPaletteFieldAt(type, page.pageNumber, { x, y });
                              setPaletteDragType(null);
                            }}
                          >
                            <image href={mainPreview.url} x="0" y="0" width={page.width} height={page.height} preserveAspectRatio="none" />
                            {alignmentGuides?.pageNumber === page.pageNumber && (
                              <WorkspaceInteractionOverlay pageWidth={page.width} pageHeight={page.height} state={alignmentGuides} />
                            )}
                            {pageItems.map((object) => renderObject(object, page, true))}
                          </svg>
                        ) : thumbnailErrors[page.pageNumber] ? (
                          <div className="split-editor-preview-fallback"><FileText className="size-8" /><span>Preview unavailable</span></div>
                        ) : (
                          <div className="split-editor-preview-fallback"><LoaderCircle className="size-7 animate-spin" /><span>Rendering page</span></div>
                        )}

                        {selectedOnPage && (
                          <div
                            className={`sign-object-toolbar sign-object-toolbar-large ${selectedOnPage.type !== "stamp" ? "has-colour" : "image-actions"}`}
                            style={{ left: `${selectedOnPage.x * 100}%`, top: `${Math.max(0.04, selectedOnPage.y - selectedOnPage.height / 2 - 0.035) * 100}%` }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button type="button" onClick={() => openObjectEditor(selectedOnPage)} title={`Edit ${typeLabel(selectedOnPage.type).toLowerCase()}`}><PencilLine className="size-4" /></button>
                            {selectedOnPage.type !== "stamp" && <button type="button" onClick={() => openObjectColorEditor(selectedOnPage)} title="Change color"><Palette className="size-4" /></button>}
                            <button type="button" onClick={() => rotateObject(selectedOnPage.id)} title="Rotate 15 degrees"><RotateCw className="size-4" /></button>
                            <button type="button" onClick={() => duplicateObject(selectedOnPage.id)} title="Duplicate"><Copy className="size-4" /></button>
                            <button type="button" className="danger" onClick={() => deleteObject(selectedOnPage.id)} title="Delete"><Trash2 className="size-4" /></button>
                          </div>
                        )}

                        {selectedOnPage && inlineEditorObject?.id === selectedOnPage.id && (
                          <div
                            className="sign-inline-editor"
                            style={{
                              left: `${Math.min(76, Math.max(24, selectedOnPage.x * 100))}%`,
                              top: `${selectedOnPage.y > 0.58 ? Math.max(3, (selectedOnPage.y - selectedOnPage.height / 2) * 100 - 30) : Math.min(70, (selectedOnPage.y + selectedOnPage.height / 2) * 100 + 4)}%`,
                            }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <header><div><strong>Edit {typeLabel(selectedOnPage.type)}</strong><span>Page {selectedOnPage.pageNumber}</span></div><button type="button" onClick={() => setInlineEditorObjectId(null)} aria-label="Close editor"><X className="size-4" /></button></header>
                            {selectedOnPage.type !== "signature" && selectedOnPage.type !== "stamp" && selectedOnPage.type !== "checkbox" && !(selectedOnPage.type === "initials" && selectedOnPage.assetId) && (
                              <label>Content<input ref={selectedTextInputRef} value={selectedOnPage.text ?? ""} placeholder={selectedOnPage.type === "input" ? "Enter a value" : "Edit text"} onChange={(event) => updateSelected({ text: event.target.value.slice(0, 240) })} /></label>
                            )}
                            <div className="sign-inline-grid">
                              {selectedOnPage.type !== "signature" && selectedOnPage.type !== "stamp" && selectedOnPage.type !== "checkbox" && !(selectedOnPage.type === "initials" && selectedOnPage.assetId) && (
                                <>
                                  <label>Font size<input type="number" min={1} max={96} value={Math.round(selectedOnPage.fontSize ?? 18)} onChange={(event) => updateSelected({ fontSize: Math.min(96, Math.max(1, Number(event.target.value) || 18)) })} /></label>
                                  <label>Style<select value={selectedOnPage.textStyle ?? "regular"} onChange={(event) => updateSelected({ textStyle: event.target.value as SignatureTextStyle })}><option value="regular">Regular</option><option value="bold">Bold</option><option value="italic">Italic</option></select></label>
                                </>
                              )}
                              <label>Rotation<input type="number" min={-180} max={180} value={Math.round(selectedOnPage.rotation)} onChange={(event) => updateSelected({ rotation: Math.min(180, Math.max(-180, Number(event.target.value) || 0)) })} /></label>
                              {!(selectedOnPage.type === "signature" || selectedOnPage.type === "stamp" || selectedOnPage.type === "checkbox" || (selectedOnPage.type === "initials" && selectedOnPage.assetId)) && <label>Color<input type="color" value={selectedOnPage.color ?? inkColor} onChange={(event) => updateSelected({ color: event.target.value })} /></label>}
                            </div>
                            <label>Field label<input value={selectedOnPage.label ?? typeLabel(selectedOnPage.type)} onChange={(event) => updateSelected({ label: event.target.value.slice(0, 80) })} /></label>
                            {selectedOnPage.type === "checkbox" && (
                              <div className="sign-checkbox-editor-controls">
                                <label className="sign-inline-check"><input type="checkbox" checked={Boolean(selectedOnPage.checked)} onChange={(event) => updateSelected({ checked: event.target.checked })} /> Checked</label>
                                <div className="sign-inline-grid sign-checkbox-color-grid">
                                  <label>Check color<input type="color" value={selectedOnPage.checkboxCheckColor ?? selectedOnPage.color ?? inkColor} onChange={(event) => updateSelected({ checkboxCheckColor: event.target.value, color: event.target.value })} /></label>
                                  <label>Box background<input type="color" value={selectedOnPage.checkboxFillColor ?? "#ffffff"} onChange={(event) => updateSelected({ checkboxFillColor: event.target.value })} /></label>
                                  <label>Border color<input type="color" value={selectedOnPage.checkboxStrokeColor ?? "#334155"} onChange={(event) => updateSelected({ checkboxStrokeColor: event.target.value })} /></label>
                                  <label>Border width<input type="number" min={0.2} max={12} step={0.2} value={selectedOnPage.checkboxStrokeWidth ?? 1.4} onChange={(event) => updateSelected({ checkboxStrokeWidth: Math.min(12, Math.max(0.2, Number(event.target.value) || 1.4)) })} /></label>
                                </div>
                                <label className="sign-checkbox-size-control"><span>Check size</span><input type="range" min={35} max={135} step={1} value={Math.round((selectedOnPage.checkboxCheckScale ?? 1) * 100)} onChange={(event) => updateSelected({ checkboxCheckScale: Number(event.target.value) / 100 })} /><output>{Math.round((selectedOnPage.checkboxCheckScale ?? 1) * 100)}%</output></label>
                              </div>
                            )}
                            <div className="sign-inline-checks"><label><input type="checkbox" checked={Boolean(selectedOnPage.required)} onChange={(event) => updateSelected({ required: event.target.checked })} /> Required</label><label><input type="checkbox" checked={snapEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} /> Snap</label></div><p className="workspace-interaction-help">Drag to see alignment rulers and live distances. Hold Shift while resizing to preserve the current aspect ratio.</p>
                            <div className="sign-inline-actions"><button type="button" onClick={() => rotateObject(selectedOnPage.id)}><RotateCw className="size-4" /> Rotate</button><button type="button" onClick={() => duplicateObject(selectedOnPage.id)}><Copy className="size-4" /> Duplicate</button><button type="button" className="danger" onClick={() => deleteObject(selectedOnPage.id)}><Trash2 className="size-4" /> Delete</button></div>
                            <footer className="sign-inline-editor-footer"><button type="button" onClick={() => setInlineEditorObjectId(null)}>Done</button></footer>
                          </div>
                        )}
                      </div>
                      <footer>Page {page.pageNumber}</footer>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
          {loaded && (
            <div className="sign-document-pagebar sign-document-pagebar-bottom" onClick={(event) => event.stopPropagation()}>
              <button type="button" disabled={activePageNumber <= 1} onClick={() => { setSelection(null); scrollToDocumentPage(activePageNumber - 1); }} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
              <span>Page <strong>{activePageNumber}</strong> of {loaded.pageCount}</span>
              <button type="button" disabled={activePageNumber >= loaded.pageCount} onClick={() => { setSelection(null); scrollToDocumentPage(activePageNumber + 1); }} aria-label="Next page"><ChevronRight className="size-4" /></button>
            </div>
          )}
        </main>

        <aside className={`organize-sidebar sign-options-sidebar ${sidebarOpen ? "organize-sidebar-open" : ""}`}>
          <div className="organize-sidebar-scroll sign-options-scroll">
            <div className="sign-options-heading">
              <div><p>NovaPDF workspace</p><h2>Signing options</h2></div>
              {loaded && <button type="button" onClick={() => openSignatureDetails("signature")}><PencilLine className="size-4" /> Edit</button>}
            </div>

            {loaded && (
              <>
                <div className="sign-options-section">
                  <h3>Type</h3>
                  <div className="sign-type-choice">
                    <button type="button" className="active"><PenLine className="size-5" /><span>Simple signature</span></button>
                    <button type="button" disabled><ShieldCheck className="size-5" /><span>Digital signature</span><em>Future</em></button>
                  </div>
                </div>

                <div className="sign-profile-card">
                  <span><UserRound className="size-5" /></span>
                  <div><strong>{signerName || "Signer details not set"}</strong><small>{signerInitials ? `Initials: ${signerInitials}` : "Add your name, initials, and signature"}</small></div>
                  <button type="button" onClick={() => openSignatureDetails("signature")}><PencilLine className="size-4" /></button>
                </div>

                <div className="sign-options-section">
                  <div className="organize-side-heading"><h3>Required fields</h3><span>Drag or click</span></div>
                  <div
                    draggable
                    className="sign-palette-row required"
                    onDragStart={(event) => beginPaletteDrag(event, "signature")}
                    onDragEnd={finishPaletteDrag}
                  >
                    <button type="button" className="sign-palette-main" onClick={() => addSignature()}>
                      <GripVertical className="size-4" /><span className="sign-palette-icon"><FileSignature className="size-4" /></span><span><small>Signature</small><strong>{signatureAsset ? signatureAsset.label : "Create signature"}</strong></span>
                    </button>
                    <button type="button" className="sign-palette-edit" onClick={() => openSignatureDetails("signature")} aria-label="Edit signature"><PencilLine className="size-4" /></button>
                  </div>
                </div>

                <div className="sign-options-section">
                  <div className="organize-side-heading"><h3>Optional fields</h3><span>Page {activePageNumber}</span></div>
                  <div className="sign-palette-list">
                    {([
                      ["initials", "Initials", PenLine],
                      ["name", "Name", UserRound],
                      ["date", "Date", CalendarDays],
                      ["text", "Text", Type],
                      ["input", "Input field", FileText],
                      ["checkbox", "Checkbox", CheckSquare2],
                      ["stamp", "Company stamp", Stamp],
                    ] as const).map(([type, label, Icon]) => {
                      const count = objects.filter((object) => object.type === type).length;
                      return (
                        <div
                          key={type}
                          draggable
                          className="sign-palette-row"
                          onDragStart={(event) => beginPaletteDrag(event, type)}
                          onDragEnd={finishPaletteDrag}
                        >
                          <button
                            type="button"
                            className="sign-palette-main"
                            onClick={() => {
                              if (type === "stamp") addStamp();
                              else if (type === "checkbox") addCheckboxObject();
                              else addTextObject(type);
                            }}
                          >
                            <GripVertical className="size-4" /><span className="sign-palette-icon"><Icon className="size-4" /></span><strong>{label}</strong>
                          </button>
                          <span className="sign-palette-meta">
                            {count > 0 && <span className="sign-palette-count">{count}</span>}
                            <button type="button" className="sign-palette-edit" onClick={() => openPaletteEditor(type)} aria-label={`Edit ${label}`}><PencilLine className="size-4" /></button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>


                <div className="sign-options-section sign-output-panel">
                  <div className="sign-filename-control">
                    <div><strong>Output file name</strong><span>Rename the signed copy before download.</span></div>
                    <label className="sign-filename-input-row">
                      <input aria-label="Output file name" value={outputName} onChange={(event) => setOutputName(event.target.value.slice(0, 90))} placeholder="signed-document" />
                      <span>.pdf</span>
                    </label>
                  </div>
                  <div className="split-editor-info sign-output-summary">{objects.length} field{objects.length === 1 ? "" : "s"} across {new Set(objects.map((object) => object.pageNumber)).size} page{new Set(objects.map((object) => object.pageNumber)).size === 1 ? "" : "s"}.</div>
                  {status === "processing" && <div className="organize-progress mt-3"><span style={{ width: `${progress}%` }} /></div>}
                  {status !== "success" && (
                    <button type="button" className="button button-dark mt-3 w-full" disabled={objects.length === 0 || status === "processing"} onClick={() => void processPdf()}>
                      {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Sign PDF
                    </button>
                  )}
                </div>

                {result && <WorkspaceResultCard title="Signed PDF is ready" summary={`${result.objectCount} field${result.objectCount === 1 ? "" : "s"} added across ${result.signedPageCount} page${result.signedPageCount === 1 ? "" : "s"} · ${formatBytes(result.size)}`} downloads={downloads} />}
              </>
            )}

            {message && <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>}
            <div className="organize-privacy-note"><LockKeyhole className="size-4" /> PDF signing stays in this browser. This build creates a visual signature, not a certificate-based digital signature.</div>
          </div>
        </aside>
      </div>

      {loaded && setupModal === "workflow" && (
        <div className="sign-setup-overlay" role="presentation">
          <section className="sign-setup-modal sign-workflow-modal" role="dialog" aria-modal="true" aria-labelledby="sign-workflow-title">
            <header><h2 id="sign-workflow-title">Who will sign this document?</h2></header>
            <div className="sign-workflow-modal-grid">
              <button type="button" onClick={() => { setDetailsTab("signature"); setSourceMode("type"); setSetupModal("details"); }}>
                <span className="sign-workflow-illustration"><UserCheck className="size-14" /><PenLine className="size-7" /></span>
                <strong>Only me</strong>
                <small>Sign this document yourself</small>
              </button>
              <button type="button" disabled>
                <span className="sign-workflow-illustration"><Users className="size-14" /></span>
                <strong>Several people</strong>
                <small>Invite others to sign</small>
                <em>Backend phase</em>
              </button>
            </div>
            <footer>Uploaded document: <strong>{loaded.file.name}</strong></footer>
          </section>
        </div>
      )}

      {loaded && setupModal === "details" && (
        <div className="sign-setup-overlay" role="presentation">
          <section className="sign-setup-modal sign-details-modal" role="dialog" aria-modal="true" aria-labelledby="sign-details-title">
            <header className="sign-details-header">
              <div><h2 id="sign-details-title">Set your signature details</h2><p>Enter your name, then create a signature and initials for this document.</p></div>
              <button type="button" onClick={() => setSetupModal("workflow")} aria-label="Back to signing workflow"><X className="size-5" /></button>
            </header>

            <div className="sign-details-identity">
              <span><UserRound className="size-5" /></span>
              <label>Full name<input value={signerName} onChange={(event) => {
                const nextName = event.target.value.slice(0, 100);
                setSignerName(nextName);
                setTypedSignature(nextName.slice(0, 80));
                if (!initialsManuallyEdited) setSignerInitials(deriveInitials(nextName));
              }} placeholder="Your name" /></label>
              <label>Initials<input value={signerInitials} onChange={(event) => {
                const nextInitials = event.target.value.slice(0, 8).toUpperCase();
                if (!nextInitials) {
                  setInitialsManuallyEdited(false);
                  setSignerInitials(deriveInitials(signerName));
                  return;
                }
                setInitialsManuallyEdited(true);
                setSignerInitials(nextInitials);
              }} placeholder="Auto from name" /></label>
            </div>

            <div className="sign-details-tabs" role="tablist">
              <button type="button" className={detailsTab === "signature" ? "active" : ""} onClick={() => { setDetailsTab("signature"); setSourceMode("type"); }}><PenLine className="size-4" /> Signature</button>
              <button type="button" className={detailsTab === "initials" ? "active" : ""} onClick={() => { setDetailsTab("initials"); setInitialsSourceMode("type"); }}><Type className="size-4" /> Initials</button>
              <button type="button" className={detailsTab === "stamp" ? "active" : ""} onClick={() => setDetailsTab("stamp")}><Stamp className="size-4" /> Company stamp</button>
            </div>

            <div className="sign-details-content">
              {detailsTab === "signature" && (
                <>
                  <nav className="sign-details-source-nav" aria-label="Signature source">
                    {(["type", "draw", "upload"] as SignatureSourceMode[]).map((mode) => (
                      <button key={mode} type="button" className={sourceMode === mode ? "active" : ""} onClick={() => { setSourceMode(mode); if (mode === "type" && !typedSignature) setTypedSignature(signerName); }}>
                        {mode === "type" ? <Type className="size-5" /> : mode === "draw" ? <PenLine className="size-5" /> : <UploadCloud className="size-5" />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="sign-details-source-panel">
                    {sourceMode === "type" && (
                      <div className="sign-details-type-list">
                        <div className="sign-style-scroll" role="radiogroup" aria-label="Typed signature styles">
                          {TYPED_SIGNATURE_STYLES.map((style) => (
                            <button key={style.id} type="button" role="radio" aria-checked={signatureTypedStyle === style.id} className={signatureTypedStyle === style.id ? "active" : ""} onClick={() => setSignatureTypedStyle(style.id)}>
                              <span className="sign-details-radio" />
                              <span className="sign-style-preview">
                                <strong style={signatureStylePreview(style.id, inkColor)}>{typedSignature || signerName || "Signature"}</strong>
                                <small>{style.label}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="sign-ink-palette" role="group" aria-label="Signature color">
                          <span>Color:</span>
                          {SIGNATURE_INK_PALETTE.map((color) => (
                            <button key={color} type="button" className={inkColor === color ? "active" : ""} style={{ backgroundColor: color }} onClick={() => setInkColor(color)} aria-label={`Use ${color} signature color`} aria-pressed={inkColor === color} />
                          ))}
                        </div>
                      </div>
                    )}
                    {sourceMode === "draw" && (
                      <div className="sign-details-draw-panel">
                        <canvas ref={drawCanvasRef} width={720} height={240} className="sign-draw-canvas" onPointerDown={drawPointerDown} onPointerMove={drawPointerMove} onPointerUp={drawPointerEnd} onPointerCancel={drawPointerEnd} />
                        <div className="sign-inline-actions"><button type="button" onClick={() => clearDrawing("signature")}>Clear</button><button type="button" className="primary" onClick={() => void createDrawnAsset("signature")}>Use drawing</button></div>
                      </div>
                    )}
                    {sourceMode === "upload" && (
                      <div className="sign-details-upload-panel">
                        <button type="button" className="watermark-image-upload" onClick={() => { setPendingAssetKind("signature"); signatureImageInputRef.current?.click(); }}><span><UploadCloud className="size-5" /></span><span><strong>Upload signature image</strong><small>PNG, JPG, JPEG, or WebP</small></span></button>
                        <label className="sign-checkbox"><input type="checkbox" checked={removeWhite} onChange={(event) => setRemoveWhite(event.target.checked)} /><span>Remove a plain white background</span></label>
                      </div>
                    )}
                  </div>
                </>
              )}

              {detailsTab === "initials" && (
                <>
                  <nav className="sign-details-source-nav" aria-label="Initials source">
                    {(["type", "draw", "upload"] as SignatureSourceMode[]).map((mode) => (
                      <button key={mode} type="button" className={initialsSourceMode === mode ? "active" : ""} onClick={() => setInitialsSourceMode(mode)}>
                        {mode === "type" ? <Type className="size-5" /> : mode === "draw" ? <PenLine className="size-5" /> : <UploadCloud className="size-5" />}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="sign-details-source-panel sign-details-initials-source-panel">
                    {initialsSourceMode === "type" && (
                      <div className="sign-details-type-list">
                        <div className="sign-initial-style-list sign-style-scroll" role="radiogroup" aria-label="Initials styles">
                          {TYPED_SIGNATURE_STYLES.map((style) => (
                            <button key={style.id} type="button" role="radio" aria-checked={initialsTypedStyle === style.id} className={initialsTypedStyle === style.id ? "active" : ""} onClick={() => setInitialsTypedStyle(style.id)}>
                              <span className="sign-details-radio" />
                              <span className="sign-style-preview">
                                <strong style={signatureStylePreview(style.id, inkColor)}>{signerInitials || deriveInitials(signerName) || "AB"}</strong>
                                <small>{style.label}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="sign-ink-palette" role="group" aria-label="Initials color">
                          <span>Color:</span>
                          {SIGNATURE_INK_PALETTE.map((color) => (
                            <button key={color} type="button" className={inkColor === color ? "active" : ""} style={{ backgroundColor: color }} onClick={() => setInkColor(color)} aria-label={`Use ${color} initials color`} aria-pressed={inkColor === color} />
                          ))}
                        </div>
                      </div>
                    )}
                    {initialsSourceMode === "draw" && (
                      <div className="sign-details-draw-panel">
                        <canvas ref={initialsDrawCanvasRef} width={720} height={240} className="sign-draw-canvas" onPointerDown={drawPointerDown} onPointerMove={drawPointerMove} onPointerUp={drawPointerEnd} onPointerCancel={drawPointerEnd} />
                        <div className="sign-inline-actions"><button type="button" onClick={() => clearDrawing("initials")}>Clear</button><button type="button" className="primary" onClick={() => void createDrawnAsset("initials")}>Use drawing</button></div>
                      </div>
                    )}
                    {initialsSourceMode === "upload" && (
                      <div className="sign-details-upload-panel">
                        <button type="button" className="watermark-image-upload" onClick={() => { setPendingAssetKind("initials"); signatureImageInputRef.current?.click(); }}><span><UploadCloud className="size-5" /></span><span><strong>Upload initials image</strong><small>PNG, JPG, JPEG, or WebP</small></span></button>
                        <label className="sign-checkbox"><input type="checkbox" checked={removeWhite} onChange={(event) => setRemoveWhite(event.target.checked)} /><span>Remove a plain white background</span></label>
                      </div>
                    )}
                  </div>
                </>
              )}

              {detailsTab === "stamp" && (
                <div className="sign-details-stamp-panel">
                  <button type="button" className="watermark-image-upload" onClick={() => { setPendingAssetKind("stamp"); stampImageInputRef.current?.click(); }}><span><Stamp className="size-5" /></span><span><strong>Upload company stamp</strong><small>PNG, JPG, JPEG, or WebP</small></span></button>
                  {stampAsset ? <div className="sign-details-active-asset"><img src={stampAsset.previewUrl} alt="Selected company stamp" /><div><strong>{stampAsset.label}</strong><small>Ready to place</small></div><button type="button" onClick={() => void saveActiveAsset(stampAsset)}><BookmarkPlus className="size-4" /> Save</button></div> : <p className="sign-details-empty-note">Upload or select a saved company stamp.</p>}
                </div>
              )}
            </div>

            {savedAssets.length > 0 && (
              <div className="sign-details-saved-row">
                <strong>Saved in this browser</strong>
                <div>{savedAssets.map((record) => <span key={record.id} className="sign-details-saved-item"><button type="button" onClick={() => restoreSavedAsset(record)}><img src={record.dataUrl} alt="" /><span>{record.label}</span></button><button type="button" className="sign-details-saved-delete" onClick={() => deleteSavedAsset(record.id)} aria-label={`Delete ${record.label}`}><Trash2 className="size-3.5" /></button></span>)}</div>
              </div>
            )}

            {message && <div className="sign-details-message"><CircleAlert className="size-4" /><span>{message}</span></div>}
            <footer className="sign-details-footer"><button type="button" onClick={() => void applySignerSetup()}>Apply</button></footer>
          </section>
        </div>
      )}
    </div>
  );
}
