/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowRight,
  Check,
  CircleAlert,
  CloudUpload,
  FileImage,
  FileText,
  Images,
  LoaderCircle,
  LockKeyhole,
  Replace,
  RotateCcw,
  Save,
  UploadCloud,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
const MAX_PAGES = 200;
const PDF_ACCEPT = ".pdf,application/pdf";

type ConvertStatus = "idle" | "reading" | "processing" | "success" | "error";
type QualityMode = "small" | "standard" | "high";
type ResolutionMode = "standard" | "high" | "very-high";

type LoadedPdf = {
  file: File;
  pageCount: number;
};

type ImageResult = {
  url: string;
  name: string;
  size: number;
  pageNumber: number;
  file: File;
};

type PdfToJpgHistoryState = {
  quality: QualityMode;
  resolution: ResolutionMode;
  selectedPages: Set<number>;
  outputName: string;
};

function clonePdfToJpgHistory(value: PdfToJpgHistoryState): PdfToJpgHistoryState {
  return { ...value, selectedPages: new Set(value.selectedPages) };
}

type ZipResult = {
  url: string;
  name: string;
  size: number;
};

const QUALITY_OPTIONS: Array<{
  id: QualityMode;
  name: string;
  description: string;
  value: number;
}> = [
  { id: "small", name: "Smaller files", description: "Good for quick sharing", value: 0.68 },
  { id: "standard", name: "Standard", description: "Balanced image quality", value: 0.84 },
  { id: "high", name: "High quality", description: "Sharper details", value: 0.94 },
];

const RESOLUTION_OPTIONS: Array<{
  id: ResolutionMode;
  name: string;
  description: string;
  scale: number;
  maxLongEdge: number;
}> = [
  { id: "standard", name: "Standard", description: "Screen and web use", scale: 1.25, maxLongEdge: 1900 },
  { id: "high", name: "High", description: "Clear documents", scale: 1.75, maxLongEdge: 2700 },
  { id: "very-high", name: "Very high", description: "Large detailed images", scale: 2.25, maxLongEdge: 3600 },
];

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
      .trim() || "NovaPDF-pages"
  );
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not create the JPG image."))),
      "image/jpeg",
      quality,
    );
  });
}

export function PdfToJpgWorkspace({
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
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdf | null>(null);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<ConvertStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [outputName, setOutputName] = useState("NovaPDF-pages");
  const [quality, setQuality] = useState<QualityMode>("standard");
  const [resolution, setResolution] = useState<ResolutionMode>("high");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [zipResult, setZipResult] = useState<ZipResult | null>(null);
  const [zoom, setZoom] = useState(100);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const history = useWorkspaceHistory<PdfToJpgHistoryState>(clonePdfToJpgHistory);

  const editorOpen = workspaceStarted || startInWorkspace;
  const selectedQuality = QUALITY_OPTIONS.find((option) => option.id === quality) ?? QUALITY_OPTIONS[1];
  const selectedResolution = RESOLUTION_OPTIONS.find((option) => option.id === resolution) ?? RESOLUTION_OPTIONS[1];
  const selectedPageNumbers = useMemo(
    () => [...selectedPages].sort((a, b) => a - b).map((index) => index + 1),
    [selectedPages],
  );
  const totalResultSize = useMemo(
    () => imageResults.reduce((sum, result) => sum + result.size, 0),
    [imageResults],
  );

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
      imageResults.forEach((result) => URL.revokeObjectURL(result.url));
      if (zipResult?.url) URL.revokeObjectURL(zipResult.url);
    },
    [imageResults, zipResult],
  );

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
              scale: Math.max(Math.min(0.74, 230 / Math.max(base.width, base.height)), 0.2),
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
                [pageIndex]: canvas.toDataURL("image/jpeg", 0.84),
              }));
            }
            page.cleanup();
          } catch {
            if (!cancelled) setThumbnailErrors((current) => ({ ...current, [pageIndex]: true }));
          }
        }
        await task.destroy();
      } catch {
        if (!cancelled) setMessage("Page previews could not be rendered, but conversion may still work.");
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
      const file = detail.files.find(isPdfFile);
      if (file) void loadPdf(file);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    // The transfer listener intentionally uses the current loader without re-subscribing on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);


  function currentHistoryState(): PdfToJpgHistoryState {
    return { quality, resolution, selectedPages: new Set(selectedPages), outputName };
  }

  function applyHistoryState(value: PdfToJpgHistoryState) {
    clearResults();
    setQuality(value.quality);
    setResolution(value.resolution);
    setSelectedPages(new Set(value.selectedPages));
    setOutputName(value.outputName);
    setMessage("");
  }

  function undoWorkspace() { history.undo(currentHistoryState(), applyHistoryState); }
  function redoWorkspace() { history.redo(currentHistoryState(), applyHistoryState); }

  function scrollToPage(pageNumber: number) {
    if (!loadedPdf) return;
    const safePage = Math.min(loadedPdf.pageCount, Math.max(1, pageNumber));
    setActivePageNumber(safePage);
    document.querySelector<HTMLElement>(`[data-novapdf-view-page="${safePage}"]`)?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }

  function clearResults() {
    imageResults.forEach((result) => URL.revokeObjectURL(result.url));
    if (zipResult?.url) URL.revokeObjectURL(zipResult.url);
    setImageResults([]);
    setZipResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function resetFields() {
    clearResults();
    setLoadedPdf(null);
    setOutputName("NovaPDF-pages");
    setQuality("standard");
    setResolution("high");
    setSelectedPages(new Set());
    setThumbnails({});
    setThumbnailErrors({});
    setMessage("");
    setStatus("idle");
    setSidebarOpen(false);
    setZoom(100);
    setActivePageNumber(1);
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
    clearResults();
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

      history.reset();
      setLoadedPdf({ file, pageCount });
      setActivePageNumber(1);
      setSelectedPages(new Set(Array.from({ length: pageCount }, (_, index) => index)));
      setOutputName(`${cleanBaseName(file.name)}-images`);
      setThumbnails({});
      setThumbnailErrors({});
      setStatus("idle");
      setProgress(0);
    } catch (error) {
      const detail = error instanceof Error ? error.message.toLowerCase() : "";
      setLoadedPdf(null);
      setSelectedPages(new Set());
      setStatus("error");
      setProgress(0);
      setMessage(
        detail.includes("encrypt") || detail.includes("password")
          ? "This PDF is password-protected. Unlock it before converting."
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

  function togglePage(pageIndex: number) {
    history.checkpoint(currentHistoryState());
    setActivePageNumber(pageIndex + 1);
    clearResults();
    setMessage("");
    setSelectedPages((current) => {
      const next = new Set(current);
      if (next.has(pageIndex)) next.delete(pageIndex);
      else next.add(pageIndex);
      return next;
    });
  }

  function selectAllPages() {
    if (!loadedPdf) return;
    history.checkpoint(currentHistoryState());
    clearResults();
    setSelectedPages(new Set(Array.from({ length: loadedPdf.pageCount }, (_, index) => index)));
    setMessage("");
  }

  function clearPageSelection() {
    history.checkpoint(currentHistoryState());
    clearResults();
    setSelectedPages(new Set());
    setMessage("");
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
      if (modifier && key === "s") { event.preventDefault(); if (loadedPdf && selectedPages.size && status !== "processing" && status !== "reading") void convertPdf(); return; }
      if (editing || !loadedPdf) return;
      if (modifier && key === "a") { event.preventDefault(); selectAllPages(); return; }
      if (event.key === "Delete" || event.key === "Backspace") {
        const pageIndex = activePageNumber - 1;
        if (selectedPages.has(pageIndex) && selectedPages.size > 1) { event.preventDefault(); togglePage(pageIndex); }
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); scrollToPage(activePageNumber - 1); return; }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); scrollToPage(activePageNumber + 1); }
    }
    document.addEventListener("keydown", handleKeyboard, true);
    return () => document.removeEventListener("keydown", handleKeyboard, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageNumber, editorOpen, isActive, loadedPdf, outputName, quality, resolution, selectedPages, status]);

  async function convertPdf() {
    if (!loadedPdf) {
      setStatus("error");
      setMessage("Choose a PDF first.");
      return;
    }
    if (!selectedPageNumbers.length) {
      setStatus("error");
      setMessage("Select at least one page to convert.");
      return;
    }

    clearResults();
    setStatus("processing");
    setMessage("");
    setProgress(2);

    try {
      const pdfjs = await import("pdfjs-dist");
      const JSZip = (await import("jszip")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const task = pdfjs.getDocument({ data: new Uint8Array(await loadedPdf.file.arrayBuffer()) });
      const pdf = await task.promise;
      const baseName = cleanBaseName(outputName);
      const padLength = Math.max(2, String(loadedPdf.pageCount).length);
      const zip = new JSZip();
      const nextResults: ImageResult[] = [];

      for (let outputIndex = 0; outputIndex < selectedPageNumbers.length; outputIndex += 1) {
        const pageNumber = selectedPageNumbers[outputIndex];
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          selectedResolution.scale,
          selectedResolution.maxLongEdge / Math.max(baseViewport.width, baseViewport.height),
        );
        const viewport = page.getViewport({ scale: Math.max(scale, 0.35) });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas is unavailable in this browser.");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const blob = await canvasToJpeg(canvas, selectedQuality.value);
        const name = `${baseName}-page-${String(pageNumber).padStart(padLength, "0")}.jpg`;
        const file = new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
        zip.file(name, blob);
        nextResults.push({
          url: URL.createObjectURL(blob),
          name,
          size: blob.size,
          pageNumber,
          file,
        });
        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();
        setProgress(Math.round(((outputIndex + 1) / selectedPageNumbers.length) * 78));
      }

      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
        (metadata) => setProgress(78 + Math.round(metadata.percent * 0.2)),
      );
      const zipName = `${baseName}.zip`;
      setImageResults(nextResults);
      setZipResult({ url: URL.createObjectURL(zipBlob), name: zipName, size: zipBlob.size });
      setProgress(100);
      setStatus("success");
      await task.destroy();
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : "PDF to JPG conversion failed.");
    }
  }

  function switchTool(tool: PdfTool) {
    if (loadedPdf) {
      const destinationSupportsImages = /image\/|\.jpg|\.jpeg|\.png|\.webp/i.test(tool.accepts);
      const candidates = destinationSupportsImages && imageResults.length
        ? imageResults.map((result) => result.file)
        : [loadedPdf.file];
      transferWorkspaceFiles(tool, candidates);
    }
    onToolChange(tool);
  }

  const downloads: WorkspaceDownload[] = useMemo(() => {
    const entries: WorkspaceDownload[] = [];
    if (zipResult) {
      entries.push({
        url: zipResult.url,
        name: zipResult.name,
        detail: `${imageResults.length} JPG files · ${formatBytes(zipResult.size)}`,
        label: "Download all as ZIP",
      });
    }
    imageResults.forEach((result) => {
      entries.push({
        url: result.url,
        name: result.name,
        detail: `Page ${result.pageNumber} · ${formatBytes(result.size)}`,
        label: `Download page ${result.pageNumber}`,
      });
    });
    return entries;
  }, [imageResults, zipResult]);

  if (editorOpen) {
    const cardWidth = Math.max(9, 12.5 * zoom / 100);
    const previewHeight = Math.max(11.5, 16 * zoom / 100);
    const zoomStyle = {
      "--split-card-width": `${cardWidth}rem`,
      "--split-preview-height": `${previewHeight}rem`,
    } as CSSProperties;

    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} onChange={onFileInput} />
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
                  <strong>Upload a PDF to convert</strong>
                  <p>Every selected page becomes a separate JPG image in your browser.</p>
                  <em>Choose a PDF</em>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar">
                  <div className="flex items-center gap-2">
                    <button type="button" className="organize-toolbar-button" onClick={selectAllPages}>
                      <Check className="size-4" /> Select all
                    </button>
                    <button type="button" className="organize-toolbar-button" onClick={clearPageSelection}>
                      Clear
                    </button>
                    <span className="split-editor-mode-label">
                      {selectedPages.size} of {loadedPdf.pageCount} selected
                    </span>
                  </div>
                  <WorkspaceZoomControls
                    active={isActive} value={zoom} onChange={setZoom} currentPage={activePageNumber} pageCount={loadedPdf.pageCount} onPageChange={scrollToPage} canUndo={history.canUndo} canRedo={history.canRedo} onUndo={undoWorkspace} onRedo={redoWorkspace} />
                </div>

                <div className="organize-pages-scroll" style={zoomStyle}>
                  <div className="split-editor-grid">
                    {Array.from({ length: loadedPdf.pageCount }, (_, pageIndex) => {
                      const selected = selectedPages.has(pageIndex);
                      return (
                        <button
                          type="button"
                          key={pageIndex}
                          data-novapdf-view-page={pageIndex + 1}
                          className={`split-editor-page ${selected ? "split-editor-page-selected" : ""}`}
                          onClick={() => togglePage(pageIndex)}
                          aria-pressed={selected}
                        >
                          <span className={`split-editor-check ${selected ? "split-editor-check-active" : ""}`}>
                            {selected && <Check className="size-4" />}
                          </span>
                          <span className="split-editor-preview">
                            {thumbnails[pageIndex] ? (
                              <img src={thumbnails[pageIndex]} alt={`Preview of page ${pageIndex + 1}`} />
                            ) : thumbnailErrors[pageIndex] ? (
                              <span><FileText className="size-7" /> Preview unavailable</span>
                            ) : (
                              <span><LoaderCircle className="size-6 animate-spin" /> Rendering page…</span>
                            )}
                          </span>
                          <span className="split-editor-page-number">Page {pageIndex + 1}</span>
                        </button>
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
                    <div className="organize-side-heading"><h3>Pages</h3><span>{selectedPages.size}</span></div>
                    <div className="split-editor-info">Click page thumbnails to include or exclude them from conversion.</div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>JPG quality</h3></div>
                    <div className="pdf-jpg-option-list">
                      {QUALITY_OPTIONS.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={quality === option.id ? "active" : ""}
                          onClick={() => {
                            if (quality !== option.id) history.checkpoint(currentHistoryState());
                            clearResults();
                            setQuality(option.id);
                            setMessage("");
                          }}
                        >
                          <span><FileImage className="size-4" /></span>
                          <span><strong>{option.name}</strong><small>{option.description}</small></span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Resolution</h3></div>
                    <div className="pdf-jpg-option-list">
                      {RESOLUTION_OPTIONS.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={resolution === option.id ? "active" : ""}
                          onClick={() => {
                            if (resolution !== option.id) history.checkpoint(currentHistoryState());
                            clearResults();
                            setResolution(option.id);
                            setMessage("");
                          }}
                        >
                          <span><Images className="size-4" /></span>
                          <span><strong>{option.name}</strong><small>{option.description}</small></span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Output filename</h3></div>
                    <label className="organize-filename-field">
                      <input
                        value={outputName}
                        onFocus={() => history.checkpoint(currentHistoryState())}
                        onChange={(event) => {
                          clearResults();
                          setOutputName(event.target.value);
                        }}
                        maxLength={86}
                      />
                      <span>.jpg</span>
                    </label>
                  </div>
                </>
              )}

              {(status === "reading" || status === "processing") && (
                <div className="organize-progress-box">
                  <div>
                    <span>{status === "reading" ? "Reading PDF…" : "Creating JPG images…"}</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && (
                <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>
              )}

              {status === "success" && imageResults.length > 0 && (
                <WorkspaceResultCard
                  title={`${activeTool.name} result is ready`}
                  summary={`${imageResults.length} JPG image${imageResults.length === 1 ? "" : "s"} · ${formatBytes(totalResultSize)}`}
                  downloads={downloads}
                />
              )}

              {imageResults.length === 0 && loadedPdf && (
                <div className="organize-sidebar-action">
                  <button
                    type="button"
                    className="organize-primary-action"
                    onClick={() => void convertPdf()}
                    disabled={status === "processing" || status === "reading"}
                  >
                    {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {activeTool.name}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              <div className="organize-privacy-note">
                <LockKeyhole className="size-4" /> PDF pages are converted inside this browser during this build.
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
            <FileImage className="size-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p>
            <p className="text-xs text-slate-500">Private browser conversion</p>
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
          <p className="mt-1 text-sm text-slate-500">Select pages and export them as JPG images.</p>
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
