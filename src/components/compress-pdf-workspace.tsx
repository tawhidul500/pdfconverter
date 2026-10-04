/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowRight,
  CircleAlert,
  CloudUpload,
  FileArchive,
  FilePlus2,
  FileText,
  Gauge,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const MAX_FILES = 10;
const MAX_TOTAL_PAGES = 120;
const COMPRESS_ACCEPT = ".pdf,application/pdf";

type CompressionMode = "preserve" | "balanced" | "strong";
type CompressStatus = "idle" | "reading" | "processing" | "success" | "error";

type CompressItem = {
  id: string;
  file: File;
  pageCount: number;
};

type CompressHistoryState = {
  items: CompressItem[];
  mode: CompressionMode;
  outputName: string;
};

function cloneCompressHistory(value: CompressHistoryState): CompressHistoryState {
  return { ...value, items: [...value.items] };
}

type CompressResult = {
  url: string;
  name: string;
  inputSize: number;
  outputSize: number;
  pageCount: number;
  savedPercent: number;
  keptOriginal: boolean;
};

const MODE_OPTIONS: Array<{
  id: CompressionMode;
  name: string;
  description: string;
  note: string;
}> = [
  {
    id: "preserve",
    name: "Preserve quality",
    description: "Keeps selectable text, links, and vector content.",
    note: "Best for text documents; file-size savings may be small.",
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Good quality with stronger size reduction.",
    note: "Pages are rebuilt as images, so text will no longer be selectable.",
  },
  {
    id: "strong",
    name: "Strong compression",
    description: "Prioritizes the smallest readable file.",
    note: "Pages are rebuilt at lower image quality; best for sharing and email.",
  },
];

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function safeBaseName(value: string) {
  return value
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 90)
    .trim() || "NovaPDF-compressed";
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function hasPdfHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return new TextDecoder("latin1").decode(bytes).includes("%PDF-");
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create a compressed page image."));
          return;
        }
        void blob.arrayBuffer().then(resolve, reject);
      },
      "image/jpeg",
      quality,
    );
  });
}

export function CompressPdfWorkspace({
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
  const [items, setItems] = useState<CompressItem[]>([]);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<CompressStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<CompressionMode>("balanced");
  const [outputName, setOutputName] = useState("NovaPDF-compressed");
  const [results, setResults] = useState<CompressResult[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState(100);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const history = useWorkspaceHistory<CompressHistoryState>(cloneCompressHistory);

  const editorOpen = workspaceStarted || startInWorkspace;
  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);
  const totalPages = useMemo(() => items.reduce((sum, item) => sum + item.pageCount, 0), [items]);
  const selectedMode = MODE_OPTIONS.find((option) => option.id === mode) ?? MODE_OPTIONS[1];

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
      results.forEach((result) => URL.revokeObjectURL(result.url));
    },
    [results],
  );

  useEffect(() => {
    if (!editorOpen || items.length === 0) return;
    let cancelled = false;

    async function renderPreviews() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        for (const item of items) {
          if (cancelled || thumbnails[item.id] || thumbnailErrors[item.id]) continue;
          try {
            const task = pdfjs.getDocument({ data: new Uint8Array(await item.file.arrayBuffer()) });
            const pdf = await task.promise;
            const page = await pdf.getPage(1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({
              scale: Math.max(Math.min(0.72, 230 / Math.max(base.width, base.height)), 0.22),
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
              setThumbnails((current) => ({ ...current, [item.id]: canvas.toDataURL("image/png") }));
            }
            page.cleanup();
            await task.destroy();
          } catch {
            if (!cancelled) setThumbnailErrors((current) => ({ ...current, [item.id]: true }));
          }
        }
      } catch {
        // Compression remains usable if thumbnail rendering is unavailable.
      }
    }

    void renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [editorOpen, items, thumbnailErrors, thumbnails]);

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      void addFiles(detail.files, true);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    // The transfer listener intentionally uses the latest loader without re-subscribing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);


  function currentHistoryState(): CompressHistoryState {
    return { items, mode, outputName };
  }

  function applyHistoryState(value: CompressHistoryState) {
    clearResults();
    setItems([...value.items]);
    setMode(value.mode);
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

  function removeSelectedItem() {
    if (!selectedItemId || !items.some((item) => item.id === selectedItemId)) return;
    removeItem(selectedItemId);
  }

  function moveSelectedItem(direction: -1 | 1) {
    if (!selectedItemId) return;
    const index = items.findIndex((item) => item.id === selectedItemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    history.checkpoint(currentHistoryState());
    clearResults();
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function clearResults() {
    results.forEach((result) => URL.revokeObjectURL(result.url));
    setResults([]);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function resetFields() {
    clearResults();
    setItems([]);
    setMessage("");
    setMode("balanced");
    setOutputName("NovaPDF-compressed");
    setThumbnails({});
    setThumbnailErrors({});
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

    clearResults();
    setMessage("");
    setStatus("reading");
    setWorkspaceStarted(true);

    const baseItems = replaceExisting ? [] : items;
    const availableSlots = MAX_FILES - baseItems.length;
    if (availableSlots <= 0) {
      setStatus("error");
      setMessage(`You can compress up to ${MAX_FILES} PDFs at a time.`);
      return;
    }

    const accepted: CompressItem[] = [];
    const errors: string[] = [];
    let runningSize = replaceExisting ? 0 : totalSize;
    let runningPages = replaceExisting ? 0 : totalPages;
    const { PDFDocument } = await import("pdf-lib");

    for (const file of incoming.slice(0, availableSlots)) {
      const duplicate = [...baseItems, ...accepted].some(
        (item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified,
      );
      if (duplicate) {
        errors.push(`${file.name}: already added`);
        continue;
      }
      if (!isPdfFile(file)) {
        errors.push(`${file.name}: only PDF files are supported`);
        continue;
      }
      if (!file.size) {
        errors.push(`${file.name}: empty file`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: larger than 50 MB`);
        continue;
      }
      if (runningSize + file.size > MAX_TOTAL_SIZE) {
        errors.push(`${file.name}: the batch would exceed 150 MB`);
        continue;
      }

      try {
        if (!(await hasPdfHeader(file))) throw new Error("invalid PDF");
        const document = await PDFDocument.load(await file.arrayBuffer(), {
          updateMetadata: false,
          throwOnInvalidObject: true,
        });
        const pageCount = document.getPageCount();
        if (pageCount < 1) throw new Error("empty PDF");
        if (runningPages + pageCount > MAX_TOTAL_PAGES) {
          errors.push(`${file.name}: the batch would exceed ${MAX_TOTAL_PAGES} pages`);
          continue;
        }
        accepted.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          pageCount,
        });
        runningSize += file.size;
        runningPages += pageCount;
      } catch (error) {
        const detail = error instanceof Error ? error.message.toLowerCase() : "";
        errors.push(
          detail.includes("encrypt") || detail.includes("password")
            ? `${file.name}: password-protected PDF`
            : `${file.name}: invalid or damaged PDF`,
        );
      }
    }

    if (accepted.length) {
      if (!replaceExisting) history.checkpoint(currentHistoryState());
      setItems((current) => (replaceExisting ? accepted : [...current, ...accepted]));
      if ((replaceExisting || baseItems.length === 0) && accepted.length === 1) {
        setOutputName(`${safeBaseName(accepted[0].file.name)}-compressed`);
      }
    } else if (replaceExisting) {
      setItems([]);
    }

    setStatus(errors.length ? "error" : "idle");
    setMessage(errors.join(" · "));
  }

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
    clearResults();
    setItems((current) => current.filter((item) => item.id !== id));
    setSelectedItemId((current) => current === id ? null : current);
    setMessage("");
  }

  async function rasterCompress(
    file: File,
    compressionMode: Exclude<CompressionMode, "preserve">,
    onPage: () => void,
  ) {
    const pdfjs = await import("pdfjs-dist");
    const { PDFDocument } = await import("pdf-lib");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const source = await task.promise;
    const output = await PDFDocument.create();
    const settings = compressionMode === "balanced"
      ? { renderScale: 1.45, maxLongEdge: 1800, quality: 0.72 }
      : { renderScale: 1.05, maxLongEdge: 1350, quality: 0.54 };

    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const page = await source.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(settings.renderScale, settings.maxLongEdge / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale: Math.max(scale, 0.35) });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas unavailable");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const jpegBytes = await canvasToJpeg(canvas, settings.quality);
      const image = await output.embedJpg(jpegBytes);
      const outputPage = output.addPage([base.width, base.height]);
      outputPage.drawImage(image, { x: 0, y: 0, width: base.width, height: base.height });
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();
      onPage();
    }

    output.setCreator("NovaPDF Compress PDF");
    output.setProducer("NovaPDF browser compression");
    const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 40 });
    await task.destroy();
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  }

  async function preserveCompress(file: File, onFile: () => void) {
    const { PDFDocument } = await import("pdf-lib");
    const source = await PDFDocument.load(await file.arrayBuffer(), {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    source.setCreator("NovaPDF Compress PDF");
    source.setProducer("NovaPDF using pdf-lib");
    const bytes = await source.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 40 });
    onFile();
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  }

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    function handleKeyboard(event: KeyboardEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const editing = Boolean(target?.closest('input, textarea, select, button, [contenteditable="true"]'));
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === "z" && !editing) { event.preventDefault(); if (event.shiftKey) redoWorkspace(); else undoWorkspace(); return; }
      if (modifier && key === "y" && !editing) { event.preventDefault(); redoWorkspace(); return; }
      if (modifier && key === "o") { event.preventDefault(); inputRef.current?.click(); return; }
      if (modifier && key === "s") { event.preventDefault(); if (items.length && status !== "processing" && status !== "reading") void compressFiles(); return; }
      if (editing) return;
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); removeSelectedItem(); return; }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); moveSelectedItem(-1); return; }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); moveSelectedItem(1); return; }
      if (event.key === "Escape") setSelectedItemId(null);
    }
    document.addEventListener("keydown", handleKeyboard, true);
    return () => document.removeEventListener("keydown", handleKeyboard, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorOpen, isActive, items, mode, outputName, selectedItemId, status]);

  async function compressFiles() {
    clearResults();
    setMessage("");
    if (items.length === 0) {
      setStatus("error");
      setMessage("Please add at least one PDF before compressing.");
      setSidebarOpen(true);
      return;
    }

    setStatus("processing");
    setProgress(2);
    const completed: CompressResult[] = [];
    const totalWork = mode === "preserve" ? items.length : Math.max(totalPages, 1);
    let finishedWork = 0;

    function updateProgress() {
      finishedWork += 1;
      setProgress(Math.min(96, 4 + Math.round((finishedWork / totalWork) * 92)));
    }

    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const generated = mode === "preserve"
          ? await preserveCompress(item.file, updateProgress)
          : await rasterCompress(item.file, mode, updateProgress);

        const useOriginal = generated.size >= item.file.size;
        const outputBlob: Blob = useOriginal ? item.file : generated;
        const prefix = safeBaseName(outputName);
        const finalName = items.length === 1
          ? `${prefix}.pdf`
          : `${prefix}-${String(index + 1).padStart(2, "0")}.pdf`;
        const savedPercent = Math.max(0, Math.round((1 - outputBlob.size / item.file.size) * 100));
        completed.push({
          url: URL.createObjectURL(outputBlob),
          name: finalName,
          inputSize: item.file.size,
          outputSize: outputBlob.size,
          pageCount: item.pageCount,
          savedPercent,
          keptOriginal: useOriginal,
        });
      }

      setResults(completed);
      setProgress(100);
      setStatus("success");
      setSidebarOpen(true);
    } catch (error) {
      completed.forEach((result) => URL.revokeObjectURL(result.url));
      const detail = error instanceof Error ? error.message.toLowerCase() : "";
      setProgress(0);
      setStatus("error");
      setMessage(
        detail.includes("encrypt") || detail.includes("password")
          ? "A PDF is password-protected. Unlock it before compression."
          : "NovaPDF could not compress this batch. A PDF may be damaged, unusually complex, or too large for browser memory.",
      );
      setSidebarOpen(true);
    }
  }

  const downloads: WorkspaceDownload[] = results.map((result) => ({
    url: result.url,
    name: result.name,
    detail: result.keptOriginal
      ? `${result.pageCount} pages · ${formatBytes(result.outputSize)} · original retained because recompression was larger`
      : `${result.pageCount} pages · ${formatBytes(result.inputSize)} → ${formatBytes(result.outputSize)} · ${result.savedPercent}% smaller`,
  }));

  if (editorOpen) {
    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" accept={COMPRESS_ACCEPT} multiple className="sr-only" onChange={onFileInput} />

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
              transferWorkspaceFiles(tool, items.map((item) => item.file));
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
                  <span><CloudUpload className="size-8" /></span>
                  <strong>Upload PDFs to compress</strong>
                  <p>Add up to {MAX_FILES} PDFs. NovaPDF processes every file privately in this browser.</p>
                  <em>Choose PDF files</em>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar">
                  <button type="button" onClick={() => inputRef.current?.click()} disabled={items.length >= MAX_FILES}>
                    <FilePlus2 className="size-4" />
                    <span className="hidden sm:inline">Add PDFs</span>
                  </button>
                  <span className="toolbar-divider" />
                  <WorkspaceZoomControls
                    active={isActive} value={zoom} onChange={setZoom} pageCount={items.length} canUndo={history.canUndo} canRedo={history.canRedo} onUndo={undoWorkspace} onRedo={redoWorkspace} />
                </div>

                <div className="organize-pages-scroll">
                  <div
                    className="compress-editor-grid"
                    style={{
                      "--compress-card-width": `${Math.round(220 * zoom / 100)}px`,
                      "--compress-preview-height": `${Math.round(276 * zoom / 100)}px`,
                    } as CSSProperties}
                  >
                    {items.map((item, index) => (
                      <article
                        key={item.id}
                        data-novapdf-view-page={index + 1}
                        className={`compress-editor-card ${selectedItemId === item.id ? "compress-editor-card-selected" : ""}`}
                        onClick={() => setSelectedItemId(item.id)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedItemId(item.id);
                          }
                        }}
                      >
                        <div className="organize-card-topline">
                          <span className="merge-editor-order">{index + 1}</span>
                          <span className="compress-file-badge"><FileArchive className="size-4" /> PDF</span>
                        </div>
                        <div className="compress-editor-preview">
                          {thumbnails[item.id] ? (
                            <img src={thumbnails[item.id]} alt={`Preview of ${item.file.name}`} />
                          ) : thumbnailErrors[item.id] ? (
                            <span><FileText className="size-8" /> Preview unavailable</span>
                          ) : (
                            <span><LoaderCircle className="size-6 animate-spin" /> Rendering preview…</span>
                          )}
                        </div>
                        <button type="button" className="compress-remove-button" onClick={(event) => { event.stopPropagation(); removeItem(item.id); }}>
                          <Trash2 className="size-4" /> Remove
                        </button>
                      </article>
                    ))}
                    <button type="button" className="organize-add-card compress-editor-add" onClick={() => inputRef.current?.click()}>
                      <span><FilePlus2 className="size-6" /></span>
                      <strong>Add PDFs</strong>
                      <small>Add another file to this compression batch.</small>
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
                  <div className="split-editor-info">Use the upload box in the middle to add one or more PDF files.</div>
                </div>
              ) : (
                <>
                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>PDF files</h3></div>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={item.id} className="organize-source-row">
                          <span className="organize-source-letter">{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-slate-700">{item.file.name}</p>
                            <p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">{item.pageCount} pages · {formatBytes(item.file.size)}</p>
                          </div>
                          <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`}><Trash2 className="size-4" /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="organize-add-file-button" onClick={() => inputRef.current?.click()}>
                      <FilePlus2 className="size-4" /> Add more PDFs
                    </button>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Compression level</h3></div>
                    <div className="compress-mode-list">
                      {MODE_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={mode === option.id ? "active" : ""}
                          onClick={() => {
                            if (mode !== option.id) history.checkpoint(currentHistoryState());
                            clearResults();
                            setMode(option.id);
                          }}
                        >
                          <span><Gauge className="size-4" /></span>
                          <span>
                            <strong>{option.name}</strong>
                            <small>{option.description}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className={`compress-mode-note ${mode !== "preserve" ? "compress-mode-note-warning" : ""}`}>
                      {selectedMode.note}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>{items.length === 1 ? "Output filename" : "Output filename prefix"}</h3></div>
                    <label className="organize-filename-field">
                      <input
                        value={outputName}
                        onFocus={() => history.checkpoint(currentHistoryState())}
                        onChange={(event) => {
                          clearResults();
                          setOutputName(event.target.value);
                        }}
                        maxLength={90}
                      />
                      <span>.pdf</span>
                    </label>
                  </div>

                  <div className="organize-side-section">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="merge-editor-stat"><strong>{items.length}</strong><span>PDF files</span></div>
                      <div className="merge-editor-stat"><strong>{totalPages}</strong><span>Total pages</span></div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{formatBytes(totalSize)} total input size.</p>
                  </div>
                </>
              )}

              {(status === "reading" || status === "processing") && (
                <div className="organize-progress-box">
                  <div><span>{status === "reading" ? "Reading PDFs…" : "Compressing PDFs…"}</span><strong>{progress}%</strong></div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && (
                <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>
              )}

              {status === "success" && results.length > 0 && (
                <WorkspaceResultCard
                  title={`${activeTool.name} is ready`}
                  summary={`${results.length} file${results.length === 1 ? "" : "s"} · ${formatBytes(results.reduce((sum, result) => sum + result.outputSize, 0))} output`}
                  downloads={downloads}
                />
              )}

              {results.length === 0 && items.length > 0 && (
                <div className="organize-sidebar-action">
                  <button
                    type="button"
                    className="organize-primary-action"
                    onClick={() => void compressFiles()}
                    disabled={status === "processing"}
                  >
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
