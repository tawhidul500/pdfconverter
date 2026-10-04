"use client";

import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  FilePenLine,
  FolderKanban,
  Gauge,
  PanelRightOpen,
  RefreshCw,
  ShieldCheck,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { pdfTools, toolCategories, type PdfTool, type ToolCategory } from "@/data/tools";

const CATEGORY_ICONS: Record<ToolCategory, LucideIcon> = {
  Workflows: Workflow,
  "Organize PDF": FolderKanban,
  "Optimize PDF": Gauge,
  "Convert PDF": RefreshCw,
  "Edit PDF": FilePenLine,
  "PDF Security": ShieldCheck,
  "PDF Intelligence": BrainCircuit,
};

export function WorkspaceToolRail({
  activeTool,
  onToolChange,
  onOpenControls,
  onExitWorkspace,
}: {
  activeTool: PdfTool;
  onToolChange: (tool: PdfTool) => void;
  onOpenControls?: () => void;
  onExitWorkspace?: () => void;
}) {
  const [openCategory, setOpenCategory] = useState<ToolCategory | null>(null);
  const [pinnedCategory, setPinnedCategory] = useState<ToolCategory | null>(null);
  const [submenuClosing, setSubmenuClosing] = useState(false);
  const [desktopHoverEnabled, setDesktopHoverEnabled] = useState(false);
  const [wideLayout, setWideLayout] = useState(false);
  const [submenuTop, setSubmenuTop] = useState(8);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railRef = useRef<HTMLElement>(null);
  const categoryButtonsRef = useRef(new Map<ToolCategory, HTMLButtonElement>());
  const categoryListRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLElement>(null);
  const categories = toolCategories.filter((category): category is ToolCategory => category !== "All");

  useEffect(() => {
    const hoverQuery = window.matchMedia("(min-width: 641px) and (hover: hover) and (pointer: fine)");
    const widthQuery = window.matchMedia("(min-width: 641px)");
    const updateSupport = () => {
      setDesktopHoverEnabled(hoverQuery.matches);
      setWideLayout(widthQuery.matches);
    };

    updateSupport();
    hoverQuery.addEventListener("change", updateSupport);
    widthQuery.addEventListener("change", updateSupport);
    return () => {
      hoverQuery.removeEventListener("change", updateSupport);
      widthQuery.removeEventListener("change", updateSupport);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const positionSubmenu = useCallback((category: ToolCategory) => {
    if (!wideLayout) return;
    const button = categoryButtonsRef.current.get(category);
    if (!button) return;

    const requestedTop = button.getBoundingClientRect().top;
    setSubmenuTop(requestedTop);

    window.requestAnimationFrame(() => {
      const submenuHeight = submenuRef.current?.getBoundingClientRect().height ?? 0;
      const maximumTop = Math.max(8, window.innerHeight - submenuHeight - 8);
      setSubmenuTop(Math.max(8, Math.min(requestedTop, maximumTop)));
    });
  }, [wideLayout]);

  useLayoutEffect(() => {
    if (openCategory) positionSubmenu(openCategory);
  }, [openCategory, positionSubmenu]);

  useEffect(() => {
    if (!openCategory || !pinnedCategory) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (railRef.current?.contains(target)) return;
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setSubmenuClosing(false);
      setPinnedCategory(null);
      setOpenCategory(null);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
  }, [openCategory, pinnedCategory]);

  useEffect(() => {
    if (!openCategory || !wideLayout) return;
    const reposition = () => positionSubmenu(openCategory);
    const categoryList = categoryListRef.current;
    window.addEventListener("resize", reposition);
    categoryList?.addEventListener("scroll", reposition, { passive: true });
    return () => {
      window.removeEventListener("resize", reposition);
      categoryList?.removeEventListener("scroll", reposition);
    };
  }, [openCategory, positionSubmenu, wideLayout]);

  function cancelScheduledClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setSubmenuClosing(false);
  }

  function openForHover(category: ToolCategory) {
    if (!desktopHoverEnabled || pinnedCategory) return;
    cancelScheduledClose();
    setOpenCategory(category);
  }

  function scheduleHoverClose() {
    if (!desktopHoverEnabled || !openCategory || pinnedCategory) return;
    cancelScheduledClose();
    setSubmenuClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setOpenCategory(null);
      setSubmenuClosing(false);
      closeTimerRef.current = null;
    }, 280);
  }

  function closeSubmenu() {
    cancelScheduledClose();
    setPinnedCategory(null);
    setOpenCategory(null);
  }

  function togglePinnedCategory(category: ToolCategory) {
    cancelScheduledClose();
    if (pinnedCategory === category && openCategory === category) {
      closeSubmenu();
      return;
    }
    setPinnedCategory(category);
    setOpenCategory(category);
  }

  function chooseTool(tool: PdfTool) {
    onToolChange(tool);
    closeSubmenu();
  }

  return (
    <nav
      ref={railRef}
      className="workspace-tool-rail"
      aria-label="NovaPDF workspace tool categories"
      onMouseEnter={cancelScheduledClose}
      onMouseLeave={scheduleHoverClose}
    >
      <button type="button" className="workspace-rail-brand" aria-label="Return to NovaPDF home" title="NovaPDF home" onClick={onExitWorkspace}>
        <BrandLogo compact />
      </button>
      <div className="workspace-rail-divider" aria-hidden="true" />

      <div ref={categoryListRef} className="workspace-rail-categories">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          const expanded = openCategory === category;
          const pinned = pinnedCategory === category;
          const activeCategory = activeTool.category === category;
          return (
            <button
              key={category}
              ref={(element) => {
                if (element) categoryButtonsRef.current.set(category, element);
                else categoryButtonsRef.current.delete(category);
              }}
              type="button"
              className={`workspace-rail-category ${activeCategory ? "workspace-rail-category-active" : ""} ${expanded ? "workspace-rail-category-expanded" : ""} ${pinned ? "workspace-rail-category-pinned" : ""}`}
              aria-expanded={expanded}
              aria-controls={`workspace-submenu-${category.replace(/\s+/g, "-").toLowerCase()}`}
              onMouseEnter={() => openForHover(category)}
              onFocus={() => {
                if (pinnedCategory) return;
                cancelScheduledClose();
                setOpenCategory(category);
              }}
              onClick={() => togglePinnedCategory(category)}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{category}</span>
              {expanded ? <ChevronDown className="workspace-rail-category-chevron" /> : <ChevronRight className="workspace-rail-category-chevron" />}
            </button>
          );
        })}
      </div>

      {openCategory && (
        <aside
          ref={submenuRef}
          id={`workspace-submenu-${openCategory.replace(/\s+/g, "-").toLowerCase()}`}
          className={`workspace-rail-submenu ${submenuClosing ? "workspace-rail-submenu-closing" : ""} ${pinnedCategory === openCategory ? "workspace-rail-submenu-pinned" : ""}`}
          style={wideLayout ? { top: `${submenuTop}px` } : undefined}
          aria-label={`${openCategory} tools`}
          onMouseEnter={cancelScheduledClose}
          onMouseLeave={scheduleHoverClose}
        >
          <div className="workspace-rail-submenu-header">
            <div>
              <small>{pinnedCategory === openCategory ? "Click-open category" : "Tool category"}</small>
              <strong>{openCategory}</strong>
            </div>
            <button type="button" aria-label="Close tool submenu" onClick={closeSubmenu}>
              <X className="size-4" />
            </button>
          </div>
          <div className="workspace-rail-submenu-list">
            {pdfTools
              .filter((tool) => tool.category === openCategory)
              .map((tool) => {
                const Icon = tool.icon;
                const active = tool.slug === activeTool.slug;
                return (
                  <button
                    key={tool.slug}
                    type="button"
                    className={`workspace-rail-subtool ${active ? "workspace-rail-subtool-active" : ""}`}
                    onClick={() => chooseTool(tool)}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="workspace-rail-subtool-icon"><Icon className="size-4" /></span>
                    <span className="workspace-rail-subtool-copy">
                      <strong>{tool.name}</strong>
                      <small>{tool.badge === "Soon" ? "Coming soon" : tool.description}</small>
                    </span>
                    {tool.badge && <em>{tool.badge}</em>}
                  </button>
                );
              })}
          </div>
        </aside>
      )}

      {onOpenControls && (
        <button type="button" className="workspace-rail-controls lg:hidden" onClick={onOpenControls} title="Open controls">
          <PanelRightOpen className="size-5" />
          <span>Controls</span>
        </button>
      )}
    </nav>
  );
}
