/**
 * Money is always integer cents. Never keep a running total in dollars.
 *
 * APR is stored in basis points (1% = 100 bps). Monthly interest is:
 *   round(balanceCents * aprBps / 120_000)
 * i.e. balance × (APR% / 12 / 100), rounded to the nearest cent each month,
 * then added to the balance *before* the payment is applied.
 */

export const MAX_CENTS = 1_000_000_000; // $10,000,000.00
export const MAX_MONTHS = 600; // 50-year safety cap

/** Convert a dollar amount to cents, rounding half-up to the nearest cent. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Format cents as a compact dollar string, e.g. 123456 -> "$1,234.56". */
export function formatCents(cents: number, opts?: { sign?: boolean }): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  const body = `$${dollars.toLocaleString("en-US")}.${String(rem).padStart(2, "0")}`;
  if (negative) return `-${body}`;
  if (opts?.sign && cents > 0) return `+${body}`;
  return body;
}

/**
 * Parse a user money string ("$1,200.50", "1200.5", "0") into cents.
 * Returns null if the input is empty or invalid.
 */
export function parseMoneyInput(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const cleaned = s.replace(/[$,\s]/g, "");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(cleaned)) return null;
  const negative = cleaned.startsWith("-");
  const [w, frac = ""] = (negative ? cleaned.slice(1) : cleaned).split(".");
  const n = Number(w) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(n) || n > MAX_CENTS) return null;
  return negative ? -n : n;
}

/** 24.99 (%) -> 2499 bps. */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

export function bpsToPercent(bps: number): number {
  return bps / 100;
}

export function parsePercentInput(raw: string): number | null {
  const s = raw.trim().replace(/%/g, "");
  if (!s) return null;
  if (!/^\d+(?:\.\d{1,4})?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n > 1000) return null;
  return percentToBps(n);
}

export function formatBps(bps: number): string {
  const p = bps / 100;
  return Number.isInteger(p) ? `${p}%` : `${p.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

/** Monthly periodic rate as a decimal (e.g. 24.99% -> 0.020825). */
export function aprBpsToMonthlyRate(aprBps: number): number {
  return aprBps / 120_000;
}

/** Interest for one month, rounded to the nearest cent. */
export function monthlyInterestCents(balanceCents: number, aprBps: number): number {
  if (balanceCents <= 0 || aprBps <= 0) return 0;
  return Math.round(balanceCents * aprBpsToMonthlyRate(aprBps));
}

/** YYYY-MM plus an integer number of months. */
export function addMonths(yearMonth: string, add: number): string {
  const [ys, ms] = yearMonth.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const total = y * 12 + (m - 1) + add;
  const yy = Math.floor(total / 12);
  const mm = ((total % 12) + 12) % 12;
  const year = total < 0 ? yy - (mm === 0 && total % 12 !== 0 ? 0 : 0) : yy;
  return `${year}-${String(mm + 1).padStart(2, "0")}`;
}

export function currentYearMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatYearMonth(yearMonth: string): string {
  const [ys, ms] = yearMonth.split("-");
  const d = new Date(Date.UTC(Number(ys), Number(ms) - 1, 1));
  return d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
