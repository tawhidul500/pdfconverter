/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CircleAlert,
  FilePlus2,
  GripVertical,
  ImagePlus,
  LayoutTemplate,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties } from "react";
import { WorkspaceResultCard } from "@/components/workspace-result-card";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { useWorkspaceHistory } from "@/hooks/use-workspace-history";
import { type PdfTool } from "@/data/tools";
import {
  WORKSPACE_FILE_TRANSFER_EVENT,
  transferWorkspaceFiles,
  type WorkspaceFileTransferDetail,
} from "@/lib/workspace-file-transfer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const MAX_FILES = 30;
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
const A4: [number, number] = [595.28, 841.89];
const LETTER: [number, number] = [612, 792];

type PageSizeMode = "auto" | "a4" | "letter";
type OrientationMode = "auto" | "portrait" | "landscape";
type MarginMode = "none" | "small" | "large";
type FitMode = "contain" | "cover";
type ConvertStatus = "idle" | "reading" | "processing" | "success" | "error";
type Rotation = 0 | 90 | 180 | 270;

type ImageItem = {
  id: string;
  file: File;
  width: number;
  height: number;
  rotation: Rotation;
  preview: string;
};

type ConvertResult = {
  url: string;
  name: string;
  pageCount: number;
  size: number;
  file: File;
};

type JpgHistoryState = {
  items: ImageItem[];
  pageSize: PageSizeMode;
  orientation: OrientationMode;
  margin: MarginMode;
  fit: FitMode;
  outputName: string;
};

function cloneJpgHistory(value: JpgHistoryState): JpgHistoryState {
  return {
    ...value,
    items: value.items.map((item) => ({ ...item })),
  };
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function isImageFile(file: File) {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)
  );
}

function safeOutputName(value: string) {
  const cleaned = value
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 100)
    .trim();
  return `${cleaned || "NovaPDF-images"}.pdf`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image preview."));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image conversion failed."))),
      type,
      quality,
    );
  });
}

async function preparedImageBytes(item: ImageItem) {
  const lowerName = item.file.name.toLowerCase();
  const isJpeg = item.file.type === "image/jpeg" || /\.jpe?g$/i.test(lowerName);
  const isPng = item.file.type === "image/png" || /\.png$/i.test(lowerName);

  if (item.rotation === 0 && (isJpeg || isPng)) {
    return {
      bytes: await item.file.arrayBuffer(),
      kind: isJpeg ? ("jpg" as const) : ("png" as const),
      width: item.width,
      height: item.height,
    };
  }

  const bitmap = await createImageBitmap(item.file);
  const rotated = item.rotation === 90 || item.rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = rotated ? bitmap.height : bitmap.width;
  canvas.height = rotated ? bitmap.width : bitmap.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    bitmap.close();
    throw new Error("Canvas is unavailable in this browser.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((item.rotation * Math.PI) / 180);
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  bitmap.close();

  const outputType: "image/png" | "image/jpeg" = isPng ? "image/png" : "image/jpeg";
  const blob = await canvasToBlob(canvas, outputType, outputType === "image/jpeg" ? 0.94 : undefined);
  return {
    bytes: await blob.arrayBuffer(),
    kind: outputType === "image/jpeg" ? ("jpg" as const) : ("png" as const),
    width: canvas.width,
    height: canvas.height,
  };
}

function marginPoints(mode: MarginMode) {
  if (mode === "small") return 24;
  if (mode === "large") return 48;
  return 0;
}

function resolvePageSize(
  pageSize: PageSizeMode,
  orientation: OrientationMode,
  imageWidth: number,
  imageHeight: number,
  margin: number,
): [number, number] {
  let width: number;
  let height: number;

  if (pageSize === "a4") {
    [width, height] = A4;
  } else if (pageSize === "letter") {
    [width, height] = LETTER;
  } else {
    const longest = Math.max(imageWidth, imageHeight);
    const targetLongest = Math.min(842, Math.max(480, longest * 0.75));
    const scale = targetLongest / longest;
    width = imageWidth * scale + margin * 2;
    height = imageHeight * scale + margin * 2;
  }

  const imageLandscape = imageWidth > imageHeight;
  const desiredLandscape = orientation === "landscape" || (orientation === "auto" && imageLandscape);
  const currentlyLandscape = width > height;
  if (desiredLandscape !== currentlyLandscape) [width, height] = [height, width];

  return [Math.max(width, 144), Math.max(height, 144)];
}

function resolveLivePreview(
  item: ImageItem,
  pageSize: PageSizeMode,
  orientation: OrientationMode,
  margin: MarginMode,
) {
  const sideways = item.rotation === 90 || item.rotation === 270;
  const imageWidth = sideways ? item.height : item.width;
  const imageHeight = sideways ? item.width : item.height;
  const marginValue = marginPoints(margin);
  const [pageWidth, pageHeight] = resolvePageSize(
    pageSize,
    orientation,
    imageWidth,
    imageHeight,
    marginValue,
  );
  const marginPercent = Math.min(14, (marginValue / Math.min(pageWidth, pageHeight)) * 100);
  const actualOrientation = pageWidth > pageHeight ? "Landscape" : "Portrait";
  const sizeLabel = pageSize === "auto" ? "Auto" : pageSize === "a4" ? "A4" : "Letter";

  return {
    pageWidth,
    pageHeight,
    marginPercent,
    actualOrientation,
    sizeLabel,
    sideways,
  };
}

export function JpgToPdfWorkspace({
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
  const dragItemId = useRef<string | null>(null);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<ConvertStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [outputName, setOutputName] = useState("NovaPDF-images");
  const [pageSize, setPageSize] = useState<PageSizeMode>("a4");
  const [orientation, setOrientation] = useState<OrientationMode>("auto");
  const [margin, setMargin] = useState<MarginMode>("small");
  const [fit, setFit] = useState<FitMode>("contain");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [zoom, setZoom] = useState(100);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const history = useWorkspaceHistory<JpgHistoryState>(cloneJpgHistory);

  const editorOpen = workspaceStarted || startInWorkspace;
  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);

  function currentHistoryState(): JpgHistoryState {
    return { items, pageSize, orientation, margin, fit, outputName };
  }

  function applyHistoryState(value: JpgHistoryState) {
    clearResult();
    setItems(value.items.map((item) => ({ ...item })));
    setPageSize(value.pageSize);
    setOrientation(value.orientation);
    setMargin(value.margin);
    setFit(value.fit);
    setOutputName(value.outputName);
    setSelectedItemId((current) => value.items.some((item) => item.id === current) ? current : null);
    setMessage("");
  }

  function undoWorkspace() {
    history.undo(currentHistoryState(), applyHistoryState);
  }

  function redoWorkspace() {
    history.redo(currentHistoryState(), applyHistoryState);
  }

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [editorOpen, isActive]);

  useEffect(
    () => () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    },
    [result],
  );



  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function resetFields() {
    clearResult();
    setItems([]);
    setMessage("");
    setOutputName("NovaPDF-images");
    setPageSize("a4");
    setOrientation("auto");
    setMargin("small");
    setFit("contain");
    setSidebarOpen(false);
    setStatus("idle");
    setZoom(100);
    setSelectedItemId(null);
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
    window.requestAnimationFrame(() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function addFiles(incoming: File[], replaceExisting = false) {
    if (replaceExisting) {
      resetFields();
      setWorkspaceStarted(true);
    }
    if (!incoming.length) return;

    clearResult();
    setMessage("");
    setStatus("reading");
    setWorkspaceStarted(true);

    const baseItems = replaceExisting ? [] : items;
    const availableSlots = MAX_FILES - baseItems.length;
    if (availableSlots <= 0) {
      setStatus("error");
      setMessage(`You can add up to ${MAX_FILES} images.`);
      return;
    }

    const accepted: ImageItem[] = [];
    const errors: string[] = [];
    let runningTotal = replaceExisting ? 0 : totalSize;

    for (const file of incoming.slice(0, availableSlots)) {
      const duplicate = [...baseItems, ...accepted].some(
        (item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified,
      );
      if (duplicate) {
        errors.push(`${file.name}: already added`);
        continue;
      }
      if (!isImageFile(file)) {
        errors.push(`${file.name}: use JPG, PNG, or WebP`);
        continue;
      }
      if (!file.size) {
        errors.push(`${file.name}: empty image`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: larger than 50 MB`);
        continue;
      }
      if (runningTotal + file.size > MAX_TOTAL_SIZE) {
        errors.push(`${file.name}: total would exceed 150 MB`);
        continue;
      }

      try {
        const bitmap = await createImageBitmap(file);
        if (!bitmap.width || !bitmap.height) throw new Error("invalid image");
        const width = bitmap.width;
        const height = bitmap.height;
        bitmap.close();
        accepted.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          width,
          height,
          rotation: 0,
          preview: await fileToDataUrl(file),
        });
        runningTotal += file.size;
      } catch {
        errors.push(`${file.name}: damaged or unsupported image`);
      }
    }

    if (accepted.length) {
      if (!replaceExisting) history.checkpoint(currentHistoryState());
      setItems((current) => (replaceExisting ? accepted : [...current, ...accepted]));
    }
    else if (replaceExisting) setItems([]);
    setStatus(errors.length ? "error" : "idle");
    setMessage(errors.join(" · "));
  }

  const receiveTransferredFiles = useEffectEvent((event: Event) => {
    const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
    if (detail?.targetSlug !== activeTool.slug) return;
    void addFiles(detail.files, true);
  });

  useEffect(() => {
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
  }, []);

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(Array.from(event.dataTransfer.files));
  }

  function removeItem(id: string) {
    history.checkpoint(currentHistoryState());
    clearResult();
    setItems((current) => current.filter((item) => item.id !== id));
    setSelectedItemId((current) => current === id ? null : current);
    setMessage("");
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    history.checkpoint(currentHistoryState());
    clearResult();
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function moveItemTo(itemId: string, targetId: string) {
    if (itemId === targetId) return;
    history.checkpoint(currentHistoryState());
    clearResult();
    setItems((current) => {
      const from = current.findIndex((item) => item.id === itemId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moving] = next.splice(from, 1);
      next.splice(to, 0, moving);
      return next;
    });
  }

  function rotateItem(id: string) {
    history.checkpoint(currentHistoryState());
    clearResult();
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, rotation: ((item.rotation + 90) % 360) as Rotation } : item,
      ),
    );
  }

  function updateSetting<T>(setter: (value: T) => void, value: T) {
    history.checkpoint(currentHistoryState());
    clearResult();
    setter(value);
  }

  const handleWorkspaceKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redoWorkspace(); else undoWorkspace();
    } else if (modifier && key === "y") {
      event.preventDefault();
      redoWorkspace();
    } else if (modifier && key === "o") {
      event.preventDefault();
      inputRef.current?.click();
    } else if (modifier && key === "s") {
      event.preventDefault();
      if (items.length && status !== "processing") void createPdf();
    } else if (modifier && key === "0") {
      event.preventDefault();
      setZoom(100);
    } else if (modifier && (event.key === "+" || event.key === "=")) {
      event.preventDefault();
      setZoom((value) => Math.min(200, value + 10));
    } else if (modifier && event.key === "-") {
      event.preventDefault();
      setZoom((value) => Math.max(50, value - 10));
    } else if ((event.key === "Delete" || event.key === "Backspace") && selectedItemId) {
      event.preventDefault();
      removeItem(selectedItemId);
    } else if ((event.key === "ArrowLeft" || event.key === "ArrowUp") && selectedItemId) {
      event.preventDefault();
      const index = items.findIndex((item) => item.id === selectedItemId);
      if (index > 0) moveItem(index, -1);
    } else if ((event.key === "ArrowRight" || event.key === "ArrowDown") && selectedItemId) {
      event.preventDefault();
      const index = items.findIndex((item) => item.id === selectedItemId);
      if (index >= 0 && index < items.length - 1) moveItem(index, 1);
    } else if (event.key === "Escape") {
      setSelectedItemId(null);
    }
  });

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    document.addEventListener("keydown", handleWorkspaceKeyDown);
    return () => document.removeEventListener("keydown", handleWorkspaceKeyDown);
  }, [editorOpen, isActive]);

  async function createPdf() {
    clearResult();
    setMessage("");
    if (!items.length) {
      setStatus("error");
      setMessage("Please add at least one JPG, PNG, or WebP image.");
      setSidebarOpen(true);
      return;
    }

    setStatus("processing");
    setProgress(4);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const document = await PDFDocument.create();
      const pageMargin = marginPoints(margin);

      for (let index = 0; index < items.length; index += 1) {
        const prepared = await preparedImageBytes(items[index]);
        const embedded = prepared.kind === "jpg"
          ? await document.embedJpg(prepared.bytes)
          : await document.embedPng(prepared.bytes);
        const [pageWidth, pageHeight] = resolvePageSize(
          pageSize,
          orientation,
          prepared.width,
          prepared.height,
          pageMargin,
        );
        const availableWidth = Math.max(1, pageWidth - pageMargin * 2);
        const availableHeight = Math.max(1, pageHeight - pageMargin * 2);
        const scale = fit === "cover"
          ? Math.max(availableWidth / embedded.width, availableHeight / embedded.height)
          : Math.min(availableWidth / embedded.width, availableHeight / embedded.height);
        const drawWidth = embedded.width * scale;
        const drawHeight = embedded.height * scale;
        const page = document.addPage([pageWidth, pageHeight]);
        page.drawImage(embedded, {
          x: (pageWidth - drawWidth) / 2,
          y: (pageHeight - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        });
        setProgress(Math.min(92, Math.round(((index + 1) / items.length) * 86) + 5));
      }

      const finalName = safeOutputName(outputName);
      document.setTitle(finalName.replace(/\.pdf$/i, ""));
      document.setCreator("NovaPDF JPG to PDF");
      document.setProducer("NovaPDF using pdf-lib");
      const bytes = await document.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const outputFile = new File([blob], finalName, { type: "application/pdf", lastModified: Date.now() });
      setResult({ url: URL.createObjectURL(blob), name: finalName, pageCount: items.length, size: blob.size, file: outputFile });
      setProgress(100);
      setStatus("success");
      setSidebarOpen(true);
    } catch {
      setStatus("error");
      setProgress(0);
      setMessage("NovaPDF could not create this PDF. One image may be damaged or too large for the browser.");
      setSidebarOpen(true);
    }
  }

  if (editorOpen) {
    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} multiple className="sr-only" onChange={onFileInput} />

        <header className="organize-editor-header">
          <button type="button" className="workspace-header-start-over" onClick={startOver} aria-label="Start over">
            <RotateCcw className="size-5" />
          </button>
          <h1 className="workspace-header-title">{activeTool.name}</h1>
        </header>

        <div className="organize-editor-body">
          <WorkspaceToolRail
            activeTool={activeTool}
            onToolChange={(tool) => {
              const originalImages = items.map((item) => item.file);
              const transferSource = result && tool.slug !== "merge-pdf" && tool.slug !== "jpg-to-pdf"
                ? [result.file]
                : originalImages;
              transferWorkspaceFiles(tool, transferSource);
              onToolChange(tool);
            }}
            onExitWorkspace={goHome}
            onOpenControls={() => setSidebarOpen((value) => !value)}
          />

          <main className="organize-canvas-area">
            {items.length === 0 ? (
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
                  <span><ImagePlus className="size-8" /></span>
                  <strong>Upload images to create a PDF</strong>
                  <p>Add JPG, JPEG, PNG, or WebP images. Drag them into the order you want.</p>
                  <em>Choose images</em>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar">
                  <button
                    type="button"
                    onClick={() => {
                      history.checkpoint(currentHistoryState());
                      clearResult();
                      setItems((current) => [...current].reverse());
                    }}
                  >
                    <ArrowRight className="size-4 rotate-180" />
                    <span className="hidden sm:inline">Reverse order</span>
                  </button>
                  <span className="toolbar-divider" />
                  <button type="button" onClick={() => inputRef.current?.click()} disabled={items.length >= MAX_FILES}>
                    <FilePlus2 className="size-4" />
                    <span className="hidden sm:inline">Add images</span>
                  </button>
                  <span className="toolbar-divider" />
                  <WorkspaceZoomControls
                    active={isActive}
                    value={zoom}
                    onChange={setZoom}
                    canUndo={history.canUndo}
                    canRedo={history.canRedo}
                    onUndo={undoWorkspace}
                    onRedo={redoWorkspace}
                    pageCount={items.length}
                  />
                </div>

                <div className="organize-pages-scroll">
                  <div
                    className="jpg-editor-grid"
                    style={{
                      "--jpg-card-width": `${Math.round(216 * zoom / 100)}px`,
                      "--jpg-preview-height": `${Math.round(272 * zoom / 100)}px`,
                    } as CSSProperties}
                  >
                    {items.map((item, index) => {
                      const preview = resolveLivePreview(item, pageSize, orientation, margin);
                      return (
                        <article
                          key={item.id}
                          draggable
                          onDragStart={() => {
                            dragItemId.current = item.id;
                          }}
                          onDragEnter={(event) => {
                            event.preventDefault();
                            setDragOverId(item.id);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (dragItemId.current) moveItemTo(dragItemId.current, item.id);
                            dragItemId.current = null;
                            setDragOverId(null);
                          }}
                          onDragEnd={() => {
                            dragItemId.current = null;
                            setDragOverId(null);
                          }}
                          data-novapdf-view-page={index + 1}
                          className={`jpg-editor-card ${dragOverId === item.id ? "jpg-editor-card-dragover" : ""} ${selectedItemId === item.id ? "jpg-editor-card-selected" : ""}`}
                          tabIndex={0}
                          onClick={() => setSelectedItemId(item.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedItemId(item.id);
                            }
                          }}
                        >
                          <div className="organize-card-topline">
                            <span className="merge-editor-order">{index + 1}</span>
                            <span className="organize-drag-handle"><GripVertical className="size-4" /></span>
                          </div>
                          <div className="jpg-editor-preview">
                            <div
                              className={`jpg-live-page ${preview.actualOrientation === "Landscape" ? "jpg-live-page-landscape" : "jpg-live-page-portrait"}`}
                              style={{
                                aspectRatio: `${preview.pageWidth} / ${preview.pageHeight}`,
                                padding: `${preview.marginPercent}%`,
                              }}
                            >
                              <div className="jpg-live-page-content">
                                <img
                                  src={item.preview}
                                  alt={`Live PDF page preview of ${item.file.name}`}
                                  className={fit === "cover" ? "jpg-live-image-cover" : "jpg-live-image-contain"}
                                  style={{
                                    transform: `rotate(${item.rotation}deg)`,
                                    width: preview.sideways ? "78%" : "100%",
                                    height: preview.sideways ? "78%" : "100%",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="jpg-editor-actions">
                            <button type="button" disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveItem(index, -1); }} aria-label="Move image up"><ArrowUp className="size-4" /></button>
                            <button type="button" disabled={index === items.length - 1} onClick={(event) => { event.stopPropagation(); moveItem(index, 1); }} aria-label="Move image down"><ArrowDown className="size-4" /></button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); rotateItem(item.id); }} aria-label="Rotate image clockwise"><RotateCw className="size-4" /></button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); removeItem(item.id); }} aria-label="Remove image"><Trash2 className="size-4" /></button>
                          </div>
                        </article>
                      );
                    })}
                    <button type="button" className="organize-add-card jpg-editor-add" onClick={() => inputRef.current?.click()}>
                      <span><FilePlus2 className="size-6" /></span>
                      <strong>Add images</strong>
                      <small>Add another JPG, PNG, or WebP page.</small>
                    </button>
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

              {items.length === 0 ? (
                <div className="organize-side-section">
                  <div className="split-editor-info">Use the upload box in the middle to add JPG, PNG, or WebP images.</div>
                </div>
              ) : (
                <>
                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Images</h3></div>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={item.id} className="organize-source-row">
                          <span className="organize-source-letter">{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-slate-700">{item.file.name}</p>
                            <p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">{item.width} × {item.height}px · {formatBytes(item.file.size)}</p>
                          </div>
                          <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`}><Trash2 className="size-4" /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="organize-add-file-button" onClick={() => inputRef.current?.click()}>
                      <FilePlus2 className="size-4" /> Add more images
                    </button>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Page size</h3></div>
                    <div className="jpg-option-grid jpg-option-grid-three">
                      {(["auto", "a4", "letter"] as PageSizeMode[]).map((option) => (
                        <button key={option} type="button" className={pageSize === option ? "active" : ""} onClick={() => updateSetting(setPageSize, option)}>
                          <LayoutTemplate className="size-4" />
                          {option === "auto" ? "Auto" : option.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Orientation</h3></div>
                    <div className="jpg-option-grid jpg-option-grid-three">
                      {(["auto", "portrait", "landscape"] as OrientationMode[]).map((option) => (
                        <button key={option} type="button" className={orientation === option ? "active" : ""} onClick={() => updateSetting(setOrientation, option)}>
                          {option === "auto" ? "Auto" : option === "portrait" ? "Portrait" : "Landscape"}
                        </button>
                      ))}
                    </div>
                    <div className="jpg-setting-note">
                      {orientation === "auto"
                        ? "Auto chooses Portrait or Landscape separately for each image."
                        : `${orientation === "portrait" ? "Portrait" : "Landscape"} is applied to every PDF page.`}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Margin</h3></div>
                    <div className="jpg-option-grid jpg-option-grid-three">
                      {(["none", "small", "large"] as MarginMode[]).map((option) => (
                        <button key={option} type="button" className={margin === option ? "active" : ""} onClick={() => updateSetting(setMargin, option)}>
                          {option[0].toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Image fit</h3></div>
                    <div className="jpg-option-grid">
                      <button type="button" className={fit === "contain" ? "active" : ""} onClick={() => updateSetting(setFit, "contain")}>Fit entire image</button>
                      <button type="button" className={fit === "cover" ? "active" : ""} onClick={() => updateSetting(setFit, "cover")}>Fill page</button>
                    </div>
                    <div className="jpg-setting-note">
                      {fit === "contain" ? "Keeps the whole image visible." : "Fills the page and may crop image edges."}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Output filename</h3></div>
                    <label className="organize-filename-field">
                      <input
                        value={outputName}
                        onFocus={() => history.checkpoint(currentHistoryState())}
                        onChange={(event) => { clearResult(); setOutputName(event.target.value); }}
                        maxLength={100}
                      />
                      <span>.pdf</span>
                    </label>
                  </div>

                  <div className="organize-side-section">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="merge-editor-stat"><strong>{items.length}</strong><span>Images</span></div>
                      <div className="merge-editor-stat"><strong>{items.length}</strong><span>PDF pages</span></div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{formatBytes(totalSize)} total · drag cards to set page order.</p>
                  </div>
                </>
              )}

              {status === "processing" && (
                <div className="organize-progress-box">
                  <div><span>Creating PDF…</span><strong>{progress}%</strong></div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && (
                <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>
              )}

              {status === "success" && result && (
                <WorkspaceResultCard
                  title={`${activeTool.name} is ready`}
                  summary={`${result.pageCount} pages · ${formatBytes(result.size)}`}
                  downloads={[{ url: result.url, name: result.name }]}
                />
              )}

              {!result && items.length > 0 && (
                <div className="organize-sidebar-action">
                  <button type="button" className="organize-primary-action" onClick={() => void createPdf()} disabled={status === "processing"}>
                    {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {activeTool.name}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              <div className="organize-privacy-note"><LockKeyhole className="size-4" /> Files stay in this browser during this build.</div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return null;
}
