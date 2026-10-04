"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { pdfTools, toolCategories, type PdfTool, type ToolCategory } from "@/data/tools";

export function ToolSelectMenu({
  activeTool,
  onToolSelect,
  className = "",
}: {
  activeTool: PdfTool;
  onToolSelect: (slug: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);


  useLayoutEffect(() => {
    if (!open) return;

    function placeBelowTrigger() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportPadding = 16;
      const width = Math.min(352, window.innerWidth - viewportPadding * 2);
      const left = Math.max(viewportPadding, Math.min(rect.right - width, window.innerWidth - width - viewportPadding));
      const top = rect.bottom + 8;
      setPopoverStyle({
        position: "fixed",
        top,
        left,
        width,
        maxHeight: Math.max(160, window.innerHeight - top - viewportPadding),
      });
    }

    placeBelowTrigger();
    window.addEventListener("resize", placeBelowTrigger);
    window.addEventListener("scroll", placeBelowTrigger, true);
    return () => {
      window.removeEventListener("resize", placeBelowTrigger);
      window.removeEventListener("scroll", placeBelowTrigger, true);
    };
  }, [open]);

  function chooseTool(slug: string) {
    onToolSelect(slug);
    setOpen(false);
  }

  const categories = toolCategories.filter((category): category is ToolCategory => category !== "All");

  return (
    <div ref={menuRef} className={`tool-select-menu ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="tool-select-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{activeTool.name}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div ref={popoverRef} className="tool-select-popover" style={popoverStyle} role="menu" aria-label="Choose PDF tool">
          {categories.map((category) => {
            const tools = pdfTools.filter((tool) => tool.category === category);
            return (
              <section key={category} className="tool-select-group">
                <p className="tool-select-group-title">{category}</p>
                <div className="tool-select-group-items">
                  {tools.map((tool) => {
                    const active = tool.slug === activeTool.slug;
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.slug}
                        type="button"
                        role="menuitem"
                        className={`tool-select-option ${active ? "tool-select-option-active" : ""}`}
                        onClick={() => chooseTool(tool.slug)}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span>{tool.name}</span>
                        {tool.badge === "Soon" && <small>Soon</small>}
                        {active && <Check className="ml-auto size-4 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
