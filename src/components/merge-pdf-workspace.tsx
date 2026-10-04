/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowDown,
  RotateCcw,
  ArrowRight,
  ArrowUp,
  CircleAlert,
  CloudUpload,
  Combine,
  FileImage,
  FilePlus2,
  FileText,
  GripVertical,
  LoaderCircle,
  LockKeyhole,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties } from "react";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { ToolSelectMenu } from "@/components/tool-select-menu";
import { WorkspaceResultCard } from "@/components/workspace-result-card";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { useWorkspaceHistory } from "@/hooks/use-workspace-history";
import { pdfTools, type PdfTool } from "@/data/tools";
import { WORKSPACE_FILE_TRANSFER_EVENT, transferWorkspaceFiles, type WorkspaceFileTransferDetail } from "@/lib/workspace-file-transfer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const MAX_FILES = 20;
const MERGE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

type MergeItem = {
  id: string;
  file: File;
  kind: "pdf" | "image";
  pageCount: number;
};
type MergeResult = { url: string; name: string; fileCount: number; pageCount: number; size: number };
type MergeStatus = "idle" | "reading" | "processing" | "success" | "error";
type MergeHistoryState = { items: MergeItem[]; outputName: string };

function cloneMergeHistory(value: MergeHistoryState): MergeHistoryState {
  return { items: [...value.items], outputName: value.outputName };
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function normaliseOutputName(value: string) {
  const cleaned = value
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 100)
    .trim();
  return `${cleaned || "NovaPDF-merged"}.pdf`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file: File) {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)
  );
}

async function hasPdfHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return new TextDecoder("latin1").decode(bytes).includes("%PDF-");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not preview image"));
    reader.readAsDataURL(file);
  });
}

async function imageToPngBytes(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    bitmap.close();
    throw new Error("Canvas unavailable");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Image conversion failed"))), "image/png");
  });
  return blob.arrayBuffer();
}

export function MergePdfWorkspace({
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
  const [items, setItems] = useState<MergeItem[]>([]);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<MergeStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [outputName, setOutputName] = useState("NovaPDF-merged");
  const [result, setResult] = useState<MergeResult | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState(100);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const history = useWorkspaceHistory<MergeHistoryState>(cloneMergeHistory);

  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);
  const totalPages = useMemo(() => items.reduce((sum, item) => sum + item.pageCount, 0), [items]);
  const editorOpen = workspaceStarted || startInWorkspace;

  function currentHistoryState(): MergeHistoryState {
    return { items, outputName };
  }

  function applyHistoryState(value: MergeHistoryState) {
    clearResult();
    setItems([...value.items]);
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
            if (item.kind === "image") {
              const preview = await fileToDataUrl(item.file);
              if (!cancelled) setThumbnails((current) => ({ ...current, [item.id]: preview }));
              continue;
            }

            const task = pdfjs.getDocument({ data: new Uint8Array(await item.file.arrayBuffer()) });
            const pdf = await task.promise;
            const page = await pdf.getPage(1);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({
              scale: Math.max(Math.min(0.7, 220 / Math.max(base.width, base.height)), 0.2),
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
        // Cards remain usable if preview rendering is unavailable.
      }
    }

    void renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [editorOpen, items, thumbnails, thumbnailErrors]);




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
    setOutputName("NovaPDF-merged");
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
    clearResult();
    setMessage("");
    setStatus("reading");
    setWorkspaceStarted(true);

    const baseItems = replaceExisting ? [] : items;
    const availableSlots = MAX_FILES - baseItems.length;
    if (availableSlots <= 0) {
      setStatus("error");
      setMessage(`You can merge up to ${MAX_FILES} PDF or image files.`);
      return;
    }

    const accepted: MergeItem[] = [];
    const errors: string[] = [];
    let runningTotal = replaceExisting ? 0 : totalSize;
    const { PDFDocument } = await import("pdf-lib");

    for (const file of incoming.slice(0, availableSlots)) {
      const duplicate = [...baseItems, ...accepted].some(
        (item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified,
      );
      if (duplicate) {
        errors.push(`${file.name}: already added`);
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
      if (runningTotal + file.size > MAX_TOTAL_SIZE) {
        errors.push(`${file.name}: total would exceed 150 MB`);
        continue;
      }

      const id = `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
      try {
        if (isPdfFile(file)) {
          if (!(await hasPdfHeader(file))) throw new Error("invalid PDF");
          const document = await PDFDocument.load(await file.arrayBuffer(), {
            updateMetadata: false,
            throwOnInvalidObject: true,
          });
          const pageCount = document.getPageCount();
          if (pageCount < 1) throw new Error("empty PDF");
          accepted.push({ id, file, kind: "pdf", pageCount });
        } else if (isImageFile(file)) {
          const bitmap = await createImageBitmap(file);
          if (!bitmap.width || !bitmap.height) throw new Error("invalid image");
          bitmap.close();
          accepted.push({ id, file, kind: "image", pageCount: 1 });
        } else {
          throw new Error("unsupported file type");
        }
        runningTotal += file.size;
      } catch (error) {
        const detail = error instanceof Error ? error.message.toLowerCase() : "";
        if (detail.includes("encrypt") || detail.includes("password")) {
          errors.push(`${file.name}: password-protected PDF`);
        } else {
          errors.push(`${file.name}: invalid, damaged, or unsupported`);
        }
      }
    }

    if (accepted.length) {
      if (!replaceExisting) history.checkpoint(currentHistoryState());
      setItems((current) => (replaceExisting ? accepted : [...current, ...accepted]));
    } else if (replaceExisting) {
      setItems([]);
    }
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

  function selectTool(slug: string) {
    const tool = pdfTools.find((item) => item.slug === slug);
    if (tool) onToolChange(tool);
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
        if (items.length >= 2 && status !== "processing" && status !== "reading") void mergeFiles();
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedItemId) {
        event.preventDefault();
        removeItem(selectedItemId);
      } else if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key) && selectedItemId) {
        const index = items.findIndex((item) => item.id === selectedItemId);
        const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
        if (index >= 0) { event.preventDefault(); moveItem(index, direction); }
      } else if (event.key === "Escape") {
        setSelectedItemId(null);
      } else if (modifier && key === "0") {
        event.preventDefault();
        setZoom(100);
      } else if (modifier && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        setZoom((value) => Math.min(200, value + 10));
      } else if (modifier && event.key === "-") {
        event.preventDefault();
        setZoom((value) => Math.max(50, value - 10));
      }
  });

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    document.addEventListener("keydown", handleWorkspaceKeyDown);
    return () => document.removeEventListener("keydown", handleWorkspaceKeyDown);
  }, [editorOpen, isActive]);

  async function mergeFiles() {
    clearResult();
    setMessage("");
    if (items.length < 2) {
      setStatus("error");
      setMessage("Please add at least two PDFs or images before merging.");
      setSidebarOpen(true);
      return;
    }

    setStatus("processing");
    setProgress(5);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      let pageCount = 0;

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        if (item.kind === "pdf") {
          const source = await PDFDocument.load(await item.file.arrayBuffer(), {
            updateMetadata: false,
            throwOnInvalidObject: true,
          });
          const count = source.getPageCount();
          const copied = await merged.copyPages(source, Array.from({ length: count }, (_, pageIndex) => pageIndex));
          copied.forEach((page) => merged.addPage(page));
          pageCount += count;
        } else {
          const lowerName = item.file.name.toLowerCase();
          const directJpeg = item.file.type === "image/jpeg" || /\.jpe?g$/i.test(lowerName);
          const directPng = item.file.type === "image/png" || /\.png$/i.test(lowerName);
          const bytes = directJpeg || directPng ? await item.file.arrayBuffer() : await imageToPngBytes(item.file);
          const embedded = directJpeg ? await merged.embedJpg(bytes) : await merged.embedPng(bytes);
          const portrait = embedded.height >= embedded.width;
          const pageWidth = portrait ? 595.28 : 841.89;
          const pageHeight = portrait ? 841.89 : 595.28;
          const margin = 28;
          const scale = Math.min((pageWidth - margin * 2) / embedded.width, (pageHeight - margin * 2) / embedded.height);
          const width = embedded.width * scale;
          const height = embedded.height * scale;
          const page = merged.addPage([pageWidth, pageHeight]);
          page.drawImage(embedded, {
            x: (pageWidth - width) / 2,
            y: (pageHeight - height) / 2,
            width,
            height,
          });
          pageCount += 1;
        }
        setProgress(Math.round(((index + 1) / items.length) * 78) + 7);
      }

      const finalName = normaliseOutputName(outputName);
      merged.setTitle(finalName.replace(/\.pdf$/i, ""));
      merged.setCreator("NovaPDF Merge PDF");
      merged.setProducer("NovaPDF using pdf-lib");
      const bytes = await merged.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 50 });
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResult({
        url: URL.createObjectURL(blob),
        name: finalName,
        fileCount: items.length,
        pageCount,
        size: blob.size,
      });
      setProgress(100);
      setStatus("success");
      setSidebarOpen(true);
    } catch (error) {
      const details = error instanceof Error ? error.message.toLowerCase() : "";
      setStatus("error");
      setProgress(0);
      setMessage(
        details.includes("encrypt") || details.includes("password")
          ? "One PDF is password-protected. Unlock it first."
          : "NovaPDF could not merge these files. One PDF or image may be damaged or unsupported.",
      );
      setSidebarOpen(true);
    }
  }

  if (editorOpen) {
    return (
      <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
        <input ref={inputRef} type="file" accept={MERGE_ACCEPT} multiple className="sr-only" onChange={onFileInput} />

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
                  <strong>Upload PDFs or images</strong>
                  <p>Choose PDF, JPG, PNG, or WebP files. Every image becomes one clean PDF page.</p>
                  <em>Choose files</em>
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
                    <span className="hidden sm:inline">Add files</span>
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
                    className="merge-editor-grid"
                    style={{
                      "--merge-card-width": `${Math.round(216 * zoom / 100)}px`,
                      "--merge-preview-height": `${Math.round(272 * zoom / 100)}px`,
                    } as CSSProperties}
                  >
                    {items.map((item, index) => (
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
                        className={`merge-editor-card ${dragOverId === item.id ? "merge-editor-card-dragover" : ""} ${selectedItemId === item.id ? "merge-editor-card-selected" : ""}`}
                        onClick={() => setSelectedItemId(item.id)}
                        tabIndex={0}
                        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedItemId(item.id); } }}
                      >
                        <div className="organize-card-topline">
                          <span className="merge-editor-order">{index + 1}</span>
                          <span className="organize-drag-handle"><GripVertical className="size-4" /></span>
                        </div>
                        <div className="merge-editor-preview">
                          {thumbnails[item.id] ? (
                            <img src={thumbnails[item.id]} alt={`Preview of ${item.file.name}`} />
                          ) : thumbnailErrors[item.id] ? (
                            <span>{item.kind === "image" ? <FileImage className="size-8" /> : <FileText className="size-8" />} Preview unavailable</span>
                          ) : (
                            <span><LoaderCircle className="size-6 animate-spin" /> Rendering preview…</span>
                          )}
                        </div>
                        <div className="merge-editor-actions">
                          <button type="button" disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveItem(index, -1); }} aria-label="Move up"><ArrowUp className="size-4" /></button>
                          <button type="button" disabled={index === items.length - 1} onClick={(event) => { event.stopPropagation(); moveItem(index, 1); }} aria-label="Move down"><ArrowDown className="size-4" /></button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); removeItem(item.id); }} aria-label="Remove file"><Trash2 className="size-4" /></button>
                        </div>
                      </article>
                    ))}
                    <button type="button" className="organize-add-card merge-editor-add" onClick={() => inputRef.current?.click()}>
                      <span><FilePlus2 className="size-6" /></span>
                      <strong>Add PDFs or images</strong>
                      <small>Add another source to the final page order.</small>
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
                  <div className="split-editor-info">Use the upload box in the middle to add PDF, JPG, PNG, or WebP files.</div>
                </div>
              ) : (
                <>
                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Sources</h3></div>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={item.id} className="organize-source-row">
                          <span className="organize-source-letter">{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-slate-700">{item.file.name}</p>
                            <p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">
                              {item.kind === "image" ? "Image · 1 page" : `PDF · ${item.pageCount} pages`} · {formatBytes(item.file.size)}
                            </p>
                          </div>
                          <button type="button" onClick={(event) => { event.stopPropagation(); removeItem(item.id); }} aria-label={`Remove ${item.file.name}`}><Trash2 className="size-4" /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="organize-add-file-button" onClick={() => inputRef.current?.click()}>
                      <FilePlus2 className="size-4" /> Add more files
                    </button>
                  </div>

                  <div className="organize-side-section">
                    <div className="organize-side-heading"><h3>Output filename</h3></div>
                    <label className="organize-filename-field">
                      <input value={outputName} onFocus={() => history.checkpoint(currentHistoryState())} onChange={(event) => { clearResult(); setOutputName(event.target.value); }} maxLength={100} />
                      <span>.pdf</span>
                    </label>
                  </div>

                  <div className="organize-side-section">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="merge-editor-stat"><strong>{items.length}</strong><span>Sources</span></div>
                      <div className="merge-editor-stat"><strong>{totalPages}</strong><span>Total pages</span></div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{formatBytes(totalSize)} total · drag cards to set order.</p>
                  </div>
                </>
              )}

              {(status === "reading" || status === "processing") && (
                <div className="organize-progress-box">
                  <div><span>{status === "reading" ? "Reading files…" : "Merging files…"}</span><strong>{progress}%</strong></div>
                  <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
                </div>
              )}

              {status === "error" && message && (
                <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>
              )}

              {status === "success" && result && (
                <WorkspaceResultCard
                  title={`${activeTool.name} is ready`}
                  summary={`${result.fileCount} sources · ${result.pageCount} pages · ${formatBytes(result.size)}`}
                  downloads={[{ url: result.url, name: result.name }]}
                />
              )}

              {!result && items.length > 0 && (
                <div className="organize-sidebar-action">
                  <button
                    type="button"
                    className="organize-primary-action"
                    onClick={() => void mergeFiles()}
                    disabled={status === "processing" || items.length < 2}
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

  return (
    <div id="workspace" className="hero-workspace scroll-mt-28">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[var(--brand-strong)]"><Combine className="size-5" /></span>
          <div><p className="text-sm font-extrabold text-[var(--ink)]">{activeTool.name}</p><p className="text-xs text-slate-500">PDF and image support</p></div>
        </div>
        <ToolSelectMenu activeTool={activeTool} onToolSelect={selectTool} className="hidden sm:block" />
      </div>
      <div className="p-4 sm:p-6">
        <input ref={inputRef} type="file" className="sr-only" accept={MERGE_ACCEPT} multiple onChange={onFileInput} />
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
          <p className="mt-4 text-lg font-extrabold text-[var(--ink)]">Drop PDFs or images here</p>
          <p className="mt-1 text-sm text-slate-500">PDF, JPG, PNG, and WebP files open in a dedicated merge workspace.</p>
          <span className="button button-primary pointer-events-none mt-5"><UploadCloud className="size-4" /> Choose files</span>
        </div>
        {message && <div className="mt-4 flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><CircleAlert className="mt-0.5 size-4 shrink-0" /><span>{message}</span></div>}
      </div>
    </div>
  );
}
