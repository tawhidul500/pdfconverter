from __future__ import annotations

import json
import os
from typing import Annotated
from urllib.parse import quote

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from .converter import (
    MAX_FILE_BYTES,
    ConversionError,
    SourcePdf,
    analyze_pdf,
    convert_sources,
    suggested_download_name,
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "NOVAPDF_WEB_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="NovaPDF Conversion Service", version="0.14.16", docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=os.getenv(
        "NOVAPDF_WEB_ORIGIN_REGEX",
        r"^https?://(localhost|127\.0\.0\.1|172\.24\.48\.1|172\.21\.32\.1)(:\d+)?$",
    ),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=[
        "Content-Disposition",
        "X-NovaPDF-Engine",
        "X-NovaPDF-Pages",
        "X-NovaPDF-OCR-Pages",
        "X-NovaPDF-Native-Text-Pages",
    ],
)


async def _read_upload(upload: UploadFile) -> bytes:
    chunks: list[bytes] = []
    size = 0
    while True:
        chunk = await upload.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail=f"{upload.filename or 'PDF'} exceeds the 50 MB file limit.")
        chunks.append(chunk)
    return b"".join(chunks)


def _parse_page_map(raw: str | None, count: int) -> list[tuple[int, ...] | None]:
    if not raw:
        return [None] * count
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=422, detail="page_map must be a JSON array.") from error
    if not isinstance(payload, list) or len(payload) != count:
        raise HTTPException(status_code=422, detail="page_map must contain one page array per PDF.")
    parsed: list[tuple[int, ...] | None] = []
    for entry in payload:
        if entry is None:
            parsed.append(None)
            continue
        if not isinstance(entry, list) or not all(isinstance(value, int) for value in entry):
            raise HTTPException(status_code=422, detail="Each page_map entry must be an integer array or null.")
        parsed.append(tuple(entry))
    return parsed


def _content_disposition(filename: str) -> str:
    ascii_name = filename.encode("ascii", "ignore").decode("ascii").strip().replace('"', "-")
    if not ascii_name or ascii_name.startswith("."):
        ascii_name = "NovaPDF-word.docx"
    return f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(filename)}"


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "novapdf-pdf-to-word",
        "version": "0.14.16",
        "engines": ["pdfium", "python-docx", "tesseract", "opencv"],
        "ocrLanguages": ["eng", "ben", "eng+ben"],
    }


@app.post("/api/v1/pdf-to-word/analyze")
async def analyze(file: Annotated[UploadFile, File(...)]) -> JSONResponse:
    data = await _read_upload(file)
    try:
        result = analyze_pdf(SourcePdf(file.filename or "document.pdf", data))
    except ConversionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    return JSONResponse(
        {
            "pageCount": result.page_count,
            "nativeTextPages": list(result.native_text_pages),
            "scannedPages": list(result.scanned_pages),
            "ocrRecommended": bool(result.scanned_pages),
        }
    )


@app.post("/api/v1/pdf-to-word/convert")
async def convert(
    files: Annotated[list[UploadFile], File(...)],
    layout_mode: Annotated[str, Form()] = "editable",
    use_ocr: Annotated[bool, Form()] = False,
    ocr_language: Annotated[str, Form()] = "eng",
    output_name: Annotated[str, Form()] = "NovaPDF-word",
    page_map: Annotated[str | None, Form()] = None,
) -> Response:
    pages = _parse_page_map(page_map, len(files))
    sources: list[SourcePdf] = []
    for upload, selected_pages in zip(files, pages, strict=True):
        sources.append(SourcePdf(upload.filename or "document.pdf", await _read_upload(upload), selected_pages))
    try:
        result = convert_sources(
            sources,
            layout_mode=layout_mode if layout_mode in {"visual", "editable", "hybrid"} else "editable",
            use_ocr=use_ocr,
            ocr_language=ocr_language,
            title=output_name,
        )
    except ConversionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    filename = suggested_download_name(output_name)
    return Response(
        content=result.data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": _content_disposition(filename),
            "X-NovaPDF-Engine": "pdfium-python-docx-tesseract-opencv",
            "X-NovaPDF-Pages": str(result.page_count),
            "X-NovaPDF-OCR-Pages": str(result.ocr_page_count),
            "X-NovaPDF-Native-Text-Pages": str(result.native_text_page_count),
            "Cache-Control": "no-store",
        },
    )
