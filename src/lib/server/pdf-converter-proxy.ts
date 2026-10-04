const DEFAULT_CONVERTER_URL = "http://127.0.0.1:4010";

const FORWARDED_RESPONSE_HEADERS = [
  "cache-control",
  "content-disposition",
  "content-type",
  "x-novapdf-engine",
  "x-novapdf-pages",
  "x-novapdf-ocr-pages",
  "x-novapdf-native-text-pages",
] as const;

function converterBaseUrl() {
  const configured = process.env.PDF_CONVERTER_INTERNAL_URL?.trim();
  return (configured || DEFAULT_CONVERTER_URL).replace(/\/$/, "");
}

function unavailableResponse(error: unknown) {
  const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
  return Response.json(
    {
      code: "CONVERTER_OFFLINE",
      detail: timedOut
        ? "The local PDF converter did not respond in time. Start or repair the converter, then retry."
        : "The local PDF converter is not running. Start RUN_NOVAPDF_ALL.cmd or START_PDF_CONVERTER.cmd, then retry.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

function upstreamResponse(response: Response) {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("cache-control")) headers.set("Cache-Control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function proxyPdfConverter(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: FormData;
    timeoutMs: number;
  },
) {
  try {
    const response = await fetch(`${converterBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      body: options.body,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    return upstreamResponse(response);
  } catch (error) {
    return unavailableResponse(error);
  }
}
