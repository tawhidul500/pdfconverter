"use client";

import {
  ArrowRight,
  Check,
  CircleAlert,
  CloudUpload,
  FilePlus2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  RefreshCcw,
  RotateCcw,
  RotateCw,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useEffectEvent,
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
import { applyPdfRotations, normalizePdfRotation } from "@/lib/rotate-pdf";
import { isRotatePageTargeted, type RotateTargetMode } from "@/lib/rotate-pdf-targeting";
import {
  WORKSPACE_FILE_TRANSFER_EVENT,
  transferWorkspaceFiles,
  type WorkspaceFileTransferDetail,
} from "@/lib/workspace-file-transfer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 10;
const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const MAX_TOTAL_PAGES = 300;
const PDF_ACCEPT = ".pdf,application/pdf";

type ProcessStatus = "idle" | "reading" | "processing" | "success" | "error";
type TargetMode = RotateTargetMode;

type SourcePage = {
  pageIndex: number;
  sourceRotation: number;
  width: number;
  height: number;
};

type SourcePdf = {
  id: string;
  file: File;
  pageCount: number;
  pages: SourcePage[];
};

type PageState = SourcePage & {
  key: string;
  sourceId: string;
  rotationDelta: number;
  selected: boolean;
};

type Thumbnail = {
  url: string;
  width: number;
  height: number;
};

type RotateResult = {
  url: string;
  name: string;
  size: number;
  file: File;
  pageCount: number;
};

type RotateHistoryState = {
  sources: SourcePdf[];
  pages: PageState[];
};

function cloneRotateHistory(value: RotateHistoryState): RotateHistoryState {
  return {
    sources: [...value.sources],
    pages: value.pages.map((page) => ({ ...page })),
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

async function hasPdfHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return new TextDecoder("latin1").decode(bytes).includes("%PDF-");
}

function cleanName(value: string, fallback: string) {
  return (
    value
      .trim()
      .replace(/\.pdf$/i, "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 86)
      .trim() || fallback
  );
}

function sourceOutputBase(fileName: string) {
  return cleanName(fileName.replace(/\.pdf$/i, ""), "NovaPDF-rotated");
}

function rotatedSvgGeometry(width: number, height: number, rotationDelta: number) {
  const rotation = normalizePdfRotation(rotationDelta);
  if (rotation === 90) {
    return { width: height, height: width, transform: `translate(${height} 0) rotate(90)` };
  }
  if (rotation === 180) {
    return { width, height, transform: `translate(${width} ${height}) rotate(180)` };
  }
  if (rotation === 270) {
    return { width: height, height: width, transform: `translate(0 ${width}) rotate(270)` };
  }
  return { width, height, transform: undefined };
}

export function RotatePdfWorkspace({
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
  const addInputRef = useRef<HTMLInputElement>(null);
  const history = useWorkspaceHistory<RotateHistoryState>(cloneRotateHistory, 80);
  const [sources, setSources] = useState<SourcePdf[]>([]);
  const [pages, setPages] = useState<PageState[]>([]);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [customFrom, setCustomFrom] = useState(1);
  const [customTo, setCustomTo] = useState(1);
  const [outputName, setOutputName] = useState("NovaPDF-rotated");
  const [thumbnails, setThumbnails] = useState<Record<string, Thumbnail>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<RotateResult[]>([]);
  const [zipResult, setZipResult] = useState<WorkspaceDownload | null>(null);

  const editorOpen = workspaceStarted || startInWorkspace;
  const totalPages = pages.length;
  const selectedCount = useMemo(() => pages.filter((page) => page.selected).length, [pages]);

  const targetedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const source of sources) {
      for (const page of pages.filter((item) => item.sourceId === source.id)) {
        const targeted = isRotatePageTargeted({
          mode: targetMode,
          pageIndex: page.pageIndex,
          selected: page.selected,
          customFrom,
          customTo,
        });
        if (targeted) keys.add(page.key);
      }
    }
    return keys;
  }, [customFrom, customTo, pages, sources, targetMode]);

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [editorOpen, isActive]);

  useEffect(() => () => {
    for (const result of results) URL.revokeObjectURL(result.url);
    if (zipResult?.url) URL.revokeObjectURL(zipResult.url);
  }, [results, zipResult]);

  useEffect(() => {
    if (sources.length === 0) return;
    let cancelled = false;

    async function renderPreviews() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        for (const source of sources) {
          const missing = source.pages.filter((page) => {
            const key = `${source.id}:${page.pageIndex}`;
            return !thumbnails[key] && !thumbnailErrors[key];
          });
          if (missing.length === 0 || cancelled) continue;
          const task = pdfjs.getDocument({ data: new Uint8Array(await source.file.arrayBuffer()) });
          const pdf = await task.promise;
          for (const meta of missing) {
            if (cancelled) break;
            const key = `${source.id}:${meta.pageIndex}`;
            try {
              const page = await pdf.getPage(meta.pageIndex + 1);
              const base = page.getViewport({ scale: 1 });
              const viewport = page.getViewport({
                scale: Math.max(Math.min(0.8, 260 / Math.max(base.width, base.height)), 0.2),
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
                  [key]: {
                    url: canvas.toDataURL("image/png"),
                    width: base.width,
                    height: base.height,
                  },
                }));
              }
              page.cleanup();
            } catch {
              if (!cancelled) setThumbnailErrors((current) => ({ ...current, [key]: true }));
            }
          }
          await task.destroy();
        }
      } catch {
        if (!cancelled) setMessage("Some previews could not be rendered, but rotation may still work.");
      }
    }

    void renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [sources, thumbnailErrors, thumbnails]);

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      resetWorkspace();
      setWorkspaceStarted(true);
      if (detail.files.length > 0) void loadFiles(detail.files, false);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  function clearResults() {
    for (const result of results) URL.revokeObjectURL(result.url);
    if (zipResult?.url) URL.revokeObjectURL(zipResult.url);
    setResults([]);
    setZipResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function resetWorkspace() {
    clearResults();
    setSources([]);
    setPages([]);
    setThumbnails({});
    setThumbnailErrors({});
    setTargetMode("all");
    setCustomFrom(1);
    setCustomTo(1);
    setOutputName("NovaPDF-rotated");
    setMessage("");
    setStatus("idle");
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
    const transferFiles = results.length > 0 ? results.map((result) => result.file) : sources.map((source) => source.file);
    transferWorkspaceFiles(tool, transferFiles);
    onToolChange(tool);
  }

  async function readSource(file: File): Promise<SourcePdf> {
    if (!isPdfFile(file) || !(await hasPdfHeader(file))) throw new Error(`invalid:${file.name}`);
    if (file.size === 0) throw new Error(`empty:${file.name}`);
    if (file.size > MAX_FILE_SIZE) throw new Error(`size:${file.name}`);
    const { PDFDocument } = await import("pdf-lib");
    const document = await PDFDocument.load(await file.arrayBuffer(), {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    const pageCount = document.getPageCount();
    if (pageCount < 1) throw new Error(`empty:${file.name}`);
    const id = makeId("rotate-source");
    return {
      id,
      file,
      pageCount,
      pages: document.getPages().map((page, pageIndex) => {
        const size = page.getSize();
        return {
          pageIndex,
          sourceRotation: page.getRotation().angle,
          width: size.width,
          height: size.height,
        };
      }),
    };
  }

  async function loadFiles(incoming: File[], append: boolean) {
    const files = incoming.filter(isPdfFile);
    if (files.length === 0) {
      setMessage("Choose one or more valid PDF files.");
      setStatus("error");
      return;
    }
    const baseSources = append ? sources : [];
    const candidates = files.slice(0, Math.max(0, MAX_FILES - baseSources.length));
    if (candidates.length === 0) {
      setMessage(`This browser build accepts up to ${MAX_FILES} PDFs per rotation job.`);
      setStatus("error");
      return;
    }
    if (baseSources.reduce((sum, item) => sum + item.file.size, 0) + candidates.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) {
      setMessage("The combined input is larger than the current 150 MB browser limit.");
      setStatus("error");
      return;
    }

    clearResults();
    setStatus("reading");
    setProgress(8);
    setMessage("");
    try {
      const loaded: SourcePdf[] = [];
      for (let index = 0; index < candidates.length; index += 1) {
        loaded.push(await readSource(candidates[index]));
        setProgress(10 + Math.round(((index + 1) / candidates.length) * 70));
      }
      const nextSources = [...baseSources, ...loaded];
      const nextPageCount = nextSources.reduce((sum, source) => sum + source.pageCount, 0);
      if (nextPageCount > MAX_TOTAL_PAGES) throw new Error("page-limit");
      setSources(nextSources);
      setPages((current) => {
        const retained = append ? current : [];
        const added = loaded.flatMap((source) =>
          source.pages.map((page) => ({
            ...page,
            key: `${source.id}:${page.pageIndex}`,
            sourceId: source.id,
            rotationDelta: 0,
            selected: false,
          })),
        );
        return [...retained, ...added];
      });
      const maxPagesInFile = Math.max(...nextSources.map((source) => source.pageCount));
      setCustomFrom(1);
      setCustomTo(maxPagesInFile);
      if (!append && nextSources.length === 1) setOutputName(`${sourceOutputBase(nextSources[0].file.name)}-rotated`);
      if (!append && nextSources.length > 1) setOutputName("NovaPDF-rotated");
      setWorkspaceStarted(true);
      setProgress(100);
      setStatus("idle");
    } catch (error) {
      const code = error instanceof Error ? error.message : "unknown";
      setStatus("error");
      if (code.startsWith("size:")) setMessage(`${code.slice(5)} is larger than the 50 MB per-file limit.`);
      else if (code === "page-limit") setMessage(`This browser build supports up to ${MAX_TOTAL_PAGES} pages per rotation job.`);
      else if (code.startsWith("invalid:")) setMessage(`${code.slice(8)} is not a readable PDF.`);
      else setMessage("The PDF could not be opened. Password-protected or damaged PDFs must be repaired or unlocked first.");
    }
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>, append: boolean) {
    void loadFiles(Array.from(event.target.files ?? []), append);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void loadFiles(Array.from(event.dataTransfer.files), sources.length > 0);
  }

  function currentRotateHistory(): RotateHistoryState {
    return { sources, pages };
  }

  function applyRotateHistory(snapshot: RotateHistoryState) {
    setSources(snapshot.sources);
    setPages(snapshot.pages);
    clearResults();
    setMessage("");
  }

  function undoRotate() {
    history.undo(currentRotateHistory(), applyRotateHistory);
  }

  function redoRotate() {
    history.redo(currentRotateHistory(), applyRotateHistory);
  }

  function updatePages(rotationChange: number | "reset") {
    if (targetedKeys.size === 0) {
      setMessage(targetMode === "selected" ? "Select at least one page first." : "No pages match the current target.");
      setStatus("error");
      return;
    }
    history.checkpoint(currentRotateHistory());
    clearResults();
    setMessage("");
    setPages((current) =>
      current.map((page) => {
        if (!targetedKeys.has(page.key)) return page;
        return {
          ...page,
          rotationDelta: rotationChange === "reset" ? 0 : normalizePdfRotation(page.rotationDelta + rotationChange),
        };
      }),
    );
  }

  function togglePage(pageKey: string) {
    history.checkpoint(currentRotateHistory());
    clearResults();
    setTargetMode("selected");
    setPages((current) => current.map((page) => (page.key === pageKey ? { ...page, selected: !page.selected } : page)));
  }

  function removeSource(sourceId: string) {
    history.checkpoint(currentRotateHistory());
    clearResults();
    setSources((current) => current.filter((source) => source.id !== sourceId));
    setPages((current) => current.filter((page) => page.sourceId !== sourceId));
    setThumbnails((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${sourceId}:`))));
    setThumbnailErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${sourceId}:`))));
  }

  const handleRotateKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (!editorOpen || !isActive || event.defaultPrevented) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return;
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier && key === "z") { event.preventDefault(); if (event.shiftKey) redoRotate(); else undoRotate(); return; }
    if (modifier && key === "y") { event.preventDefault(); redoRotate(); return; }
    if (modifier && key === "o") { event.preventDefault(); addInputRef.current?.click(); return; }
    if (modifier && key === "s") { event.preventDefault(); if (sources.length && status !== "processing" && status !== "reading") void createRotatedPdfs(); return; }
    if (modifier && key === "a") {
      event.preventDefault();
      history.checkpoint(currentRotateHistory());
      setTargetMode("selected");
      setPages((current) => current.map((page) => ({ ...page, selected: true })));
      return;
    }
    if (event.key === "Escape" && selectedCount > 0) {
      event.preventDefault();
      history.checkpoint(currentRotateHistory());
      setPages((current) => current.map((page) => ({ ...page, selected: false })));
    }
  });

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    document.addEventListener("keydown", handleRotateKeyboard, true);
    return () => document.removeEventListener("keydown", handleRotateKeyboard, true);
  }, [editorOpen, isActive]);

  async function createRotatedPdfs() {
    if (sources.length === 0) return;
    clearResults();
    setStatus("processing");
    setProgress(5);
    setMessage("");
    try {
      const outputResults: RotateResult[] = [];
      for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex += 1) {
        const source = sources[sourceIndex];
        const sourcePages = pages.filter((page) => page.sourceId === source.id);
        const bytes = await applyPdfRotations(
          await source.file.arrayBuffer(),
          sourcePages.map((page) => ({ pageIndex: page.pageIndex, rotationDelta: page.rotationDelta })),
        );
        const base = sources.length === 1
          ? cleanName(outputName, `${sourceOutputBase(source.file.name)}-rotated`)
          : `${cleanName(outputName, "NovaPDF-rotated")}-${String(sourceIndex + 1).padStart(2, "0")}-${sourceOutputBase(source.file.name)}`;
        const name = `${base}.pdf`;
        const outputBuffer = Uint8Array.from(bytes).buffer;
        const file = new File([outputBuffer], name, { type: "application/pdf", lastModified: Date.now() });
        const url = URL.createObjectURL(file);
        outputResults.push({ url, name, size: file.size, file, pageCount: source.pageCount });
        setProgress(10 + Math.round(((sourceIndex + 1) / sources.length) * 72));
      }

      let nextZip: WorkspaceDownload | null = null;
      if (outputResults.length > 1) {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const result of outputResults) zip.file(result.name, await result.file.arrayBuffer());
        const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
        nextZip = {
          url: URL.createObjectURL(zipBlob),
          name: `${cleanName(outputName, "NovaPDF-rotated")}.zip`,
          detail: `${outputResults.length} rotated PDFs`,
          label: "Download all as ZIP",
        };
      }
      setResults(outputResults);
      setZipResult(nextZip);
      setProgress(100);
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("NovaPDF could not create the rotated PDF. Try a smaller or unlocked document.");
    }
  }

  const downloads = useMemo<WorkspaceDownload[]>(() => {
    const individual = results.map((result) => ({
      url: result.url,
      name: result.name,
      detail: `${result.pageCount} pages · ${formatBytes(result.size)}`,
      label: results.length === 1 ? "Download rotated PDF" : "Download PDF",
    }));
    return zipResult ? [zipResult, ...individual] : individual;
  }, [results, zipResult]);

  if (editorOpen) {
    const cardWidth = Math.max(9, 12.5 * zoom / 100);
    const previewHeight = Math.max(11.5, 16 * zoom / 100);
    const zoomStyle = {
      "--split-card-width": `${cardWidth}rem`,
      "--split-preview-height": `${previewHeight}rem`,
    } as CSSProperties;

    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} multiple onChange={(event) => onFileInput(event, false)} />
        <input ref={addInputRef} type="file" className="sr-only" accept={PDF_ACCEPT} multiple onChange={(event) => onFileInput(event, true)} />
        <header className="organize-editor-header">
          <button type="button" className="workspace-header-start-over" onClick={startOver} aria-label="Start over"><RotateCcw className="size-5" /></button>
          <h1 className="workspace-header-title">{activeTool.name}</h1>
        </header>

        <div className="organize-editor-body">
          <WorkspaceToolRail activeTool={activeTool} onToolChange={switchTool} onExitWorkspace={goHome} onOpenControls={() => setSidebarOpen((value) => !value)} />

          <main className="organize-canvas-area">
            {sources.length === 0 ? (
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
                  <strong>Upload PDFs to rotate</strong>
                  <p>Rotate individual pages, selected pages, odd/even pages, a range, or every page.</p>
                  <em>Choose PDF files</em>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar rotate-floating-toolbar">
                  <span className="split-editor-mode-label">
                    {targetMode === "selected" ? `${selectedCount} selected` : `${targetedKeys.size} targeted`} · {totalPages} pages
                  </span>
                  <div className="rotate-toolbar-actions">
                    <button type="button" onClick={() => updatePages(-90)} title="Rotate targeted pages left"><RotateCcw className="size-4" /></button>
                    <button type="button" onClick={() => updatePages(90)} title="Rotate targeted pages right"><RotateCw className="size-4" /></button>
                    <button type="button" onClick={() => updatePages(180)} title="Rotate targeted pages 180 degrees"><RefreshCcw className="size-4" /></button>
                    <button type="button" onClick={() => updatePages("reset")} title="Reset targeted page rotations">Reset</button>
                  </div>
                  <WorkspaceZoomControls
                    active={isActive}
                    value={zoom}
                    onChange={setZoom}
                    canUndo={history.canUndo}
                    canRedo={history.canRedo}
                    onUndo={undoRotate}
                    onRedo={redoRotate}
                    pageCount={pages.length}
                  />
                </div>

                <div className="organize-pages-scroll" style={zoomStyle}>
                  <div className="rotate-source-groups">
                    {sources.map((source, sourceIndex) => (
                      <section key={source.id} className="rotate-source-group">
                        <div className="rotate-source-group-heading">
                          <span>{String.fromCharCode(65 + sourceIndex)}</span>
                          <strong>{source.file.name}</strong>
                          <small>{source.pageCount} pages</small>
                        </div>
                        <div className="split-editor-grid">
                          {pages.filter((page) => page.sourceId === source.id).map((page) => {
                            const thumbnail = thumbnails[page.key];
                            const width = thumbnail?.width ?? page.width;
                            const height = thumbnail?.height ?? page.height;
                            const geometry = rotatedSvgGeometry(width, height, page.rotationDelta);
                            const targeted = targetedKeys.has(page.key);
                            return (
                              <button
                                type="button"
                                key={page.key}
                                data-novapdf-view-page={pages.findIndex((candidate) => candidate.key === page.key) + 1}
                                className={`split-editor-page rotate-editor-page ${targeted ? "rotate-editor-page-selected rotate-editor-page-targeted" : ""}`}
                                onClick={() => togglePage(page.key)}
                                aria-pressed={targeted}
                              >
                                <span className="rotate-page-check" aria-hidden="true">{targeted && <Check className="size-3.5" />}</span>
                                <span className="split-editor-preview rotate-preview-surface">
                                  {thumbnail ? (
                                    <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Preview of page ${page.pageIndex + 1}`}>
                                      <g transform={geometry.transform}>
                                        <image href={thumbnail.url} x="0" y="0" width={width} height={height} preserveAspectRatio="none" />
                                      </g>
                                    </svg>
                                  ) : thumbnailErrors[page.key] ? (
                                    <span><FileText className="size-7" /> Preview unavailable</span>
                                  ) : (
                                    <span><LoaderCircle className="size-6 animate-spin" /> Rendering page…</span>
                                  )}
                                </span>
                                <span className="split-editor-page-number">Page {page.pageIndex + 1}</span>
                                <span className="rotate-page-angle">{normalizePdfRotation(page.sourceRotation + page.rotationDelta)}°</span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
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

              {sources.length === 0 ? (
                <div className="organize-side-section"><div className="split-editor-info">Use the upload box in the middle to choose one or more PDFs.</div></div>
              ) : (
                <>
                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>PDF files</h3><span>{sources.length}</span></div>
                    <div className="space-y-2">
                      {sources.map((source, index) => (
                        <div className="organize-source-row" key={source.id}>
                          <span className="organize-source-letter">{String.fromCharCode(65 + index)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-slate-700">{source.file.name}</p>
                            <p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">{source.pageCount} pages · {formatBytes(source.file.size)}</p>
                          </div>
                          <button type="button" onClick={() => removeSource(source.id)} aria-label={`Remove ${source.file.name}`}><Trash2 className="size-4" /></button>
                        </div>
                      ))}
                    </div>
                    {sources.length < MAX_FILES && (
                      <button type="button" className="organize-add-file-button" onClick={() => addInputRef.current?.click()}><FilePlus2 className="size-4" /> Add PDFs</button>
                    )}
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Apply rotation to</h3><span>{targetedKeys.size}</span></div>
                    <div className="rotate-target-grid">
                      {([
                        ["selected", "Selected"],
                        ["all", "All pages"],
                        ["odd", "Odd pages"],
                        ["even", "Even pages"],
                        ["custom", "Custom range"],
                      ] as Array<[TargetMode, string]>).map(([mode, label]) => (
                        <button type="button" key={mode} className={targetMode === mode ? "active" : ""} onClick={() => { clearResults(); setTargetMode(mode); }}>{label}</button>
                      ))}
                    </div>
                    {targetMode === "custom" && (
                      <>
                        <div className="page-number-input-grid mt-2">
                          <label><span>From</span><input type="number" min={1} max={Math.max(...sources.map((source) => source.pageCount))} value={customFrom} onChange={(event) => { clearResults(); const value = Math.max(1, Number(event.target.value) || 1); setCustomFrom(value); setCustomTo((current) => Math.max(current, value)); }} /></label>
                          <label><span>To</span><input type="number" min={customFrom} max={Math.max(...sources.map((source) => source.pageCount))} value={customTo} onChange={(event) => { clearResults(); setCustomTo(Math.max(customFrom, Number(event.target.value) || customFrom)); }} /></label>
                        </div>
                        <div className="split-editor-info mt-2">The same page-number range is applied inside each uploaded PDF.</div>
                      </>
                    )}
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Rotate targeted pages</h3></div>
                    <div className="rotate-action-grid">
                      <button type="button" onClick={() => updatePages(-90)}><RotateCcw className="size-4" /> Left 90°</button>
                      <button type="button" onClick={() => updatePages(90)}><RotateCw className="size-4" /> Right 90°</button>
                      <button type="button" onClick={() => updatePages(180)}><RefreshCcw className="size-4" /> 180°</button>
                      <button type="button" onClick={() => updatePages("reset")}><RefreshCcw className="size-4" /> Reset</button>
                    </div>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>{sources.length === 1 ? "Output filename" : "Output prefix"}</h3></div>
                    <label className="organize-filename-field"><input value={outputName} onChange={(event) => { clearResults(); setOutputName(event.target.value); }} maxLength={86} /><span>{sources.length === 1 ? ".pdf" : ""}</span></label>
                  </div>
                </>
              )}

              {(status === "reading" || status === "processing") && (
                <div className="organize-progress-box">
                  <div><span>{status === "reading" ? "Reading PDFs…" : "Rotating pages…"}</span><strong>{progress}%</strong></div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>}

              {status === "success" && results.length > 0 && (
                <WorkspaceResultCard title={`${activeTool.name} result${results.length === 1 ? "" : "s"} ready`} summary={`${results.length} PDF${results.length === 1 ? "" : "s"} · ${totalPages} pages`} downloads={downloads} />
              )}

              {!results.length && sources.length > 0 && (
                <div className="organize-sidebar-action">
                  <button type="button" className="organize-primary-action" onClick={() => void createRotatedPdfs()} disabled={status === "reading" || status === "processing"}>
                    {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Rotate PDF{sources.length === 1 ? "" : "s"}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              <div className="organize-privacy-note"><LockKeyhole className="size-4" /> PDFs are rotated inside this browser during this build.</div>
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
          <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[var(--brand-strong)]"><RotateCw className="size-5" /></span>
          <div><p className="text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p><p className="text-xs text-slate-500">Rotate selected or grouped PDF pages</p></div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} multiple onChange={(event) => onFileInput(event, false)} />
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
          <p className="mt-4 text-lg font-extrabold text-[var(--ink)]">Drop PDF files here</p>
          <p className="mt-1 text-sm text-slate-500">Rotate individual pages or apply one rotation to all, odd, even, or ranged pages.</p>
          <span className="button button-primary pointer-events-none mt-5"><UploadCloud className="size-4" /> Choose PDFs</span>
        </div>
        {message && <div className="mt-4 flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{message}</span></div>}
      </div>
    </div>
  );
}
