export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERSION = "0.14.16";

export async function GET() {
  return Response.json(
    {
      product: "NovaPDF",
      version: VERSION,
      buildStep: "14.16",
      capability: "PDF to Word editable object parity without page-background duplication",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-NovaPDF-Version": VERSION,
      },
    },
  );
}
