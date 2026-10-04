# NovaPDF Defect Resolution Ledger — Step 14.11

| Observed failure | Root cause | Consolidated resolution | Status |
|---|---|---|---|
| Downloaded DOCX would not open | Hand-built browser OOXML was not reliable for arbitrary PDF content | Service-side python-docx generation plus DOCX ZIP/XML validation | Implemented; Windows Word acceptance required |
| Convert button unavailable / converter offline | Browser directly depended on port 4010 and service was not started | Docker converter startup, same-origin proxy, retry state, controlled 503 | Implemented |
| `AbortError` during health polling | React development cleanup aborted a request surfaced by browser wrappers | Safe polling without cleanup abort | Implemented |
| Repeated `Failed to fetch` | Direct browser-to-converter requests | Browser now calls `/api/pdf-to-word/*`; server calls converter | Implemented |
| Four root ESLint errors | Synchronous effect setState and unescaped apostrophes | Source corrected | Windows passed in prior run |
| `PDFDocumentProxy.destroy` TypeScript errors | Local PDF.js type did not expose that method | Loading task cleanup used | Windows passed in prior run |
| Migration shown pending before apply | Runner verified before running migration | Apply → show → idempotency order | Implemented |
| `spawn EINVAL` on Node 24 | Direct Windows `.cmd` child-process spawn | Node executable launches local Next CLI | Implemented |
| Migration successful but runner failed | TypeORM output included numeric order after `[X]` | Dedicated migration output parser | Implemented |
| Hydration server/client build-label mismatch | Old and new server/client bundles were mixed | Isolated dev cache, deterministic label, stale-process protection, exact version endpoint | Consolidated in 14.11 |
| `cannot find batch label` | LF-only `.cmd` packaging | CRLF-only/BOM-free runners and byte contract | Implemented |
| User repeatedly ran an old package | Old processes/folders were silently reused | Current-version endpoint, fresh process launch, stable `START_HERE.txt`, explicit version verification | Implemented |
| Every version created a new Compose project/volume set | Compose project name derived from folder | Stable `novapdf-local` project; old containers stopped but volumes retained | Implemented |
| `/favicon.ico` returned 404 | No ICO asset | Valid favicon added | Implemented |
| npm audit reports high findings | Current dependency graph contains advisories; force remediation is prohibited | Reports remain captured; controlled dependency-upgrade milestone is still required | Open security backlog |
