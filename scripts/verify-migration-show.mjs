import { readFileSync } from "node:fs";

const targetMigration = "CreateSignatureRequestBackend1721800000000";
const logPath = process.argv[2];

if (!logPath) {
  console.error("[ERROR] Migration-show log path was not provided.");
  process.exit(2);
}

let text;
try {
  text = readFileSync(logPath, "utf8");
} catch (error) {
  console.error(`[ERROR] Could not read migration-show log: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

const plainText = text.replace(/\u001B\[[0-?]*[ -\/]*[@-~]/g, "");
const appliedPattern = new RegExp(
  `^\\s*\\[X\\]\\s+(?:\\d+\\s+)?${targetMigration}\\s*$`,
  "mi",
);

if (!appliedPattern.test(plainText)) {
  console.error(`[ERROR] Applied migration marker was not found for ${targetMigration}.`);
  process.exit(1);
}

console.log(`[OK] Applied migration confirmed: ${targetMigration}`);
