import fs from 'node:fs';

const component = fs.readFileSync('src/components/sign-pdf-workspace.tsx', 'utf8');
const engine = fs.readFileSync('src/lib/sign-pdf.ts', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

const requirements = [
  ['post-upload workflow choice', component.includes('Who will sign this document?') && component.includes('Several people') && component.includes('setupModal')],
  ['saved signatures', component.includes('SAVED_SIGNATURES_KEY') && component.includes('saveActiveAsset') && component.includes('restoreSavedAsset')],
  ['browser-restored signer details', component.includes('useState("")') && component.includes('SIGNER_PROFILE_KEY') && component.includes('window.localStorage.getItem(SIGNER_PROFILE_KEY)') && component.includes('window.localStorage.setItem(SIGNER_PROFILE_KEY')],
  ['company stamp', component.includes('addStamp') && component.includes('Upload company stamp') && engine.includes('object.type === "stamp"')],
  ['input field', component.includes('addTextObject') && component.includes('"input"') && engine.includes('object.type === "input"')],
  ['checkbox field', component.includes('addCheckboxObject') && engine.includes('object.type === "checkbox"')],
  ['required control', component.includes(' /> Required</label>') && component.includes('incompleteRequired')],
  ['snapping guides', component.includes('snapEnabled') && component.includes('alignmentGuides') && css.includes('.sign-alignment-guide')],
  ['local-only disclosure', component.includes('PDF signing stays in this browser')],
];

for (const [label, passed] of requirements) {
  if (!passed) throw new Error(`Missing self-signing feature: ${label}`);
}
console.log(`Complete self-signing contract passed (${requirements.length} checks).`);
