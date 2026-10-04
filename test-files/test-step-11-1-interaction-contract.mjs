import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const watermark = await readFile(new URL("../src/components/watermark-pdf-workspace.tsx", import.meta.url), "utf8");
const rotate = await readFile(new URL("../src/components/rotate-pdf-workspace.tsx", import.meta.url), "utf8");
const crop = await readFile(new URL("../src/components/crop-pdf-workspace.tsx", import.meta.url), "utf8");
const organize = await readFile(new URL("../src/components/organize-pdf-workspace.tsx", import.meta.url), "utf8");
const merge = await readFile(new URL("../src/components/merge-pdf-workspace.tsx", import.meta.url), "utf8");
const jpgToPdf = await readFile(new URL("../src/components/jpg-to-pdf-workspace.tsx", import.meta.url), "utf8");
const history = await readFile(new URL("../src/hooks/use-workspace-history.ts", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

assert.match(watermark, /pendingAddPageRef/, "Watermark image/text recovery must remember the intended page.");
assert.match(watermark, /pendingPlacementRef/, "A placement chosen before image upload must be applied after the image is loaded.");
assert.match(watermark, /requestAddWatermark\(pageNumber, editScopeRef\.current\)/, "Every empty thumbnail page must expose page-specific recovery.");
assert.match(watermark, /function selectPlacement\(nextPlacement/, "Placement presets must use an explicit selection handler.");
assert.match(watermark, /pendingPlacementRef\.current = nextPlacement/, "Image-mode preset selection must survive the image picker.");
assert.doesNotMatch(watermark, /disabled=\{!selection\}[\s\S]{0,240}selectPlacement/, "Placement presets must remain clickable when no object is selected.");
assert.match(watermark, /modifier && key === "z"/, "Watermark must support Ctrl+Z undo.");
assert.match(watermark, /modifier && key === "y"/, "Watermark must support Ctrl+Y redo.");
assert.match(watermark, /modifier && key === "c"/, "Watermark must support Ctrl+C copy.");
assert.match(watermark, /modifier && key === "x"/, "Watermark must support Ctrl+X cut.");
assert.match(watermark, /modifier && key === "v"/, "Watermark must support Ctrl+V paste.");
assert.match(watermark, /modifier && key === "d"/, "Watermark must support Ctrl+D duplicate.");
assert.match(watermark, /modifier && key === "s"/, "Watermark must support Ctrl+S processing.");
assert.match(watermark, /modifier && key === "o"/, "Watermark must support Ctrl+O file selection.");
assert.match(watermark, /onUndo=\{undoObjects\}/, "Watermark must expose Undo beside the shared zoom controls.");
assert.match(watermark, /onRedo=\{redoObjects\}/, "Watermark must expose Redo beside the shared zoom controls.");
assert.match(styles, /\.watermark-empty-page-action-grid/, "Grid thumbnails must show a compact recovery button.");
assert.match(history, /function useWorkspaceHistory/, "A shared bounded history hook is required.");
for (const [name, source] of [["Rotate", rotate], ["Crop", crop], ["Organize", organize], ["Merge", merge], ["JPG to PDF", jpgToPdf]]) {
  assert.match(source, /useWorkspaceHistory/, `${name} must use shared undo/redo history.`);
  assert.match(source, /key === "z"/, `${name} must support Ctrl+Z.`);
  assert.match(source, /key === "y"/, `${name} must support Ctrl+Y.`);
}

console.log("Step 11.1 recovery and keyboard interaction contracts passed.");
