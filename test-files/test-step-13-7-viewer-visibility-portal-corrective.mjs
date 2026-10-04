import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const controls = read("src/components/workspace-zoom-controls.tsx");
const generic = read("src/components/generic-tool-workspace.tsx");
const home = read("src/components/home-page.tsx");
const css = read("src/app/globals.css");
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

assert.ok(["0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)); checks += 1;
has(controls, "active = false", "the shared portal must be opt-in instead of rendering from hidden workspaces");
has(controls, "if (!active || typeof document === \"undefined\") return null", "inactive viewer controls must never create a body portal");
has(controls, "return createPortal(controls, document.body)", "the one active viewer must remain unclipped through the body portal");

has(generic, "isActive,", "generic workspaces must receive explicit route activity");
has(generic, "isActive: boolean", "generic workspace activity must be typed");
has(generic, "active={isActive && files.length > 0}", "generic tools must hide the viewer before an upload and show it only for the active tool with files");
has(home, "isActive={forceWorkspace && activeTool.slug === tool.slug}", "the workspace host must keep hidden generic tools from portaling controls");

has(css, "NovaPDF v0.13.7: one document-ready portal only", "the viewer corrective must be documented in shared CSS");
has(css, "box-shadow: 0 9px 22px rgba(15, 23, 42, 0.2)", "the remaining single viewer must use a restrained shadow");
has(css, "backdrop-filter: none", "the viewer must not create a blurred background spot");
lacks(css, /NovaPDF v0\.13\.7[\s\S]*box-shadow:\s*0\s+16px\s+42px/, "the corrective override must not restore the stacked halo shadow");

assert.ok(runner.includes("NovaPDF v0.13.7") || runner.includes("NovaPDF v0.14.0") || runner.includes("NovaPDF v0.14.1") || runner.includes("NovaPDF v0.14.2") || runner.includes("NovaPDF v0.14.3") || runner.includes("NovaPDF v0.14.4") || runner.includes("NovaPDF v0.14.5") || runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))), "one-click runner must identify the corrective release or its successor"); checks += 1;
assert.ok(runner.includes("WINDOWS_VALIDATION_STEP_13_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_0.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_1.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_2.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_3.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_4.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_6.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_8.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md")))), "one-click runner must open the current checklist"); checks += 1;
lacks(runner, /^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im, "runner must preserve Docker volumes");
lacks(runner, /^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im, "runner must never run automatic npm audit fixes");

console.log(`Step 13.7 document-ready viewer visibility and duplicate portal corrective passed (${checks} checks).`);
