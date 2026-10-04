import fs from 'node:fs';

const component = fs.readFileSync('src/components/sign-pdf-workspace.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

const checks = [
  ['workflow modal', component.includes('Who will sign this document?') && component.includes('Only me') && component.includes('Several people')],
  ['signature details modal', component.includes('Set your signature details') && component.includes('sign-details-modal')],
  ['NovaPDF category rail preserved', component.includes('<WorkspaceToolRail')],
  ['scrollable page strip', component.includes('sign-page-strip-scroll') && css.includes('.sign-page-strip-scroll')],
  ['large document canvas', component.includes('sign-document-paper') && css.includes('.sign-document-paper')],
  ['right signing options', component.includes('Signing options') && component.includes('sign-options-sidebar')],
  ['field palette drag and click', component.includes('beginPaletteDrag') && component.includes('addPaletteFieldAt') && component.includes('draggable')],
  ['simple versus digital choice', component.includes('Simple signature') && component.includes('Digital signature')],
  ['required and optional fields', component.includes('Required fields') && component.includes('Optional fields')],
  ['responsive rules', css.includes('@media (max-width: 760px)')],
];

for (const [label, passed] of checks) {
  if (!passed) throw new Error(`Missing Sign PDF UX requirement: ${label}`);
}
console.log(`Sign PDF UX redesign contract passed (${checks.length} checks).`);
