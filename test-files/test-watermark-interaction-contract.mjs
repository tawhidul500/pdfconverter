import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../src/components/watermark-pdf-workspace.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

assert.match(component, /useState<WatermarkSelection \| null>\(null\)/, "Watermark selection must begin unselected so a click visibly selects it.");
assert.match(component, /className="watermark-object-hitbox"/, "A full rectangular click/drag hit target is required.");
assert.match(component, /className="watermark-svg-toolbar"/, "The selected object must render a pure SVG action toolbar.");
assert.doesNotMatch(component, /<foreignObject[\s>]/, "foreignObject controls are intentionally forbidden because they were unreliable in the thumbnail SVG.");
assert.match(component, /aria-label="Rotate watermark 15 degrees"/, "Rotate control is missing.");
assert.match(component, /aria-label="Duplicate watermark"/, "Duplicate control is missing.");
assert.match(component, /aria-label=\{editScope === "page"/, "Delete/remove control is missing.");
assert.match(component, /document\.addEventListener\("keydown", handleDocumentKeyDown, true\)/, "Keyboard movement must be captured at document level after selection.");
assert.match(component, /const step = event\.shiftKey \? 12 : 4;/, "Arrow movement must be visually noticeable in thumbnail previews.");
assert.match(styles, /\.watermark-object-hitbox\s*\{[^}]*pointer-events:\s*all;/s, "Watermark hitbox must accept pointer events.");
assert.match(styles, /\.watermark-svg-object\s*\{[^}]*pointer-events:\s*none;/s, "Visible text/image must not block the larger click hitbox.");
assert.match(styles, /\.watermark-svg-toolbar-button\s*\{[^}]*cursor:\s*pointer;/s, "Toolbar buttons must be interactive.");

console.log("Watermark click-selection, SVG controls, and document-level keyboard interaction contract passed.");
