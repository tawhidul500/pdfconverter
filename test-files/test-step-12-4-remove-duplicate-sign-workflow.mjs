import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/sign-pdf-workspace.tsx", import.meta.url), "utf8");

assert(!source.includes('className="sign-workflow-choice mb-5"'), "compact pre-upload workflow chooser must be removed");
assert(!source.includes('className="sign-workflow-choice sign-workflow-choice-canvas"'), "workspace pre-upload workflow chooser must be removed");
assert.match(source, /Who will sign this document\?/, "post-upload signing workflow modal must remain");
assert.match(source, /Upload a PDF to sign/, "single upload card must remain in the full workspace");
assert.match(source, /Drop one PDF here/, "compact upload card must remain");

console.log("Step 12.4 duplicate pre-upload workflow chooser removal contract passed.");
