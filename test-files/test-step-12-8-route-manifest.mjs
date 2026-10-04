import fs from 'node:fs';

const source = fs.readFileSync('src/data/tools.ts', 'utf8');
const slugs = [...source.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]);
if (slugs.length !== 32) throw new Error(`Expected 32 tool routes, found ${slugs.length}.`);
if (new Set(slugs).size !== 32) throw new Error('Tool route slugs must be unique.');
if (!fs.existsSync('src/app/page.tsx')) throw new Error('Homepage route is missing.');
if (!fs.existsSync('src/app/[tool]/page.tsx')) throw new Error('Dynamic root-level tool route is missing.');
const requiredWorking = ['merge-pdf','split-pdf','compress-pdf','organize-pdf','jpg-to-pdf','pdf-to-jpg','page-numbers-pdf','watermark-pdf','rotate-pdf','crop-pdf','sign-pdf','edit-pdf'];
for (const slug of requiredWorking) if (!slugs.includes(slug)) throw new Error(`Working tool route missing: /${slug}`);
const urls = ['/', ...slugs.map((slug) => `/${slug}`)];
console.log(`Route manifest passed: ${urls.length} routes (${slugs.length} tools plus homepage).`);
for (const url of urls) console.log(url);
