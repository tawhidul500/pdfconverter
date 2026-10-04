"use client";

import { CheckCircle2, Download } from "lucide-react";

export type WorkspaceDownload = {
  url: string;
  name: string;
  detail?: string;
  label?: string;
};

export function WorkspaceResultCard({
  title,
  summary,
  downloads,
}: {
  title: string;
  summary: string;
  downloads: WorkspaceDownload[];
}) {
  return (
    <div className="organize-result-box workspace-result-card" aria-live="polite">
      <div className="flex items-start gap-3">
        <span><CheckCircle2 className="size-5" /></span>
        <div className="min-w-0">
          <p>{title}</p>
          <small>{summary}</small>
        </div>
      </div>
      <div className="workspace-result-download-list">
        {downloads.map((item, index) => (
          <div key={`${item.url}-${item.name}`} className="workspace-result-download-item">
            {downloads.length > 1 && (
              <div className="workspace-result-download-meta">
                <strong title={item.name}>{item.name}</strong>
                {item.detail && <small>{item.detail}</small>}
              </div>
            )}
            <a href={item.url} download={item.name} className="button button-dark workspace-result-download">
              <Download className="size-4" />
              {item.label ?? (downloads.length === 1 ? "Download PDF" : `Download PDF ${index + 1}`)}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
