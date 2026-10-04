import fs from 'node:fs/promises';

const signSource = await fs.readFile('src/components/sign-pdf-workspace.tsx', 'utf8');
const signEngine = await fs.readFile('src/lib/sign-pdf.ts', 'utf8');
const styles = await fs.readFile('src/app/globals.css', 'utf8');
const testSource = await fs.readFile('test-files/test-step-12-1-self-signing.mjs', 'utf8');

const required = [
  ['lossless sign thumbnails', signSource.includes('canvas.toDataURL("image/png")')],
  ['lazy high-resolution main pages', signSource.includes('renderMainPages') && signSource.includes('targetLongEdge')],
  ['no reverse thumbnail scroll controller', !signSource.includes('onScroll={handlePageStripScroll}')],
  ['inline canvas editor', signSource.includes('sign-inline-editor') && styles.includes('.sign-inline-editor')],
  ['sidebar selected panel removed', !signSource.includes('className="sign-options-section sign-selected-panel"')],
  ['text color action', signSource.includes('title="Change color"')],
  ['stable rotation-aware resize', signSource.includes('inverseRotatePoint') && signSource.includes('startRotation')],
  ['content-aware minimum boxes', signSource.includes('minimumObjectSize')],
  ['outer document drop target', signSource.includes('className="sign-document-paper"') && signSource.includes('querySelector("svg")')],
  ['input PDF text fitting', signEngine.includes('fittedFontSize') && signEngine.includes('maxTextWidth')],
  ['signature transparent padding', signSource.includes('contentWidth + padding * 2')],
  ['Windows-safe test runner', testSource.includes("require.resolve('typescript/lib/tsc.js')") && testSource.includes('process.execPath')],
];

for (const [label, passed] of required) {
  if (!passed) throw new Error(`Step 12.7 contract failed: ${label}`);
}

const previewFiles = [
  'merge-pdf-workspace.tsx',
  'split-pdf-workspace.tsx',
  'organize-pdf-workspace.tsx',
  'compress-pdf-workspace.tsx',
  'crop-pdf-workspace.tsx',
  'page-numbers-pdf-workspace.tsx',
  'rotate-pdf-workspace.tsx',
  'watermark-pdf-workspace.tsx',
];
for (const file of previewFiles) {
  const source = await fs.readFile(`src/components/${file}`, 'utf8');
  if (source.includes('canvas.toDataURL("image/jpeg"')) {
    throw new Error(`Step 12.7 contract failed: lossy preview remains in ${file}`);
  }
}

console.log('Step 12.7 Sign PDF core stabilization contract passed.');
