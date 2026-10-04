import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const sourceUrl = new URL("../src/lib/rotate-pdf-targeting.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { isRotatePageTargeted } = await import(moduleUrl);

const pages = Array.from({ length: 6 }, (_, pageIndex) => pageIndex);
const selected = new Set([0, 1]);
const targets = (mode, customFrom = 1, customTo = 6) => pages
  .filter((pageIndex) => isRotatePageTargeted({
    mode,
    pageIndex,
    selected: selected.has(pageIndex),
    customFrom,
    customTo,
  }))
  .map((pageIndex) => pageIndex + 1);

assert.deepEqual(targets("selected"), [1, 2]);
assert.deepEqual(targets("all"), [1, 2, 3, 4, 5, 6]);
assert.deepEqual(targets("odd"), [1, 3, 5]);
assert.deepEqual(targets("even"), [2, 4, 6]);
assert.deepEqual(targets("custom", 2, 4), [2, 3, 4]);
console.log("Rotate target-mode selection tests passed.");
