import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { PDFDocument } from 'pdf-lib';

const require = createRequire(import.meta.url);
const typescriptCompiler = require.resolve('typescript/lib/tsc.js');
const buildDir = path.resolve('.sign-engine-test-build');
await fs.rm(buildDir, { recursive: true, force: true });
execFileSync(process.execPath, [
  typescriptCompiler,
  'src/lib/sign-pdf.ts',
  'src/lib/watermark-pdf.ts',
  '--outDir', buildDir,
  '--module', 'commonjs',
  '--target', 'es2020',
  '--esModuleInterop',
  '--skipLibCheck',
  '--moduleResolution', 'node',
], { stdio: 'inherit' });

const { applyPdfSignatures } = require(path.join(buildDir, 'sign-pdf.js'));

try {
  const source = await fs.readFile('test-files/sample-six-pages.pdf');
  const signature = await fs.readFile('test-files/sample-image.png');
  const result = await applyPdfSignatures(source, {
    assets: [{ id: 'sig-1', bytes: signature, imageType: 'png' }],
    objects: [
      { id: 'o1', pageNumber: 1, type: 'signature', x: 0.52, y: 0.72, width: 0.34, height: 0.12, rotation: -5, assetId: 'sig-1' },
      { id: 'o2', pageNumber: 2, type: 'name', x: 0.5, y: 0.55, width: 0.28, height: 0.06, rotation: 0, text: 'NovaPDF Signer', color: '#0f766e', fontSize: 22, textStyle: 'bold' },
      { id: 'o3', pageNumber: 2, type: 'date', x: 0.5, y: 0.64, width: 0.22, height: 0.05, rotation: 0, text: 'Jul 21, 2026', color: '#111827', fontSize: 14, textStyle: 'regular' },
      { id: 'o4', pageNumber: 6, type: 'initials', x: 0.84, y: 0.9, width: 0.1, height: 0.05, rotation: 12, text: 'NP', color: '#1d4ed8', fontSize: 18, textStyle: 'bold' },
    ],
  });
  if (result.pageCount !== 6) throw new Error(`Expected 6 pages, got ${result.pageCount}`);
  if (result.signedPageCount !== 3) throw new Error(`Expected 3 signed pages, got ${result.signedPageCount}`);
  if (result.objectCount !== 4) throw new Error(`Expected 4 objects, got ${result.objectCount}`);
  const output = 'test-files/sample-sign-output.pdf';
  await fs.writeFile(output, result.bytes);
  const document = await PDFDocument.load(result.bytes);
  if (document.getPageCount() !== 6) throw new Error('Output page count changed.');
  console.log(`Sign PDF engine tests passed. Output: ${output}`);
} finally {
  await fs.rm(buildDir, { recursive: true, force: true });
}
