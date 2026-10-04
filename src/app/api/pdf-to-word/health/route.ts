import { proxyPdfConverter } from "@/lib/server/pdf-converter-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return proxyPdfConverter("/health", { timeoutMs: 4_000 });
}
