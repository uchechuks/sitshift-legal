// Checks the legal pages before they're published. No dependencies.
//
//   node scripts/check.mjs              draft mode (today): every page carries
//                                       the "Draft, not yet in effect" banner
//   node scripts/check.mjs --published  publication: no banner, and every
//                                       policy page states an effective date
//
// Always: every page keeps the locked-down CSP, every internal link and
// #anchor resolves, and each policy names what the app's data map requires
// (data/required-disclosures.json). Exits 1 with a list of problems.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const published = process.argv.includes("--published");
// Root pages, plus earlier versions kept in archive/ (each must say it no
// longer applies, and keeps the same CSP and working links).
const ARCHIVE = existsSync(join(ROOT, "archive")) ? readdirSync(join(ROOT, "archive")).filter((f) => f.endsWith(".html")).map((f) => `archive/${f}`) : [];
const pages = [...readdirSync(ROOT).filter((f) => f.endsWith(".html")), ...ARCHIVE];
const required = JSON.parse(readFileSync(join(ROOT, "data", "required-disclosures.json"), "utf8"));
// Pages that aren't part of the policy set (the pod invite page opens the app).
const NOT_POLICY = new Set(["join.html"]);
const problems = [];

const text = Object.fromEntries(pages.map((f) => [f, readFileSync(join(ROOT, f), "utf8")]));
const ids = (html) => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

for (const f of pages) {
  const html = text[f];
  if (!/Content-Security-Policy" content="default-src 'none'/.test(html)) problems.push(`${f}: the locked-down CSP is missing`);
  if (f.startsWith("archive/")) {
    if (!/id="archived"/.test(html)) problems.push(`${f}: an archived version must say it no longer applies`);
    if (!/name="robots" content="noindex"/.test(html)) problems.push(`${f}: an archived version must not be indexed`);
  } else if (!NOT_POLICY.has(f)) {
    const banner = /class="draft"/.test(html);
    if (!published && !banner) problems.push(`${f}: the draft banner is missing (draft mode)`);
    if (published && banner) problems.push(`${f}: the draft banner is still there (published mode)`);
    if (published && /Effective date: to be set/.test(html)) problems.push(`${f}: no effective date yet`);
    if (published && /class="todo"/.test(html)) problems.push(`${f}: a [to be decided] placeholder is still there`);
  }
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:)/.test(href)) continue;
    const [file, anchor] = href.split("#");
    // Resolve against the linking page's folder (archive pages link "../").
    const target = file ? normalize(join(dirname(f), file)).split("\\").join("/") : f;
    if (file && !existsSync(join(ROOT, target))) { problems.push(`${f}: link to a missing page ${href}`); continue; }
    if (anchor && text[target] && !ids(text[target]).has(anchor)) problems.push(`${f}: link to a missing anchor ${href}`);
  }
}

const plain = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
for (const [page, phrases] of Object.entries({ "privacy.html": required.privacy, "consumer-health-data.html": required["consumer-health-data"], "terms.html": required.terms })) {
  const body = plain(text[page] ?? "");
  const raw = (text[page] ?? "").toLowerCase();
  for (const p of phrases) if (!body.includes(p.toLowerCase()) && !raw.includes(p.toLowerCase())) problems.push(`${page}: doesn't name "${p}"`);
}

if (problems.length) {
  console.error(`${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`OK: ${pages.length - ARCHIVE.length} pages and ${ARCHIVE.length} archived, ${published ? "published" : "draft"} mode.`);
