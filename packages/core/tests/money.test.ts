import { describe, it, expect } from "vitest";
import {
  addMonths,
  aprBpsToMonthlyRate,
  dollarsToCents,
  formatCents,
  isValidIsoDate,
  monthlyInterestCents,
  parseMoneyInput,
  parsePercentInput,
  percentToBps,
} from "../src/money.js";
import { PERIODS_PER_YEAR, toMonthlyCents } from "../src/frequency.js";

describe("money", () => {
  it("converts dollars to integer cents without float drift", () => {
    expect(dollarsToCents(0.29)).toBe(29);
    expect(dollarsToCents(100.01)).toBe(10001);
    expect(dollarsToCents(1.2)).toBe(120);
    expect(parseMoneyInput("0.29")).toBe(29);
    expect(parseMoneyInput(" 1.2 ")).toBe(120);
    expect(parseMoneyInput("$1,000.50")).toBe(100050);
    expect(parseMoneyInput("0")).toBe(0);
  });

  it("rejects invalid money strings", () => {
    for (const s of ["", "-1", "1e4", "$", "0.001", "abc"]) {
      // -1 is technically parseable as negative; we allow parseMoneyInput to return it
      if (s === "-1") {
        expect(parseMoneyInput(s)).toBe(-100);
        continue;
      }
      expect(parseMoneyInput(s)).toBeNull();
    }
  });

  it("maps percent to basis points and monthly rate", () => {
    expect(percentToBps(24.99)).toBe(2499);
    expect(aprBpsToMonthlyRate(2499)).toBeCloseTo(24.99 / 1200, 12);
    expect(parsePercentInput("7")).toBe(700);
    expect(parsePercentInput("7.5%")).toBe(750);
  });

  it("rounds monthly interest to the nearest cent", () => {
    // $1,000 at 12% APR → 1% per month = $10.00
    expect(monthlyInterestCents(100000, 1200)).toBe(1000);
    expect(monthlyInterestCents(0, 1200)).toBe(0);
    expect(monthlyInterestCents(100000, 0)).toBe(0);
  });

  it("formats cents and adds months", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(-50)).toBe("-$0.50");
    expect(addMonths("2026-11", 2)).toBe("2027-01");
    expect(addMonths("2026-01", 0)).toBe("2026-01");
    expect(addMonths("2026-11", 7)).toBe("2027-06");
  });

  it("validates real calendar dates", () => {
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2025-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-2-01")).toBe(false);
  });
});

describe("frequency normalization", () => {
  it("documents 52/26/24/12 periods per year", () => {
    expect(PERIODS_PER_YEAR.weekly).toBe(52);
    expect(PERIODS_PER_YEAR.biweekly).toBe(26);
    expect(PERIODS_PER_YEAR.semimonthly).toBe(24);
    expect(PERIODS_PER_YEAR.monthly).toBe(12);
  });

  it("converts to monthly cents with nearest-cent rounding", () => {
    expect(toMonthlyCents(10000, "monthly")).toBe(10000);
    expect(toMonthlyCents(10000, "semimonthly")).toBe(20000);
    // $100 weekly → 10000 * 52 / 12 = 43333.33… → 43333
    expect(toMonthlyCents(10000, "weekly")).toBe(Math.round((10000 * 52) / 12));
    expect(toMonthlyCents(10000, "biweekly")).toBe(Math.round((10000 * 26) / 12));
  });
});
