"use client";

import { CircleAlert, CloudUpload, LockKeyhole, RotateCcw, Trash2 } from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { WorkspaceToolRail } from "@/components/workspace-tool-rail";
import { WorkspaceZoomControls } from "@/components/workspace-zoom-controls";
import { type PdfTool } from "@/data/tools";
import { WORKSPACE_FILE_TRANSFER_EVENT, transferWorkspaceFiles, type WorkspaceFileTransferDetail } from "@/lib/workspace-file-transfer";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function GenericToolWorkspace({
  activeTool,
  onToolChange,
  onExitWorkspace,
  isActive,
}: {
  activeTool: PdfTool;
  onToolChange: (tool: PdfTool) => void;
  onExitWorkspace: () => void;
  isActive: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    function receiveTransferredFiles(event: Event) {
      const detail = (event as CustomEvent<WorkspaceFileTransferDetail>).detail;
      if (detail?.targetSlug !== activeTool.slug) return;
      addFiles(detail.files);
    }
    window.addEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
    return () => window.removeEventListener(WORKSPACE_FILE_TRANSFER_EVENT, receiveTransferredFiles);
  // The transfer listener intentionally uses the latest workspace loader without re-subscribing on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool.slug]);

  function startOver() {
    setFiles([]);
    setMessage("");
    setSidebarOpen(false);
    setZoom(100);
  }

  function goHome() {
    setSidebarOpen(false);
    onExitWorkspace();
    window.requestAnimationFrame(() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function addFiles(incoming: File[]) {
    const accepted = incoming.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setMessage(`${file.name} is larger than the current 50 MB limit.`);
        return false;
      }
      return true;
    });
    setFiles(activeTool.multiple ? accepted : accepted.slice(0, 1));
    if (accepted.length) setMessage("");
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files ?? []));
  }

  return (
    <div className="organize-editor-shell" role="dialog" aria-modal="true" aria-label={`${activeTool.name} workspace`}>
      <input ref={inputRef} type="file" className="sr-only" accept={activeTool.accepts} multiple={activeTool.multiple} onChange={onFileInput} />
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
            transferWorkspaceFiles(tool, files);
            onToolChange(tool);
          }}
          onExitWorkspace={goHome}
          onOpenControls={() => setSidebarOpen((value) => !value)}
        />
        <main className="organize-canvas-area">
          <div className="workspace-generic-zoom"><WorkspaceZoomControls active={isActive && files.length > 0} value={zoom} onChange={setZoom} /></div>
          <div className="workspace-empty-canvas">
            <div
              className={`workspace-empty-upload ${dragging ? "workspace-empty-upload-active" : ""}`}
              style={{ width: `${Math.min(42, 34 * zoom / 100)}rem`, minHeight: `${Math.min(24, 19 * zoom / 100)}rem` }}
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
              <strong>Upload files for {activeTool.name}</strong>
              <p>{activeTool.description}</p>
              <em>Choose {activeTool.multiple ? "files" : "a file"}</em>
            </div>
          </div>
        </main>
        <aside className={`organize-sidebar ${sidebarOpen ? "organize-sidebar-open" : ""}`}>
          <div className="organize-sidebar-scroll">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--brand-strong)]">NovaPDF workspace</p><h2 className="mt-1 text-2xl font-black text-[var(--ink)]">{activeTool.name}</h2></div>
            <div className="organize-side-section">
              <div className="organize-side-heading"><h3>Selected files</h3></div>
              {files.length === 0 ? <div className="split-editor-info">Use the upload box in the middle to choose your files.</div> : <div className="space-y-2">{files.map((file, index) => <div key={`${file.name}-${file.lastModified}-${index}`} className="organize-source-row"><span className="organize-source-letter">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-slate-700">{file.name}</p><p className="mt-0.5 text-[0.66rem] font-semibold text-slate-400">{formatBytes(file.size)}</p></div><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></button></div>)}</div>}
            </div>
            {message && <div className="organize-error-box"><CircleAlert className="size-5 shrink-0" /><span>{message}</span></div>}
            {files.length > 0 && <div className="split-editor-info mt-4">The real {activeTool.name} processing engine will be connected in its scheduled build step.</div>}
            <div className="organize-privacy-note"><LockKeyhole className="size-4" /> Files stay in this browser during this build.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
