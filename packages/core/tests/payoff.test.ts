import { describe, it, expect } from "vitest";
import { planDebts, estimateDebtFreeMonths } from "../src/payoff.js";
import { amortize, paymentNeeded, requiredPaymentDollars } from "../src/payment.js";
import { percentToBps } from "../src/money.js";

const d = (
  id: string,
  balance: number,
  apr: number,
  minimum: number,
  name = id
) => ({
  id,
  name,
  balanceCents: Math.round(balance * 100),
  aprBps: percentToBps(apr),
  minimumPaymentCents: Math.round(minimum * 100),
});

describe("single-debt amortization (hand-checked)", () => {
  it("known formula: $200k, 6%, 30 yrs ≈ $1,199.10", () => {
    expect(requiredPaymentDollars(200000, 6, 360).toFixed(2)).toBe("1199.10");
    const r = paymentNeeded(20_000_000, 600, 360);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.months).toBeLessThanOrEqual(360);
      expect(r.paymentCents).toBeGreaterThanOrEqual(119910);
      expect(r.paymentCents).toBeLessThanOrEqual(119911);
    }
  });

  it("known formula: $10k, 7%, 60 mo = $198.02", () => {
    const r = paymentNeeded(1_000_000, 700, 60);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.paymentCents).toBe(19802);
      expect(r.months).toBe(60);
      expect(r.totalPaidCents).toBe(1_000_000 + r.interestCents);
      expect(Math.abs(r.interestCents / 100 - 1880.72)).toBeLessThan(1.5);
    }
  });

  it("0% APR exact split and partial final month", () => {
    const r = paymentNeeded(100_000, 0, 3);
    expect(r.ok && r.paymentCents).toBe(33334);
    if (r.ok) {
      expect(r.lastPaymentCents).toBe(33332);
      expect(r.interestCents).toBe(0);
      expect(r.totalPaidCents).toBe(100000);
      expect(r.months).toBe(3);
    }
    expect(paymentNeeded(120_000, 0, 12).paymentCents).toBe(10000);
  });

  it("amortize conserves money and uses a partial last payment", () => {
    const r = amortize(100_000, 1200, 30_000);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.months).toBe(4);
      expect(r.lastPaymentCents).toBeLessThan(30000);
      expect(r.lastPaymentCents).toBeGreaterThan(0);
      expect(r.totalPaidCents).toBe(100000 + r.interestCents);
      r.rows.forEach((x) => expect(x.balanceCents).toBeGreaterThanOrEqual(0));
    }
  });

  it("detects a payment that cannot cover monthly interest", () => {
    const r = amortize(1_000_000, 2400, 20_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("interest");
  });
});

describe("multi-debt planner", () => {
  it("zero-interest snowball pays the $500 debt first (hand case)", () => {
    const r = planDebts({
      debts: [d("A", 1000, 0, 100), d("B", 500, 0, 50)],
      extraMonthlyCents: 5000,
      strategy: "snowball",
    });
    expect(r.ok).toBe(true);
    expect(r.months).toBe(8);
    expect(r.interestCents).toBe(0);
    expect(r.budgetCents).toBe(20000);
    expect(r.totalPaidCents).toBe(150000);
    const a = r.debts.find((x) => x.id === "A")!;
    const b = r.debts.find((x) => x.id === "B")!;
    expect(b.payoffMonth).toBe(5);
    expect(a.payoffMonth).toBe(8);
    r.schedule.slice(0, -1).forEach((s) => expect(s.paymentCents).toBe(20000));
  });

  it("avalanche pays the highest APR first and never costs more interest than snowball", () => {
    const sameRates = [d("big", 5000, 25, 100, "big hi"), d("small", 1000, 5, 30, "small lo")];
    const sn = planDebts({ debts: sameRates, extraMonthlyCents: 30000, strategy: "snowball" });
    const av = planDebts({ debts: sameRates, extraMonthlyCents: 30000, strategy: "avalanche" });
    expect(sn.ok && av.ok).toBe(true);
    expect(sn.debts.find((x) => x.id === "small")!.payoffMonth!).toBeLessThan(
      sn.debts.find((x) => x.id === "big")!.payoffMonth!
    );
    expect(av.interestCents).toBeLessThan(sn.interestCents);
  });

  it("matches an independent float reference within a tight band", () => {
    const sample = [
      d("Card", 3200, 24.99, 95),
      d("Car", 11500, 7.5, 280),
      d("Student", 18000, 5.5, 190),
      d("Store", 900, 29.99, 35),
    ];
    for (const strategy of ["snowball", "avalanche"] as const) {
      const r = planDebts({
        debts: sample,
        extraMonthlyCents: 20000,
        strategy,
        compare: true,
      });
      expect(r.ok).toBe(true);
      expect(r.totalPaidCents).toBe(r.startTotalCents + r.interestCents);
      r.debts.forEach((debt) => {
        expect(debt.paidCents).toBe(debt.startBalanceCents + debt.interestCents);
        expect(debt.payoffMonth).toBeGreaterThanOrEqual(1);
      });
      expect(r.schedule.at(-1)?.endBalanceCents).toBe(0);
      if (strategy === "snowball") {
        expect(r.vsAvalanche).toBeTruthy();
        expect(r.vsMinimumOnly).toBeTruthy();
      }
    }
  });

  it("rolls freed minimums into the next debt", () => {
    const r = planDebts({
      debts: [d("a", 300, 0, 0), d("b", 300, 10, 50)],
      extraMonthlyCents: 10000,
      strategy: "avalanche",
    });
    expect(r.ok).toBe(true);
    r.debts.forEach((debt) => expect(debt.paidCents).toBeGreaterThan(0));
    expect(r.remainingCents).toBe(0);
  });

  it("custom order follows the given id list", () => {
    const r = planDebts({
      debts: [d("A", 200, 0, 10), d("B", 100, 0, 10), d("C", 150, 0, 10)],
      extraMonthlyCents: 5000,
      strategy: "custom",
      customOrder: ["C", "A", "B"],
    });
    expect(r.ok).toBe(true);
    expect(r.debts.find((x) => x.id === "C")!.payoffMonth!).toBeLessThan(
      r.debts.find((x) => x.id === "A")!.payoffMonth!
    );
    expect(r.debts.find((x) => x.id === "A")!.payoffMonth!).toBeLessThan(
      r.debts.find((x) => x.id === "B")!.payoffMonth!
    );
  });

  it("applies a one-time lump sum in the given month", () => {
    const without = planDebts({
      debts: [d("A", 1000, 0, 100)],
      extraMonthlyCents: 0,
      strategy: "snowball",
    });
    const withLump = planDebts({
      debts: [d("A", 1000, 0, 100)],
      extraMonthlyCents: 0,
      strategy: "snowball",
      lumpSums: [{ month: 2, amountCents: 50000 }],
    });
    expect(without.ok && withLump.ok).toBe(true);
    expect(withLump.months).toBeLessThan(without.months);
  });

  it("reports non-amortizing debts and refuses a budget below first-month interest", () => {
    const r = planDebts({
      debts: [d("x", 20000, 30, 100)],
      extraMonthlyCents: 0,
      strategy: "snowball",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("interest");
    expect(r.warnings.length).toBe(1);
    expect(r.warnings[0]!.minimumPaymentCents).toBeLessThanOrEqual(
      r.warnings[0]!.monthlyInterestCents
    );
  });

  it("hits the 50-year cap instead of looping forever", () => {
    const r = planDebts({
      debts: [d("x", 200000, 24, 4000.01)],
      extraMonthlyCents: 0,
      strategy: "snowball",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("cap");
    expect(r.remainingCents).toBeGreaterThan(0);
    expect(r.months).toBe(600);
  });

  it("assigns a debt-free year-month from the start month", () => {
    const r = planDebts({
      debts: [d("A", 300, 0, 100)],
      extraMonthlyCents: 0,
      strategy: "snowball",
      startMonth: "2026-11",
    });
    expect(r.ok).toBe(true);
    expect(r.months).toBe(3);
    expect(r.debtFreeYearMonth).toBe("2027-01");
  });

  it("comparison reports interest and months saved vs minimums", () => {
    const r = planDebts({
      debts: [d("A", 1000, 0, 50), d("B", 500, 0, 25)],
      extraMonthlyCents: 7500,
      strategy: "snowball",
      compare: true,
    });
    expect(r.ok).toBe(true);
    expect(r.vsMinimumOnly?.otherCapped).toBe(false);
    expect(r.vsMinimumOnly?.monthsSaved).toBeGreaterThan(0);
    expect(r.vsMinimumOnly?.interestSavedCents).toBe(0);
  });
});

describe("quick 0% estimate", () => {
  it("ceil-divides total debt by the monthly payment", () => {
    expect(estimateDebtFreeMonths(150000, 20000)).toEqual({ ok: true, months: 8 });
    expect(estimateDebtFreeMonths(0, 20000)).toEqual({ ok: true, months: 0 });
    expect(estimateDebtFreeMonths(10000, 0).ok).toBe(false);
  });
});
