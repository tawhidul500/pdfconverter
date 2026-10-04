"use client";

import {
  Minus,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type WorkspacePageViewMode = "continuous" | "single" | "two" | "three";

const ZOOM_PRESETS = [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200];
const VIEW_PAGE_SELECTOR = "[data-novapdf-view-page]";
const VIEW_MODES: Array<{ mode: WorkspacePageViewMode; label: string }> = [
  { mode: "continuous", label: "Continuous view" },
  { mode: "single", label: "Single-page view" },
  { mode: "two", label: "Two-page view" },
  { mode: "three", label: "Three-page view" },
];

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.isContentEditable);
}

function viewModeLabel(mode: WorkspacePageViewMode) {
  return VIEW_MODES.find((item) => item.mode === mode)?.label ?? "Continuous view";
}

function ViewIcon({ mode }: { mode: WorkspacePageViewMode }) {
  const columns = mode === "three" ? 3 : mode === "two" ? 2 : 1;
  const rows = mode === "continuous" ? 3 : 1;
  const gap = 1.5;
  const width = (16 - gap * (columns - 1)) / columns;
  const height = (16 - gap * (rows - 1)) / rows;
  return (
    <svg className="size-4" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (__, column) => (
        <rect
          key={`${row}-${column}`}
          x={1 + column * (width + gap)}
          y={1 + row * (height + gap)}
          width={width}
          height={height}
          rx="1.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )))}
    </svg>
  );
}

function markActivePage(page: number) {
  const candidates = document.querySelectorAll<HTMLElement>(VIEW_PAGE_SELECTOR);
  candidates.forEach((element) => {
    const elementPage = Number(element.dataset.novapdfViewPage ?? 0);
    element.classList.toggle("novapdf-page-active", elementPage === page);
  });
}

export function WorkspaceZoomControls({
  value,
  onChange,
  min = 50,
  max = 200,
  step = 10,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  currentPage,
  pageCount,
  onPageChange,
  viewMode,
  onViewModeChange,
  active = false,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  currentPage?: number;
  pageCount?: number;
  onPageChange?: (pageNumber: number) => void;
  viewMode?: WorkspacePageViewMode;
  onViewModeChange?: (mode: WorkspacePageViewMode) => void;
  active?: boolean;
}) {
  const [internalViewMode, setInternalViewMode] = useState<WorkspacePageViewMode>("continuous");
  const [internalPage, setInternalPage] = useState(1);
  const visibleRatiosRef = useRef(new Map<number, number>());
  const viewMenuRef = useRef<HTMLDetailsElement>(null);
  const activeViewMode = viewMode ?? internalViewMode;
  const safePageCount = Math.max(0, Math.floor(pageCount ?? 0));
  const safeCurrentPage = safePageCount > 0
    ? Math.min(safePageCount, Math.max(1, Math.floor(currentPage ?? internalPage)))
    : 0;
  const pageOptions = useMemo(
    () => Array.from({ length: safePageCount }, (_, index) => index + 1),
    [safePageCount],
  );

  const setZoom = (next: number) => onChange(Math.min(max, Math.max(min, Math.round(next))));
  const decrease = () => setZoom(value - step);
  const increase = () => setZoom(value + step);

  function changePage(next: number, behavior: ScrollBehavior = "smooth") {
    if (safePageCount < 1) return;
    const page = Math.min(safePageCount, Math.max(1, Math.floor(next)));
    setInternalPage(page);
    markActivePage(page);
    onPageChange?.(page);
    if (!onPageChange) {
      document.querySelector<HTMLElement>(`[data-novapdf-view-page="${page}"]`)?.scrollIntoView({
        behavior,
        block: "center",
        inline: "center",
      });
    }
  }

  function changeViewMode(next: WorkspacePageViewMode) {
    if (viewMode === undefined) setInternalViewMode(next);
    onViewModeChange?.(next);
    viewMenuRef.current?.removeAttribute("open");
  }

  useEffect(() => {
    if (currentPage === undefined) return;
    const frame = window.requestAnimationFrame(() => setInternalPage(currentPage));
    return () => window.cancelAnimationFrame(frame);
  }, [currentPage]);

  useEffect(() => {
    if (!active || currentPage !== undefined || safePageCount < 1 || typeof IntersectionObserver === "undefined") return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(VIEW_PAGE_SELECTOR));
    if (!elements.length) return;
    visibleRatiosRef.current.clear();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const page = Number(element.dataset.novapdfViewPage ?? 0);
        if (page > 0 && page <= safePageCount) visibleRatiosRef.current.set(page, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      let bestPage = internalPage;
      let bestRatio = -1;
      visibleRatiosRef.current.forEach((ratio, page) => {
        if (ratio > bestRatio) { bestRatio = ratio; bestPage = page; }
      });
      if (bestRatio > 0 && bestPage !== internalPage) {
        setInternalPage(bestPage);
        markActivePage(bestPage);
      }
    }, { threshold: [0.15, 0.35, 0.55, 0.75] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [active, activeViewMode, currentPage, internalPage, safePageCount]);

  useEffect(() => {
    if (active && safeCurrentPage > 0) markActivePage(safeCurrentPage);
  }, [active, safeCurrentPage, safePageCount]);

  useEffect(() => {
    if (!active) return;
    function capturePageInteraction(event: PointerEvent) {
      if (currentPage !== undefined) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(VIEW_PAGE_SELECTOR) : null;
      const page = Number(target?.dataset.novapdfViewPage ?? 0);
      if (page > 0 && page <= safePageCount) {
        setInternalPage(page);
        markActivePage(page);
      }
    }
    document.addEventListener("pointerdown", capturePageInteraction, true);
    return () => document.removeEventListener("pointerdown", capturePageInteraction, true);
  }, [active, currentPage, safePageCount]);

  useEffect(() => {
    if (!active) return;
    document.documentElement.dataset.novapdfPageView = activeViewMode;
    return () => {
      if (document.documentElement.dataset.novapdfPageView === activeViewMode) {
        delete document.documentElement.dataset.novapdfPageView;
      }
    };
  }, [active, activeViewMode]);

  useEffect(() => {
    if (!active) return;
    function handleKeyboard(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && ["+", "=", "Add"].includes(event.key)) {
        event.preventDefault();
        increase();
        return;
      }
      if (modifier && ["-", "_", "Subtract"].includes(event.key)) {
        event.preventDefault();
        decrease();
        return;
      }
      if (modifier && event.key === "0") {
        event.preventDefault();
        setZoom(100);
        return;
      }
      if (safePageCount > 0 && event.key === "PageUp") {
        event.preventDefault();
        changePage(safeCurrentPage - 1);
        return;
      }
      if (safePageCount > 0 && event.key === "PageDown") {
        event.preventDefault();
        changePage(safeCurrentPage + 1);
        return;
      }
      if (safePageCount > 0 && modifier && event.key === "Home") {
        event.preventDefault();
        changePage(1);
        return;
      }
      if (safePageCount > 0 && modifier && event.key === "End") {
        event.preventDefault();
        changePage(safePageCount);
      }
    }

    document.addEventListener("keydown", handleKeyboard, true);
    return () => document.removeEventListener("keydown", handleKeyboard, true);
  // Functions use the latest props after each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, max, min, safeCurrentPage, safePageCount, step, value]);

  if (!active || typeof document === "undefined") return null;

  const controls = (
    <div className="workspace-bottom-controls" aria-label="PDF workspace controls">
      {(onUndo || onRedo) && (
        <div className="workspace-history-controls" role="group" aria-label="Undo and redo controls">
          <button
            type="button"
            onClick={onUndo}
            disabled={!onUndo || !canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!onRedo || !canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo2 className="size-4" />
          </button>
        </div>
      )}

      <div className="workspace-viewer-controls" role="group" aria-label="PDF page, zoom, and view controls">
        {safePageCount > 0 && (
          <>
            <label className="workspace-page-select" title={`Page ${safeCurrentPage} of ${safePageCount}`}>
              <span className="sr-only">Current page</span>
              <select
                value={safeCurrentPage}
                onChange={(event) => changePage(Number(event.target.value))}
                aria-label={`Current page. Page ${safeCurrentPage} of ${safePageCount}`}
              >
                {pageOptions.map((page) => <option key={page} value={page}>{page}</option>)}
              </select>
              <strong aria-hidden="true">/ {safePageCount}</strong>
            </label>
            <span className="workspace-viewer-divider" aria-hidden="true" />
          </>
        )}

        <button type="button" onClick={decrease} disabled={value <= min} aria-label="Zoom out" title="Zoom out (Ctrl+-)">
          <Minus className="size-4" />
        </button>
        <label className="workspace-zoom-select" title={`Current zoom ${value}%`}>
          <span className="sr-only">Zoom percentage</span>
          <select value={value} onChange={(event) => setZoom(Number(event.target.value))} aria-label={`Zoom percentage. Current zoom ${value}%`}>
            {!ZOOM_PRESETS.includes(value) && <option value={value}>{value}%</option>}
            {ZOOM_PRESETS.filter((preset) => preset >= min && preset <= max).map((preset) => (
              <option key={preset} value={preset}>{preset}%</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={increase} disabled={value >= max} aria-label="Zoom in" title="Zoom in (Ctrl++)">
          <Plus className="size-4" />
        </button>
        <span className="workspace-viewer-divider" aria-hidden="true" />
        <details ref={viewMenuRef} className="workspace-view-menu">
          <summary aria-label={`${viewModeLabel(activeViewMode)}. Change page view`} title="Change page view">
            <ViewIcon mode={activeViewMode} />
          </summary>
          <div className="workspace-view-menu-popover" role="menu" aria-label="Page view">
            {VIEW_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                role="menuitemradio"
                aria-checked={activeViewMode === mode}
                className={activeViewMode === mode ? "active" : ""}
                onClick={() => changeViewMode(mode)}
              >
                <ViewIcon mode={mode} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );

  return createPortal(controls, document.body);
}
