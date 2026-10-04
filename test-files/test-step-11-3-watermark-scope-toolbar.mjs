import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const watermark = await readFile(new URL("../src/components/watermark-pdf-workspace.tsx", import.meta.url), "utf8");
const zoom = await readFile(new URL("../src/components/workspace-zoom-controls.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

assert.match(watermark, /function objectForScopeOnPage/, "Watermark must resolve a scope-compatible object on the active page.");
assert.match(watermark, /function setEditingScope\(scope: EditScope/, "Watermark must synchronize object selection with the selected scope.");
assert.match(watermark, /editScope === "all" && object\.scope === "all"/, "All-pages scope must visually select the linked object on every affected page.");
assert.match(watermark, /scope: "page"/, "This-page scope must support independent page objects.");
assert.match(watermark, /pendingAddScopeRef/, "Image selection must remember whether it belongs to all pages or one page.");
assert.match(watermark, /pendingAddScopeRef\.current = editScopeRef\.current/, "Image picker actions must use the active edit scope.");
assert.match(watermark, /aria-label="Edit watermark text"/, "Focused text watermark controls must include an Edit text action.");
assert.match(watermark, /watermarkTextRef\.current\?\.focus/, "Edit text must focus the actual watermark text field.");
assert.match(watermark, /onUndo=\{undoObjects\}/, "Watermark Undo must be located in the shared zoom/history controls.");
assert.match(watermark, /onRedo=\{redoObjects\}/, "Watermark Redo must be located in the shared zoom/history controls.");
assert.doesNotMatch(watermark, /className="watermark-history-actions"/, "Watermark must not duplicate Undo/Redo in the settings panel.");

assert.match(zoom, /Undo2/, "Shared zoom controls must contain an Undo icon.");
assert.match(zoom, /Redo2/, "Shared zoom controls must contain a Redo icon.");
assert.match(zoom, /canUndo/, "Shared controls must expose Undo availability.");
assert.match(zoom, /canRedo/, "Shared controls must expose Redo availability.");
assert.match(styles, /\.workspace-zoom-divider/, "Shared history and zoom controls must have a visual divider.");
assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/, "Watermark action controls must remain usable after adding Edit text.");

for (const filename of [
  "merge-pdf-workspace.tsx",
  "jpg-to-pdf-workspace.tsx",
  "organize-pdf-workspace.tsx",
  "rotate-pdf-workspace.tsx",
  "crop-pdf-workspace.tsx",
  "page-numbers-pdf-workspace.tsx",
]) {
  const source = await readFile(new URL(`../src/components/${filename}`, import.meta.url), "utf8");
  assert.match(source, /canUndo=\{history\.canUndo\}/, `${filename} must place Undo beside zoom.`);
  assert.match(source, /canRedo=\{history\.canRedo\}/, `${filename} must place Redo beside zoom.`);
  assert.doesNotMatch(source, /className="watermark-history-actions/, `${filename} must not keep a duplicate sidebar history panel.`);
}

console.log("Step 11.3 watermark scope, Edit text, and shared history toolbar contracts passed.");
