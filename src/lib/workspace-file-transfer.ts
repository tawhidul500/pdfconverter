import type { PdfTool } from "@/data/tools";

export const WORKSPACE_FILE_TRANSFER_EVENT = "novapdf:workspace-file-transfer";

export type WorkspaceFileTransferDetail = {
  targetSlug: string;
  files: File[];
};

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImage(file: File) {
  return (
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)
  );
}

export function compatibleFilesForTool(files: File[], tool: PdfTool) {
  if (tool.slug === "merge-pdf") return files.filter((file) => isPdf(file) || isImage(file));
  if (tool.slug === "split-pdf") return files.filter(isPdf).slice(-1);
  if (tool.slug === "organize-pdf") return files.filter(isPdf);

  const accepts = tool.accepts.toLowerCase();
  const compatible = files.filter((file) => {
    if (isPdf(file) && (accepts.includes(".pdf") || accepts.includes("application/pdf"))) return true;
    if (isImage(file) && (accepts.includes("image/") || accepts.includes(".jpg") || accepts.includes(".png") || accepts.includes(".webp"))) return true;
    return false;
  });

  return tool.multiple ? compatible : compatible.slice(-1);
}

export function transferWorkspaceFiles(targetTool: PdfTool, files: File[]) {
  if (typeof window === "undefined") return;
  const compatible = compatibleFilesForTool(files, targetTool);
  window.dispatchEvent(
    new CustomEvent<WorkspaceFileTransferDetail>(WORKSPACE_FILE_TRANSFER_EVENT, {
      detail: { targetSlug: targetTool.slug, files: compatible },
    }),
  );
}
