"use client";

import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CloudUpload,
  Copy,
  FilePlus2,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Scissors,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { ToolSelectMenu } from "@/components/tool-select-menu";
import { WorkspaceResultCard } from "@/components/workspace-result-card";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { useWorkspaceHistory } from "@/hooks/use-workspace-history";
import { pdfTools, type PdfTool } from "@/data/tools";
import { WORKSPACE_FILE_TRANSFER_EVENT, transferWorkspaceFiles, type WorkspaceFileTransferDetail } from "@/lib/workspace-file-transfer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_PAGE_COUNT = 200;

type OrganizeStatus = "idle" | "reading" | "processing" | "success" | "error";

type SourcePageMeta = {
  sourceIndex: number;
  sourceRotation: number;
  width: number;
  height: number;
};

type SourcePdf = {
  id: string;
  file: File;
  pageCount: number;
  pages: SourcePageMeta[];
};

type PageItem = SourcePageMeta & {
  id: string;
  sourceId: string;
  rotationDelta: number;
  selected: boolean;
};

type DownloadResult = {
  url: string;
  name: string;
  size: number;
  pageCount: number;
  kind: "organized" | "extracted";
};

type OrganizeHistoryState = {
  sources: SourcePdf[];
  pages: PageItem[];
};

function cloneOrganizeHistory(value: OrganizeHistoryState): OrganizeHistoryState {
  return {
    sources: [...value.sources],
    pages: value.pages.map((page) => ({ ...page })),
  };
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function hasPdfExtension(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function hasPdfHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const header = new TextDecoder("latin1").decode(bytes);
  return header.includes("%PDF-");
}

function cleanBaseName(value: string) {
  return (
    value
      .trim()
      .replace(/\.pdf$/i, "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 90)
      .trim() || "NovaPDF-organized"
  );
}

function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function pageItemsFromSource(source: SourcePdf): PageItem[] {
  return source.pages.map((page) => ({
    ...page,
    id: makeId(`page-${source.id}-${page.sourceIndex}`),
    sourceId: source.id,
    rotationDelta: 0,
    selected: false,
  }));
}

export function OrganizePdfWorkspace({
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
  const initialInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const dragPageId = useRef<string | null>(null);
  const history = useWorkspaceHistory<OrganizeHistoryState>(cloneOrganizeHistory, 120);
  const [sources, setSources] = useState<SourcePdf[]>([]);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
  const [outputName, setOutputName] = useState("NovaPDF-organized");
  const [draggingFile, setDraggingFile] = useState(false);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [status, setStatus] = useState<OrganizeStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [zoom, setZoom] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedCount = useMemo(() => pages.filter((page) => page.selected).length, [pages]);
  const totalInputSize = useMemo(() => sources.reduce((total, source) => total + source.file.size, 0), [sources]);
  const editorOpen = workspaceStarted || startInWorkspace;
  const thumbnailSize = Math.round(176 * zoom / 100);

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editorOpen, isActive]);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  useEffect(() => {
    if (sources.length === 0) return;
    let cancelled = false;

    async function renderThumbnails() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        for (const source of sources) {
          const missing = source.pages.filter(
            (page) => !thumbnails[`${source.id}:${page.sourceIndex}`] && !thumbnailErrors[`${source.id}:${page.sourceIndex}`],
          );
          if (missing.length === 0 || cancelled) continue;

          const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await source.file.arrayBuffer()) });
          const documentProxy = await loadingTask.promise;

          for (const meta of missing) {
            if (cancelled) break;
            const key = `${source.id}:${meta.sourceIndex}`;
            try {
              const page = await documentProxy.getPage(meta.sourceIndex + 1);
              const baseViewport = page.getViewport({ scale: 1 });
              const scale = Math.min(0.75, 210 / Math.max(baseViewport.width, baseViewport.height));
              const viewport = page.getViewport({ scale: Math.max(scale, 0.18) });
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d", { alpha: false });
              if (!context) throw new Error("Canvas is unavailable");
              canvas.width = Math.max(1, Math.floor(viewport.width));
              canvas.height = Math.max(1, Math.floor(viewport.height));
              context.fillStyle = "#ffffff";
              context.fillRect(0, 0, canvas.width, canvas.height);
              await page.render({ canvas, canvasContext: context, viewport }).promise;
              const dataUrl = canvas.toDataURL("image/png");
              if (!cancelled) setThumbnails((current) => ({ ...current, [key]: dataUrl }));
              page.cleanup();
            } catch {
              if (!cancelled) setThumbnailErrors((current) => ({ ...current, [key]: true }));
            }
          }

          await loadingTask.destroy();
        }
      } catch {
        // The editor remains usable with page placeholders if preview rendering is unavailable.
      }
    }

    void renderThumbnails();
    return () => {
      cancelled = true;
    };
  }, [sources, thumbnails, thumbnailErrors]);

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      resetWorkspaceFields();
      setWorkspaceStarted(true);
      if (detail.files.length > 0) void loadFiles(detail.files, false);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
  // The transfer listener intentionally uses the latest workspace loader without re-subscribing on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  function clearResult() {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setProgress(0);
    if (status !== "reading") setStatus("idle");
  }

  function selectTool(slug: string) {
    const tool = pdfTools.find((item) => item.slug === slug);
    if (tool) onToolChange(tool);
  }

  async function readSource(file: File): Promise<SourcePdf> {
    if (!hasPdfExtension(file) || !(await hasPdfHeader(file))) throw new Error(`invalid:${file.name}`);
    if (file.size === 0) throw new Error(`empty:${file.name}`);
    if (file.size > MAX_FILE_SIZE) throw new Error(`size:${file.name}`);

    const { PDFDocument } = await import("pdf-lib");
    const document = await PDFDocument.load(await file.arrayBuffer(), {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    const pageCount = document.getPageCount();
    if (pageCount < 1) throw new Error(`empty:${file.name}`);

    const sourceId = makeId("source");
    const pageMeta = document.getPages().map((page, sourceIndex) => {
      const size = page.getSize();
      return {
        sourceIndex,
        sourceRotation: page.getRotation().angle,
        width: Math.round(size.width),
        height: Math.round(size.height),
      } satisfies SourcePageMeta;
    });

    return { id: sourceId, file, pageCount, pages: pageMeta };
  }

  async function loadFiles(files: File[], append: boolean) {
    if (files.length === 0) return;
    clearResult();
    setMessage("");
    setStatus("reading");
    setProgress(8);

    try {
      const accepted: SourcePdf[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const source = await readSource(files[index]);
        accepted.push(source);
        setProgress(10 + Math.round(((index + 1) / files.length) * 68));
      }

      const existingPageCount = append ? pages.length : 0;
      const incomingPageCount = accepted.reduce((total, source) => total + source.pageCount, 0);
      if (existingPageCount + incomingPageCount > MAX_TOTAL_PAGE_COUNT) {
        throw new Error(`page-limit:${existingPageCount + incomingPageCount}`);
      }

      setWorkspaceStarted(true);

      if (append) {
        setSources((current) => [...current, ...accepted]);
        setPages((current) => [...current, ...accepted.flatMap(pageItemsFromSource)]);
      } else {
        setSources(accepted);
        setPages(accepted.flatMap(pageItemsFromSource));
        setThumbnails({});
        setThumbnailErrors({});
        setOutputName(`${cleanBaseName(accepted[0].file.name)}-organized`);
      }

      setProgress(100);
      setStatus("idle");
    } catch (error) {
      const details = error instanceof Error ? error.message : "";
      setProgress(0);
      setStatus("error");
      if (details.startsWith("invalid:")) {
        setMessage(`${details.slice(8)} is not a valid PDF file.`);
      } else if (details.startsWith("empty:")) {
        setMessage(`${details.slice(6)} is empty or has no readable pages.`);
      } else if (details.startsWith("size:")) {
        setMessage(`${details.slice(5)} is larger than the current 50 MB per-file limit.`);
      } else if (details.startsWith("page-limit:")) {
        setMessage(`The selected files contain ${details.split(":")[1]} pages. This build supports up to ${MAX_TOTAL_PAGE_COUNT} pages in one workspace.`);
      } else if (details.toLowerCase().includes("encrypt") || details.toLowerCase().includes("password")) {
        setMessage("One of these PDFs is password-protected. Unlock it first, then try again.");
      } else {
        setMessage("NovaPDF could not read one of these PDFs. It may be damaged or unsupported.");
      }
    }
  }

  function onInitialFileInput(event: ChangeEvent<HTMLInputElement>) {
    void loadFiles(Array.from(event.target.files ?? []), false);
    event.target.value = "";
  }

  function onAddFileInput(event: ChangeEvent<HTMLInputElement>) {
    void loadFiles(Array.from(event.target.files ?? []), true);
    event.target.value = "";
  }

  function onFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingFile(false);
    void loadFiles(Array.from(event.dataTransfer.files ?? []), false);
  }

  function currentOrganizeHistory(): OrganizeHistoryState {
    return { sources, pages };
  }

  function applyOrganizeHistory(snapshot: OrganizeHistoryState) {
    setSources(snapshot.sources);
    setPages(snapshot.pages);
    clearResult();
    setMessage("");
  }

  function undoOrganize() { history.undo(currentOrganizeHistory(), applyOrganizeHistory); }
  function redoOrganize() { history.redo(currentOrganizeHistory(), applyOrganizeHistory); }

  function updatePages(updater: (current: PageItem[]) => PageItem[]) {
    history.checkpoint(currentOrganizeHistory());
    clearResult();
    setMessage("");
    setPages(updater);
  }

  function movePage(index: number, direction: -1 | 1) {
    updatePages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function movePageTo(pageId: string, targetId: string) {
    if (pageId === targetId) return;
    updatePages((current) => {
      const fromIndex = current.findIndex((page) => page.id === pageId);
      const targetIndex = current.findIndex((page) => page.id === targetId);
      if (fromIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moving] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, moving);
      return next;
    });
  }

  function rotatePage(id: string, delta: -90 | 90) {
    updatePages((current) =>
      current.map((page) =>
        page.id === id ? { ...page, rotationDelta: normalizeRotation(page.rotationDelta + delta) } : page,
      ),
    );
  }

  function rotateSelected(delta: -90 | 90) {
    if (selectedCount === 0) {
      setStatus("error");
      setMessage("Select one or more pages first.");
      return;
    }
    updatePages((current) =>
      current.map((page) =>
        page.selected ? { ...page, rotationDelta: normalizeRotation(page.rotationDelta + delta) } : page,
      ),
    );
  }

  function duplicatePage(id: string) {
    updatePages((current) => {
      const index = current.findIndex((page) => page.id === id);
      if (index < 0) return current;
      const original = current[index];
      const duplicate = { ...original, id: makeId(`duplicate-${original.sourceId}`), selected: false };
      const next = [...current];
      next.splice(index + 1, 0, duplicate);
      return next;
    });
  }

  function removePage(id: string) {
    if (pages.length === 1) {
      setStatus("error");
      setMessage("A PDF must keep at least one page.");
      return;
    }
    updatePages((current) => current.filter((page) => page.id !== id));
  }

  function toggleSelected(id: string) {
    updatePages((current) =>
      current.map((page) => (page.id === id ? { ...page, selected: !page.selected } : page)),
    );
  }

  function selectAll() {
    const shouldSelect = selectedCount !== pages.length;
    updatePages((current) => current.map((page) => ({ ...page, selected: shouldSelect })));
  }

  function removeSelected() {
    if (selectedCount === 0) {
      setStatus("error");
      setMessage("Select one or more pages first.");
      return;
    }
    if (selectedCount === pages.length) {
      setStatus("error");
      setMessage("You cannot remove every page. Keep at least one page.");
      return;
    }
    updatePages((current) => current.filter((page) => !page.selected));
  }

  function resetPages() {
    history.checkpoint(currentOrganizeHistory());
    clearResult();
    setMessage("");
    setPages(sources.flatMap(pageItemsFromSource));
  }

  function reversePages() {
    updatePages((current) => [...current].reverse());
  }

  function sortOriginalOrder() {
    const sourceOrder = new Map(sources.map((source, index) => [source.id, index]));
    updatePages((current) =>
      [...current].sort((a, b) => {
        const sourceDifference = (sourceOrder.get(a.sourceId) ?? 0) - (sourceOrder.get(b.sourceId) ?? 0);
        return sourceDifference || a.sourceIndex - b.sourceIndex;
      }),
    );
  }

  function removeSource(sourceId: string) {
    history.checkpoint(currentOrganizeHistory());
    const remainingSources = sources.filter((source) => source.id !== sourceId);
    const remainingPages = pages.filter((page) => page.sourceId !== sourceId);
    if (remainingSources.length === 0 || remainingPages.length === 0) {
      startOver();
      return;
    }
    clearResult();
    setSources(remainingSources);
    setPages(remainingPages);
  }

  function resetWorkspaceFields() {
    clearResult();
    setSources([]);
    setPages([]);
    setThumbnails({});
    setThumbnailErrors({});
    setOutputName("NovaPDF-organized");
    setMessage("");
    setStatus("idle");
    setSidebarOpen(false);
    setZoom(100);
    history.reset();
  }

  function startOver() {
    resetWorkspaceFields();
    setWorkspaceStarted(true);
  }

  function goHome() {
    setSidebarOpen(false);
    setWorkspaceStarted(false);
    onExitWorkspace?.();
    window.requestAnimationFrame(() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const handleOrganizeKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (!editorOpen || !isActive || pages.length === 0 || event.defaultPrevented) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return;
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier && key === "z") { event.preventDefault(); if (event.shiftKey) redoOrganize(); else undoOrganize(); return; }
    if (modifier && key === "y") { event.preventDefault(); redoOrganize(); return; }
    if (modifier && key === "o") { event.preventDefault(); addInputRef.current?.click(); return; }
    if (modifier && key === "s") { event.preventDefault(); if (status !== "processing" && status !== "reading") void buildPdf("organized"); return; }
    if (modifier && key === "a") { event.preventDefault(); selectAll(); return; }
    if ((event.key === "Delete" || event.key === "Backspace") && selectedCount > 0 && selectedCount < pages.length) {
      event.preventDefault();
      removeSelected();
      return;
    }
    if (event.key === "Escape" && selectedCount > 0) {
      event.preventDefault();
      updatePages((current) => current.map((page) => ({ ...page, selected: false })));
    }
  });

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    document.addEventListener("keydown", handleOrganizeKeyboard, true);
    return () => document.removeEventListener("keydown", handleOrganizeKeyboard, true);
  }, [editorOpen, isActive]);

  async function buildPdf(kind: "organized" | "extracted") {
    clearResult();
    setMessage("");

    const targetPages = kind === "extracted" ? pages.filter((page) => page.selected) : pages;
    if (targetPages.length === 0) {
      setStatus("error");
      setMessage("Select at least one page to extract.");
      return;
    }

    setStatus("processing");
    setProgress(8);

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const sourceDocuments = new Map<string, Awaited<ReturnType<typeof PDFDocument.load>>>();

      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index];
        const document = await PDFDocument.load(await source.file.arrayBuffer(), {
          updateMetadata: false,
          throwOnInvalidObject: true,
        });
        sourceDocuments.set(source.id, document);
        setProgress(10 + Math.round(((index + 1) / sources.length) * 20));
      }

      const output = await PDFDocument.create();
      for (let index = 0; index < targetPages.length; index += 1) {
        const item = targetPages[index];
        const sourceDocument = sourceDocuments.get(item.sourceId);
        if (!sourceDocument) throw new Error("missing-source");
        const [copiedPage] = await output.copyPages(sourceDocument, [item.sourceIndex]);
        copiedPage.setRotation(degrees(normalizeRotation(item.sourceRotation + item.rotationDelta)));
        output.addPage(copiedPage);
        setProgress(32 + Math.round(((index + 1) / targetPages.length) * 48));
      }

      const baseName = cleanBaseName(outputName);
      const name = `${baseName}${kind === "extracted" ? "-extracted" : ""}.pdf`;
      const now = new Date();
      output.setTitle(name.replace(/\.pdf$/i, ""));
      output.setAuthor("NovaPDF user");
      output.setCreator("NovaPDF Organize PDF");
      output.setProducer("NovaPDF using pdf-lib");
      output.setCreationDate(now);
      output.setModificationDate(now);

      const bytes = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResult({
        url: URL.createObjectURL(blob),
        name,
        size: blob.size,
        pageCount: targetPages.length,
        kind,
      });
      setProgress(100);
      setStatus("success");
      setSidebarOpen(true);
    } catch (error) {
      const details = error instanceof Error ? error.message.toLowerCase() : "";
      setProgress(0);
      setStatus("error");
      setMessage(
        details.includes("encrypt") || details.includes("password")
          ? "One of these PDFs is password-protected. Unlock it first, then try again."
          : "NovaPDF could not create the organized PDF. Please reload the files and try again.",
      );
      setSidebarOpen(true);
    }
  }

  if (editorOpen) {
    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input
          ref={initialInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="sr-only"
          onChange={onInitialFileInput}
        />
        <input
          ref={addInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="sr-only"
          onChange={onAddFileInput}
        />

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
              transferWorkspaceFiles(tool, sources.map((source) => source.file));
              onToolChange(tool);
            }}
            onExitWorkspace={goHome}
            onOpenControls={() => setSidebarOpen((current) => !current)}
          />
          <main className="organize-canvas-area">
            {sources.length === 0 ? (
              <div className="workspace-empty-canvas">
                <div
                  className={`workspace-empty-upload ${draggingFile ? "workspace-empty-upload-active" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => initialInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") initialInputRef.current?.click();
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDraggingFile(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setDraggingFile(false)}
                  onDrop={onFileDrop}
                >
                  <span><CloudUpload className="size-8" /></span>
                  <strong>Upload PDFs to organize</strong>
                  <p>Add one or more PDFs, then reorder, rotate, duplicate, remove, or extract pages.</p>
                  <em>Choose PDFs</em>
                </div>
              </div>
            ) : (
              <>
            <div className="organize-floating-toolbar">
              <button type="button" onClick={selectAll} title="Select all pages">
                <Check className="size-4" />
                <span className="hidden sm:inline">{selectedCount === pages.length ? "Clear" : "Select all"}</span>
              </button>
              <span className="toolbar-divider" />
              <button type="button" onClick={sortOriginalOrder} title="Restore original page order">
                <ArrowDownAZ className="size-4" />
                <span className="hidden md:inline">Original order</span>
              </button>
              <button type="button" onClick={reversePages} title="Reverse page order">
                <ArrowRight className="size-4 rotate-180" />
                <span className="hidden md:inline">Reverse</span>
              </button>
              <span className="toolbar-divider" />
              <WorkspaceZoomControls
                    active={isActive}
                    value={zoom}
                    onChange={setZoom}
                    canUndo={history.canUndo}
                    canRedo={history.canRedo}
                    onUndo={undoOrganize}
                    onRedo={redoOrganize}
                    pageCount={pages.length}
                  />
            </div>

            <div className="organize-pages-scroll">
              <div className="organize-pages-grid">
                {pages.map((page, index) => {
                  const source = sources.find((item) => item.id === page.sourceId);
                  const thumbnailKey = `${page.sourceId}:${page.sourceIndex}`;
                  const thumbnail = thumbnails[thumbnailKey];
                  const effectiveRotation = normalizeRotation(page.sourceRotation + page.rotationDelta);

                  return (
                    <article
                      key={page.id}
                      draggable
                      style={{ width: `${thumbnailSize}px` }}
                      onDragStart={() => {
                        dragPageId.current = page.id;
                      }}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setDragOverPageId(page.id);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const movingId = dragPageId.current;
                        if (movingId) movePageTo(movingId, page.id);
                        dragPageId.current = null;
                        setDragOverPageId(null);
                      }}
                      onDragEnd={() => {
                        dragPageId.current = null;
                        setDragOverPageId(null);
                      }}
                      data-novapdf-view-page={index + 1}
                      className={`organize-page-card ${page.selected ? "organize-page-card-selected" : ""} ${
                        dragOverPageId === page.id ? "organize-page-card-dragover" : ""
                      }`}
                    >
                      <div className="organize-card-topline">
                        <button
                          type="button"
                          className={`organize-select-check ${page.selected ? "organize-select-check-active" : ""}`}
                          onClick={() => toggleSelected(page.id)}
                          aria-label={`Select output page ${index + 1}`}
                        >
                          {page.selected && <Check className="size-3.5" strokeWidth={3} />}
                        </button>
                        <span className="organize-drag-handle" title="Drag to reorder">
                          <GripVertical className="size-4" />
                        </span>
                      </div>

                      <button
                        type="button"
                        className="organize-thumbnail-button"
                        style={{ height: `${Math.round(thumbnailSize * 1.32)}px` }}
                        onClick={() => toggleSelected(page.id)}
                        aria-label={`Toggle output page ${index + 1}`}
                      >
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnail}
                            alt={`Preview of ${source?.file.name ?? "PDF"}, page ${page.sourceIndex + 1}`}
                            style={{ transform: `rotate(${effectiveRotation}deg)` }}
                            className="organize-page-thumbnail"
                          />
                        ) : thumbnailErrors[thumbnailKey] ? (
                          <span className="organize-thumbnail-fallback">
                            <ImageIcon className="size-7" />
                            Preview unavailable
                          </span>
                        ) : (
                          <span className="organize-thumbnail-loading">
                            <LoaderCircle className="size-6 animate-spin" />
                            Rendering page…
                          </span>
                        )}
                      </button>

                      <div className="organize-card-actions">
                        <button type="button" onClick={() => rotatePage(page.id, -90)} aria-label="Rotate page left" title="Rotate left">
                          <RotateCcw className="size-4" />
                        </button>
                        <button type="button" onClick={() => rotatePage(page.id, 90)} aria-label="Rotate page right" title="Rotate right">
                          <RotateCw className="size-4" />
                        </button>
                        <button type="button" onClick={() => duplicatePage(page.id)} aria-label="Duplicate page" title="Duplicate">
                          <Copy className="size-4" />
                        </button>
                        <button type="button" onClick={() => removePage(page.id)} aria-label="Remove page" title="Remove">
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="organize-card-caption organize-card-caption-number-only">
                        <strong>{index + 1}</strong>
                      </div>

                      <div className="organize-card-move-buttons">
                        <button type="button" disabled={index === 0} onClick={() => movePage(index, -1)} aria-label="Move page left">
                          <ArrowLeft className="size-3.5" />
                        </button>
                        <button type="button" disabled={index === pages.length - 1} onClick={() => movePage(index, 1)} aria-label="Move page right">
                          <ArrowRight className="size-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}

                <button
                  type="button"
                  className="organize-add-card"
                  style={{ width: `${thumbnailSize}px`, minHeight: `${Math.round(thumbnailSize * 1.52)}px` }}
                  onClick={() => addInputRef.current?.click()}
                >
                  <span><Plus className="size-7" /></span>
                  <strong>Add more PDFs</strong>
                  <small>Combine pages in this workspace</small>
                </button>
              </div>
            </div>
              </>
            )}
          </main>

          <aside className={`organize-sidebar ${sidebarOpen ? "organize-sidebar-open" : ""}`}>
            <div className="organize-sidebar-scroll">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-teal-700">Workspace</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[var(--ink)]">{activeTool.name}</h2>
              </div>

              <section className="organize-side-section">
                <div className="organize-side-heading">
                  <h3>Files</h3>
                  <button type="button" onClick={resetPages}>Reset all</button>
                </div>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <div key={source.id} className="organize-source-row">
                      <span className="organize-source-letter">{String.fromCharCode(65 + (index % 26))}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-[var(--ink)]">{source.file.name}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{source.pageCount} pages · {formatBytes(source.file.size)}</p>
                      </div>
                      <button type="button" onClick={() => removeSource(source.id)} aria-label={`Remove ${source.file.name}`}>
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="organize-add-file-button" onClick={() => addInputRef.current?.click()}>
                  <FilePlus2 className="size-4" /> Add another PDF
                </button>
              </section>

              <section className="organize-side-section">
                <div className="organize-side-heading"><h3>Selected pages</h3><span>{selectedCount}</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="organize-side-tool" onClick={() => rotateSelected(-90)} disabled={selectedCount === 0}>
                    <RotateCcw className="size-4" /> Rotate left
                  </button>
                  <button type="button" className="organize-side-tool" onClick={() => rotateSelected(90)} disabled={selectedCount === 0}>
                    <RotateCw className="size-4" /> Rotate right
                  </button>
                  <button type="button" className="organize-side-tool" onClick={removeSelected} disabled={selectedCount === 0}>
                    <Trash2 className="size-4" /> Remove
                  </button>
                  <button type="button" className="organize-side-tool" onClick={() => void buildPdf("extracted")} disabled={selectedCount === 0 || status === "processing"}>
                    <Scissors className="size-4" /> Extract
                  </button>
                </div>
              </section>

              <section className="organize-side-section">
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Output filename</span>
                  <div className="organize-filename-field">
                    <input
                      type="text"
                      value={outputName}
                      onChange={(event) => {
                        clearResult();
                        setOutputName(event.target.value);
                      }}
                      maxLength={90}
                    />
                    <span>.pdf</span>
                  </div>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                  <span>{pages.length} output pages</span>
                  <span className="text-right">{formatBytes(totalInputSize)} input</span>
                </div>
              </section>

              {(status === "reading" || status === "processing") && (
                <div className="organize-progress-box" aria-live="polite">
                  <div><span>{status === "reading" ? "Reading PDFs…" : "Creating PDF…"}</span><strong>{progress}%</strong></div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && (
                <div className="organize-error-box" role="alert"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>
              )}

              {status === "success" && result && (
                <WorkspaceResultCard
                  title={result.kind === "organized" ? "Organized PDF is ready" : "Extracted pages are ready"}
                  summary={`${result.pageCount} pages · ${formatBytes(result.size)}`}
                  downloads={[{ url: result.url, name: result.name }]}
                />
              )}

              {!result && pages.length > 0 && (
                <div className="organize-sidebar-action">
                  <button
                    type="button"
                    className="organize-primary-action"
                    disabled={status === "processing"}
                    onClick={() => void buildPdf("organized")}
                  >
                    {status === "processing" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                    {activeTool.name}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              <div className="organize-privacy-note">
                <LockKeyhole className="size-4" />
                These files stay in this browser during this build.
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
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[var(--brand-strong)]">
            <activeTool.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p>
            <p className="truncate text-xs text-slate-500">Full-screen page workspace</p>
          </div>
        </div>

        <ToolSelectMenu activeTool={activeTool} onToolSelect={selectTool} className="hidden sm:block" />
      </div>

      <div className="p-4 sm:p-6">
        <input
          ref={initialInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="sr-only"
          onChange={onInitialFileInput}
        />

        <div
          className={`upload-zone ${draggingFile ? "upload-zone-active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => initialInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") initialInputRef.current?.click();
          }}
          onDragEnter={(event) => { event.preventDefault(); setDraggingFile(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDraggingFile(false)}
          onDrop={onFileDrop}
        >
          <span className="upload-icon"><CloudUpload className="size-7" aria-hidden="true" /></span>
          <p className="mt-4 text-lg font-extrabold tracking-[-0.025em] text-[var(--ink)]">Drop PDF files here</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
            After upload, NovaPDF opens a spacious dedicated page editor with real thumbnails and a separate control panel.
          </p>
          <span className="button button-primary pointer-events-none mt-5"><UploadCloud className="size-4" /> Choose PDF files</span>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-teal-600" /> Up to 50 MB each</span>
            <span className="inline-flex items-center gap-1.5"><Layers3 className="size-3.5 text-teal-600" /> Up to {MAX_TOTAL_PAGE_COUNT} pages</span>
          </div>
        </div>

        {status === "reading" && (
          <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4" aria-live="polite">
            <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-teal-800"><span>Opening PDF workspace…</span><span>{progress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-teal-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        {status === "error" && message && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700" role="alert">
            <CircleAlert className="mt-0.5 size-5 shrink-0" /><span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
