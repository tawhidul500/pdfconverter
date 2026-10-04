import { spawnSync } from "node:child_process";

const tests = [
  "test-files/test-step-10-1-interaction-contract.mjs",
  "test-files/test-step-11-1-interaction-contract.mjs",
  "test-files/test-step-11-3-watermark-scope-toolbar.mjs",
  "test-files/test-step-12-sign-contract.mjs",
  "test-files/test-step-12-1-self-signing-contract.mjs",
  "test-files/test-step-12-2-sign-ux-contract.mjs",
  "test-files/test-step-12-3-signature-styles.mjs",
  "test-files/test-step-12-4-remove-duplicate-sign-workflow.mjs",
  "test-files/test-step-12-5-signature-setup-cleanup.mjs",
  "test-files/test-step-12-6-sign-editor-refinement.mjs",
  "test-files/test-step-12-7-sign-core-stabilization.mjs",
  "test-files/test-step-12-8-route-manifest.mjs",
  "test-files/test-step-12-8-request-signatures-backend.mjs",
  "test-files/test-watermark-interaction-contract.mjs",
  "test-files/test-step-13-edit-pdf-contract.mjs",
  "test-files/test-step-13-1-sign-pdf-corrections.mjs",
  "test-files/test-step-13-2-one-click-runner.mjs",
  "test-files/test-step-13-3-shared-controls-checkbox-edit-alignment.mjs",
  "test-files/test-step-13-4-shared-guides-aspect-resize.mjs",
  "test-files/test-step-13-5-windows-runner-eslint-corrective.mjs",
  "test-files/test-step-13-6-viewer-active-page-smooth-resize.mjs",
  "test-files/test-step-13-7-viewer-visibility-portal-corrective.mjs",
  "test-files/test-step-14-1-pdf-to-word-working.mjs",
  "test-files/test-step-14-2-pdf-to-word-service-ocr.mjs",
  "test-files/test-step-14-3-pdf-to-word-converter-startup-proxy.mjs",
  "test-files/test-step-14-4-pdf-to-word-eslint-windows-gate.mjs",
  "test-files/test-step-14-5-pdfjs-document-cleanup-typescript.mjs",
  "test-files/test-step-14-6-migration-apply-verify-sequence.mjs",
  "test-files/test-step-14-7-windows-node24-dev-launcher.mjs",
  "test-files/test-step-14-8-migration-show-output-parser.mjs",
  "test-files/test-step-14-9-dev-hydration-cache-isolation.mjs",
  "test-files/test-step-14-10-windows-cmd-crlf-label.mjs",
  "test-files/test-step-14-11-end-to-end-stability.mjs",
  "test-files/test-step-14-12-windows-service-launch-path.mjs",
  "test-files/test-step-14-13-preserve-layout-searchable-ocr.mjs",
  "test-files/test-step-14-14-editable-layout-reconstruction.mjs",
  "test-files/test-step-14-15-editable-native-object-corrective.mjs",
  "test-files/test-step-14-16-editable-layout-object-parity.mjs",
];

for (const test of tests) {
  console.log(`\n== ${test} ==`);
  const result = spawnSync(process.execPath, [test], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`\nAll ${tests.length} dependency-free source contracts passed.`);
