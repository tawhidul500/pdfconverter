import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const history = read("src/hooks/use-workspace-history.ts");
const controls = read("src/components/workspace-zoom-controls.tsx");
const css = read("src/app/globals.css");
const home = read("src/components/home-page.tsx");
const signWorkspace = read("src/components/sign-pdf-workspace.tsx");
const signEngine = read("src/lib/sign-pdf.ts");
const editWorkspace = read("src/components/edit-pdf-workspace.tsx");
const mergeWorkspace = read("src/components/merge-pdf-workspace.tsx");
const jpgWorkspace = read("src/components/jpg-to-pdf-workspace.tsx");
const compressWorkspace = read("src/components/compress-pdf-workspace.tsx");
const splitWorkspace = read("src/components/split-pdf-workspace.tsx");
const pdfJpgWorkspace = read("src/components/pdf-to-jpg-workspace.tsx");
const runner = read("RUN_NOVAPDF_ALL.cmd");

let checks = 0;
function has(source, value, message) {
  assert.ok(source.includes(value), message);
  checks += 1;
}
function lacks(source, pattern, message) {
  assert.ok(!pattern.test(source), message);
  checks += 1;
}

assert.ok(["0.13.3", "0.13.4", "0.13.5", "0.13.6", "0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)); checks += 1;

has(history, "pastRef.current.push(clone(current))", "history must retain every session checkpoint");
has(history, "const previous = pastRef.current.pop()", "history must undo to the first checkpoint");
has(history, "futureRef.current.push(clone(current))", "history must preserve redo states");
has(history, "const next = futureRef.current.pop()", "history must restore redo states");
lacks(history, /\.slice\(-?\s*legacyLimit|\.shift\(\)/, "history must not truncate early checkpoints");

has(controls, 'className="workspace-bottom-controls"', "viewer controls must use a fixed bottom wrapper");
has(controls, 'className="workspace-viewer-controls"', "viewer controls must expose the compact viewer bar");
has(controls, 'className="workspace-page-select"', "viewer controls must include page selection");
has(controls, 'className="workspace-zoom-select"', "viewer controls must include a zoom percentage menu");
has(controls, "WorkspacePageViewMode", "viewer controls must support page-view modes");
has(controls, 'event.key === "PageUp"', "Page Up keyboard navigation must work");
has(controls, 'event.key === "PageDown"', "Page Down keyboard navigation must work");
has(controls, 'event.key === "Home"', "Ctrl/Cmd+Home must navigate to the first page");
has(controls, 'event.key === "End"', "Ctrl/Cmd+End must navigate to the last page");
has(controls, "IntersectionObserver", "uncontrolled workspaces must update the current page while scrolling");
has(css, "background: rgba(16, 35, 58, 0.97)", "viewer bar must use NovaPDF navy styling");
has(css, 'html[data-novapdf-page-view="single"]', "single-page view CSS must exist");
has(css, 'html[data-novapdf-page-view="grid"]', "grid view CSS must exist");

has(home, 'const DEFAULT_HOME_TOOL_SLUG = "merge-pdf"', "homepage must not default to Edit PDF");
has(home, "const [workspaceNavOpen, setWorkspaceNavOpen] = useState(Boolean(initialToolSlug))", "root page must begin outside a workspace");
has(home, 'setBrowserPath("/")', "workspace Home actions must restore the root route");
has(home, 'if (!forceWorkspace)', "homepage must render an upload card instead of silently opening a built workspace");
has(home, '<Link href="/"', "the NovaPDF header brand must link to the homepage");

for (const property of ["checkboxFillColor", "checkboxStrokeColor", "checkboxCheckColor", "checkboxCheckScale", "checkboxStrokeWidth"]) {
  has(signEngine, property, `Sign PDF engine must persist ${property}`);
  has(signWorkspace, property, `Sign PDF workspace must edit ${property}`);
}
has(signEngine, "const side = Math.min(width, height)", "exported checkbox must maintain a square aspect ratio");
has(signEngine, "const checkScale = clampNumber", "exported tick size must be scalable safely");
has(signWorkspace, 'selectedOnPage.type === "checkbox"', "checkbox-specific controls must be shown for selected checkboxes");
has(signWorkspace, "Check color", "checkbox editor must expose tick color");
has(signWorkspace, "Box background", "checkbox editor must expose box fill color");
has(signWorkspace, "Border color", "checkbox editor must expose box stroke color");
has(signWorkspace, "Border width", "checkbox editor must expose stroke width");
has(signWorkspace, "Check size", "checkbox editor must expose proportional tick size");
has(signWorkspace, 'object.type === "checkbox"', "checkbox objects must use protected resize behavior");

has(editWorkspace, "EditAlignmentGuides", "Edit PDF must define live alignment guides");
has(editWorkspace, "snapEnabled", "Edit PDF must allow snapping to be enabled or disabled");
has(editWorkspace, "snapNormalizedBox", "Edit PDF must snap to shared horizontal and vertical page/object anchors");
has(editWorkspace, "WorkspaceInteractionOverlay", "Edit PDF must render shared alignment guides");
has(editWorkspace, 'beginPointer(event, object, "move")', "Edit PDF objects must drag like Sign PDF fields");
has(editWorkspace, 'beginPointer(event, object, "resize")', "Edit PDF objects must resize from a visible handle");
has(editWorkspace, 'event.key === "Delete" || event.key === "Backspace"', "Edit PDF Delete and Backspace shortcuts must work");
has(editWorkspace, 'event.key.toLowerCase() === "z"', "Edit PDF Ctrl/Cmd+Z must work");
has(editWorkspace, 'event.key.toLowerCase() === "y"', "Edit PDF Ctrl/Cmd+Y must work");
has(editWorkspace, '"ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"', "Edit PDF arrow-key movement must work");
has(editWorkspace, 'event.key.toLowerCase() === "c"', "Edit PDF copy shortcut must work");
has(editWorkspace, 'event.key.toLowerCase() === "v"', "Edit PDF paste shortcut must work");
has(editWorkspace, 'event.key.toLowerCase() === "d"', "Edit PDF duplicate shortcut must work");

for (const [name, source] of [
  ["Merge PDF", mergeWorkspace],
  ["JPG to PDF", jpgWorkspace],
  ["Compress PDF", compressWorkspace],
  ["Split PDF", splitWorkspace],
  ["PDF to JPG", pdfJpgWorkspace],
]) {
  has(source, "useWorkspaceHistory", `${name} must use shared undo/redo history`);
  has(source, 'key === "z"', `${name} must support Ctrl/Cmd+Z`);
  has(source, 'key === "y"', `${name} must support Ctrl/Cmd+Y`);
  has(source, 'key === "o"', `${name} must support Ctrl/Cmd+O`);
  has(source, 'key === "s"', `${name} must support Ctrl/Cmd+S`);
  has(source, "WorkspaceZoomControls", `${name} must use the shared bottom viewer controls`);
}

assert.ok((runner.includes("NovaPDF v0.13.3") || runner.includes("NovaPDF v0.13.4") || runner.includes("NovaPDF v0.13.5") || runner.includes("NovaPDF v0.13.6") || runner.includes("NovaPDF v0.13.7") || runner.includes("NovaPDF v0.14.0") || runner.includes("NovaPDF v0.14.1") || runner.includes("NovaPDF v0.14.2") || runner.includes("NovaPDF v0.14.3") || runner.includes("NovaPDF v0.14.4") || runner.includes("NovaPDF v0.14.5") || runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16"))))), "one-click runner must identify the current version"); checks += 1;
has(runner, 'start "" "http://localhost:3000/"', "one-click runner must open the corrected homepage route");
assert.ok(runner.includes("WINDOWS_VALIDATION_STEP_13_3.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_4.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_6.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_0.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_1.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_2.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_3.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_4.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_6.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_8.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md")))), "one-click runner must open the current validation guide"); checks += 1;
lacks(runner, /^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im, "runner must never delete Docker volumes");
lacks(runner, /^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im, "runner must never apply npm audit fixes automatically");

console.log(`Step 13.3 shared controls, keyboard, checkbox, homepage, and Edit alignment contract passed (${checks} checks).`);
