import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const workspace = read("src/components/edit-pdf-workspace.tsx");
const engine = read("src/lib/edit-pdf.ts");
const home = read("src/components/home-page.tsx");
const tools = read("src/data/tools.ts");
const zoom = read("src/components/workspace-zoom-controls.tsx");
const sign = read("src/components/sign-pdf-workspace.tsx");
const nextConfig = read("next.config.ts");
const npmrc = read(".npmrc");
const backendNpmrc = read("backend/.npmrc");
const packageJson = JSON.parse(read("package.json"));

const checks = [
  ["dedicated workspace exists", workspace.includes("export function EditPdfWorkspace")],
  ["browser-local export engine exists", engine.includes("export async function applyPdfEdits")],
  ["Edit PDF is wired into the home workspace", home.includes('import { EditPdfWorkspace }') && home.includes('<EditPdfWorkspace')],
  ["Edit PDF is a built workspace", /BUILT_WORKSPACE_SLUGS[^;]+"edit-pdf"/s.test(home)],
  ["Edit PDF is no longer Soon", /slug:\s*"edit-pdf"[\s\S]{0,260}badge:\s*"New"/.test(tools)],
  ["all 32 tool routes remain", [...tools.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].length === 32],
  ["text edits", workspace.includes('{ type: "text", label: "Text"') && engine.includes('object.type === "text"')],
  ["image edits", workspace.includes('{ type: "image", label: "Image"') && engine.includes("embedPng") && engine.includes("embedJpg")],
  ["rectangle edits", workspace.includes('{ type: "rectangle", label: "Rectangle"')],
  ["ellipse edits", workspace.includes('{ type: "ellipse", label: "Ellipse"') && engine.includes("drawEllipse")],
  ["line edits", workspace.includes('{ type: "line", label: "Line"') && engine.includes("drawLine")],
  ["highlight edits", workspace.includes('{ type: "highlight", label: "Highlight"')],
  ["underline edits", workspace.includes('{ type: "underline", label: "Underline"')],
  ["freehand drawing", workspace.includes('{ type: "freehand", label: "Draw"') && workspace.includes("DraftStroke") && engine.includes("drawFreehandObject")],
  ["link areas", workspace.includes('{ type: "link", label: "Link"') && engine.includes("addLinkAnnotation")],
  ["move interaction", workspace.includes('mode: "move" | "resize"') && workspace.includes('beginPointer(event, object, "move")')],
  ["resize interaction", workspace.includes('beginPointer(event, object, "resize")')],
  ["rotation controls", workspace.includes('normalizeAngle(selectedObject.rotation + 15)')],
  ["duplicate action", workspace.includes("function duplicateSelected")],
  ["delete action", workspace.includes("function deleteSelected")],
  ["front and back ordering", workspace.includes('moveLayer("front")') && workspace.includes('moveLayer("back")')],
  ["font family controls", workspace.includes("EditPdfFontFamily") && engine.includes("StandardFonts.TimesRoman") && engine.includes("StandardFonts.Courier")],
  ["font size and styles", workspace.includes('patch: "fontSize"') || workspace.includes('"fontSize", 6, 160')],
  ["text alignment", workspace.includes("EditPdfTextAlign") && engine.includes('const align = object.align ?? "left"')],
  ["color controls", workspace.includes('type="color"') && engine.includes("hexToRgbTuple")],
  ["opacity is normalized", workspace.includes("Number(event.target.value) / 100") && engine.includes("clampNumber(object.opacity")],
  ["border and fill controls", workspace.includes("Border / stroke") && workspace.includes("Box fill")],
  ["undo and redo", workspace.includes("useWorkspaceHistory") && workspace.includes("onUndo={undo}") && workspace.includes("onRedo={redo}")],
  ["50 to 200 percent zoom remains", zoom.includes("min = 50") && zoom.includes("max = 200")],
  ["continuous document scroll", workspace.includes("edit-document-scroll") && workspace.includes("onDocumentScroll")],
  ["one-way thumbnail controller", workspace.includes("syncThumbnail(best)") && !workspace.includes("onScroll={syncThumbnail")],
  ["lazy active-neighborhood previews", workspace.includes("activePageNumber - 1") && workspace.includes("activePageNumber + 1") && workspace.includes("renderNeighborhood")],
  ["page navigation", workspace.includes("Previous page") && workspace.includes("Next page")],
  ["file transfer", workspace.includes("transferWorkspaceFiles") && workspace.includes("WORKSPACE_FILE_TRANSFER_EVENT")],
  ["Start over", workspace.includes('aria-label="Start over"') && workspace.includes("function startOver")],
  ["home reset", workspace.includes("onExitWorkspace") && workspace.includes("goHome")],
  ["separate output filename", workspace.includes("edited-document") && (workspace.includes("does not overwrite") || workspace.includes("without overwriting"))],
  ["flattened new PDF", workspace.includes("Added edits are flattened into a new PDF") && engine.includes("document.save")],
  ["Request signatures stays disabled", /sign-workflow-modal-grid[\s\S]*?<button type="button" disabled>/s.test(sign) || sign.includes("<button type=\"button\" disabled>")],
  ["allowed development origins preserved", nextConfig.includes('allowedDevOrigins: ["172.24.48.1", "172.21.32.1"]')],
  ["public root npm registry", npmrc.includes("registry=https://registry.npmjs.org/")],
  ["public backend npm registry", backendNpmrc.includes("registry=https://registry.npmjs.org/")],
  ["release version remains in the Step 13 line", ["0.13.0", "0.13.1", "0.13.2", "0.13.3", "0.13.4", "0.13.5", "0.13.6", "0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(packageJson.version)],
];

for (const [name, passed] of checks) assert.ok(passed, `Step 13 contract failed: ${name}`);
console.log(`Step 13 Edit PDF source contract passed (${checks.length} checks).`);
