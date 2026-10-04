import fs from 'node:fs';

const component = fs.readFileSync('src/components/sign-pdf-workspace.tsx', 'utf8');
const engine = fs.readFileSync('src/lib/sign-pdf.ts', 'utf8');
const home = fs.readFileSync('src/components/home-page.tsx', 'utf8');
const tools = fs.readFileSync('src/data/tools.ts', 'utf8');

const requirements = [
  ['draw signature canvas', component.includes('sign-draw-canvas') && component.includes('createDrawnAsset')],
  ['typed signature', component.includes('createTypedSignatureAsset') && component.includes('Typed signature styles') && component.includes('Signature color')],
  ['uploaded signature', component.includes('prepareUploadedSignature') && component.includes('Remove a plain white background')],
  ['signature fields', ['signature','initials','date','name','text'].every((value) => component.includes(`"${value}"`))],
  ['object controls', component.includes('duplicateObject') && component.includes('deleteObject') && component.includes('rotateObject') && component.includes('beginResize')],
  ['keyboard controls', component.includes('ArrowLeft') && component.includes('event.key.toLowerCase() === "c"') && component.includes('event.key.toLowerCase() === "v"') && component.includes('event.key.toLowerCase() === "d"') && component.includes('event.key.toLowerCase() === "z"')],
  ['real engine', engine.includes('applyPdfSignatures') && engine.includes('page.drawImage') && engine.includes('page.drawText')],
  ['workspace registration', home.includes('SignPdfWorkspace') && home.includes('"sign-pdf"')],
  ['working badge', /slug:\s*"sign-pdf"[\s\S]*?badge:\s*"New"/.test(tools)],
];
for (const [label, passed] of requirements) {
  if (!passed) throw new Error(`Missing Sign PDF contract: ${label}`);
}
console.log(`Sign PDF contract passed (${requirements.length} checks).`);
