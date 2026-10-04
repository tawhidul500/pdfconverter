import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const geometry = read("src/lib/workspace-interaction-guides.ts");
const overlay = read("src/components/workspace-interaction-overlay.tsx");
const sign = read("src/components/sign-pdf-workspace.tsx");
const edit = read("src/components/edit-pdf-workspace.tsx");
const watermark = read("src/components/watermark-pdf-workspace.tsx");
const crop = read("src/components/crop-pdf-workspace.tsx");
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

assert.ok(["0.13.4", "0.13.5", "0.13.6", "0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)); checks += 1;

has(geometry, "export type InteractionGuideState", "shared interaction state must be reusable across canvas tools");
has(geometry, "snapNormalizedBox", "shared snapping must be implemented once");
has(geometry, "axisAnchors", "snapping must compare edges and centers");
has(geometry, "[0, 0.1, 0.5, 0.9, 1]", "page edge, common-position, and center anchors must exist");
has(geometry, "constrainAspectSize", "shared proportional resize geometry must exist");
has(geometry, "lockAspect", "aspect locking must be modifier-aware");

has(overlay, "WorkspaceInteractionOverlay", "shared SVG guide overlay must exist");
has(overlay, "measurementLabel", "distance values must be formatted visibly");
has(overlay, "leftDistance", "left-page distance must be measured");
has(overlay, "rightDistance", "right-page distance must be measured");
has(overlay, "topDistance", "top-page distance must be measured");
has(overlay, "bottomDistance", "bottom-page distance must be measured");
has(overlay, "workspace-size-label", "live object dimensions must be shown");
has(overlay, "workspace-alignment-guide", "snap alignment lines must be shared");

for (const [name, source] of [
  ["Sign PDF", sign],
  ["Edit PDF", edit],
  ["Watermark PDF", watermark],
  ["Crop PDF", crop],
]) {
  has(source, "WorkspaceInteractionOverlay", `${name} must render the shared ruler/distance overlay`);
  has(source, "InteractionGuideState", `${name} must use shared interaction-guide state`);
  has(source, "snapEnabled", `${name} must expose snapping behavior`);
  has(source, "snapNormalizedBox", `${name} must use shared page/object snapping`);
}

has(sign, "resizeState.lockAspect || event.shiftKey", "Sign PDF Shift+drag must preserve aspect ratio for every field");
has(sign, "constrainAspectSize", "Sign PDF must use shared proportional resize math");
has(sign, 'mode: "resize"', "Sign PDF must show measurements during resize");
has(sign, "Hold Shift while resizing", "Sign PDF must explain the resize modifier in US English");

has(edit, 'start.type === "image" || event.shiftKey', "Edit PDF Shift+drag must preserve aspect ratio for every object");
has(edit, "constrainAspectSize", "Edit PDF must use shared proportional resize math");
has(edit, 'mode: "resize"', "Edit PDF must show measurements during resize");
has(edit, "hold Shift to preserve the current aspect ratio", "Edit PDF must explain the resize modifier");

has(watermark, "offsetX", "Watermark dragging must preserve the initial pointer offset");
has(watermark, "offsetY", "Watermark dragging must preserve the initial pointer offset vertically");
has(watermark, "Snap to page and watermark alignment guides", "Watermark PDF must expose snapping control");
has(watermark, "Dragging shows alignment rulers and live distances", "Watermark PDF must explain live measurements");

has(crop, "preserveDraggedAspect", "Crop PDF must preserve its current ratio from every resize handle");
has(crop, "event.shiftKey", "Crop PDF Shift+drag must activate temporary aspect locking");
has(crop, "Snap the crop area to page alignment guides", "Crop PDF must expose snapping control");
has(crop, "Hold Shift while dragging any resize handle", "Crop PDF must explain the resize modifier");

for (const className of [
  ".workspace-interaction-overlay",
  ".workspace-alignment-guide",
  ".workspace-ruler-line",
  ".workspace-ruler-label-bg",
  ".workspace-size-label-bg",
  ".workspace-interaction-help",
]) {
  has(css, className, `shared stylesheet must include ${className}`);
}

assert.ok(runner.includes("NovaPDF v0.13.4") || runner.includes("NovaPDF v0.13.5") || runner.includes("NovaPDF v0.13.6") || runner.includes("NovaPDF v0.13.7") || runner.includes("NovaPDF v0.14.0") || runner.includes("NovaPDF v0.14.1") || runner.includes("NovaPDF v0.14.2") || runner.includes("NovaPDF v0.14.3") || runner.includes("NovaPDF v0.14.4") || runner.includes("NovaPDF v0.14.5") || runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))), "one-click runner must identify the current release"); checks += 1;
assert.ok(runner.includes("WINDOWS_VALIDATION_STEP_13_4.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_6.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_0.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_1.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_2.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_3.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_4.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_6.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_8.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md")))), "one-click runner must open the current checklist"); checks += 1;
lacks(runner, /^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im, "runner must never delete Docker volumes");
lacks(runner, /^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im, "runner must never apply audit fixes automatically");

console.log(`Step 13.4 shared guides, rulers, distances, and Shift-resize contract passed (${checks} checks).`);
