import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/sign-pdf-workspace.tsx', import.meta.url), 'utf8');

const styleIds = ['flowing', 'signature', 'classic', 'casual', 'elegant', 'formal', 'clean', 'bold'];
for (const id of styleIds) {
  assert.match(source, new RegExp(`id: "${id}"`), `missing ${id} signature style`);
}
assert.match(source, /TYPED_SIGNATURE_STYLES\.map\(\(style\) => \(/, 'signature list must use complete style catalog');
assert.match(source, /sign-initial-style-list sign-style-scroll/, 'initials list must use the same scrollable style catalog');
assert.match(source, /setSignerInitials\(deriveInitials\(nextName\)\)/, 'full name must auto-generate initials');
assert.match(source, /setInitialsManuallyEdited\(true\)/, 'manual initials override must be preserved');
assert.match(source, /signatureStyle\(signatureTypedStyle\)/, 'typed signature output must use selected style');
assert.match(source, /signatureStyleToPdfTextStyle\(initialsTypedStyle\)/, 'initials fields must use selected style mapping');
assert.match(source, /preparedSignatureId = await createTypedSignatureAsset\(\)/, 'Apply must create the selected typed signature automatically');

assert(!source.includes('Signature name<input'), 'Duplicate Signature name input must be removed');
assert(!source.includes('signatureTextManuallyEdited'), 'Removed duplicate signature-name editing state must not remain');

console.log('Step 12.3 signature style, automatic initials, and duplicate-control removal contract passed.');
