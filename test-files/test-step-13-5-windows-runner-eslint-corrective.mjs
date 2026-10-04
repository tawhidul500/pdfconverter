import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const edit = read("src/components/edit-pdf-workspace.tsx");
const zoom = read("src/components/workspace-zoom-controls.tsx");
const split = read("src/components/split-pdf-workspace.tsx");
const sign = read("src/components/sign-pdf-workspace.tsx");
const runner = read("RUN_NOVAPDF_ALL.cmd");

let checks = 0;
function has(source, value, message) { assert.ok(source.includes(value), message); checks += 1; }
function lacks(source, value, message) { assert.ok(!source.includes(value), message); checks += 1; }

assert.ok(["0.13.5", "0.13.6", "0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)); checks += 1;
assert.ok(runner.includes("NovaPDF v0.13.5") || runner.includes("NovaPDF v0.13.6") || runner.includes("NovaPDF v0.13.7") || runner.includes("NovaPDF v0.14.0") || runner.includes("NovaPDF v0.14.1") || runner.includes("NovaPDF v0.14.2") || runner.includes("NovaPDF v0.14.3") || runner.includes("NovaPDF v0.14.4") || runner.includes("NovaPDF v0.14.5") || runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))), "runner must identify the corrective or successor release"); checks += 1;
assert.ok(runner.includes("WINDOWS_VALIDATION_STEP_13_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_6.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_0.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_1.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_2.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_3.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_4.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_6.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_8.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md")))), "runner must open the corrective or successor checklist"); checks += 1;

lacks(edit, 'if (!loaded) setStatus("idle");', "Edit PDF must not synchronously set state in an effect");
has(edit, 'window.requestAnimationFrame(() => setStatus("idle"))', "Edit PDF must defer the workspace activation reset");
lacks(zoom, 'if (currentPage !== undefined) setInternalPage(currentPage);', "shared zoom controls must not synchronously mirror props in an effect");
has(zoom, 'window.requestAnimationFrame(() => setInternalPage(currentPage))', "controlled page synchronization must be deferred");

lacks(sign, "function focusSelectedTextEditor()", "unused Sign PDF text-editor helper must be removed");
has(sign, "function openObjectEditor", "the used Sign PDF editor entry point must remain");

const resetIndex = split.indexOf("function resetFields()");
const loadIndex = split.indexOf("async function loadPdf(file: File)");
const transferIndex = split.indexOf("function receiveTransferredFiles(event: Event)");
const splitIndex = split.indexOf("async function splitPdf()");
const keyboardIndex = split.indexOf("function handleKeyboard(event: KeyboardEvent)");
assert.ok(resetIndex >= 0 && resetIndex < transferIndex, "Split PDF resetFields must be declared before the transfer effect"); checks += 1;
assert.ok(loadIndex >= 0 && loadIndex < transferIndex, "Split PDF loadPdf must be declared before the transfer effect"); checks += 1;
assert.ok(splitIndex >= 0 && splitIndex < keyboardIndex, "Split PDF splitPdf must be declared before the keyboard effect"); checks += 1;
has(split, "void splitPdf()", "Split PDF Ctrl/Cmd+S behavior must remain");
has(split, "void loadPdf(file)", "Split PDF file-transfer loading must remain");

has(runner, "npm.cmd run lint", "one-click runner must retain the root and backend lint gates");
has(runner, "npm.cmd run test:contracts", "one-click runner must retain source contracts");
has(runner, "npm.cmd run test:pdf-engines", "one-click runner must retain PDF-engine tests");
assert.ok(!/^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im.test(runner), "runner must preserve Docker volumes"); checks += 1;
assert.ok(!/^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im.test(runner), "runner must never apply audit fixes automatically"); checks += 1;

console.log(`Step 13.5 Windows runner ESLint corrective contract passed (${checks} checks).`);
