"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleCheckBig,
  CloudUpload,
  FileCheck2,
  FileText,
  Gauge,
  LockKeyhole,
  Menu,
  MousePointerClick,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { ToolSelectMenu } from "@/components/tool-select-menu";
import { CompressPdfWorkspace } from "@/components/compress-pdf-workspace";
import { MergePdfWorkspace } from "@/components/merge-pdf-workspace";
import { JpgToPdfWorkspace } from "@/components/jpg-to-pdf-workspace";
import { PdfToJpgWorkspace } from "@/components/pdf-to-jpg-workspace";
import { PdfToWordWorkspace } from "@/components/pdf-to-word-workspace";
import { PageNumbersPdfWorkspace } from "@/components/page-numbers-pdf-workspace";
import { WatermarkPdfWorkspace } from "@/components/watermark-pdf-workspace";
import { RotatePdfWorkspace } from "@/components/rotate-pdf-workspace";
import { CropPdfWorkspace } from "@/components/crop-pdf-workspace";
import { SignPdfWorkspace } from "@/components/sign-pdf-workspace";
import { EditPdfWorkspace } from "@/components/edit-pdf-workspace";
import { GenericToolWorkspace } from "@/components/generic-tool-workspace";
import { OrganizePdfWorkspace } from "@/components/organize-pdf-workspace";
import { SplitPdfWorkspace } from "@/components/split-pdf-workspace";
import { pdfTools, toolCategories, type PdfTool, type ToolCategory } from "@/data/tools";

const MAX_FRONTEND_FILE_SIZE = 50 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function Header() {
  const [open, setOpen] = useState(false);

  const links = [
    ["All PDF Tools", "#tools"],
    ["How it works", "#how-it-works"],
    ["Security", "#security"],
    ["Pricing", "#pricing"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="page-shell flex h-[74px] items-center justify-between gap-5">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <BrandLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="nav-link">
              {label}
            </Link>
          ))}
          <Link href="#business" className="nav-link">
            Business
          </Link>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <button type="button" className="button button-ghost">
            Sign in
          </button>
          <Link href="#workspace" className="button button-primary">
            Start free
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-2xl border border-slate-200 text-slate-700 sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-5 py-5 sm:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="#business"
              className="rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Business
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="button button-secondary">
                Sign in
              </button>
              <Link href="#workspace" className="button button-primary" onClick={() => setOpen(false)}>
                Start free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function GenericUploadCard({
  activeTool,
  onToolChange,
}: {
  activeTool: PdfTool;
  onToolChange: (tool: PdfTool) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string>("");


  function validateAndAdd(incoming: File[]) {
    const accepted = incoming.filter((file) => {
      if (file.size > MAX_FRONTEND_FILE_SIZE) {
        setMessage(`${file.name} is larger than the current 50 MB demo limit.`);
        return false;
      }
      return true;
    });

    const nextFiles = activeTool.multiple ? accepted : accepted.slice(0, 1);
    setFiles((current) => (activeTool.multiple ? [...current, ...nextFiles] : nextFiles));
    if (accepted.length > 0) setMessage("");
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    validateAndAdd(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    validateAndAdd(Array.from(event.dataTransfer.files));
  }

  function selectTool(slug: string) {
    const tool = pdfTools.find((item) => item.slug === slug);
    if (!tool) return;
    onToolChange(tool);
    setFiles([]);
    setMessage("");
  }

  function handleProcess() {
    if (files.length === 0) {
      setMessage("Please choose at least one file first.");
      return;
    }
    setMessage(`${activeTool.name} processing will be connected in the next build step.`);
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
            <p className="truncate text-xs text-slate-500">Browser upload demo</p>
          </div>
        </div>
        <ToolSelectMenu
          activeTool={activeTool}
          onToolSelect={selectTool}
          className="hidden sm:block"
        />
      </div>

      <div className="p-4 sm:p-6">
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={activeTool.accepts}
          multiple={activeTool.multiple}
          onChange={onFileInput}
        />

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
          <span className="upload-icon">
            <CloudUpload className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-lg font-extrabold tracking-[-0.025em] text-[var(--ink)]">
            Drop your {activeTool.category === "Convert PDF" ? "files" : "PDFs"} here
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            or click to browse · up to 50 MB in this frontend demo
          </p>
          <span className="button button-primary mt-5 pointer-events-none">
            <UploadCloud className="size-4" aria-hidden="true" />
            Choose {activeTool.multiple ? "files" : "a file"}
          </span>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2" aria-live="polite">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="file-row">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {message && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800" aria-live="polite">
            {message}
          </p>
        )}

        <button type="button" className="button button-dark mt-4 w-full" onClick={handleProcess}>
          Continue with {activeTool.name}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>

        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-teal-600" /> Private upload
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-500" /> Fast workspace
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Trash2 className="size-3.5 text-rose-500" /> Auto-delete planned
          </span>
        </div>
      </div>
    </div>
  );
}


const BUILT_WORKSPACE_SLUGS = new Set(["merge-pdf", "split-pdf", "organize-pdf", "compress-pdf", "pdf-to-word", "jpg-to-pdf", "pdf-to-jpg", "page-numbers-pdf", "watermark-pdf", "rotate-pdf", "crop-pdf", "sign-pdf", "edit-pdf"]);

function UploadWorkspace({
  activeTool,
  onToolChange,
  forceWorkspace,
  onExitWorkspace,
}: {
  activeTool: PdfTool;
  onToolChange: (tool: PdfTool) => void;
  forceWorkspace: boolean;
  onExitWorkspace: () => void;
}) {
  const mergeTool = pdfTools.find((tool) => tool.slug === "merge-pdf")!;
  const splitTool = pdfTools.find((tool) => tool.slug === "split-pdf")!;
  const organizeTool = pdfTools.find((tool) => tool.slug === "organize-pdf")!;
  const compressTool = pdfTools.find((tool) => tool.slug === "compress-pdf")!;
  const jpgToPdfTool = pdfTools.find((tool) => tool.slug === "jpg-to-pdf")!;
  const pdfToWordTool = pdfTools.find((tool) => tool.slug === "pdf-to-word")!;
  const pdfToJpgTool = pdfTools.find((tool) => tool.slug === "pdf-to-jpg")!;
  const pageNumbersTool = pdfTools.find((tool) => tool.slug === "page-numbers-pdf")!;
  const watermarkTool = pdfTools.find((tool) => tool.slug === "watermark-pdf")!;
  const rotateTool = pdfTools.find((tool) => tool.slug === "rotate-pdf")!;
  const cropTool = pdfTools.find((tool) => tool.slug === "crop-pdf")!;
  const signTool = pdfTools.find((tool) => tool.slug === "sign-pdf")!;
  const editTool = pdfTools.find((tool) => tool.slug === "edit-pdf")!;
  const genericTools = pdfTools.filter((tool) => !BUILT_WORKSPACE_SLUGS.has(tool.slug));

  if (!forceWorkspace) {
    return <GenericUploadCard activeTool={activeTool} onToolChange={onToolChange} />;
  }

  return (
    <>
      <div className={activeTool.slug === mergeTool.slug ? "" : "hidden"}>
        <MergePdfWorkspace
          activeTool={mergeTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === mergeTool.slug}
          isActive={activeTool.slug === mergeTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === splitTool.slug ? "" : "hidden"}>
        <SplitPdfWorkspace
          activeTool={splitTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === splitTool.slug}
          isActive={activeTool.slug === splitTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === organizeTool.slug ? "" : "hidden"}>
        <OrganizePdfWorkspace
          activeTool={organizeTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === organizeTool.slug}
          isActive={activeTool.slug === organizeTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === compressTool.slug ? "" : "hidden"}>
        <CompressPdfWorkspace
          activeTool={compressTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === compressTool.slug}
          isActive={activeTool.slug === compressTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === jpgToPdfTool.slug ? "" : "hidden"}>
        <JpgToPdfWorkspace
          activeTool={jpgToPdfTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === jpgToPdfTool.slug}
          isActive={activeTool.slug === jpgToPdfTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === pdfToWordTool.slug ? "" : "hidden"}>
        <PdfToWordWorkspace
          activeTool={pdfToWordTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === pdfToWordTool.slug}
          isActive={activeTool.slug === pdfToWordTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === pdfToJpgTool.slug ? "" : "hidden"}>
        <PdfToJpgWorkspace
          activeTool={pdfToJpgTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === pdfToJpgTool.slug}
          isActive={activeTool.slug === pdfToJpgTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === pageNumbersTool.slug ? "" : "hidden"}>
        <PageNumbersPdfWorkspace
          activeTool={pageNumbersTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === pageNumbersTool.slug}
          isActive={activeTool.slug === pageNumbersTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === watermarkTool.slug ? "" : "hidden"}>
        <WatermarkPdfWorkspace
          activeTool={watermarkTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === watermarkTool.slug}
          isActive={activeTool.slug === watermarkTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === rotateTool.slug ? "" : "hidden"}>
        <RotatePdfWorkspace
          activeTool={rotateTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === rotateTool.slug}
          isActive={activeTool.slug === rotateTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === cropTool.slug ? "" : "hidden"}>
        <CropPdfWorkspace
          activeTool={cropTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === cropTool.slug}
          isActive={activeTool.slug === cropTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === signTool.slug ? "" : "hidden"}>
        <SignPdfWorkspace
          activeTool={signTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === signTool.slug}
          isActive={activeTool.slug === signTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      <div className={activeTool.slug === editTool.slug ? "" : "hidden"}>
        <EditPdfWorkspace
          activeTool={editTool}
          onToolChange={onToolChange}
          startInWorkspace={forceWorkspace && activeTool.slug === editTool.slug}
          isActive={activeTool.slug === editTool.slug}
          onExitWorkspace={onExitWorkspace}
        />
      </div>

      {genericTools.map((tool) => (
        <div
          key={`workspace-${tool.slug}`}
          className={forceWorkspace && activeTool.slug === tool.slug ? "" : "hidden"}
        >
          <GenericToolWorkspace
            activeTool={tool}
            onToolChange={onToolChange}
            onExitWorkspace={onExitWorkspace}
            isActive={forceWorkspace && activeTool.slug === tool.slug}
          />
        </div>
      ))}

      {!forceWorkspace && !BUILT_WORKSPACE_SLUGS.has(activeTool.slug) && (
        <GenericUploadCard activeTool={activeTool} onToolChange={onToolChange} />
      )}
    </>
  );
}

function Hero({
  activeTool,
  onToolChange,
  forceWorkspace,
  onExitWorkspace,
  workspaceResetVersion,
}: {
  activeTool: PdfTool;
  onToolChange: (tool: PdfTool) => void;
  forceWorkspace: boolean;
  onExitWorkspace: () => void;
  workspaceResetVersion: number;
}) {
  return (
    <section id="top" className="hero-section overflow-hidden">
      <div className="hero-orb hero-orb-one" aria-hidden="true" />
      <div className="hero-orb hero-orb-two" aria-hidden="true" />
      <div className="page-shell relative grid items-center gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
        <div className="max-w-2xl">
          <div className="eyebrow">
            <Sparkles className="size-4" aria-hidden="true" />
            Your documents, made simple
          </div>
          <h1 className="mt-6 text-balance text-[clamp(2.65rem,7vw,5.5rem)] font-black leading-[0.96] tracking-[-0.065em] text-[var(--ink)]">
            Every PDF task.
            <span className="block text-gradient">One calm workspace.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Organize, convert, edit, and secure your documents without jumping between confusing tools. NovaPDF is being built as a fast, private, all-in-one PDF platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#workspace" className="button button-primary button-large">
              Choose a file
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="#tools" className="button button-secondary button-large">
              Explore all tools
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <CircleCheckBig className="size-4 text-teal-600" /> No installation
            </span>
            <span className="inline-flex items-center gap-2">
              <CircleCheckBig className="size-4 text-teal-600" /> Mobile friendly
            </span>
            <span className="inline-flex items-center gap-2">
              <CircleCheckBig className="size-4 text-teal-600" /> Original design
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:ml-auto">
          <div className="absolute -left-6 top-10 hidden rounded-2xl border border-white/70 bg-white/85 p-3 shadow-xl backdrop-blur md:flex items-center gap-3 animate-float-slow">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck2 className="size-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-700">Ready to process</p>
              <p className="text-[11px] text-slate-400">Simple, guided steps</p>
            </div>
          </div>
          <div className="absolute -right-5 bottom-14 z-10 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-xl backdrop-blur md:block animate-float-delayed">
            <p className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <ShieldCheck className="size-4 text-teal-600" /> Privacy-first flow
            </p>
          </div>
          <UploadWorkspace
            key={workspaceResetVersion}
            activeTool={activeTool}
            onToolChange={onToolChange}
            forceWorkspace={forceWorkspace}
            onExitWorkspace={onExitWorkspace}
          />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, title: "Private by design", copy: "Files stay isolated" },
    { icon: Gauge, title: "Built for speed", copy: "Clear, focused actions" },
    { icon: MousePointerClick, title: "Easy for anyone", copy: "No learning curve" },
    { icon: BadgeCheck, title: "Consistent quality", copy: "One design system" },
  ];

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="page-shell grid grid-cols-2 divide-x divide-y divide-slate-200 lg:grid-cols-4 lg:divide-y-0">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-3 px-3 py-6 sm:px-6">
            <item.icon className="size-5 shrink-0 text-[var(--brand-strong)]" aria-hidden="true" />
            <div>
              <p className="text-sm font-extrabold text-slate-800">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ToolExplorer({ onSelectTool }: { onSelectTool: (tool: PdfTool) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ToolCategory>("All");

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return pdfTools.filter((tool) => {
      const matchesCategory = category === "All" || tool.category === category;
      const matchesSearch =
        normalized.length === 0 ||
        tool.name.toLowerCase().includes(normalized) ||
        tool.description.toLowerCase().includes(normalized) ||
        tool.category.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [category, query]);

  function chooseTool(tool: PdfTool) {
    onSelectTool(tool);
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section id="tools" className="section-space scroll-mt-24 bg-[var(--surface-soft)]">
      <div className="page-shell">
        <div className="section-heading-row">
          <div>
            <div className="eyebrow eyebrow-soft">
              <WandSparkles className="size-4" />
              PDF toolkit
            </div>
            <h2 className="section-title mt-5">One place for your everyday document work.</h2>
            <p className="section-copy mt-4">Start with the tools people use most. More advanced tools will be connected as we build each phase.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PDF tools..."
              className="search-input"
              aria-label="Search PDF tools"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2" aria-label="Tool categories">
          {toolCategories.map((item) => (
            <button
              type="button"
              key={item}
              className={`category-pill ${category === item ? "category-pill-active" : ""}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredTools.map((tool) => (
            <button type="button" key={tool.slug} className="tool-card group text-left" onClick={() => chooseTool(tool)}>
              <div className="flex items-start justify-between gap-3">
                <span className="tool-icon">
                  <tool.icon className="size-5" aria-hidden="true" />
                </span>
                {tool.badge && (
                  <span className={`tool-badge ${tool.badge === "Soon" ? "tool-badge-muted" : ""}`}>{tool.badge}</span>
                )}
              </div>
              <h3 className="mt-5 text-lg font-extrabold tracking-[-0.025em] text-[var(--ink)]">{tool.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{tool.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-strong)]">
                Open tool
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Search className="mx-auto size-7 text-slate-400" />
            <p className="mt-4 font-extrabold text-slate-700">No matching tool found</p>
            <p className="mt-1 text-sm text-slate-500">Try a simpler word such as merge, image, or protect.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: CloudUpload,
      title: "Choose your file",
      copy: "Upload from your computer or drag the file into the workspace.",
    },
    {
      number: "02",
      icon: WandSparkles,
      title: "Set what you need",
      copy: "Pick simple options made specifically for the selected PDF tool.",
    },
    {
      number: "03",
      icon: FileCheck2,
      title: "Process and download",
      copy: "The backend worker will create your result and provide a secure link.",
    },
  ];

  return (
    <section id="how-it-works" className="section-space scroll-mt-24 bg-white">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow eyebrow-soft mx-auto w-fit">Three simple steps</div>
          <h2 className="section-title mt-5">Powerful PDF work should still feel easy.</h2>
          <p className="section-copy mx-auto mt-4">NovaPDF hides the technical complexity and gives you only the controls you actually need.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="step-card">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-[var(--brand-strong)]">
                  <step.icon className="size-5" />
                </span>
                <span className="text-4xl font-black tracking-[-0.08em] text-slate-100">{step.number}</span>
              </div>
              <h3 className="mt-7 text-xl font-extrabold tracking-[-0.03em] text-[var(--ink)]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{step.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="section-space scroll-mt-24 bg-[var(--ink)] text-white">
      <div className="page-shell grid items-center gap-12 lg:grid-cols-2">
        <div>
          <div className="eyebrow eyebrow-dark">
            <LockKeyhole className="size-4" />
            Security architecture
          </div>
          <h2 className="mt-6 text-balance text-4xl font-black leading-tight tracking-[-0.05em] sm:text-5xl">
            Your file is a task—not our product.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            The production platform will use private storage, signed download links, file validation, malware scanning, and automatic deletion. We are designing privacy into the system from day one.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Private object storage",
              "Expiring download links",
              "Automatic file deletion",
              "No document-content advertising",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-200">
                <span className="grid size-7 place-items-center rounded-full bg-white/10 text-teal-300">
                  <Check className="size-4" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="security-visual">
          <div className="security-ring security-ring-one" />
          <div className="security-ring security-ring-two" />
          <div className="relative z-10 grid size-36 place-items-center rounded-[2.5rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
            <ShieldCheck className="size-16 text-teal-300" strokeWidth={1.5} />
          </div>
          <div className="absolute left-8 top-12 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs font-extrabold">Encrypted transfer</p>
            <p className="mt-1 text-[11px] text-slate-400">HTTPS / TLS</p>
          </div>
          <div className="absolute bottom-10 right-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs font-extrabold">Timed cleanup</p>
            <p className="mt-1 text-[11px] text-slate-400">Retention controlled</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Free",
      copy: "For quick personal tasks",
      price: "$0",
      suffix: "forever",
      featured: false,
      features: ["Core PDF tools", "Standard file limits", "Browser workspace", "Secure temporary files"],
    },
    {
      name: "Pro",
      copy: "For frequent document work",
      price: "$—",
      suffix: "price set later",
      featured: true,
      features: ["Larger files", "Batch processing", "Priority queue", "OCR and advanced tools"],
    },
    {
      name: "Business",
      copy: "For teams and workflows",
      price: "Custom",
      suffix: "based on usage",
      featured: false,
      features: ["Team members", "Shared workflows", "Central billing", "Usage reporting"],
    },
  ];

  return (
    <section id="pricing" className="section-space scroll-mt-24 bg-[var(--surface-soft)]">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow eyebrow-soft mx-auto w-fit">Plans for every stage</div>
          <h2 className="section-title mt-5">Start simple. Upgrade only when it helps.</h2>
          <p className="section-copy mx-auto mt-4">Pricing is not activated yet. This section establishes the future Free, Pro, and Business structure.</p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`pricing-card ${plan.featured ? "pricing-card-featured" : ""}`}>
              {plan.featured && <span className="pricing-ribbon">Recommended</span>}
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--brand-strong)]">{plan.name}</p>
              <p className="mt-2 text-sm text-slate-500">{plan.copy}</p>
              <div className="mt-7 flex items-end gap-2">
                <span className="text-4xl font-black tracking-[-0.055em] text-[var(--ink)]">{plan.price}</span>
                <span className="pb-1 text-xs font-semibold text-slate-400">{plan.suffix}</span>
              </div>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                    <span className="grid size-6 place-items-center rounded-full bg-teal-50 text-teal-700">
                      <Check className="size-3.5" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="#workspace" className={`button mt-8 w-full ${plan.featured ? "button-primary" : "button-secondary"}`}>
                {plan.name === "Business" ? "Explore business" : "Get started"}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessSection() {
  return (
    <section id="business" className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="page-shell overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 px-6 py-10 text-white shadow-[0_28px_80px_rgba(13,148,136,0.22)] sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-teal-100">NovaPDF for teams</p>
          <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.045em] sm:text-4xl">Shared PDF workflows without scattered tools.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-teal-50 sm:text-base">Business accounts will add team roles, shared workflows, usage controls, central billing, and an API for repeatable document processing.</p>
        </div>
        <Link href="#pricing" className="button mt-7 shrink-0 bg-white text-teal-800 hover:bg-teal-50 lg:mt-0">
          View business plan
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    ["Is PDF processing working in this first build?", "Not yet. This build delivers the frontend foundation and real browser interactions. Merge PDF becomes the first real processing engine in Build Step 2."],
    ["Is this design copied from iLovePDF?", "No. The product idea is a PDF toolkit, but the visual system, layout, writing, components, and code are original to NovaPDF."],
    ["Will the website work on phones?", "Yes. This homepage is responsive, and future workspaces will use a simplified mobile layout instead of squeezing a desktop interface onto a small screen."],
    ["Will my files be stored forever?", "No. The production architecture is designed around temporary private storage, expiring links, and configurable automatic deletion."],
  ];

  return (
    <section className="section-space bg-white">
      <div className="page-shell grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <div className="eyebrow eyebrow-soft w-fit">Clear answers</div>
          <h2 className="section-title mt-5">Questions before we build deeper.</h2>
          <p className="section-copy mt-4">This first milestone is intentionally focused: a strong, runnable frontend before we connect the real PDF system.</p>
        </div>
        <div className="space-y-3">
          {faqs.map(([question, answer], index) => (
            <details key={question} className="faq-item" open={index === 0}>
              <summary>
                {question}
                <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}


const CURRENT_BUILD_STAMP = "Build Step 14.16 · Editable Layout Object Parity Corrective";

function BuildStamp() {
  return <p>{CURRENT_BUILD_STAMP}</p>;
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[var(--surface-soft)]">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <BrandLogo />
          <p className="mt-5 text-sm leading-7 text-slate-500">A modern, original PDF workspace being built one clear milestone at a time.</p>
        </div>
        {[
          { title: "Product", links: ["All tools", "Pricing", "Business", "Security"] },
          { title: "Company", links: ["About", "Contact", "Blog", "Status"] },
          { title: "Legal", links: ["Privacy", "Terms", "Cookies", "Acceptable use"] },
        ].map((group) => (
          <div key={group.title}>
            <p className="text-sm font-extrabold text-slate-800">{group.title}</p>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-slate-500 transition hover:text-teal-700">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 NovaPDF. Development codename and original interface.</p>
          <BuildStamp />
        </div>
      </div>
    </footer>
  );
}

const HOME_PAGE_TITLE = "NovaPDF — Every PDF task in one calm workspace";
const DEFAULT_HOME_TOOL_SLUG = "merge-pdf";

function getDefaultHomeTool() {
  return pdfTools.find((tool) => tool.slug === DEFAULT_HOME_TOOL_SLUG) ?? pdfTools[0];
}

function toolFromPathname(pathname: string) {
  const slug = pathname.split("/").filter(Boolean)[0] ?? "";
  return pdfTools.find((tool) => tool.slug === slug) ?? null;
}

function setBrowserPath(path: string, mode: "push" | "replace" = "push") {
  if (typeof window === "undefined") return;
  const currentPath = window.location.pathname;
  if (currentPath === path) return;
  if (mode === "replace") window.history.replaceState({ novapdf: true }, "", path);
  else window.history.pushState({ novapdf: true }, "", path);
}

export function HomePage({ initialToolSlug }: { initialToolSlug?: string } = {}) {
  const initialTool = pdfTools.find((tool) => tool.slug === initialToolSlug) ?? getDefaultHomeTool();
  const [activeTool, setActiveTool] = useState<PdfTool>(initialTool);
  const [workspaceNavOpen, setWorkspaceNavOpen] = useState(Boolean(initialToolSlug));
  const [workspaceResetVersion, setWorkspaceResetVersion] = useState(0);

  useEffect(() => {
    document.title = workspaceNavOpen ? `${activeTool.name} | NovaPDF` : HOME_PAGE_TITLE;
  }, [activeTool.name, workspaceNavOpen]);

  useEffect(() => {
    function handleBrowserNavigation() {
      const routeTool = toolFromPathname(window.location.pathname);
      if (routeTool) {
        setActiveTool(routeTool);
        setWorkspaceNavOpen(true);
        return;
      }

      // Returning to the homepage is a deliberate reset: all mounted workspaces remount.
      setWorkspaceNavOpen(false);
      setActiveTool(getDefaultHomeTool());
      setWorkspaceResetVersion((version) => version + 1);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    window.addEventListener("popstate", handleBrowserNavigation);
    return () => window.removeEventListener("popstate", handleBrowserNavigation);
  }, []);

  function openTool(tool: PdfTool) {
    setWorkspaceNavOpen(true);
    setActiveTool(tool);
    setBrowserPath(`/${tool.slug}`);
  }

  function selectFromHomepage(tool: PdfTool) {
    openTool(tool);
  }

  function selectFromWorkspace(tool: PdfTool) {
    openTool(tool);
  }

  function exitWorkspaceAndClearFiles() {
    setWorkspaceNavOpen(false);
    setActiveTool(getDefaultHomeTool());
    setWorkspaceResetVersion((version) => version + 1);
    setBrowserPath("/");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  return (
    <>
      <Header />
      <main>
        <Hero
          activeTool={activeTool}
          onToolChange={selectFromWorkspace}
          forceWorkspace={workspaceNavOpen}
          onExitWorkspace={exitWorkspaceAndClearFiles}
          workspaceResetVersion={workspaceResetVersion}
        />
        <TrustStrip />
        <ToolExplorer onSelectTool={selectFromHomepage} />
        <HowItWorks />
        <SecuritySection />
        <PricingSection />
        <BusinessSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
