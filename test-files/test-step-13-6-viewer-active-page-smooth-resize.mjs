import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const controls = read("src/components/workspace-zoom-controls.tsx");
const geometry = read("src/lib/workspace-interaction-guides.ts");
const edit = read("src/components/edit-pdf-workspace.tsx");
const sign = read("src/components/sign-pdf-workspace.tsx");
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

assert.ok(["0.13.6", "0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(pkg.version)); checks += 1;
has(controls, 'import { createPortal } from "react-dom"', "shared viewer must render through a body portal");
has(controls, 'return createPortal(controls, document.body)', "viewer must escape transformed and scrollable toolbars");
has(controls, '"continuous" | "single" | "two" | "three"', "viewer must expose continuous, single, two-page, and three-page modes");
has(controls, 'label: "Two-page view"', "two-page view must be visible in US English");
has(controls, 'label: "Three-page view"', "three-page view must be visible in US English");
has(controls, 'className="workspace-view-menu"', "viewer must expose a compact view menu");

has(css, 'html[data-novapdf-page-view="two"]', "two-page layout CSS must exist");
has(css, 'html[data-novapdf-page-view="three"]', "three-page layout CSS must exist");
has(css, '.workspace-view-menu-popover', "page view menu must be styled");
has(css, 'width: max-content', "bottom controls must retain the usable Edit PDF toolbar shape");
has(css, '.sign-output-panel {\n  position: static', "Sign PDF output controls must scroll with the panel");

has(geometry, 'const requestedScale = denominator > 0', "aspect resize must use continuous vector projection");
has(geometry, 'nextWidth * startWidth + nextHeight * startHeight', "aspect resize must avoid dominant-axis snapping");
lacks(geometry, /Math\.abs\(widthScale - 1\).*Math\.abs\(heightScale - 1\)/s, "dominant-axis aspect snapping must be removed");

has(edit, 'const pendingInsertPageRef = useRef<number | null>(null)', "Edit PDF must retain the selected insertion page while choosing an image");
has(edit, 'onPointerDownCapture={() => activatePage(page.pageNumber)}', "clicking a page must activate it before adding an object");
has(edit, 'aria-current={page.pageNumber === activePageNumber ? "page" : undefined}', "active page must be exposed to accessibility and styling");
has(edit, 'const targetPageNumber = pendingInsertPageRef.current ?? activePageNumber', "new images must appear on the chosen page");
has(edit, 'const objectsRef = useRef<EditPdfObject[]>([])', "Edit PDF pointer movement must read live objects without re-subscribing");
has(edit, '}, [clearResult, snapEnabled]);', "pointer listeners must remain stable while an object moves or resizes");
has(edit, 'const visualGuides = snapEnabled ? snapNormalizedBox(nextBox, resizePeers) : null', "resize guides must be visual-only");
has(edit, 'box: nextBox', "Edit PDF must keep the unsnapped resize box");
has(edit, 'r={13} fill="transparent"', "small highlights must have an easier resize hit target");

has(sign, 'const visualGuides = snapEnabled ? snapNormalizedBox(resizeBox, resizePeers) : null', "Sign PDF resize guides must not force object dimensions");
has(sign, 'box: resizeBox', "Sign PDF must keep the smooth unsnapped resize box");
has(crop, 'if (drag.kind === "move") {', "Crop PDF must apply snapping only while moving");
has(crop, 'guideX = snapped.guideX', "Crop PDF resize must retain visual alignment feedback");

assert.ok(runner.includes("NovaPDF v0.13.6") || runner.includes("NovaPDF v0.13.7") || runner.includes("NovaPDF v0.14.0") || runner.includes("NovaPDF v0.14.1") || runner.includes("NovaPDF v0.14.2") || runner.includes("NovaPDF v0.14.3") || runner.includes("NovaPDF v0.14.4") || runner.includes("NovaPDF v0.14.5") || runner.includes("NovaPDF v0.14.6") || (runner.includes("NovaPDF v0.14.7") || runner.includes("NovaPDF v0.14.8") || (runner.includes("NovaPDF v0.14.9") || (runner.includes("NovaPDF v0.14.10") || runner.includes("NovaPDF v0.14.16")))), "one-click runner must identify v0.13.6 or its corrective successor"); checks += 1;
assert.ok(runner.includes("WINDOWS_VALIDATION_STEP_13_6.md") || runner.includes("WINDOWS_VALIDATION_STEP_13_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_0.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_1.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_2.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_3.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_4.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_5.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_6.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_7.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_8.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_9.md") || (runner.includes("WINDOWS_VALIDATION_STEP_14_10.md") || runner.includes("WINDOWS_VALIDATION_STEP_14_16.md")))), "one-click runner must open the v0.13.6 or successor checklist"); checks += 1;
lacks(runner, /^\s*(?:call\s+)?docker\s+compose\s+down\s+-v(?:\s|$)/im, "runner must preserve Docker volumes");
lacks(runner, /^\s*(?:call\s+)?npm(?:\.cmd)?\s+audit\s+fix(?:\s|$)/im, "runner must not apply automatic audit fixes");

console.log(`Step 13.6 unified viewer, active-page targeting, smooth resize, and Sign panel contract passed (${checks} checks).`);
