import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../src/components/sign-pdf-workspace.tsx", import.meta.url), "utf8");
const engine = await readFile(new URL("../src/lib/sign-pdf.ts", import.meta.url), "utf8");
const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

assert.match(component, /\{loaded && \(\s*<div className="workspace-generic-zoom sign-document-zoom">/, "zoom controls must only render after a PDF loads");
assert.match(component, /const \[signerName, setSignerName\] = useState\(""\)/, "full name must start empty");
assert.match(component, /const \[signerInitials, setSignerInitials\] = useState\(""\)/, "initials must start empty");
assert.match(component, /SIGNER_PROFILE_KEY/, "signer identity must have a browser-local profile key");
assert.match(component, /window\.localStorage\.getItem\(SIGNER_PROFILE_KEY\)/, "saved signer identity must restore from browser storage");
assert.match(component, /window\.localStorage\.setItem\(SIGNER_PROFILE_KEY/, "signer identity must persist in browser storage");
assert.match(component, /words\.slice\(0, 2\)/, "initials must use the first two name words");
assert.match(component, /initialsSourceMode/, "initials need a source-mode state");
assert.match(component, /aria-label="Initials source"/, "initials need Type, Draw, and Upload controls");
assert.match(component, /createDrawnAsset\("initials"\)/, "drawn initials must be supported");
assert.match(component, /setPendingAssetKind\("initials"\)/, "uploaded initials must be supported");
assert.match(component, /loaded\.pages\.map\(\(page\) =>/, "all PDF pages must render in the main canvas");
assert.match(component, /documentScrollRef/, "main document scrolling must be tracked");
assert.match(component, /pageStripScrollRef/, "thumbnail scrolling must be tracked");
assert.match(component, /handleDocumentScroll/, "document scroll must synchronize thumbnails");
assert.doesNotMatch(component, /onScroll=\{handlePageStripScroll\}/, "thumbnail scrolling must not fight the main document scroll controller");
assert.match(component, /scrollToDocumentPage/, "thumbnail clicks must navigate the main document directly");
assert.match(component, /event\.ctrlKey/, "Ctrl+mouse-wheel zoom must be supported");
assert.match(component, /offsetX: pointerX - object\.x/, "dragging must preserve the pointer offset");
assert.match(component, /startCenterX: object\.x/, "resizing must preserve the object centre");
assert.match(component, /inverseRotatePoint/, "resizing must account for object rotation");
assert.match(component, /type === "text"\s*\? \(customText\.trim\(\) \|\| "Text"\)/, "dragged text fields must appear without pre-entered text");
assert.match(component, /type === "input" && !\(object\.text/, "empty input fields must show a visible placeholder");
assert.match(component, /title=\{`Edit \${typeLabel\(selectedOnPage\.type\)\.toLowerCase\(\)}`\}/, "every selected field needs a contextual edit action");
assert.match(component, /title="Duplicate"/, "all selected fields need duplicate");
assert.match(component, /title="Delete"/, "all selected fields need delete");
assert.match(engine, /if \(object\.type === "input"\)[\s\S]*page\.drawRectangle[\s\S]*if \(!text\) continue/, "empty input boxes must remain visible in exported PDFs");
assert.match(css, /\.sign-document-pages/, "continuous page layout CSS is required");
assert.match(css, /\.sign-document-paper \{[\s\S]*background: transparent;/, "the extra white preview wrapper must be removed");
assert.match(css, /\.sign-object-toolbar-large\.has-colour/, "field toolbar must accommodate edit and color actions");

console.log("Step 12.6 Sign PDF editor refinement contract passed.");
