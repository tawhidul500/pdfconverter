# NovaPDF v0.12.8 Release Notes

**Build:** Step 12.8 - Request Signatures Backend Preview  
**Date:** 2026-07-24

## Added

- A separate NestJS Request Signatures API.
- PostgreSQL schema and migration for accounts, opaque sessions, private documents, requests, recipients, assigned fields, email delivery records, and append-only audit events.
- Redis/BullMQ queues for email, request expiry, and PDF finalization.
- Private S3-compatible storage for original PDFs, signer image assets, and completed PDFs.
- SMTP provider integration and a signed delivery/bounce webhook endpoint.
- Signed-in sender request creation.
- Multiple recipients with parallel or sequential order.
- Recipient-specific field assignment.
- Hashed, expiring secure signer links.
- Request/recipient status tracking, reminders, decline, cancel, and expiry.
- Rotation-aware final completed-PDF generation and sender download email.
- Docker Compose services for PostgreSQL, Redis, MinIO, and Mailpit.
- Unit tests, a Step 12.8 architecture/corrective source contract (now 31 checks), and an opt-in real end-to-end workflow test.


## Windows Corrective Package 1 - 25 July 2026

The first Windows validation run proved that root dependencies installed and all 14 source-contract files passed, but exposed packaging/configuration defects before backend runtime testing:

- Root `npx tsc --noEmit` and `next build` scanned `backend/**/*.ts` even though backend dependencies are installed separately.
- The Page Numbers test built an invalid Windows path beginning `C:\C:\`.
- The backend imported Express and Multer directly without declaring both runtime packages directly.
- Node.js 24 rejected the E2E test's `Uint8Array<ArrayBufferLike>` as a `BlobPart`.

Corrective changes:

- Added `backend` to the root TypeScript exclude list.
- Added `backend/**` to root ESLint ignores; backend keeps its own lint/type/build gates.
- Added root scripts for backend clean install, audit, lint, typecheck, build, unit test, E2E, API, and worker commands.
- Replaced pathname parsing with `fileURLToPath(import.meta.url)` in the Page Numbers test.
- Declared `express` and `multer` directly in `backend/package.json`.
- Copied E2E PDF bytes into a guaranteed `ArrayBuffer` before creating the upload `Blob`.
- Expanded the Step 12.8 source contract from 14 to 21 architecture/corrective checks.

No frontend source, tool registration, PDF engine implementation, Sign PDF behaviour, design, route, zoom rule, or `allowedDevOrigins` value changed.

The complete corrected Windows gate must still be rerun. Request signatures remains disabled and is not Working.

## Windows Corrective Package 2 - 25 July 2026

The second Windows validation run confirmed that the clean root install, root TypeScript boundary, Page Numbers path correction, source contracts, and production build now work. It also exposed a Node.js 24 test-runner-only failure:

- `test-sign-engine.mjs` launched `npx.cmd` through `execFileSync`, which failed before the compiler started with `spawnSync npx.cmd EINVAL`.
- The later self-signing test still resolved TypeScript before creating its ESM-compatible `require`, which would have produced the next failure after the Sign test was repaired.

Corrective changes:

- Resolve the installed compiler with `createRequire(import.meta.url)` and `require.resolve("typescript/lib/tsc.js")`.
- Launch that JavaScript compiler through `process.execPath` instead of spawning a Windows `.cmd` shim.
- Apply the same compiler-launch pattern to both Sign PDF engine tests.
- Expand the Step 12.8 architecture/corrective source contract from 21 to 23 checks.

The second Windows run also established these real root results before this patch: `npm ci` passed, ESLint completed with two pre-existing warnings and no errors, root TypeScript passed, all 14 source-contract files passed, Crop/Page Numbers/Rotate tests passed, and the Next.js production build completed. The remaining PDF-engine suite and HTTP/manual/backend gates must be rerun with Corrective Package 2.

No frontend file, PDF engine implementation, route, design rule, lockfile, `allowedDevOrigins` value, or Request signatures product claim changed.

## Preserved

- All 32 tool cards and root routes.
- All 11 real working PDF engines.
- The current NovaPDF interface and wording.
- The right-side tool panels, preview behavior, file transfer, Start over, and home reset.
- The v0.4.10 50–200% zoom behavior.
- The v0.12.7 Sign PDF one-way active-page scroll controller, lazy active-neighborhood previews, safety padding, content-aware minimum sizes, rotation-aware resizing, inline editing, and fitted input export.
- `allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]`.
- Public npm registry URLs in the existing root lock.

## Product status

Request signatures remains visible but disabled. It is not marked Working. The Step 12.8 code is an API-first backend preview pending the complete Windows and production-provider gate.

## Validation status

Passed in the packaging container:

- Source inspection.
- All 14 dependency-free source contracts.
- 33-route manifest source check.
- Step 12.8 32-check architecture/corrective contract.
- Corrected Step 12.1 required-field contract.
- Backend TypeScript syntax/no-check compile.

Blocked by infrastructure:

- Root and backend dependency installation.
- npm audit, ESLint, semantic TypeScript, production build, HTTP route checks, all 10 dependency-backed PDF/interaction tests, migrations, SMTP workflow, private storage workflow, and final end-to-end test.

The direct public npm registry failed DNS resolution, and the container npm gateway returned HTTP 503. No `npm audit fix --force` was used.

## Next.js and Sharp investigation

The checked root lock contains Next.js 16.2.10 and optional Sharp 0.34.5. Sharp 0.34.5 is the current locked optional image dependency. Next.js published a July 2026 security patch at 16.2.11. Because the container could not install dependencies and run regressions, v0.12.8 does not make an untested package or lock change. The first Windows corrective gate must update Next.js and `eslint-config-next` together, then rerun all 33 routes, all eleven engines, and the full Sign PDF manual checklist.

## Windows Corrective Package 3 - 25 July 2026

The third Windows validation run completed the entire root gate and all 33 route checks. It also completed the first backend install, backend clean `npm ci`, and all seven backend unit tests. Docker Desktop's Linux engine was not running, so migration/runtime/E2E could not start. Strict backend lint and semantic TypeScript identified real corrective work.

Corrective changes:

- use TypeORM `IsNull()` when revoking an active nullable session;
- load `backend\.env` directly in the standalone TypeORM data source;
- add `@types/pg` and typed E2E API/database response models;
- mark Node test registration explicitly `void`;
- remove the unnecessary renderer assertion and async-without-await test helper;
- validate email-provider results before reading `messageId`;
- disable Nodemailer file/URL content access;
- update Nodemailer to 9.0.3 and `@types/nodemailer` to 8.0.1;
- pin `@nestjs/swagger` to 11.4.6 and override `js-yaml` to patched 5.2.2;
- expand the Step 12.8 architecture/corrective source contract to 31 checks.

No frontend source, PDF engine, route, design, zoom rule, `allowedDevOrigins`, root lockfile, or Request signatures product claim changed. Request signatures remains disabled and not Working.


## Windows Corrective Package 5 - 25 July 2026

The Step 12.8 migration completed successfully on Windows, creating and committing every enum, table, index, constraint, and append-only audit trigger. The first API development start then failed before Nest bootstrap because the `tsx` transpiler does not emit TypeScript decorator metadata; TypeORM first reported `AuthSessionEntity.tokenHash`, and Nest constructor injection would have had the same metadata dependency.

Corrective changes:

- replace `tsx watch` with Node watch mode plus `ts-node/register` for API and worker development;
- run TypeScript unit and E2E tests through the same metadata-capable compiler path;
- remove the unused backend `tsx` dependency;
- explicitly type every entity primitive column that previously relied on reflected metadata, including token hash, document names/keys/checksum, recipient name, required boolean, request title/version, audit event type, and user display/password fields;
- add a runtime metadata regression test covering Nest constructor `design:paramtypes` and all eight TypeORM entities;
- expand the Step 12.8 architecture/corrective source contract from 32 to 36 checks.

No new database migration is added because these entity types match the migration already committed on Windows. Frontend source, all routes and engines, root lock, design, Sign PDF behavior, and the disabled Request signatures product claim remain unchanged.

## Windows Corrective Package 4 - 25 July 2026

The fourth Windows validation run proved that Docker Desktop's Linux engine and all local infrastructure services were healthy. Backend lint, semantic TypeScript, build, and all seven unit tests passed. TypeORM reached PostgreSQL but rejected entity metadata before applying the migration because nullable string unions without explicit database types are reflected as JavaScript `Object`; the first reported column was `DocumentEntity.completedStorageKey`.

Corrective changes:

- declare `type: "varchar"` for every nullable bounded string column in the document, recipient, signature-field, audit-event, and email-delivery entities;
- match each explicit entity type to the existing PostgreSQL migration schema;
- add a source contract that covers all eight nullable varchar columns;
- expand the Step 12.8 architecture/corrective source contract from 31 to 32 checks.

The failed migration had only executed PostgreSQL version/schema discovery queries; the migration itself had not begun, so no partial Step 12.8 tables were created by that attempt. The Windows log also showed a changing npm audit result: the first backend install reported zero vulnerabilities, while the subsequent clean install/audit reported seven high-severity `brace-expansion` dependency-chain findings. No forced audit fix or untested major ESLint/TypeORM change is included. Corrective Package 4 requires a fresh public-registry lock/install and exact audit capture.

No frontend source, PDF engine, route, design, zoom rule, `allowedDevOrigins`, root lockfile, or Request signatures product claim changed. Request signatures remains disabled and not Working.
