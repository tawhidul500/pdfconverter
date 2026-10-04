import { Layers3 } from "lucide-react";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5" aria-label="NovaPDF home">
      <span className="grid size-10 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-[0_8px_24px_rgba(24,184,166,0.28)]">
        <Layers3 aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="text-[1.08rem] font-extrabold tracking-[-0.035em] text-[var(--ink)]">
          Nova<span className="text-[var(--brand-strong)]">PDF</span>
        </span>
      )}
    </div>
  );
}
