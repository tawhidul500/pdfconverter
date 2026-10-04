import { spawn, spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const dockerCommand = process.platform === "win32" ? "docker.exe" : "docker";
const healthUrl = "http://127.0.0.1:4010/health";
const webVersionUrl = "http://127.0.0.1:3000/api/novapdf/version";
const expectedWebVersion = "0.14.16";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const nextCliPath = resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");
const devDistDirName = ".next-dev";
const devDistDirPath = resolve(projectRoot, devDistDirName);

async function converterOnline() {
  try {
    const response = await fetch(healthUrl, { cache: "no-store", signal: AbortSignal.timeout(2_500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForConverter(seconds = 180) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (await converterOnline()) return true;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
  }
  return false;
}

async function ensureConverter() {
  if (await converterOnline()) {
    console.log("[NovaPDF] PDF converter is already online.");
    return;
  }

  const docker = spawnSync(dockerCommand, ["info"], { stdio: "ignore" });
  if (docker.status !== 0) {
    console.warn("[NovaPDF] Docker is not ready. The web app will start, but PDF to Word stays offline.");
    console.warn("[NovaPDF] Start Docker Desktop, then run START_PDF_CONVERTER.cmd.");
    return;
  }

  console.log("[NovaPDF] Building and starting the PDF converter…");
  const started = spawnSync(
    dockerCommand,
    ["compose", "up", "-d", "--build", "pdf-converter"],
    { stdio: "inherit" },
  );
  if (started.status !== 0 || !(await waitForConverter())) {
    console.warn("[NovaPDF] PDF converter did not become healthy. The web app will still start.");
    spawnSync(dockerCommand, ["compose", "logs", "--tail", "120", "pdf-converter"], { stdio: "inherit" });
    return;
  }
  console.log("[NovaPDF] PDF converter is online.");
}

await ensureConverter();

async function checkExistingWeb() {
  try {
    const response = await fetch(webVersionUrl, { cache: "no-store", signal: AbortSignal.timeout(2_000) });
    if (!response.ok) return { occupied: true, version: "unknown" };
    const payload = await response.json();
    return { occupied: true, version: String(payload?.version || "unknown") };
  } catch {
    return { occupied: false, version: null };
  }
}

const existingWeb = await checkExistingWeb();
if (existingWeb.occupied) {
  if (existingWeb.version === expectedWebVersion) {
    console.log(`[NovaPDF] Web ${expectedWebVersion} is already running at http://localhost:3000.`);
    process.exit(0);
  }
  console.error(`[NovaPDF] Port 3000 is already occupied by another server (reported version: ${existingWeb.version}).`);
  console.error("[NovaPDF] Close the old NovaPDF Web CMD window, then retry npm.cmd run dev.");
  process.exit(1);
}

if (!existsSync(nextCliPath)) {
  console.error(`[NovaPDF] Next.js CLI was not found at ${nextCliPath}.`);
  console.error("[NovaPDF] Run npm.cmd ci, then retry npm.cmd run dev.");
  process.exit(1);
}

// Do not spawn npx.cmd/npm.cmd directly. Modern Node.js rejects direct .cmd
// execution without a shell on Windows. Running Next's JavaScript CLI with the
// current Node executable is shell-free, quoting-safe, and cross-platform.
// Keep development output separate from the production .next build so a manual
// dev launch cannot hydrate against stale production or prior-version artifacts.
rmSync(devDistDirPath, { recursive: true, force: true });
console.log(`[NovaPDF] Starting the Webpack development server with a clean ${devDistDirName} cache.`);
const child = spawn(process.execPath, [nextCliPath, "dev", "--webpack"], {
  stdio: "inherit",
  env: { ...process.env, NOVAPDF_NEXT_DIST_DIR: devDistDirName },
  cwd: projectRoot,
  windowsHide: false,
});

child.on("error", (error) => {
  console.error(`[NovaPDF] Failed to start the Next.js development server: ${error.message}`);
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal && process.platform !== "win32") {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? (signal ? 1 : 0));
});
