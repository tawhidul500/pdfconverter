/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowRight,
  CircleAlert,
  CloudUpload,
  FileOutput,
  FilePlus2,
  FileText,
  LayoutTemplate,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Save,
  ScanText,
  Trash2,
  Type,
} from "lucide-react";
import {
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { WorkspaceResultCard, type WorkspaceDownload } from "@/components/workspace-result-card";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { type PdfTool } from "@/data/tools";
import {
  analyzePdfForWord,
  checkPdfConverterHealth,
  convertPdfToWordWithService,
  isPdfConverterUnavailableError,
  type PdfToWordAnalysis,
} from "@/lib/pdf-to-word-service";
import {
  WORKSPACE_FILE_TRANSFER_EVENT,
  transferWorkspaceFiles,
  type WorkspaceFileTransferDetail,
} from "@/lib/workspace-file-transfer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_SIZE = 150 * 1024 * 1024;
const MAX_FILES = 10;
const MAX_TOTAL_PAGES = 250;
const PDF_ACCEPT = ".pdf,application/pdf";

type LayoutPriority = "visual" | "hybrid" | "editable";
type PageScope = "all" | "custom";
type OutputMode = "separate" | "combined";
type WorkspaceStatus = "idle" | "reading" | "processing" | "success" | "error";

type PdfToWordItem = {
  id: string;
  file: File;
  pageCount: number;
  analysis: PdfToWordAnalysis | null;
  analysisStatus: "pending" | "ready" | "failed";
};

type ParsedPageRange = {
  pages: Set<number>;
  valid: boolean;
};

type WordResult = {
  url: string;
  name: string;
  size: number;
  pageCount: number;
  ocrPageCount: number;
  engine: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function cleanBaseName(value: string) {
  return value
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 90)
    .trim() || "NovaPDF-word";
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function hasPdfHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  return new TextDecoder("latin1").decode(bytes).includes("%PDF-");
}

function parsePageRange(value: string, pageCount: number): ParsedPageRange {
  const normalized = value.trim();
  if (!normalized) return { pages: new Set(), valid: false };

  const pages = new Set<number>();
  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return { pages, valid: false };

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) return { pages: new Set(), valid: false };
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first) {
      return { pages: new Set(), valid: false };
    }
    for (let page = first; page <= last; page += 1) {
      if (page <= pageCount) pages.add(page);
    }
  }

  return { pages, valid: pages.size > 0 };
}

export function PdfToWordWorkspace({
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
  const analysisInFlightRef = useRef(new Set<string>());
  const [items, setItems] = useState<PdfToWordItem[]>([]);
  const [workspaceStarted, setWorkspaceStarted] = useState(startInWorkspace);
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<WorkspaceStatus>("idle");
  const [message, setMessage] = useState("");
  const [layoutPriority, setLayoutPriority] = useState<LayoutPriority>("visual");
  const [pageScope, setPageScope] = useState<PageScope>("all");
  const [customRange, setCustomRange] = useState("1-3");
  const [outputMode, setOutputMode] = useState<OutputMode>("separate");
  const [outputName, setOutputName] = useState("NovaPDF-word");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState(100);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [results, setResults] = useState<WordResult[]>([]);
  const [useOcr, setUseOcr] = useState(false);
  const [ocrLanguage, setOcrLanguage] = useState("eng");
  const [converterState, setConverterState] = useState<"checking" | "online" | "offline">("checking");
  const [converterMessage, setConverterMessage] = useState("Checking the local converter…");
  const [converterProbeToken, setConverterProbeToken] = useState(0);

  const editorOpen = workspaceStarted || startInWorkspace;
  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);
  const totalPages = useMemo(() => items.reduce((sum, item) => sum + item.pageCount, 0), [items]);
  const activeItemIndex = Math.max(0, items.findIndex((item) => item.id === activeItemId));
  const activePageNumber = items.length ? activeItemIndex + 1 : 0;
  const scannedPageTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.analysis?.scannedPages.length ?? 0), 0),
    [items],
  );
  const analysisPending = converterState === "online" && items.some((item) => item.analysisStatus === "pending");

  const selectionByItem = useMemo(() => {
    return items.map((item) => {
      if (pageScope === "all") return item.pageCount;
      return parsePageRange(customRange, item.pageCount).pages.size;
    });
  }, [customRange, items, pageScope]);

  const selectedPageTotal = useMemo(
    () => selectionByItem.reduce((sum, count) => sum + count, 0),
    [selectionByItem],
  );

  const rangeValid = pageScope === "all"
    || (customRange.trim().length > 0 && items.every((item) => parsePageRange(customRange, item.pageCount).valid));

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [editorOpen, isActive]);

  useEffect(() => {
    if (!editorOpen || !isActive) return;
    let stopped = false;
    let probing = false;
    async function probe() {
      if (stopped || probing) return;
      probing = true;
      try {
        const health = await checkPdfConverterHealth();
        if (!stopped) {
          setConverterState("online");
          setConverterMessage(`Converter ${health.version || "service"} is online.`);
        }
      } catch (error) {
        if (!stopped) {
          setConverterState("offline");
          setConverterMessage(error instanceof Error ? error.message : "The local PDF converter is offline.");
        }
      } finally {
        probing = false;
      }
    }

    void probe();
    const timer = window.setInterval(() => void probe(), 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [converterProbeToken, editorOpen, isActive]);

  useEffect(() => {
    if (!editorOpen || !isActive || converterState !== "online") return;
    const pending = items.filter(
      (item) => item.analysisStatus === "pending" && !analysisInFlightRef.current.has(item.id),
    );
    if (!pending.length) return;

    pending.forEach((item) => {
      analysisInFlightRef.current.add(item.id);
      void analyzePdfForWord(item.file)
        .then((analysis) => {
          setItems((current) => current.map((entry) => entry.id === item.id
            ? { ...entry, pageCount: analysis.pageCount, analysis, analysisStatus: "ready" }
            : entry));
        })
        .catch((error) => {
          if (isPdfConverterUnavailableError(error)) {
            setConverterState("offline");
            setConverterMessage(error.message);
            return;
          }
          setItems((current) => current.map((entry) => entry.id === item.id
            ? { ...entry, analysisStatus: "failed" }
            : entry));
        })
        .finally(() => {
          analysisInFlightRef.current.delete(item.id);
        });
    });
  }, [converterState, editorOpen, isActive, items]);

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
              scale: Math.max(Math.min(0.84, 280 / Math.max(base.width, base.height)), 0.24),
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
              setThumbnails((current) => ({ ...current, [item.id]: canvas.toDataURL("image/jpeg", 0.86) }));
            }
            page.cleanup();
            await task.destroy();
          } catch {
            if (!cancelled) setThumbnailErrors((current) => ({ ...current, [item.id]: true }));
          }
        }
      } catch {
        // The frontend configuration remains usable if page previews are unavailable.
      }
    }

    void renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [editorOpen, items, thumbnailErrors, thumbnails]);

  useEffect(
    () => () => {
      results.forEach((result) => URL.revokeObjectURL(result.url));
    },
    [results],
  );

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      void addFiles(detail.files, true);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    // The transfer listener intentionally uses the current workspace loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  function invalidateReview() {
    setResults([]);
    setProgress(0);
    setProgressLabel("");
    if (status === "error" || status === "success") setStatus("idle");
    setMessage("");
  }

  function resetFields() {
    setItems([]);
    setDragging(false);
    setSidebarOpen(false);
    setStatus("idle");
    setMessage("");
    setLayoutPriority("visual");
    setPageScope("all");
    setCustomRange("1-3");
    setOutputMode("separate");
    setOutputName("NovaPDF-word");
    setThumbnails({});
    setThumbnailErrors({});
    setZoom(100);
    setActiveItemId(null);
    setProgress(0);
    setProgressLabel("");
    setResults([]);
    setUseOcr(false);
    setOcrLanguage("eng");
    analysisInFlightRef.current.clear();
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

  async function addFiles(incoming: File[], replace = false) {
    setWorkspaceStarted(true);
    setStatus("reading");
    setMessage("");
    setResults([]);
    setProgress(0);
    setProgressLabel("");

    const baseItems = replace ? [] : items;
    const warnings: string[] = [];
    const candidates = incoming.filter((file) => {
      if (!isPdfFile(file)) {
        warnings.push(`${file.name} is not a PDF.`);
        return false;
      }
      if (!file.size) {
        warnings.push(`${file.name} is empty.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        warnings.push(`${file.name} is larger than the current 50 MB browser limit.`);
        return false;
      }
      if (baseItems.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified)) {
        warnings.push(`${file.name} is already in this workspace.`);
        return false;
      }
      return true;
    });

    const availableSlots = Math.max(0, MAX_FILES - baseItems.length);
    const limitedCandidates = candidates.slice(0, availableSlots);
    if (candidates.length > availableSlots) warnings.push(`A maximum of ${MAX_FILES} PDFs can be prepared at once.`);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const loaded: PdfToWordItem[] = [];
      let runningSize = baseItems.reduce((sum, item) => sum + item.file.size, 0);
      let runningPages = baseItems.reduce((sum, item) => sum + item.pageCount, 0);

      for (const file of limitedCandidates) {
        if (runningSize + file.size > MAX_TOTAL_SIZE) {
          warnings.push(`${file.name} would exceed the 150 MB batch limit.`);
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
            warnings.push(`${file.name} would exceed the ${MAX_TOTAL_PAGES}-page batch limit.`);
            continue;
          }
          runningSize += file.size;
          runningPages += pageCount;
          loaded.push({
            id: `${file.name}-${file.size}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
            file,
            pageCount,
            analysis: null,
            analysisStatus: "pending",
          });
        } catch (error) {
          const detail = error instanceof Error ? error.message.toLowerCase() : "";
          warnings.push(
            detail.includes("encrypt") || detail.includes("password")
              ? `${file.name} is password-protected. Unlock it before conversion.`
              : `${file.name} is invalid, damaged, or unsupported.`,
          );
        }
      }

      const nextItems = [...baseItems, ...loaded];
      setItems(nextItems);
      setActiveItemId((current) => {
        if (nextItems.some((item) => item.id === current)) return current;
        return loaded[0]?.id ?? nextItems[0]?.id ?? null;
      });
      if (replace && loaded.length > 0) setOutputName(`${cleanBaseName(loaded[0].file.name)}-word`);
      else if (baseItems.length === 0 && loaded.length > 0) setOutputName(`${cleanBaseName(loaded[0].file.name)}-word`);
      setStatus(warnings.length && loaded.length === 0 ? "error" : "idle");
      setMessage(warnings.join(" "));
    } catch {
      setStatus("error");
      setMessage("The PDF reader could not be loaded in this browser.");
    }
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeItem(id: string) {
    invalidateReview();
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      setActiveItemId((selected) => selected === id ? next[0]?.id ?? null : selected);
      if (next.length < 2 && outputMode === "combined") setOutputMode("separate");
      return next;
    });
    setThumbnails((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setThumbnailErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function selectSource(pageNumber: number) {
    const item = items[pageNumber - 1];
    if (!item) return;
    setActiveItemId(item.id);
    document.querySelector<HTMLElement>(`.pdf-word-card[data-novapdf-view-page="${pageNumber}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }

  function selectedPagesForItem(item: PdfToWordItem) {
    if (pageScope === "all") return Array.from({ length: item.pageCount }, (_, index) => index + 1);
    return [...parsePageRange(customRange, item.pageCount).pages].sort((first, second) => first - second);
  }

  function retryConverter() {
    setConverterState("checking");
    setConverterMessage("Checking the local converter…");
    setConverterProbeToken((value) => value + 1);
  }

  async function convertToWord() {
    if (!items.length) {
      setStatus("error");
      setMessage("Add at least one PDF before conversion.");
      return;
    }
    if (converterState !== "online") {
      setStatus("error");
      setMessage("The PDF converter is offline. Run START_PDF_CONVERTER.cmd or RUN_NOVAPDF_ALL.cmd, then click Retry converter.");
      retryConverter();
      return;
    }
    if (!rangeValid || selectedPageTotal < 1) {
      setStatus("error");
      setMessage("Enter a valid page range such as 1-3,5,8 that selects at least one page in every PDF.");
      return;
    }

    invalidateReview();
    setStatus("processing");
    setProgress(8);
    setProgressLabel(
      layoutPriority === "hybrid"
        ? "Preparing editable layout reconstruction…"
        : useOcr
          ? "Preparing searchable OCR and Word conversion…"
          : "Preparing Word conversion…",
    );

    const createdResultUrls: string[] = [];
    try {
      const baseName = cleanBaseName(outputName);
      const prepared = items.map((item) => ({
        item,
        source: {
          file: item.file,
          pageNumbers: selectedPagesForItem(item),
        },
      }));
      const nextResults: WordResult[] = [];

      if (outputMode === "combined") {
        setProgress(28);
        setProgressLabel(
          layoutPriority === "hybrid"
            ? "Reconstructing editable Word objects without a page-background duplicate…"
            : useOcr
              ? "Recognizing pages and creating searchable DOCX…"
              : "Creating a Microsoft Word DOCX…",
        );
        const converted = await convertPdfToWordWithService(
          prepared.map((entry) => entry.source),
          {
            layoutMode: layoutPriority,
            useOcr,
            ocrLanguage,
            outputName: baseName,
          },
        );
        setProgress(92);
        setProgressLabel("Validating the Word package…");
        const docxBuffer = converted.bytes.buffer.slice(
          converted.bytes.byteOffset,
          converted.bytes.byteOffset + converted.bytes.byteLength,
        ) as ArrayBuffer;
        const blob = new Blob([docxBuffer], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const resultUrl = URL.createObjectURL(blob);
        createdResultUrls.push(resultUrl);
        nextResults.push({
          url: resultUrl,
          name: `${baseName}.docx`,
          size: blob.size,
          pageCount: converted.pageCount,
          ocrPageCount: converted.ocrPageCount,
          engine: converted.engine,
        });
      } else {
        for (let index = 0; index < prepared.length; index += 1) {
          const entry = prepared[index];
          const progressBase = Math.round(10 + (index / prepared.length) * 80);
          setProgress(progressBase);
          setProgressLabel(
            layoutPriority === "hybrid"
              ? `Reconstructing editable layout for ${entry.item.file.name}…`
              : `Converting ${entry.item.file.name}${useOcr ? " with searchable OCR" : ""}…`,
          );
          const sourceName = cleanBaseName(entry.item.file.name);
          const resultName = prepared.length === 1 ? `${baseName}.docx` : `${baseName}-${index + 1}-${sourceName}.docx`;
          const converted = await convertPdfToWordWithService([entry.source], {
            layoutMode: layoutPriority,
            useOcr,
            ocrLanguage,
            outputName: resultName.replace(/\.docx$/i, ""),
          });
          const docxBuffer = converted.bytes.buffer.slice(
            converted.bytes.byteOffset,
            converted.bytes.byteOffset + converted.bytes.byteLength,
          ) as ArrayBuffer;
          const blob = new Blob([docxBuffer], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          const resultUrl = URL.createObjectURL(blob);
          createdResultUrls.push(resultUrl);
          nextResults.push({
            url: resultUrl,
            name: resultName,
            size: blob.size,
            pageCount: converted.pageCount,
            ocrPageCount: converted.ocrPageCount,
            engine: converted.engine,
          });
        }
      }

      setResults(nextResults);
      setProgress(100);
      setProgressLabel("Word document ready");
      setStatus("success");
      const ocrPages = nextResults.reduce((sum, result) => sum + result.ocrPageCount, 0);
      setMessage(
        layoutPriority === "hybrid"
          ? `Editable layout reconstruction completed${ocrPages ? ` with OCR on ${ocrPages} scanned page${ocrPages === 1 ? "" : "s"}` : ""}. Native-page text, detected tables, supported shapes, and embedded pictures are independent Word objects. NovaPDF does not place the original native PDF page behind them; only unsupported residual artwork is retained in cropped fallback pictures.`
          : ocrPages
            ? `OCR recognized ${ocrPages} scanned page${ocrPages === 1 ? "" : "s"}${layoutPriority === "visual" ? " and added a hidden searchable text layer without changing the page image" : ""}. The DOCX package passed NovaPDF validation.`
            : useOcr && layoutPriority === "visual"
              ? "The preserved page images now include a hidden searchable text layer from the PDF's native text. The DOCX package passed NovaPDF validation."
              : "The DOCX package passed NovaPDF validation and is ready for Microsoft Word.",
      );
    } catch (error) {
      createdResultUrls.forEach((url) => URL.revokeObjectURL(url));
      setStatus("error");
      setProgress(0);
      setProgressLabel("");
      setMessage(error instanceof Error ? error.message : "PDF to Word conversion failed.");
    }
  }

  const downloads: WorkspaceDownload[] = useMemo(() => results.map((result, index) => ({
    url: result.url,
    name: result.name,
    detail: `${result.pageCount} page${result.pageCount === 1 ? "" : "s"} · ${formatBytes(result.size)}${result.ocrPageCount ? ` · OCR ${result.ocrPageCount} page${result.ocrPageCount === 1 ? "" : "s"}` : ""}`,
    label: results.length === 1 ? "Download DOCX" : `Download DOCX ${index + 1}`,
  })), [results]);

  const cardStyle = {
    "--pdf-word-card-width": `${Math.max(11.5, Math.min(23, 15.5 * zoom / 100))}rem`,
  } as CSSProperties;

  if (!editorOpen) return null;

  return (
    <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label="PDF to Word workspace">
      <input ref={inputRef} type="file" className="sr-only" accept={PDF_ACCEPT} multiple onChange={onFileInput} />

      <header className="organize-editor-header">
        <button type="button" className="workspace-header-start-over" onClick={startOver} aria-label="Start over">
          <RotateCcw className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="workspace-header-title">PDF to Word</h1>
          <p className="mt-0.5 text-[0.66rem] font-bold text-slate-400">Microsoft Word DOCX · optional OCR · service validated</p>
        </div>
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
          <div className="workspace-generic-zoom">
            <WorkspaceZoomControls
              active={isActive && items.length > 0}
              value={zoom}
              onChange={setZoom}
              currentPage={activePageNumber || undefined}
              pageCount={items.length || undefined}
              onPageChange={selectSource}
            />
          </div>

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
                <strong>Upload PDFs to convert to Word</strong>
                <p>Add up to 10 PDFs, select pages, choose the conversion mode, and download real DOCX files.</p>
                <em>Choose PDF files</em>
              </div>
            </div>
          ) : (
            <div className="organize-pages-scroll pdf-word-scroll">
              <div className="pdf-word-grid">
                {items.map((item, index) => {
                  const selectedPages = selectionByItem[index] ?? 0;
                  const active = item.id === activeItemId;
                  return (
                    <article
                      key={item.id}
                      className={`pdf-word-card ${active ? "pdf-word-card-active novapdf-page-active" : ""}`}
                      style={cardStyle}
                      data-novapdf-view-page={index + 1}
                      onClick={() => setActiveItemId(item.id)}
                    >
                      <div className="pdf-word-preview">
                        {thumbnails[item.id] ? (
                          <img src={thumbnails[item.id]} alt={`First page preview of ${item.file.name}`} />
                        ) : (
                          <div className="pdf-word-preview-fallback">
                            <FileText className="size-10" />
                            <span>{thumbnailErrors[item.id] ? "Preview unavailable" : "Rendering preview"}</span>
                          </div>
                        )}
                        <span className="pdf-word-file-index">{index + 1}</span>
                      </div>
                      <div className="pdf-word-card-body">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[var(--ink)]" title={item.file.name}>{item.file.name}</p>
                            <p className="mt-1 text-[0.68rem] font-bold text-slate-400">{formatBytes(item.file.size)} · {item.pageCount} pages</p>
                          </div>
                          <button
                            type="button"
                            className="pdf-word-remove"
                            aria-label={`Remove ${item.file.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeItem(item.id);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="pdf-word-chip">{selectedPages} selected</span>
                          <span className="pdf-word-chip">{layoutPriority === "visual" ? "Visual layout" : layoutPriority === "hybrid" ? "Editable layout" : "Editable flow"}</span>
                          {item.analysisStatus === "pending" && (
                            <span className="pdf-word-chip">{converterState === "online" ? "Checking text" : "Waiting for converter"}</span>
                          )}
                          {item.analysisStatus === "failed" && <span className="pdf-word-chip">Analysis unavailable</span>}
                          {item.analysis?.scannedPages.length ? <span className="pdf-word-chip">{item.analysis.scannedPages.length} scanned</span> : null}
                        </div>
                      </div>
                    </article>
                  );
                })}

                {items.length < MAX_FILES && (
                  <button type="button" className="pdf-word-add-card" style={cardStyle} onClick={() => inputRef.current?.click()}>
                    <FilePlus2 className="size-8" />
                    <strong>Add PDFs</strong>
                    <span>{items.length} of {MAX_FILES} files</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        <aside className={`organize-sidebar ${sidebarOpen ? "organize-sidebar-open" : ""}`}>
          <div className="organize-sidebar-scroll">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-strong)]">Conversion setup</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--ink)]">PDF to Word</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Convert selected pages through NovaPDF&apos;s local Word service, with optional OCR for scanned PDFs.</p>
            </div>

            <div className="organize-side-section">
              <div className="organize-side-heading">
                <h3>Selected PDFs</h3>
                <span>{items.length}</span>
              </div>
              {items.length === 0 ? (
                <div className="split-editor-info">Use the upload box in the middle to choose PDF files.</div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`organize-source-row w-full text-left ${item.id === activeItemId ? "ring-2 ring-teal-100" : ""}`}
                      onClick={() => selectSource(index + 1)}
                    >
                      <span className="organize-source-letter">{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-extrabold text-slate-700">{item.file.name}</span>
                        <span className="mt-0.5 block text-[0.66rem] font-semibold text-slate-400">{item.pageCount} pages · {formatBytes(item.file.size)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="organize-add-file-button" onClick={() => inputRef.current?.click()} disabled={items.length >= MAX_FILES}>
                <FilePlus2 className="size-4" /> Add PDF files
              </button>
              {items.length > 0 && (
                <p className="mt-2 text-[0.66rem] font-bold text-slate-400">{totalPages} total pages · {formatBytes(totalSize)}</p>
              )}
            </div>

            <div className="organize-side-section">
              <div className="organize-side-heading"><h3>Pages</h3></div>
              <div className="pdf-word-option-grid">
                <button
                  type="button"
                  className={`pdf-word-option-card ${pageScope === "all" ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setPageScope("all");
                  }}
                >
                  <FileText className="size-4" />
                  <span><strong>All pages</strong><small>Use every page in each PDF</small></span>
                </button>
                <button
                  type="button"
                  className={`pdf-word-option-card ${pageScope === "custom" ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setPageScope("custom");
                  }}
                >
                  <Type className="size-4" />
                  <span><strong>Custom range</strong><small>Apply one range to each PDF</small></span>
                </button>
              </div>
              {pageScope === "custom" && (
                <div className="mt-2">
                  <label className="text-[0.68rem] font-extrabold text-slate-500" htmlFor="pdf-word-range">Page range</label>
                  <input
                    id="pdf-word-range"
                    className={`pdf-word-input mt-1 ${!rangeValid && items.length ? "pdf-word-input-error" : ""}`}
                    value={customRange}
                    onChange={(event) => {
                      invalidateReview();
                      setCustomRange(event.target.value);
                    }}
                    placeholder="1-3,5,8"
                  />
                  <p className="mt-1 text-[0.64rem] font-semibold leading-5 text-slate-400">Pages outside a document&apos;s length are ignored. Every PDF must retain at least one page.</p>
                </div>
              )}
            </div>

            <div className="organize-side-section">
              <div className="organize-side-heading"><h3>Layout priority</h3></div>
              <div className="pdf-word-option-grid">
                <button
                  type="button"
                  className={`pdf-word-option-card ${layoutPriority === "visual" ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setLayoutPriority("visual");
                  }}
                >
                  <LayoutTemplate className="size-4" />
                  <span><strong>Preserve layout</strong><small>Prioritize visual placement</small></span>
                </button>
                <button
                  type="button"
                  className={`pdf-word-option-card ${layoutPriority === "hybrid" ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setLayoutPriority("hybrid");
                  }}
                >
                  <ScanText className="size-4" />
                  <span><strong>Editable layout (Beta)</strong><small>Editable text, tables, shapes + pictures</small></span>
                </button>
                <button
                  type="button"
                  className={`pdf-word-option-card ${layoutPriority === "editable" ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setLayoutPriority("editable");
                  }}
                >
                  <Type className="size-4" />
                  <span><strong>Editable text</strong><small>Prioritize reading flow</small></span>
                </button>
              </div>
            </div>

            <div className="organize-side-section">
              <div className="organize-side-heading"><h3>Output</h3></div>
              <div className="pdf-word-option-grid">
                <button
                  type="button"
                  className={`pdf-word-option-card ${outputMode === "separate" ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setOutputMode("separate");
                  }}
                >
                  <FileOutput className="size-4" />
                  <span><strong>Separate DOCX</strong><small>One result per PDF</small></span>
                </button>
                <button
                  type="button"
                  disabled={items.length < 2}
                  className={`pdf-word-option-card ${outputMode === "combined" ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setOutputMode("combined");
                  }}
                >
                  <FileText className="size-4" />
                  <span><strong>Combined DOCX</strong><small>Join compatible documents</small></span>
                </button>
              </div>

              <label className="mt-3 block text-[0.68rem] font-extrabold text-slate-500" htmlFor="pdf-word-output-name">
                {outputMode === "combined" ? "Output filename" : "Batch filename prefix"}
              </label>
              <div className="organize-filename-field mt-1">
                <input
                  id="pdf-word-output-name"
                  value={outputName}
                  onChange={(event) => {
                    invalidateReview();
                    setOutputName(cleanBaseName(event.target.value));
                  }}
                  aria-label={outputMode === "combined" ? "Output filename" : "Batch filename prefix"}
                />
                <span>.docx</span>
              </div>
            </div>

            <div className="organize-side-section">
              <div className="organize-side-heading"><h3>Scanned pages / OCR</h3></div>
              {scannedPageTotal > 0 && (
                <div className="pdf-word-scan-notice">
                  <ScanText className="size-5" />
                  <span><strong>{scannedPageTotal} scanned page{scannedPageTotal === 1 ? "" : "s"} detected</strong><small>OCR can create editable text or add a searchable text layer beneath the preserved page image.</small></span>
                </div>
              )}
              {analysisPending && <p className="pdf-word-analysis-note"><LoaderCircle className="size-3.5 animate-spin" /> Checking pages for selectable text…</p>}
              <div className="pdf-word-option-grid">
                <button
                  type="button"
                  className={`pdf-word-option-card ${!useOcr ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setUseOcr(false);
                  }}
                >
                  <FileText className="size-4" />
                  <span><strong>No OCR</strong><small>{layoutPriority === "visual" ? "Preserve only the visible page image" : layoutPriority === "hybrid" ? "Use native PDF text; image-only regions remain visual" : "Use the PDF&apos;s existing selectable text"}</small></span>
                </button>
                <button
                  type="button"
                  className={`pdf-word-option-card ${useOcr ? "pdf-word-option-card-active" : ""}`}
                  onClick={() => {
                    invalidateReview();
                    setUseOcr(true);
                  }}
                >
                  <ScanText className="size-4" />
                  <span><strong>OCR</strong><small>{layoutPriority === "visual" ? "Keep the page image and add searchable text" : layoutPriority === "hybrid" ? "Recognize image-only regions and overlay editable text" : "Recognize image-only pages as editable text"}</small></span>
                </button>
              </div>
              {useOcr && (
                <label className="mt-3 block text-[0.68rem] font-extrabold text-slate-500" htmlFor="pdf-word-ocr-language">
                  OCR language
                  <select
                    id="pdf-word-ocr-language"
                    className="pdf-word-select mt-1"
                    value={ocrLanguage}
                    onChange={(event) => {
                      invalidateReview();
                      setOcrLanguage(event.target.value);
                    }}
                  >
                    <option value="eng">English</option>
                    <option value="ben">Bangla</option>
                    <option value="eng+ben">English + Bangla</option>
                  </select>
                </label>
              )}
              {layoutPriority === "visual" && (
                <p className="pdf-word-analysis-note">{useOcr ? "Preserve layout keeps the page image unchanged and adds an invisible searchable OCR/native-text layer. The visible content remains image-based rather than freely editable." : "Preserve layout reproduces each page as an image. Enable OCR to add a hidden searchable text layer without changing the visual layout."}</p>
              )}
              {layoutPriority === "hybrid" && (
                <p className="pdf-word-analysis-note">For native PDFs, NovaPDF rebuilds text as positioned Word text boxes, detected grids as real Word tables, supported paths as selectable Word shapes, and embedded images as independent Word pictures. The original full-page PDF render is not placed behind these objects; only unsupported residual artwork is retained as small cropped fallback pictures. Scanned pages remain image-based because they do not contain native table, shape, or picture objects.</p>
              )}
            </div>

            {(status === "reading" || status === "processing") && (
              <div className="organize-progress-box">
                <div>
                  <span>{status === "reading" ? "Reading PDFs…" : progressLabel || "Creating Word document…"}</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="organize-progress-track"><span style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            {status === "error" && message && (
              <div className="organize-error-box">
                <CircleAlert className="size-5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {status !== "error" && message && (
              <div className="split-editor-info">{message}</div>
            )}

            {status === "success" && results.length > 0 && (
              <WorkspaceResultCard
                title={`${activeTool.name} result${results.length === 1 ? "" : "s"} ready`}
                summary={`${selectedPageTotal} page${selectedPageTotal === 1 ? "" : "s"} · ${layoutPriority === "visual" ? useOcr ? "layout preserved + searchable OCR" : "layout preserved" : layoutPriority === "hybrid" ? useOcr ? "editable layout + smart OCR" : "editable layout" : useOcr ? "editable text + OCR" : "editable text"} · ${outputMode}`}
                downloads={downloads}
              />
            )}

            {results.length === 0 && (
              <div className="organize-sidebar-action">
                <button
                  type="button"
                  className="organize-primary-action min-h-12 px-4"
                  disabled={!items.length || status === "reading" || status === "processing" || converterState === "checking"}
                  onClick={() => {
                    if (converterState === "offline") retryConverter();
                    else void convertToWord();
                  }}
                >
                  {status === "processing" || converterState === "checking"
                    ? <LoaderCircle className="size-4 animate-spin" />
                    : converterState === "offline"
                      ? <RotateCcw className="size-4" />
                      : <Save className="size-4" />}
                  {status === "reading"
                    ? "Reading PDFs…"
                    : status === "processing"
                      ? "Converting…"
                      : converterState === "checking"
                        ? "Checking converter…"
                        : converterState === "offline"
                          ? "Retry converter"
                          : "Convert to Word"}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}

            <div className={`organize-privacy-note pdf-word-service-status pdf-word-service-${converterState}`}>
              <LockKeyhole className="size-4" />
              <span>
                Files are processed by the local NovaPDF converter and deleted after each request.
                <small>{converterMessage}</small>
              </span>
              <div className="pdf-word-service-actions">
                <strong>{converterState === "online" ? "Converter online" : converterState === "checking" ? "Checking converter…" : "Converter offline"}</strong>
                {converterState === "offline" && (
                  <button type="button" onClick={retryConverter}>Retry</button>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
