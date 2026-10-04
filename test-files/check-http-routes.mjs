import fs from "node:fs";

const baseUrl = (process.env.NOVAPDF_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const source = fs.readFileSync("src/data/tools.ts", "utf8");
const slugs = [...source.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]);
if (slugs.length !== 32 || new Set(slugs).size !== 32) throw new Error(`Expected 32 unique tool routes, found ${slugs.length}.`);
const routes = ["/", ...slugs.map((slug) => `/${slug}`)];
const failures = [];
for (const route of routes) {
  const url = `${baseUrl}${route}`;
  try {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    console.log(`${response.status} ${url}`);
    if (response.status !== 200) failures.push(`${response.status} ${route}`);
  } catch (error) {
    failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failures.length) throw new Error(`HTTP route check failed:\n${failures.join("\n")}`);
console.log(`All ${routes.length} NovaPDF routes returned HTTP 200.`);
