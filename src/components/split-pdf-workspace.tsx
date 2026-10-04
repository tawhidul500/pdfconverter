/* eslint-disable @next/next/no-img-element */
"use client";

import {
  RotateCcw,
  ArrowRight,
  Check,
  CircleAlert,
  CloudUpload,
  FileText,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Replace,
  Save,
  Scissors,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { ToolSelectMenu } from "@/components/tool-select-menu";
import { WorkspaceResultCard } from "@/components/workspace-result-card";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { useWorkspaceHistory } from "@/hooks/use-workspace-history";
import { pdfTools, type PdfTool } from "@/data/tools";
import { WORKSPACE_FILE_TRANSFER_EVENT, transferWorkspaceFiles, type WorkspaceFileTransferDetail } from "@/lib/workspace-file-transfer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_EVERY_PAGE_OUTPUTS = 200;
const MAX_RANGE_GROUPS = 50;

type SplitMode = "extract" | "ranges" | "every-page";
type SplitStatus = "idle" | "reading" | "processing" | "success" | "error";
type LoadedPdf = { file: File; pageCount: number };
type SplitResult = { url: string; name: string; pageCount: number; size: number; label: string };
type RangeItem = { id: string; start: number; end: number };
type SplitHistoryState = {
  mode: SplitMode;
  selection: string;
  ranges: RangeItem[];
  mergeRanges: boolean;
  outputName: string;
};

function cloneSplitHistory(value: SplitHistoryState): SplitHistoryState {
  return { ...value, ranges: value.ranges.map((range) => ({ ...range })) };
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
function hasPdfExtension(file: File) { return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"); }
async function hasPdfHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return new TextDecoder("latin1").decode(bytes).includes("%PDF-");
}
function cleanBaseName(value: string) {
  return value.trim().replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, " ").slice(0, 90).trim() || "NovaPDF-split";
}
function parsePageSelection(value: string, totalPages: number) {
  const tokens = value.split(",").map((token) => token.trim()).filter(Boolean);
  if (!tokens.length) throw new Error("Enter at least one page number or range, such as 1,3-5.");
  const pages: number[] = [];
  const seen = new Set<number>();
  for (const token of tokens) {
    const single = token.match(/^\d+$/);
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (single) {
      const page = Number(token);
      if (page < 1 || page > totalPages) throw new Error(`Page ${page} is outside this PDF. It has ${totalPages} page(s).`);
      if (!seen.has(page)) { seen.add(page); pages.push(page - 1); }
      continue;
    }
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start > end) throw new Error(`Range ${token} is reversed. Use ${end}-${start} instead.`);
      if (start < 1 || end > totalPages) throw new Error(`Range ${token} is outside this PDF. It has ${totalPages} page(s).`);
      for (let page = start; page <= end; page += 1) if (!seen.has(page)) { seen.add(page); pages.push(page - 1); }
      continue;
    }
    throw new Error(`“${token}” is not valid. Use numbers and ranges like 1,3-5,8.`);
  }
  return pages;
}
function makePdfName(baseName: string, suffix: string) { return `${cleanBaseName(baseName)}-${suffix}.pdf`; }
function indexesToSelection(indexes: number[]) { return indexes.map((index) => index + 1).join(","); }
function makeInitialRanges(pageCount: number): RangeItem[] {
  if (pageCount <= 1) return [{ id: "range-1", start: 1, end: 1 }];
  if (pageCount === 2) return [
    { id: "range-1", start: 1, end: 1 },
    { id: "range-2", start: 2, end: 2 },
  ];
  return [
    { id: "range-1", start: 1, end: 2 },
    { id: "range-2", start: 3, end: pageCount },
  ];
}
function getRangeIndexes(range: RangeItem, totalPages: number) {
  if (range.start < 1 || range.end > totalPages || range.start > range.end) {
    throw new Error(`Range ${range.start}-${range.end} is outside this PDF. It has ${totalPages} page(s).`);
  }
  return Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start - 1 + index);
}

export function SplitPdfWorkspace({
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
  const rangeCounterRef = useRef(3);
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdf | null>(null);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [mode, setMode] = useState<SplitMode>("extract");
  const [selection, setSelection] = useState("1");
  const [ranges, setRanges] = useState<RangeItem[]>([{ id: "range-1", start: 1, end: 2 }, { id: "range-2", start: 3, end: 3 }]);
  const [mergeRanges, setMergeRanges] = useState(false);
  const [outputName, setOutputName] = useState("NovaPDF-split");
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<SplitStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SplitResult[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const [zoom, setZoom] = useState(100);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const history = useWorkspaceHistory<SplitHistoryState>(cloneSplitHistory);

  const editorOpen = workspaceStarted || startInWorkspace;
  const totalResultSize = useMemo(() => results.reduce((sum, result) => sum + result.size, 0), [results]);
  const selectedIndexes = useMemo(() => {
    if (!loadedPdf || mode !== "extract") return new Set<number>();
    try { return new Set(parsePageSelection(selection, loadedPdf.pageCount)); } catch { return new Set<number>(); }
  }, [loadedPdf, mode, selection]);
  const rangePageGroups = useMemo(() => {
    if (!loadedPdf || mode !== "ranges") return [];
    return ranges.map((range, index) => ({
      ...range,
      label: `Range ${index + 1}`,
      indexes: getRangeIndexes(range, loadedPdf.pageCount),
    }));
  }, [loadedPdf, mode, ranges]);

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [editorOpen, isActive]);

  useEffect(() => () => { results.forEach((result) => URL.revokeObjectURL(result.url)); }, [results]);

  useEffect(() => {
    if (!loadedPdf) return;
    const currentPdf = loadedPdf;
    let cancelled = false;
    async function renderPages() {
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
            const viewport = page.getViewport({ scale: Math.max(Math.min(0.72, 220 / Math.max(base.width, base.height)), 0.2) });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d", { alpha: false });
            if (!context) throw new Error("Canvas unavailable");
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            if (!cancelled) setThumbnails((current) => ({ ...current, [pageIndex]: canvas.toDataURL("image/png") }));
            page.cleanup();
          } catch {
            if (!cancelled) setThumbnailErrors((current) => ({ ...current, [pageIndex]: true }));
          }
        }
        await task.destroy();
      } catch { /* placeholders remain */ }
    }
    void renderPages();
    return () => { cancelled = true; };
  }, [loadedPdf, thumbnails, thumbnailErrors]);

  function currentHistoryState(): SplitHistoryState {
    return { mode, selection, ranges, mergeRanges, outputName };
  }

  function applyHistoryState(value: SplitHistoryState) {
    clearResults();
    setMode(value.mode);
    setSelection(value.selection);
    setRanges(value.ranges.map((range) => ({ ...range })));
    setMergeRanges(value.mergeRanges);
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
    results.forEach((result) => URL.revokeObjectURL(result.url));
    setResults([]);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function selectTool(slug: string) {
    const tool = pdfTools.find((item) => item.slug === slug);
    if (tool) onToolChange(tool);
  }

  function resetFields() {
    clearResults();
    setLoadedPdf(null);
    setMode("extract");
    setSelection("1");
    setRanges([{ id: "range-1", start: 1, end: 2 }, { id: "range-2", start: 3, end: 3 }]);
    setMergeRanges(false);
    rangeCounterRef.current = 3;
    setOutputName("NovaPDF-split");
    setMessage("");
    setStatus("idle");
    setSidebarOpen(false);
    setThumbnails({});
    setThumbnailErrors({});
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
    window.requestAnimationFrame(() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function loadPdf(file: File) {
    clearResults();
    setMessage("");
    if (!hasPdfExtension(file) || !(await hasPdfHeader(file))) { setStatus("error"); setMessage("Please choose a valid PDF file."); return; }
    if (!file.size) { setStatus("error"); setMessage("This PDF file is empty."); return; }
    if (file.size > MAX_FILE_SIZE) { setStatus("error"); setMessage("This build accepts one PDF up to 50 MB."); return; }
    setWorkspaceStarted(true);
    setStatus("reading");
    setProgress(20);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false, throwOnInvalidObject: true });
      const pageCount = source.getPageCount();
      if (pageCount < 1) throw new Error("empty pdf");
      history.reset();
      setLoadedPdf({ file, pageCount });
      setActivePageNumber(1);
      setSelection(pageCount > 1 ? `1-${Math.min(pageCount, 2)}` : "1");
      setRanges(makeInitialRanges(pageCount));
      setMergeRanges(false);
      rangeCounterRef.current = 3;
      setOutputName(cleanBaseName(file.name));
      setThumbnails({});
      setThumbnailErrors({});
      setProgress(100);
      setStatus("idle");
    } catch (error) {
      const details = error instanceof Error ? error.message.toLowerCase() : "";
      setStatus("error");
      setProgress(0);
      setMessage(details.includes("encrypt") || details.includes("password") ? "This PDF is password-protected. Unlock it first." : "NovaPDF could not read this PDF. It may be damaged or unsupported.");
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
    const file = event.dataTransfer.files?.[0];
    if (file) void loadPdf(file);
  }

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      resetFields();
      setWorkspaceStarted(true);
      const file = detail.files[0];
      if (file) void loadPdf(file);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
  // The transfer listener intentionally uses the latest workspace loader without re-subscribing on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);
  function togglePage(pageIndex: number) {
    if (!loadedPdf || mode !== "extract") return;
    history.checkpoint(currentHistoryState());
    setActivePageNumber(pageIndex + 1);
    const next = new Set(selectedIndexes);
    if (next.has(pageIndex)) next.delete(pageIndex); else next.add(pageIndex);
    if (!next.size) next.add(pageIndex);
    clearResults();
    setMessage("");
    setSelection(indexesToSelection([...next].sort((a, b) => a - b)));
  }

  function updateRange(id: string, field: "start" | "end", rawValue: number) {
    if (!loadedPdf) return;
    history.checkpoint(currentHistoryState());
    const value = Math.min(loadedPdf.pageCount, Math.max(1, Number.isFinite(rawValue) ? rawValue : 1));
    clearResults();
    setMessage("");
    setRanges((current) => current.map((range) => {
      if (range.id !== id) return range;
      if (field === "start") return { ...range, start: value, end: Math.max(value, range.end) };
      return { ...range, start: Math.min(range.start, value), end: value };
    }));
  }

  function addRange() {
    if (!loadedPdf || ranges.length >= MAX_RANGE_GROUPS) return;
    history.checkpoint(currentHistoryState());
    clearResults();
    setMessage("");
    const lastEnd = ranges.at(-1)?.end ?? 0;
    const nextPage = Math.min(loadedPdf.pageCount, Math.max(1, lastEnd + 1));
    const id = `range-${rangeCounterRef.current}`;
    rangeCounterRef.current += 1;
    setRanges((current) => [...current, { id, start: nextPage, end: nextPage }]);
  }

  function removeRange(id: string) {
    if (ranges.length <= 1) return;
    history.checkpoint(currentHistoryState());
    clearResults();
    setMessage("");
    setRanges((current) => current.filter((range) => range.id !== id));
  }

  async function createResult(
    source: Awaited<ReturnType<(typeof import("pdf-lib"))["PDFDocument"]["load"]>>,
    indexes: number[],
    name: string,
    label: string,
  ) {
    const { PDFDocument } = await import("pdf-lib");
    const output = await PDFDocument.create();
    const copied = await output.copyPages(source, indexes);
    copied.forEach((page) => output.addPage(page));
    output.setTitle(name.replace(/\.pdf$/i, ""));
    output.setCreator("NovaPDF Split PDF");
    output.setProducer("NovaPDF using pdf-lib");
    const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
    const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    return { url: URL.createObjectURL(blob), name, pageCount: indexes.length, size: blob.size, label } satisfies SplitResult;
  }

  async function splitPdf() {
    clearResults();
    setMessage("");
    if (!loadedPdf) { setStatus("error"); setMessage("Please choose a PDF file first."); return; }
    setStatus("processing");
    setProgress(5);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await loadedPdf.file.arrayBuffer(), { updateMetadata: false, throwOnInvalidObject: true });
      const baseName = cleanBaseName(outputName);
      const nextResults: SplitResult[] = [];
      if (mode === "extract") {
        const indexes = parsePageSelection(selection, loadedPdf.pageCount);
        setProgress(45);
        nextResults.push(await createResult(source, indexes, `${baseName}.pdf`, `${indexes.length} selected page${indexes.length === 1 ? "" : "s"}`));
      }
      if (mode === "ranges") {
        if (!ranges.length) throw new Error("Add at least one custom range.");
        const groups = ranges.map((range, index) => ({
          label: `Range ${index + 1}: pages ${range.start}-${range.end}`,
          indexes: getRangeIndexes(range, loadedPdf.pageCount),
        }));
        if (mergeRanges) {
          const mergedIndexes = groups.flatMap((group) => group.indexes);
          setProgress(45);
          nextResults.push(await createResult(source, mergedIndexes, `${baseName}.pdf`, `${groups.length} ranges · ${mergedIndexes.length} pages`));
        } else {
          for (let index = 0; index < groups.length; index += 1) {
            const group = groups[index];
            nextResults.push(await createResult(source, group.indexes, makePdfName(baseName, `range-${String(index + 1).padStart(2, "0")}`), group.label));
            setProgress(Math.round(((index + 1) / groups.length) * 85) + 5);
          }
        }
      }
      if (mode === "every-page") {
        if (loadedPdf.pageCount > MAX_EVERY_PAGE_OUTPUTS) throw new Error(`This PDF has ${loadedPdf.pageCount} pages. Every-page mode supports up to ${MAX_EVERY_PAGE_OUTPUTS} outputs.`);
        for (let pageIndex = 0; pageIndex < loadedPdf.pageCount; pageIndex += 1) {
          nextResults.push(await createResult(source, [pageIndex], makePdfName(baseName, `page-${String(pageIndex + 1).padStart(3, "0")}`), `Page ${pageIndex + 1}`));
          setProgress(Math.round(((pageIndex + 1) / loadedPdf.pageCount) * 85) + 5);
        }
      }
      setResults(nextResults);
      setProgress(100);
      setStatus("success");
      setSidebarOpen(true);
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : "NovaPDF could not split this PDF.");
      setSidebarOpen(true);
    }
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
      if (modifier && key === "s") { event.preventDefault(); if (loadedPdf && status !== "processing" && status !== "reading") void splitPdf(); return; }
      if (editing || !loadedPdf) return;
      if (modifier && key === "a" && mode === "extract") {
        event.preventDefault();
        history.checkpoint(currentHistoryState());
        setSelection(indexesToSelection(Array.from({ length: loadedPdf.pageCount }, (_, index) => index)));
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && mode === "extract") {
        const pageIndex = activePageNumber - 1;
        if (selectedIndexes.has(pageIndex) && selectedIndexes.size > 1) {
          event.preventDefault();
          togglePage(pageIndex);
        }
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); scrollToPage(activePageNumber - 1); return; }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); scrollToPage(activePageNumber + 1); }
    }
    document.addEventListener("keydown", handleKeyboard, true);
    return () => document.removeEventListener("keydown", handleKeyboard, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageNumber, editorOpen, isActive, loadedPdf, mergeRanges, mode, outputName, ranges, selection, selectedIndexes, status]);

  if (editorOpen) {
    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only" onChange={onFileInput} />
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
              transferWorkspaceFiles(tool, loadedPdf ? [loadedPdf.file] : []);
              onToolChange(tool);
            }}
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
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
                  onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                >
                  <span><CloudUpload className="size-8" /></span>
                  <strong>Upload a PDF to split</strong>
                  <p>Select one PDF. You can extract pages, create custom parts, or save every page separately.</p>
                  <em>Choose a PDF</em>
                </div>
              </div>
            ) : (
              <>
                <div className="organize-floating-toolbar">
                  <span className="split-editor-mode-label"><Scissors className="size-4" /> {mode === "extract" ? `${selectedIndexes.size} selected` : mode === "ranges" ? `${ranges.length} range${ranges.length === 1 ? "" : "s"}` : `${loadedPdf.pageCount} pages selected`}</span>
                  <span className="toolbar-divider" />
                  <button type="button" onClick={() => inputRef.current?.click()}><Replace className="size-4" /><span className="hidden sm:inline">Replace PDF</span></button>
                  <span className="toolbar-divider" />
                  <WorkspaceZoomControls
                    active={isActive} value={zoom} onChange={setZoom} currentPage={activePageNumber} pageCount={loadedPdf.pageCount} onPageChange={scrollToPage} canUndo={history.canUndo} canRedo={history.canRedo} onUndo={undoWorkspace} onRedo={redoWorkspace} />
                </div>
                <div className="organize-pages-scroll">
                  {mode === "ranges" ? (
                    <div
                      className="split-range-layout"
                      style={{
                        "--split-card-width": `${Math.round(170 * zoom / 100)}px`,
                        "--split-preview-height": `${Math.round(220 * zoom / 100)}px`,
                      } as CSSProperties}
                    >
                      {rangePageGroups.map((range) => (
                        <section key={range.id} className="split-range-group">
                          <div className="split-range-group-heading">
                            <strong>{range.label}</strong>
                            <span>Pages {range.start}-{range.end}</span>
                          </div>
                          <div className="split-range-group-pages">
                            {range.indexes.map((pageIndex) => (
                              <button key={`${range.id}-${pageIndex}`} data-novapdf-view-page={pageIndex + 1} type="button" onClick={() => scrollToPage(pageIndex + 1)} className="split-editor-page split-editor-page-selected split-editor-page-static split-editor-range-page" aria-pressed="true">
                                <span className="split-editor-check split-editor-check-active"><Check className="size-3.5" strokeWidth={3} /></span>
                                <span className="split-editor-preview">
                                  {thumbnails[pageIndex] ? <img src={thumbnails[pageIndex]} alt={`Preview of page ${pageIndex + 1}`} /> : thumbnailErrors[pageIndex] ? <span><FileText className="size-7" /> Preview unavailable</span> : <span><LoaderCircle className="size-6 animate-spin" /> Rendering page…</span>}
                                </span>
                                <span className="split-editor-page-number">Page {pageIndex + 1}</span>
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="split-editor-grid"
                      style={{
                        "--split-card-width": `${Math.round(200 * zoom / 100)}px`,
                        "--split-preview-height": `${Math.round(256 * zoom / 100)}px`,
                      } as CSSProperties}
                    >
                      {Array.from({ length: loadedPdf.pageCount }, (_, pageIndex) => {
                        const selected = mode === "every-page" || selectedIndexes.has(pageIndex);
                        return (
                          <button key={pageIndex} data-novapdf-view-page={pageIndex + 1} type="button" onClick={() => { setActivePageNumber(pageIndex + 1); togglePage(pageIndex); }} className={`split-editor-page ${selected ? "split-editor-page-selected" : ""} ${mode !== "extract" ? "split-editor-page-static split-editor-page-every" : ""}`} aria-pressed={selected}>
                            <span className={`split-editor-check ${selected ? "split-editor-check-active" : ""}`}>{selected && <Check className="size-3.5" strokeWidth={3} />}</span>
                            <span className="split-editor-preview">
                              {thumbnails[pageIndex] ? <img src={thumbnails[pageIndex]} alt={`Preview of page ${pageIndex + 1}`} /> : thumbnailErrors[pageIndex] ? <span><FileText className="size-7" /> Preview unavailable</span> : <span><LoaderCircle className="size-6 animate-spin" /> Rendering page…</span>}
                            </span>
                            <span className="split-editor-page-number">Page {pageIndex + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          <aside className={`organize-sidebar ${sidebarOpen ? "organize-sidebar-open" : ""}`}>
            <div className="organize-sidebar-scroll">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-strong)]">NovaPDF workspace</p><h2 className="mt-1 text-2xl font-black text-[var(--ink)]">{activeTool.name}</h2></div>

              {!loadedPdf ? (
                <div className="organize-side-section"><div className="split-editor-info">Use the upload box in the middle to choose a PDF.</div></div>
              ) : (
                <>
                  <div className="organize-side-section">
                    <div className="organize-source-row"><span className="organize-source-letter">A</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-slate-700">{loadedPdf.file.name}</p><p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">{loadedPdf.pageCount} pages · {formatBytes(loadedPdf.file.size)}</p></div><button type="button" onClick={() => inputRef.current?.click()} aria-label="Replace PDF"><Replace className="size-4" /></button></div>
                  </div>
                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Split method</h3></div>
                    <div className="split-editor-modes">
                      <button type="button" className={mode === "extract" ? "active" : ""} onClick={() => { if (mode !== "extract") history.checkpoint(currentHistoryState()); clearResults(); setMessage(""); setMode("extract"); }}><Scissors className="size-4" /><span><strong>Extract pages</strong><small>One PDF from selected pages</small></span></button>
                      <button type="button" className={mode === "ranges" ? "active" : ""} onClick={() => { if (mode !== "ranges") history.checkpoint(currentHistoryState()); clearResults(); setMessage(""); setMode("ranges"); }}><Layers3 className="size-4" /><span><strong>Custom parts</strong><small>Several PDFs from ranges</small></span></button>
                      <button type="button" className={mode === "every-page" ? "active" : ""} onClick={() => { if (mode !== "every-page") history.checkpoint(currentHistoryState()); clearResults(); setMessage(""); setMode("every-page"); }}><FileText className="size-4" /><span><strong>Every page</strong><small>One PDF per page</small></span></button>
                    </div>
                  </div>
                  {mode === "extract" && <div className="organize-side-section"><div className="organize-side-heading"><h3>Pages to extract</h3><span>{selectedIndexes.size}</span></div><input className="split-editor-input" value={selection} onFocus={() => history.checkpoint(currentHistoryState())} onChange={(event) => { clearResults(); setMessage(""); setSelection(event.target.value); }} placeholder="1,3-5,8" /><p className="mt-2 text-[0.68rem] font-semibold leading-5 text-slate-500">Click thumbnails or type page numbers and ranges.</p></div>}
                  {mode === "ranges" && (
                    <div className="organize-side-section">
                      <div className="organize-side-heading"><h3>Custom ranges</h3><span>{ranges.length}</span></div>
                      <div className="split-range-controls">
                        {ranges.map((range, index) => (
                          <div key={range.id} className="split-range-control-row">
                            <div className="split-range-control-title">
                              <strong>Range {index + 1}</strong>
                              <button type="button" onClick={() => removeRange(range.id)} disabled={ranges.length === 1} aria-label={`Remove range ${index + 1}`}><Trash2 className="size-3.5" /></button>
                            </div>
                            <div className="split-range-input-row">
                              <label><span>From page</span><input type="number" min={1} max={loadedPdf.pageCount} value={range.start} onChange={(event) => updateRange(range.id, "start", Number(event.target.value))} /></label>
                              <em>to</em>
                              <label><span>To page</span><input type="number" min={1} max={loadedPdf.pageCount} value={range.end} onChange={(event) => updateRange(range.id, "end", Number(event.target.value))} /></label>
                            </div>
                          </div>
                        ))}
                        <button type="button" className="split-add-range" onClick={addRange} disabled={ranges.length >= MAX_RANGE_GROUPS}><Plus className="size-4" /> Add range</button>
                        <label className="split-merge-ranges"><input type="checkbox" checked={mergeRanges} onChange={(event) => { history.checkpoint(currentHistoryState()); clearResults(); setMessage(""); setMergeRanges(event.target.checked); }} /><span>Merge all ranges into one PDF file</span></label>
                      </div>
                    </div>
                  )}
                  {mode === "every-page" && <div className="organize-side-section"><div className="split-editor-info">All {loadedPdf.pageCount} pages are selected. NovaPDF will create one separate PDF for every checked page.</div></div>}
                  <div className="organize-side-section"><div className="organize-side-heading"><h3>Output filename</h3></div><label className="organize-filename-field"><input value={outputName} onFocus={() => history.checkpoint(currentHistoryState())} onChange={(event) => { clearResults(); setOutputName(event.target.value); }} maxLength={90} /><span>.pdf</span></label></div>
                </>
              )}

              {(status === "reading" || status === "processing") && <div className="organize-progress-box"><div><span>{status === "reading" ? "Reading PDF…" : "Splitting PDF…"}</span><strong>{progress}%</strong></div><div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div></div>}
              {status === "error" && message && <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>}
              {status === "success" && results.length > 0 && (
                <WorkspaceResultCard
                  title={`${activeTool.name} result is ready`}
                  summary={`${results.length} file${results.length === 1 ? "" : "s"} · ${formatBytes(totalResultSize)}`}
                  downloads={results.map((result) => ({
                    url: result.url,
                    name: result.name,
                    detail: `${result.label} · ${formatBytes(result.size)}`,
                  }))}
                />
              )}

              {results.length === 0 && loadedPdf && (
                <div className="organize-sidebar-action"><button type="button" className="organize-primary-action" onClick={() => void splitPdf()} disabled={status === "processing" || status === "reading"}>{status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} {activeTool.name} <ArrowRight className="size-4" /></button></div>
              )}
              <div className="organize-privacy-note"><LockKeyhole className="size-4" /> This PDF stays in your browser during this build.</div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div id="workspace" className="hero-workspace scroll-mt-28">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[var(--brand-strong)]"><Scissors className="size-5" /></span><div><p className="text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p><p className="text-xs text-slate-500">Private browser processing</p></div></div>
        <ToolSelectMenu activeTool={activeTool} onToolSelect={selectTool} className="hidden sm:block" />
      </div>
      <div className="p-4 sm:p-6">
        <input ref={inputRef} type="file" className="sr-only" accept=".pdf,application/pdf" onChange={onFileInput} />
        <div className={`upload-zone ${dragging ? "upload-zone-active" : ""}`} role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
          <span className="upload-icon"><CloudUpload className="size-7" /></span><p className="mt-4 text-lg font-extrabold text-[var(--ink)]">Drop one PDF here</p><p className="mt-1 text-sm text-slate-500">A dedicated full-screen split workspace opens after upload.</p><span className="button button-primary pointer-events-none mt-5"><UploadCloud className="size-4" /> Choose a PDF</span>
        </div>
        {message && <div className="mt-4 flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{message}</span></div>}
      </div>
    </div>
  );
}
