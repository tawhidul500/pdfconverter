import { spawnSync } from "node:child_process";

const tests = [
  "test-files/test-crop-engine.mjs",
  "test-files/test-page-numbers-engine.mjs",
  "test-files/test-rotate-engine.mjs",
  "test-files/test-rotate-targeting.mjs",
  "test-files/test-sign-engine.mjs",
  "test-files/test-step-11-2-crop-refinement.mjs",
  "test-files/test-step-11-4-crop-watermark-corrections.mjs",
  "test-files/test-step-11-5-crop-watermark-scope.mjs",
  "test-files/test-step-12-1-self-signing.mjs",
  "test-files/test-watermark-engine.mjs",
  "test-files/test-edit-pdf-engine.mjs",
  "test-files/test-pdf-to-word-engine.mjs",
];

for (const test of tests) {
  console.log(`\n== ${test} ==`);
  const result = spawnSync(process.execPath, [test], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`\nAll ${tests.length} dependency-backed PDF-engine tests passed.`);
