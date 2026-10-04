import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const watermark = await readFile(new URL("../src/components/watermark-pdf-workspace.tsx", import.meta.url), "utf8");
const rotate = await readFile(new URL("../src/components/rotate-pdf-workspace.tsx", import.meta.url), "utf8");
const rail = await readFile(new URL("../src/components/workspace-tool-rail.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

assert.match(rotate, /\{targeted && <Check/, "Rotate ticks must follow the active target mode.");
assert.match(rotate, /aria-pressed=\{targeted\}/, "Rotate thumbnail accessibility state must match the active targets.");
assert.match(watermark, /focusedPageNumber/, "Watermark focus editing state is required.");
assert.match(watermark, /Back to grid/, "Focused editing needs a clear return-to-grid action.");
assert.match(watermark, /watermark-editor-page-focused/, "The selected page must have a dedicated large editing layout.");
assert.match(watermark, /focusedPageNumber !== pageNumber[\s\S]*setFocusedPageNumber\(pageNumber\)/, "The first grid click must open focused editing instead of starting a tiny drag.");
assert.match(watermark, /Page \{selectedPageNumber\} has no watermark/, "Deleting the active page watermark must expose a page-specific recovery state.");
assert.match(watermark, /!activePageHasWatermark[\s\S]*requestAddWatermark\(selectedPageNumber, editScopeRef\.current\)/, "An empty page must offer an add-watermark action that respects the active scope.");
assert.match(watermark, /pendingAddPageRef[\s\S]*watermarkImageInputRef/, "Image replacement must retain the intended target page.");
assert.match(styles, /\.watermark-editor-page-focused[\s\S]*width:\s*min\(48rem/, "Focused editing must be substantially larger than the grid thumbnail.");
assert.doesNotMatch(rail, /click to keep open/i, "The blocking native category tooltip must be removed.");
assert.doesNotMatch(rail, /title=\{`\$\{category\}/, "Category buttons must not use a blocking native title tooltip.");

console.log("Step 10.1 interaction source contracts passed.");
