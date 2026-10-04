import JSZip from "jszip";

const PROXY_BASE = "/api/pdf-to-word";
const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type PdfToWordAnalysis = {
  pageCount: number;
  nativeTextPages: number[];
  scannedPages: number[];
  ocrRecommended: boolean;
};

export type PdfToWordServiceResult = {
  bytes: Uint8Array;
  pageCount: number;
  ocrPageCount: number;
  nativeTextPageCount: number;
  engine: string;
};

export type PdfToWordServiceSource = {
  file: File;
  pageNumbers: number[];
};

export class PdfConverterUnavailableError extends Error {
  readonly code = "CONVERTER_OFFLINE";

  constructor(message = "The local PDF converter is not running.") {
    super(message);
    this.name = "PdfConverterUnavailableError";
  }
}

export function isPdfConverterUnavailableError(error: unknown): error is PdfConverterUnavailableError {
  return error instanceof PdfConverterUnavailableError;
}

type ErrorPayload = { code?: string; detail?: string };

async function responseError(response: Response) {
  try {
    const payload = await response.json() as ErrorPayload;
    return {
      code: payload.code,
      message: payload.detail || `Conversion service returned HTTP ${response.status}.`,
    };
  } catch {
    return { code: undefined, message: `Conversion service returned HTTP ${response.status}.` };
  }
}

async function serviceFetch(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${PROXY_BASE}${path}`, {
      ...init,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new PdfConverterUnavailableError(
      "NovaPDF could not reach its converter proxy. Keep the NovaPDF web window running and retry.",
    );
  }

  if (!response.ok) {
    const detail = await responseError(response);
    if (response.status === 503 || detail.code === "CONVERTER_OFFLINE") {
      throw new PdfConverterUnavailableError(detail.message);
    }
    throw new Error(detail.message);
  }
  return response;
}

export async function checkPdfConverterHealth(signal?: AbortSignal) {
  const response = await serviceFetch("/health", { method: "GET", signal });
  return response.json() as Promise<{ status: string; version: string; engines: string[]; ocrLanguages?: string[] }>;
}

export async function analyzePdfForWord(file: File, signal?: AbortSignal): Promise<PdfToWordAnalysis> {
  const body = new FormData();
  body.append("file", file, file.name);
  const response = await serviceFetch("/analyze", {
    method: "POST",
    body,
    signal,
  });
  return response.json() as Promise<PdfToWordAnalysis>;
}

function ensureDocxXml(xml: string, partName: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error(`The converter produced invalid ${partName}.`);
  }
}

export async function validateDocxBytes(bytes: Uint8Array) {
  if (bytes.byteLength < 256 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error("The conversion service did not return a valid Word document package.");
  }
  const zip = await JSZip.loadAsync(bytes);
  const requiredParts = ["[Content_Types].xml", "_rels/.rels", "word/document.xml"];
  for (const part of requiredParts) {
    const entry = zip.file(part);
    if (!entry) throw new Error(`The Word document is missing ${part}.`);
    ensureDocxXml(await entry.async("string"), part);
  }
  const contentTypes = await zip.file("[Content_Types].xml")!.async("string");
  if (!contentTypes.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml")) {
    throw new Error("The result is not a Microsoft Word DOCX package.");
  }
}

export async function convertPdfToWordWithService(
  sources: PdfToWordServiceSource[],
  options: {
    layoutMode: "visual" | "editable" | "hybrid";
    useOcr: boolean;
    ocrLanguage: string;
    outputName: string;
    signal?: AbortSignal;
  },
): Promise<PdfToWordServiceResult> {
  if (!sources.length) throw new Error("Add at least one PDF before conversion.");
  const body = new FormData();
  sources.forEach((source) => body.append("files", source.file, source.file.name));
  body.append("layout_mode", options.layoutMode);
  body.append("use_ocr", String(options.useOcr));
  body.append("ocr_language", options.ocrLanguage);
  body.append("output_name", options.outputName);
  body.append("page_map", JSON.stringify(sources.map((source) => source.pageNumbers)));

  const response = await serviceFetch("/convert", {
    method: "POST",
    body,
    signal: options.signal,
  });
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== WORD_MIME) {
    throw new Error("The conversion service returned an unexpected file type.");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await validateDocxBytes(bytes);
  return {
    bytes,
    pageCount: Number(response.headers.get("x-novapdf-pages") || sources.reduce((sum, source) => sum + source.pageNumbers.length, 0)),
    ocrPageCount: Number(response.headers.get("x-novapdf-ocr-pages") || 0),
    nativeTextPageCount: Number(response.headers.get("x-novapdf-native-text-pages") || 0),
    engine: response.headers.get("x-novapdf-engine") || "novapdf-conversion-service",
  };
}
