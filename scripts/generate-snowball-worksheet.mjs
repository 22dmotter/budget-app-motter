#!/usr/bin/env node
/**
 * Generate the two-page US Letter Debt Snowball Worksheet PDF
 * (plus a web preview PNG) using HTML + Playwright.
 *
 * Usage (from repo root): npm run generate:worksheet
 */
import { chromium } from "playwright-core";
import QRCode from "qrcode";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "apps/web/public/freebies");
const pdfPath = join(outDir, "debt-snowball-worksheet.pdf");
const previewPath = join(outDir, "worksheet-preview.png");

const CALCULATOR_URL =
  "https://22dmotter.github.io/budget-app-motter/calculator/";
const STORY_URL = "https://22dmotter.github.io/daniel-motter-site/";
const BRAND = "Budget App";

/**
 * Simple snowball month-count: smallest balance first; each debt is paid
 * with (its minimum + extra + freed minimums from paid-off debts).
 * Interest is ignored — same idea as estimateDebtFreeMonths in packages/core.
 */
function estimateSnowballMonths(debts, extra) {
  const ordered = [...debts].sort(
    (a, b) => a.balance - b.balance || a.name.localeCompare(b.name)
  );
  let freed = 0;
  let totalMonths = 0;
  const rows = [];
  for (const d of ordered) {
    const payment = d.min + extra + freed;
    const months = payment > 0 ? Math.ceil(d.balance / payment) : null;
    rows.push({ ...d, payment, months });
    if (months) totalMonths += months;
    freed += d.min;
  }
  return { rows, totalMonths };
}

const exampleDebts = [
  { name: "Store card", balance: 400, rate: 22, min: 25 },
  { name: "Credit card", balance: 1200, rate: 18, min: 35 },
  { name: "Car loan", balance: 3000, rate: 6, min: 90 },
];
const exampleExtra = 100;
const example = estimateSnowballMonths(exampleDebts, exampleExtra);

function money(n) {
  return `$${n.toLocaleString("en-US")}`;
}

const exampleLines = example.rows
  .map(
    (r, i) =>
      `${i + 1}. ${r.name} (${money(r.balance)}): snowball ${money(r.payment)} → ${r.months} mo.`
  )
  .join(" ");

if (example.totalMonths !== 24) {
  console.warn(
    "Unexpected example total months:",
    example.totalMonths,
    example.rows
  );
}

const qrDataUrl = await QRCode.toDataURL(CALCULATOR_URL, {
  margin: 0,
  width: 240,
  color: { dark: "#0F1E3D", light: "#FFFFFF" },
});

const monthCells = Array.from({ length: 36 }, (_, i) => {
  const n = i + 1;
  return `<div class="cell"><span>${n}</span></div>`;
}).join("");

const blankRows = Array.from({ length: 8 }, (_, i) => {
  const n = i + 1;
  return `<tr>
    <td class="num">${n}</td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>`;
}).join("");

const checklist = [
  "List every debt with real balances, interest rates, and minimum payments.",
  "Number them smallest balance first — that order is your snowball.",
  "Set a starter emergency-fund goal, even a small one.",
  "Build a zero-based budget that includes a giving line.",
  "Find one expense you can trim this month.",
  "Choose a monthly extra payment you can actually keep.",
  "Make your first extra payment toward the smallest debt.",
  "Log that payment on this sheet or in the app.",
  "Tell an accountability partner, if you have one.",
  "Schedule a weekly 10-minute money check-in.",
  "Download the free spreadsheets if you want a digital copy.",
  "Celebrate the first step. Showing up counts.",
];

const checkItems = checklist
  .map((t) => `<li><span class="box"></span><span>${t}</span></li>`)
  .join("");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${BRAND} — Debt Snowball Worksheet</title>
<style>
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; }
  body {
    font-family: Inter, "Noto Sans", system-ui, sans-serif;
    color: #0F1E3D;
    font-size: 9.2pt;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1, h2, h3, .brand {
    font-family: "Space Grotesk", Inter, system-ui, sans-serif;
    letter-spacing: -0.02em;
  }
  .page {
    width: 8.5in;
    height: 11in;
    padding: 0.42in 0.48in 0.38in;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background: #fff;
  }
  .bar { height: 5px; background: #B42318; margin: -0.42in -0.48in 10px; }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 2px solid #0F1E3D;
  }
  .brand { font-weight: 700; font-size: 11.5pt; color: #0F1E3D; }
  .brand em { color: #B42318; font-style: normal; }
  h1 { font-size: 16.5pt; line-height: 1.1; }
  .story { font-size: 8pt; color: #0F1E3D; max-width: 4.6in; }
  .story a { color: #B42318; text-decoration: underline; }
  .verse {
    font-size: 8.2pt;
    font-style: italic;
    color: #0F1E3D;
    margin: 6px 0 10px;
    padding: 6px 10px;
    border-left: 3px solid #B42318;
    background: #F7F8FA;
  }
  .verse cite { font-style: normal; font-weight: 600; }
  h2 {
    font-size: 10.5pt;
    margin: 0 0 4px;
    color: #0F1E3D;
  }
  h2 .step {
    display: inline-block;
    background: #0F1E3D;
    color: #fff;
    font-size: 8pt;
    padding: 1px 7px;
    border-radius: 999px;
    margin-right: 6px;
    letter-spacing: 0.04em;
    font-weight: 700;
  }
  .rule { margin: 0 0 6px; font-size: 8.5pt; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 8.4pt;
  }
  th, td {
    border: 1px solid #0F1E3D;
    padding: 5px 6px;
    text-align: left;
    height: 22px;
  }
  th {
    background: #0F1E3D;
    color: #fff;
    font-weight: 600;
    font-size: 7.6pt;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  td.num, th.num { width: 0.42in; text-align: center; }
  .split { display: flex; gap: 14px; margin-top: 2px; }
  .split .col { flex: 1; }
  .box-field {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0;
  }
  .box-field .blank {
    border: 1.5px solid #0F1E3D;
    height: 28px;
    min-width: 1.8in;
    background: #fff;
  }
  .example {
    border: 1.5px solid #0F1E3D;
    background: #F7F8FA;
    padding: 7px 9px;
    font-size: 7.6pt;
    line-height: 1.4;
  }
  .example strong.label {
    display: inline-block;
    background: #B42318;
    color: #fff;
    font-size: 7pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 1px 6px;
    border-radius: 3px;
    margin-bottom: 3px;
  }
  .qr-row {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 6px;
  }
  .qr-row img { width: 72px; height: 72px; border: 1px solid #0F1E3D; }
  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 4px;
    margin-top: 6px;
  }
  .grid .cell {
    border: 1.25px solid #0F1E3D;
    height: 26px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 2px 3px;
    font-size: 7pt;
    font-weight: 600;
    background: #fff;
  }
  .writein { margin-top: 6px; font-size: 8.5pt; }
  .writein .line {
    display: inline-block;
    border-bottom: 1px solid #0F1E3D;
    min-width: 2.2in;
    height: 14px;
  }
  .foot {
    margin-top: auto;
    padding-top: 6px;
    border-top: 1px solid #0F1E3D;
    font-size: 6.2pt;
    color: #0F1E3D;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }
  .foot .left { white-space: nowrap; flex: 0 0 auto; }
  .foot .attr { flex: 1; }
  /* page 2 */
  .intro { margin: 8px 0 12px; font-size: 9.5pt; }
  .checks { list-style: none; display: grid; gap: 7px; }
  .checks li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border: 1px solid #0F1E3D;
    padding: 8px 10px;
    background: #F7F8FA;
    font-size: 10pt;
    line-height: 1.35;
  }
  .checks .box {
    flex: 0 0 16px;
    width: 16px;
    height: 16px;
    border: 1.5px solid #0F1E3D;
    background: #fff;
    margin-top: 1px;
  }
  .close {
    margin-top: 14px;
    padding: 10px 12px;
    border-left: 3px solid #B42318;
    background: #F7F8FA;
    font-size: 9.5pt;
  }
</style>
</head>
<body>
  <section class="page" id="p1">
    <div class="bar"></div>
    <div class="top">
      <div>
        <div class="brand">${BRAND} <em>·</em> Free tool</div>
        <h1>Debt Snowball Worksheet</h1>
      </div>
      <p class="story">
        Built by <a href="${STORY_URL}">Daniel Motter</a>, who is paying off
        about $49k of his own debt, one payment at a time.
      </p>
    </div>
    <p class="verse">
      “Owe no one anything, except to love each other, for the one who loves
      another has fulfilled the law.”
      <cite>Romans 13:8 (ESV)</cite>
    </p>

    <h2><span class="step">1</span>List every debt</h2>
    <p class="rule">Write the real balance, interest rate, and minimum payment for each one. Use another sheet if you have more than eight.</p>
    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>Debt name</th>
          <th>Balance</th>
          <th>Interest rate</th>
          <th>Minimum payment</th>
        </tr>
      </thead>
      <tbody>${blankRows}</tbody>
    </table>

    <h2><span class="step">2</span>Order smallest balance first</h2>
    <p class="rule">In the # column, write 1 next to the smallest balance, then 2, and so on. Ignore interest rates for this order — the snowball starts with the smallest balance so you can get an early win, then roll that payment forward.</p>

    <h2><span class="step">3</span>Find your snowball</h2>
    <div class="box-field">
      <strong>My monthly extra:</strong>
      <span class="blank"></span>
    </div>
    <p class="rule">Pay every minimum each month. Put your extra on debt #1. When #1 is gone, its minimum joins the extra on debt #2. Each freed minimum rolls into the next debt — that growing payment is your snowball.</p>

    <h2><span class="step">4</span>Estimate your payoff</h2>
    <p class="rule">For each debt in order: <strong>snowball payment</strong> = that debt’s minimum + your extra + the minimums of debts you have already paid off. <strong>Months</strong> ≈ balance ÷ snowball payment (round up). Add the months together. Interest makes the real date a little later — use the free online calculator for an exact date.</p>
    <div class="split">
      <div class="col">
        <div class="example">
          <strong class="label">Example</strong>
          <p>Extra ${money(exampleExtra)}. ${exampleLines} About <strong>${example.totalMonths} months</strong> in this simple count (interest not included).</p>
        </div>
        <p class="writein">My simple estimate: <span class="line"></span> months</p>
      </div>
      <div class="qr-row">
        <img src="${qrDataUrl}" alt="QR code to the free calculator" />
        <p class="rule" style="margin:0">Exact date with interest:<br /><strong>${CALCULATOR_URL}</strong></p>
      </div>
    </div>

    <h2 style="margin-top:10px"><span class="step">5</span>Circle your target debt-free date</h2>
    <p class="rule">Starting this month as 1, circle the month that matches your estimate — or the date you’re asking God to help you reach. Write the calendar date below.</p>
    <div class="grid">${monthCells}</div>
    <p class="writein">My target date: <span class="line"></span></p>

    <div class="foot">
      <span class="left">Page 1 of 2 · ${BRAND} · Not financial advice.</span>
      <span class="attr">Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.</span>
    </div>
  </section>

  <section class="page" id="p2">
    <div class="bar"></div>
    <div class="top">
      <div>
        <div class="brand">${BRAND} <em>·</em> Free tool</div>
        <h1>Your First 30 Days</h1>
      </div>
      <p class="story">
        A gentle checklist — not a test. Do what you can, in the order that
        fits your life. One honest step is enough for today.
      </p>
    </div>
    <p class="intro">
      Use the next month to put your snowball in motion. Check things off as
      you go. If a week gets away from you, pick back up without shame.
    </p>
    <ol class="checks">${checkItems}</ol>
    <p class="close">
      “Owe no one anything, except to love each other.” Romans 13:8 (ESV) —
      offered as encouragement, not a rulebook. Built by Daniel Motter:
      ${STORY_URL}
    </p>
    <div class="foot">
      <span class="left">Page 2 of 2 · ${BRAND} · Not financial advice.</span>
      <span class="attr">Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.</span>
    </div>
  </section>
</body>
</html>`;

mkdirSync(outDir, { recursive: true });
const htmlPath = join(outDir, "_worksheet.html");
writeFileSync(htmlPath, html);

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }
  res.writeHead(404);
  res.end();
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: pdfPath,
  format: "Letter",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
// Web preview of page 1 (also used on the landing page)
const p1 = page.locator("#p1");
await p1.screenshot({ path: previewPath, type: "png" });
await browser.close();
server.close();

// Don't ship the helper HTML
import { unlinkSync } from "node:fs";
try {
  unlinkSync(htmlPath);
} catch {}

console.log("Wrote", pdfPath);
console.log("Wrote", previewPath);
console.log("Example months:", example.totalMonths, example.rows);
