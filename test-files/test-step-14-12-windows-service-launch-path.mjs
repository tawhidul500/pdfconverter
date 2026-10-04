import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const text = (path) => readFileSync(path, "utf8");
const bytes = (path) => readFileSync(path);
const runner = text("RUN_NOVAPDF_ALL.cmd");
const orchestrator = text("scripts/start-production-windows.ps1");
const web = text("START_NOVAPDF_WEB.cmd");
const api = text("START_NOVAPDF_API.cmd");
const worker = text("START_NOVAPDF_WORKER.cmd");
const wrappers = ["START_NOVAPDF_WEB.cmd", "START_NOVAPDF_API.cmd", "START_NOVAPDF_WORKER.cmd"];

function crlfOnly(buffer) {
  let lf = 0;
  let crlf = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === 0x0a) {
      lf += 1;
      if (i > 0 && buffer[i - 1] === 0x0d) crlf += 1;
    }
  }
  return lf > 0 && lf === crlf;
}

const checks = [
  [runner.includes("start-production-windows.ps1"), "runner uses structured process orchestrator"],
  [!runner.includes('cmd.exe /k "cd /d ""%ROOT%""'), "legacy nested Web cd command removed"],
  [!runner.includes('cmd.exe /k "cd /d ""%BACKEND%""'), "legacy nested backend cd commands removed"],
  [orchestrator.includes("Start-Process") && orchestrator.includes("-WorkingDirectory $rootPath"), "working directory passed structurally"],
  [orchestrator.includes('"call $($target.Script)"'), "child command contains launcher name only"],
  [orchestrator.includes("runtime-processes.json"), "launched process evidence recorded"],
  [web.includes('%~dp0') && web.includes('node_modules\\next\\dist\\bin\\next'), "self-locating Web launcher"],
  [api.includes('%~dp0') && api.includes('%BACKEND%\\dist\\main.js'), "self-locating API launcher"],
  [worker.includes('%~dp0') && worker.includes('%BACKEND%\\dist\\worker.js'), "self-locating Worker launcher"],
  [web.includes('node.exe "%ROOT%\\node_modules\\next\\dist\\bin\\next" start'), "Web starts local Next CLI directly"],
  [api.includes('node.exe "%BACKEND%\\dist\\main.js"'), "API starts compiled entry directly"],
  [worker.includes('node.exe "%BACKEND%\\dist\\worker.js"'), "Worker starts compiled entry directly"],
  [wrappers.every((file) => crlfOnly(bytes(file))), "all Windows service launchers use CRLF only"],
  [wrappers.every((file) => !bytes(file).subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))), "launchers contain no UTF-8 BOM"],
  [runner.includes('set "EXPECTED_WEB_VERSION=0.14.16"'), "runner verifies the current Web version"],
  [runner.includes("verify-web-version.ps1"), "post-launch Web verification remains"],
  [runner.includes('call :wait_url "http://localhost:4000/api/v1/health/live" 120'), "post-launch API health remains"],
  [!runner.includes("docker compose down -v") && !runner.includes("npm audit fix"), "volume and audit safety retained"],
];
for (const [condition, label] of checks) assert.ok(condition, label);
console.log(`Step 14.12 Windows service-launch path corrective passed (${checks.length} checks).`);
