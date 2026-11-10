#!/usr/bin/env node
/**
 * Read-only import of Daniel's public payoff ledger into
 * apps/web/src/data/daniel-journey.json (build-time snapshot).
 * Does not modify daniel-motter-site.
 */
import { createRequire } from "node:module";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(here, "../../daniel-motter-site/debt-contributions.js"),
  "/workspace/daniel-motter-site/debt-contributions.js",
];
const src = candidates.find((p) => existsSync(p));
if (!src) {
  console.error("Could not find debt-contributions.js (read-only source).");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const ledger = require(src);
const report = ledger.report();
const data = ledger.data;

function daysBetween(start, end) {
  const a = Date.parse(start + "T12:00:00Z");
  const b = Date.parse(end + "T12:00:00Z");
  return Math.floor((b - a) / 86400000) + 1;
}

// Only include milestone dates that actually appear in the published ledger
// (crossed by a recorded contribution). We never invent a date.
const start = data.startingCents;
const milestones = [];
let cumulative = 0;
const crossed = new Set();
for (const day of report.days) {
  cumulative = day.cumulativeCents;
  const pct = (cumulative / start) * 100;
  const maybe = [
    { id: "first-thousand", label: "First $1,000 paid down", ok: cumulative >= 100000 },
    { id: "percent-10", label: "10% paid down", ok: pct >= 10 },
    { id: "percent-25", label: "25% paid down", ok: pct >= 25 },
    { id: "percent-50", label: "50% Halfway Home", ok: pct >= 50 },
    { id: "percent-75", label: "75% paid down", ok: pct >= 75 },
    { id: "debt-free", label: "100% Debt-Free", ok: cumulative >= start },
  ];
  for (const m of maybe) {
    if (m.ok && !crossed.has(m.id)) {
      crossed.add(m.id);
      milestones.push({ id: m.id, label: m.label, date: day.date });
    }
  }
}

const out = {
  sourceFile: "daniel-motter-site/debt-contributions.js",
  importedAt: new Date().toISOString(),
  startingCents: start,
  paidCents: report.paidCents,
  remainingCents: report.remainingCents,
  percent: report.percent,
  journeyStart: data.journeyStart,
  lastDate: report.lastDate,
  dayCount: report.lastDate ? daysBetween(data.journeyStart, report.lastDate) : 0,
  siteUrl: "https://22dmotter.github.io/daniel-motter-site/",
  contributionsUrl: "https://22dmotter.github.io/daniel-motter-site/daily-contributions.html",
  youtubeUrl: "https://www.youtube.com/@DanielEMotter",
  milestones,
};

const dest = resolve(here, "../apps/web/src/data/daniel-journey.json");
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
console.log("Wrote", dest, `(paid ${out.paidCents} cents, ${out.percent.toFixed(2)}%, day ${out.dayCount})`);
