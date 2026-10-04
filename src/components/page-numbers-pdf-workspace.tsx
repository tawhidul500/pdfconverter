"use client";

import {
  ArrowRight,
  Bold,
  CircleAlert,
  CloudUpload,
  FileText,
  Hash,
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { WorkspaceResultCard, type WorkspaceDownload } from "@/components/workspace-result-card";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { type PdfTool } from "@/data/tools";
import { useWorkspaceHistory } from "@/hooks/use-workspace-history";
import {
  WORKSPACE_FILE_TRANSFER_EVENT,
  transferWorkspaceFiles,
  type WorkspaceFileTransferDetail,
} from "@/lib/workspace-file-transfer";
import {
  applyPageNumbers,
  formatPageNumberText,
} from "@/lib/page-numbers-pdf";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_PAGES = 300;
const PDF_ACCEPT = ".pdf,application/pdf";

type ProcessStatus = "idle" | "reading" | "processing" | "success" | "error";
type Position = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
type RangeMode = "all" | "custom";
type NumberFormat = "number" | "page-number" | "number-total";
type FontWeight = "regular" | "bold";
type NumberColor = "black" | "gray" | "teal";

type LoadedPdf = {
  file: File;
  pageCount: number;
};

type ThumbnailPreview = {
  url: string;
  width: number;
  height: number;
};

type PreviewTextMetrics = {
  width: number;
  ascent: number;
  descent: number;
  height: number;
};

type PdfResult = {
  url: string;
  name: string;
  size: number;
  file: File;
};

type PageNumberHistoryState = {
  outputName: string;
  position: Position;
  rangeMode: RangeMode;
  rangeStart: number;
  rangeEnd: number;
  startingNumber: number;
  numberFormat: NumberFormat;
  fontSize: number;
  margin: number;
  fontWeight: FontWeight;
  numberColor: NumberColor;
};

const POSITIONS: Array<{ id: Position; label: string }> = [
  { id: "top-left", label: "Top left" },
  { id: "top-center", label: "Top center" },
  { id: "top-right", label: "Top right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom-center", label: "Bottom center" },
  { id: "bottom-right", label: "Bottom right" },
];

const COLOR_VALUES: Record<NumberColor, { css: string; rgb: [number, number, number] }> = {
  black: { css: "#111827", rgb: [0.067, 0.094, 0.153] },
  gray: { css: "#64748b", rgb: [0.392, 0.455, 0.545] },
  teal: { css: "#0f766e", rgb: [0.059, 0.463, 0.431] },
};

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
      .trim() || "NovaPDF-numbered"
  );
}

function clampInteger(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function numberText(value: number, lastValue: number, format: NumberFormat) {
  return formatPageNumberText(value, lastValue, format);
}


export function PageNumbersPdfWorkspace({
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
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [outputName, setOutputName] = useState("NovaPDF-numbered");
  const [position, setPosition] = useState<Position>("bottom-center");
  const [rangeMode, setRangeMode] = useState<RangeMode>("all");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [startingNumber, setStartingNumber] = useState(1);
  const [numberFormat, setNumberFormat] = useState<NumberFormat>("number");
  const [fontSize, setFontSize] = useState(12);
  const [margin, setMargin] = useState(24);
  const [fontWeight, setFontWeight] = useState<FontWeight>("regular");
  const [numberColor, setNumberColor] = useState<NumberColor>("black");
  const [thumbnails, setThumbnails] = useState<Record<number, ThumbnailPreview>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [previewTextMetrics, setPreviewTextMetrics] = useState<Record<number, PreviewTextMetrics>>({});
  const [result, setResult] = useState<PdfResult | null>(null);
  const [zoom, setZoom] = useState(100);
  const cloneHistory = useCallback((value: PageNumberHistoryState) => ({ ...value }), []);
  const history = useWorkspaceHistory<PageNumberHistoryState>(cloneHistory);

  const editorOpen = workspaceStarted || startInWorkspace;
  const effectiveStart = loadedPdf ? (rangeMode === "all" ? 1 : clampInteger(rangeStart, 1, loadedPdf.pageCount)) : 1;
  const effectiveEnd = loadedPdf
    ? rangeMode === "all"
      ? loadedPdf.pageCount
      : clampInteger(rangeEnd, effectiveStart, loadedPdf.pageCount)
    : 1;
  const numberedPageCount = loadedPdf ? Math.max(0, effectiveEnd - effectiveStart + 1) : 0;
  const lastNumber = startingNumber + Math.max(0, numberedPageCount - 1);

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
        if (!cancelled) setMessage("Page previews could not be rendered, but numbering may still work.");
      }
    }

    void renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [loadedPdf, thumbnailErrors, thumbnails]);

  useEffect(() => {
    if (!loadedPdf) return;
    const currentPdf = loadedPdf;
    let cancelled = false;

    async function measurePreviewText() {
      try {
        const { PDFDocument, StandardFonts } = await import("pdf-lib");
        const document = await PDFDocument.create();
        const font = await document.embedFont(
          fontWeight === "bold" ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
        );
        const metrics: Record<number, PreviewTextMetrics> = {};
        for (let pageNumber = 1; pageNumber <= currentPdf.pageCount; pageNumber += 1) {
          const displayedNumber = startingNumber + pageNumber - effectiveStart;
          const text = numberText(displayedNumber, lastNumber, numberFormat);
          const ascent = Math.max(1, font.heightAtSize(fontSize, { descender: false }));
          const fullHeight = Math.max(ascent, font.heightAtSize(fontSize, { descender: true }));
          const descent = Math.max(0, fullHeight - ascent);
          metrics[pageNumber] = {
            width: Math.max(1, font.widthOfTextAtSize(text, fontSize)),
            ascent,
            descent,
            height: ascent + descent,
          };
        }
        if (!cancelled) setPreviewTextMetrics(metrics);
      } catch {
        if (!cancelled) setPreviewTextMetrics({});
      }
    }

    void measurePreviewText();
    return () => {
      cancelled = true;
    };
  }, [effectiveStart, fontSize, fontWeight, lastNumber, loadedPdf, numberFormat, startingNumber]);

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable=true]")) return;
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redoSettings(); else undoSettings();
      } else if (modifier && key === "y") {
        event.preventDefault(); redoSettings();
      } else if (modifier && key === "o") {
        event.preventDefault(); inputRef.current?.click();
      } else if (modifier && key === "s") {
        event.preventDefault();
        if (loadedPdf && status !== "processing" && status !== "reading") void createNumberedPdf();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

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

  function currentHistoryState(): PageNumberHistoryState {
    return { outputName, position, rangeMode, rangeStart, rangeEnd, startingNumber, numberFormat, fontSize, margin, fontWeight, numberColor };
  }

  function applyHistoryState(value: PageNumberHistoryState) {
    clearResult();
    setOutputName(value.outputName);
    setPosition(value.position);
    setRangeMode(value.rangeMode);
    setRangeStart(value.rangeStart);
    setRangeEnd(value.rangeEnd);
    setStartingNumber(value.startingNumber);
    setNumberFormat(value.numberFormat);
    setFontSize(value.fontSize);
    setMargin(value.margin);
    setFontWeight(value.fontWeight);
    setNumberColor(value.numberColor);
    setMessage("");
  }

  function undoSettings() { history.undo(currentHistoryState(), applyHistoryState); }
  function redoSettings() { history.redo(currentHistoryState(), applyHistoryState); }

  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function resetFields() {
    clearResult();
    setLoadedPdf(null);
    setOutputName("NovaPDF-numbered");
    setPosition("bottom-center");
    setRangeMode("all");
    setRangeStart(1);
    setRangeEnd(1);
    setStartingNumber(1);
    setNumberFormat("number");
    setFontSize(12);
    setMargin(24);
    setFontWeight("regular");
    setNumberColor("black");
    setThumbnails({});
    setThumbnailErrors({});
    setPreviewTextMetrics({});
    setMessage("");
    setStatus("idle");
    setSidebarOpen(false);
    setZoom(100);
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

      setLoadedPdf({ file, pageCount });
      setRangeMode("all");
      setRangeStart(1);
      setRangeEnd(pageCount);
      setStartingNumber(1);
      setOutputName(`${cleanBaseName(file.name)}-numbered`);
      setThumbnails({});
      setThumbnailErrors({});
      setPreviewTextMetrics({});
      setStatus("idle");
      setProgress(0);
      history.reset();
    } catch (error) {
      const detail = error instanceof Error ? error.message.toLowerCase() : "";
      setLoadedPdf(null);
      setStatus("error");
      setProgress(0);
      setMessage(
        detail.includes("encrypt") || detail.includes("password")
          ? "This PDF is password-protected. Unlock it before adding page numbers."
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

  function updateSetting(callback: () => void) {
    history.checkpoint(currentHistoryState());
    clearResult();
    setMessage("");
    callback();
  }

  async function createNumberedPdf() {
    if (!loadedPdf) {
      setStatus("error");
      setMessage("Choose a PDF first.");
      return;
    }

    clearResult();
    setStatus("processing");
    setMessage("");
    setProgress(8);

    try {
      const generated = await applyPageNumbers(await loadedPdf.file.arrayBuffer(), {
        position,
        rangeStart: effectiveStart,
        rangeEnd: effectiveEnd,
        startingNumber,
        format: numberFormat,
        fontSize,
        margin,
        fontWeight,
        color: COLOR_VALUES[numberColor].rgb,
      });
      setProgress(88);
      const outputBytes = new Uint8Array(generated.bytes.length);
      outputBytes.set(generated.bytes);
      const name = `${cleanBaseName(outputName)}.pdf`;
      const file = new File([outputBytes], name, { type: "application/pdf", lastModified: Date.now() });
      const blob = new Blob([outputBytes], { type: "application/pdf" });
      setResult({ url: URL.createObjectURL(blob), name, size: blob.size, file });
      setProgress(100);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : "Page numbering failed.");
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
              detail: `${numberedPageCount} numbered page${numberedPageCount === 1 ? "" : "s"} · ${formatBytes(result.size)}`,
              label: "Download numbered PDF",
            },
          ]
        : [],
    [numberedPageCount, result],
  );

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
                  <strong>Upload a PDF to number</strong>
                  <p>Add readable page numbers while keeping the original PDF content intact.</p>
                  <em>Choose a PDF</em>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar">
                  <div className="flex items-center gap-2">
                    <span className="split-editor-mode-label">
                      {numberedPageCount} of {loadedPdf.pageCount} pages numbered
                    </span>
                  </div>
                  <WorkspaceZoomControls
                    active={isActive}
                    value={zoom}
                    onChange={setZoom}
                    canUndo={history.canUndo}
                    canRedo={history.canRedo}
                    onUndo={undoSettings}
                    onRedo={redoSettings}
                    pageCount={loadedPdf.pageCount}
                  />
                </div>

                <div className="organize-pages-scroll" style={zoomStyle}>
                  <div className="split-editor-grid">
                    {Array.from({ length: loadedPdf.pageCount }, (_, pageIndex) => {
                      const pageNumber = pageIndex + 1;
                      const numbered = pageNumber >= effectiveStart && pageNumber <= effectiveEnd;
                      const displayedNumber = startingNumber + pageNumber - effectiveStart;
                      const text = numberText(displayedNumber, lastNumber, numberFormat);
                      const thumbnail = thumbnails[pageIndex];
                      const pageWidth = thumbnail?.width ?? 612;
                      const pageHeight = thumbnail?.height ?? 792;
                      const metrics = previewTextMetrics[pageNumber] ?? {
                        width: Math.max(fontSize, text.length * fontSize * 0.56),
                        ascent: Math.max(1, fontSize * 0.72),
                        descent: Math.max(0, fontSize * 0.2),
                        height: Math.max(1, fontSize * 0.92),
                      };
                      const centerX = position.endsWith("left")
                        ? margin + metrics.width / 2
                        : position.endsWith("right")
                          ? pageWidth - margin - metrics.width / 2
                          : pageWidth / 2;
                      const centerY = position.startsWith("top")
                        ? margin + metrics.height / 2
                        : pageHeight - margin - metrics.height / 2;
                      const textX = centerX - metrics.width / 2;
                      const baselineY = centerY + (metrics.ascent - metrics.descent) / 2;
                      return (
                        <div
                          key={pageIndex}
                          data-novapdf-view-page={pageNumber}
                          className={`split-editor-page page-number-editor-page ${numbered ? "page-number-editor-page-active" : ""}`}
                        >
                          <span className="split-editor-preview page-number-preview-surface">
                            {thumbnail ? (
                              <svg
                                className="page-number-page-stage"
                                viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                                preserveAspectRatio="xMidYMid meet"
                                role="img"
                                aria-label={`Preview of page ${pageNumber}`}
                              >
                                <image href={thumbnail.url} x="0" y="0" width={pageWidth} height={pageHeight} preserveAspectRatio="none" />
                                {numbered && (
                                  <text
                                    className="page-number-svg-text"
                                    x={textX}
                                    y={baselineY}
                                    fill={COLOR_VALUES[numberColor].css}
                                    fontFamily="Helvetica, Arial, sans-serif"
                                    fontSize={fontSize}
                                    fontWeight={fontWeight === "bold" ? 700 : 400}
                                    textAnchor="start"
                                    textLength={metrics.width}
                                    lengthAdjust="spacingAndGlyphs"
                                  >
                                    {text}
                                  </text>
                                )}
                              </svg>
                            ) : thumbnailErrors[pageIndex] ? (
                              <span><FileText className="size-7" /> Preview unavailable</span>
                            ) : (
                              <span><LoaderCircle className="size-6 animate-spin" /> Rendering page…</span>
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
                    <div className="organize-side-heading"><h3>Page range</h3><span>{numberedPageCount}</span></div>
                    <div className="jpg-option-grid">
                      <button
                        type="button"
                        className={rangeMode === "all" ? "active" : ""}
                        onClick={() => updateSetting(() => setRangeMode("all"))}
                      >
                        All pages
                      </button>
                      <button
                        type="button"
                        className={rangeMode === "custom" ? "active" : ""}
                        onClick={() => updateSetting(() => setRangeMode("custom"))}
                      >
                        Custom
                      </button>
                    </div>
                    {rangeMode === "custom" && (
                      <div className="page-number-input-grid mt-2">
                        <label><span>From</span><input type="number" min={1} max={loadedPdf.pageCount} value={rangeStart} onChange={(event) => updateSetting(() => {
                          const next = clampInteger(Number(event.target.value), 1, loadedPdf.pageCount);
                          setRangeStart(next);
                          setRangeEnd((current) => Math.max(current, next));
                        })} /></label>
                        <label><span>To</span><input type="number" min={effectiveStart} max={loadedPdf.pageCount} value={rangeEnd} onChange={(event) => updateSetting(() => setRangeEnd(clampInteger(Number(event.target.value), effectiveStart, loadedPdf.pageCount)))} /></label>
                      </div>
                    )}
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Position</h3></div>
                    <div className="page-number-position-grid">
                      {POSITIONS.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          className={position === option.id ? "active" : ""}
                          onClick={() => updateSetting(() => setPosition(option.id))}
                          title={option.label}
                          aria-label={option.label}
                        >
                          <span className={`page-number-position-dot ${option.id}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Numbering</h3></div>
                    <div className="page-number-input-grid">
                      <label><span>Start at</span><input type="number" min={0} max={999999} value={startingNumber} onChange={(event) => updateSetting(() => setStartingNumber(clampInteger(Number(event.target.value), 0, 999999)))} /></label>
                      <label><span>Font size</span><input type="number" min={8} max={36} value={fontSize} onChange={(event) => updateSetting(() => setFontSize(clampInteger(Number(event.target.value), 8, 36)))} /></label>
                    </div>
                    <div className="jpg-option-grid jpg-option-grid-three mt-2">
                      <button type="button" className={numberFormat === "number" ? "active" : ""} onClick={() => updateSetting(() => setNumberFormat("number"))}>1</button>
                      <button type="button" className={numberFormat === "page-number" ? "active" : ""} onClick={() => updateSetting(() => setNumberFormat("page-number"))}>Page 1</button>
                      <button type="button" className={numberFormat === "number-total" ? "active" : ""} onClick={() => updateSetting(() => setNumberFormat("number-total"))}>1 / N</button>
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Style</h3></div>
                    <label className="page-number-range-field">
                      <span>Edge margin <strong>{margin} pt</strong></span>
                      <input type="range" min={12} max={72} step={2} value={margin} onChange={(event) => updateSetting(() => setMargin(Number(event.target.value)))} />
                    </label>
                    <div className="jpg-option-grid mt-2">
                      <button type="button" className={fontWeight === "regular" ? "active" : ""} onClick={() => updateSetting(() => setFontWeight("regular"))}>Regular</button>
                      <button type="button" className={fontWeight === "bold" ? "active" : ""} onClick={() => updateSetting(() => setFontWeight("bold"))}><Bold className="size-4" /> Bold</button>
                    </div>
                    <div className="page-number-color-grid mt-2">
                      {(Object.keys(COLOR_VALUES) as NumberColor[]).map((color) => (
                        <button
                          type="button"
                          key={color}
                          className={numberColor === color ? "active" : ""}
                          onClick={() => updateSetting(() => setNumberColor(color))}
                          aria-label={`${color} page-number color`}
                          title={color}
                        >
                          <span style={{ background: COLOR_VALUES[color].css }} />
                        </button>
                      ))}
                    </div>
                  </div>

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
                  <div>
                    <span>{status === "reading" ? "Reading PDF…" : "Adding page numbers…"}</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && (
                <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>
              )}

              {status === "success" && result && (
                <WorkspaceResultCard
                  title={`${activeTool.name} result is ready`}
                  summary={`${numberedPageCount} numbered page${numberedPageCount === 1 ? "" : "s"} · ${formatBytes(result.size)}`}
                  downloads={downloads}
                />
              )}

              {!result && loadedPdf && (
                <div className="organize-sidebar-action">
                  <button
                    type="button"
                    className="organize-primary-action"
                    onClick={() => void createNumberedPdf()}
                    disabled={status === "processing" || status === "reading"}
                  >
                    {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Add page numbers
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              <div className="organize-privacy-note">
                <LockKeyhole className="size-4" /> Page numbers are added inside this browser during this build.
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
            <Hash className="size-5" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p>
            <p className="text-xs text-slate-500">Live browser page numbering</p>
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
          <p className="mt-1 text-sm text-slate-500">Choose position, range, numbering style, and see a live preview.</p>
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
