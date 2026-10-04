import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const sign = read("src/components/sign-pdf-workspace.tsx");
const edit = read("src/components/edit-pdf-workspace.tsx");
const engine = read("src/lib/sign-pdf.ts");
const css = read("src/app/globals.css");
const packageJson = JSON.parse(read("package.json"));
const signScrollIndex = sign.indexOf('className="sign-document-scroll"');
const signPagebarIndex = sign.indexOf('className="sign-document-pagebar sign-document-pagebar-bottom"');
const editScrollIndex = edit.indexOf('className={`edit-document-scroll');
const editPagebarIndex = edit.indexOf('className="sign-document-pagebar sign-document-pagebar-bottom"');

const checks = [
  ["all Sign PDF objects can shrink to a practical one-pixel floor", /function minimumObjectSize[\s\S]*width: Math\.max\(0\.001, 1 \/ Math\.max\(1, pageWidth\)\)[\s\S]*height: Math\.max\(0\.001, 1 \/ Math\.max\(1, pageHeight\)\)/.test(sign)],
  ["image export no longer restores a large minimum", /Math\.max\(1, clampNumber\(object\.width, 0\.001, 0\.95\) \* visualWidth\)/.test(engine) && /Math\.max\(1, clampNumber\(object\.height, 0\.001, 0\.95\) \* visualHeight\)/.test(engine)],
  ["input export no longer restores a large minimum", /object\.type === "input"[\s\S]*Math\.max\(1, clampNumber\(object\.width, 0\.001, 0\.92\) \* visualWidth\)[\s\S]*Math\.max\(1, clampNumber\(object\.height, 0\.001, 0\.25\) \* visualHeight\)/.test(engine)],
  ["text can scale below the former seven-point floor", sign.includes('min={1} max={96}') && engine.includes('clampNumber(object.fontSize ?? 18, 1, 96)')],
  ["every selected field has an Edit action", /openObjectEditor\(selectedOnPage\)[\s\S]*title=\{`Edit \$\{typeLabel\(selectedOnPage\.type\)\.toLowerCase\(\)\}`\}/.test(sign)],
  ["every selected field except company stamp has a US-English color action", /selectedOnPage\.type !== "stamp" && <button[\s\S]*openObjectColorEditor\(selectedOnPage\)[\s\S]*title="Change color"/.test(sign) && sign.includes('aria-label="Signature color"') && sign.includes('aria-label="Initials color"') && edit.includes('>Text color<') && edit.includes('>Stroke color<')],
  ["every right-side field row has an Edit action", sign.includes('onClick={() => openPaletteEditor(type)}') && sign.includes('aria-label={`Edit ${label}`}')],
  ["company stamp still has Edit without color", sign.includes('selectedOnPage.type !== "stamp" ? "has-colour" : "image-actions"') && css.includes('.sign-object-toolbar-large.image-actions { grid-template-columns: repeat(4, 2.55rem); }')],
  ["inline field editing has a Done action", sign.includes('className="sign-inline-editor-footer"') && sign.includes('>Done</button>')],
  ["old Text or input value control is removed", !sign.includes('Text or input value')],
  ["output filename control is clearly labelled", sign.includes('<strong>Output file name</strong>') && sign.includes('Rename the signed copy before download.') && sign.includes('aria-label="Output file name"') && sign.includes('<span>.pdf</span>')],
  ["required red star is not rendered on fields", !sign.includes('className="sign-required-marker"') && !sign.includes('> *</text>')],
  ["saved signer name and initials restore locally", sign.includes('const SIGNER_PROFILE_KEY = "novapdf-signer-profile-v1"') && sign.includes('window.localStorage.getItem(SIGNER_PROFILE_KEY)') && sign.includes('window.localStorage.setItem(SIGNER_PROFILE_KEY')],
  ["typed signature box starts with the restored name", sign.includes('setTypedSignature(name.slice(0, 80))')],
  ["typed signatures use measured glyph bounds", sign.includes('actualBoundingBoxLeft') && sign.includes('actualBoundingBoxRight') && sign.includes('actualBoundingBoxAscent') && sign.includes('actualBoundingBoxDescent')],
  ["typed signatures retain transparent edge padding", sign.includes('return trimTransparentCanvas(canvas)') && /const paddingX = Math\.max\(36/.test(sign)],
  ["Sign PDF page count is rendered after its scrolling document", signScrollIndex >= 0 && signPagebarIndex > signScrollIndex],
  ["Edit PDF page count is rendered after its scrolling document", editScrollIndex >= 0 && editPagebarIndex > editScrollIndex],
  ["page count is fixed to the workspace bottom", /\.sign-document-pagebar \{[\s\S]*position: absolute;[\s\S]*bottom: 1rem;/.test(css) && css.includes('.sign-document-pagebar-bottom')],
  ["US English date formatting is explicit", sign.includes('toLocaleDateString("en-US"')],
  ["Request signatures remains disabled", /<button type="button" disabled>[\s\S]*<strong>Several people<\/strong>/.test(sign)],
  ["corrective release version", ["0.13.1", "0.13.2", "0.13.3", "0.13.4", "0.13.5", "0.13.6", "0.13.7", "0.14.0", "0.14.1", "0.14.2", "0.14.3", "0.14.4", "0.14.5", "0.14.6", "0.14.7", "0.14.8", "0.14.9", "0.14.10", "0.14.16"].includes(packageJson.version)],
];

for (const [name, passed] of checks) assert.ok(passed, `Step 13.1 Sign PDF correction failed: ${name}`);
console.log(`Step 13.1 Sign PDF corrections contract passed (${checks.length} checks).`);
