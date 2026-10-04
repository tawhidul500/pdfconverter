import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { PDFDocument } from 'pdf-lib';

const require = createRequire(import.meta.url);
const tscCli = require.resolve('typescript/lib/tsc.js');
const buildDir = path.resolve('.sign-self-test-build');
await fs.rm(buildDir, { recursive: true, force: true });
execFileSync(process.execPath, [
  tscCli, 'src/lib/sign-pdf.ts', 'src/lib/watermark-pdf.ts',
  '--outDir', buildDir, '--module', 'commonjs', '--target', 'es2020',
  '--esModuleInterop', '--skipLibCheck', '--moduleResolution', 'node',
], { stdio: 'inherit' });

const { applyPdfSignatures } = require(path.join(buildDir, 'sign-pdf.js'));

try {
  const source = await fs.readFile('test-files/sample-six-pages.pdf');
  const image = await fs.readFile('test-files/sample-image.png');
  const result = await applyPdfSignatures(source, {
    assets: [
      { id: 'sig', bytes: image, imageType: 'png' },
      { id: 'stamp', bytes: image, imageType: 'png' },
    ],
    objects: [
      { id: 's1', pageNumber: 1, type: 'signature', x: 0.5, y: 0.75, width: 0.32, height: 0.11, rotation: 0, assetId: 'sig', required: true },
      { id: 'st1', pageNumber: 2, type: 'stamp', x: 0.75, y: 0.25, width: 0.2, height: 0.12, rotation: -8, assetId: 'stamp' },
      { id: 'i1', pageNumber: 3, type: 'input', x: 0.5, y: 0.45, width: 0.34, height: 0.07, rotation: 0, text: 'Approved for release', color: '#0f766e', fontSize: 16, textStyle: 'bold', required: true },
      { id: 'c1', pageNumber: 4, type: 'checkbox', x: 0.2, y: 0.25, width: 0.04, height: 0.04, rotation: 0, checked: true, color: '#111827', required: true },
    ],
  });
  if (result.pageCount !== 6) throw new Error(`Expected 6 pages, got ${result.pageCount}`);
  if (result.signedPageCount !== 4) throw new Error(`Expected 4 signed pages, got ${result.signedPageCount}`);
  if (result.objectCount !== 4) throw new Error(`Expected 4 objects, got ${result.objectCount}`);
  const output = 'test-files/sample-self-sign-output.pdf';
  await fs.writeFile(output, result.bytes);
  const pdf = await PDFDocument.load(result.bytes);
  if (pdf.getPageCount() !== 6) throw new Error('Page count changed.');
  console.log(`Complete self-signing engine test passed. Output: ${output}`);
} finally {
  await fs.rm(buildDir, { recursive: true, force: true });
}
