import { proxyPdfConverter } from "@/lib/server/pdf-converter-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.formData();
    return proxyPdfConverter("/api/v1/pdf-to-word/convert", {
      method: "POST",
      body,
      timeoutMs: 15 * 60_000,
    });
  } catch {
    return Response.json(
      { code: "INVALID_UPLOAD", detail: "The PDF conversion request could not be read." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
