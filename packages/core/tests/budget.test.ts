import { describe, it, expect } from "vitest";
import { summarizeBudget, monthlyIncomeTotal } from "../src/budget.js";
import type { BudgetLine, IncomeSource } from "@motter/shared";

const inc = (
  id: string,
  amountCents: number,
  frequency: IncomeSource["frequency"]
): IncomeSource => ({ id, name: id, amountCents, frequency });

const line = (
  id: string,
  group: BudgetLine["group"],
  plannedCents: number,
  actualCents = 0
): BudgetLine => ({ id, name: id, group, plannedCents, actualCents });

describe("budget engine", () => {
  it("normalizes mixed pay frequencies to a monthly total", () => {
    const incomes = [inc("job", 200000, "semimonthly"), inc("side", 10000, "weekly")];
    // 2000*2 + round(100*52/12) = 400000 + 43333
    expect(monthlyIncomeTotal(incomes)).toBe(400000 + Math.round((10000 * 52) / 12));
  });

  it("remaining-to-assign is zero on a zero-based plan", () => {
    const s = summarizeBudget({
      incomes: [inc("job", 400000, "monthly")],
      categories: [
        line("tithe", "giving", 40000),
        line("save", "saving", 20000),
        line("rent", "needs", 200000),
        line("fun", "wants", 40000),
        line("debt", "debt", 100000),
      ],
    });
    expect(s.monthlyIncomeCents).toBe(400000);
    expect(s.plannedCents).toBe(400000);
    expect(s.remainingToAssignCents).toBe(0);
    expect(s.isZeroBased).toBe(true);
  });

  it("suggested extra toward debt is income - non-debt planned - minimums, never negative", () => {
    const s = summarizeBudget({
      incomes: [inc("job", 300000, "monthly")],
      categories: [
        line("give", "giving", 30000),
        line("needs", "needs", 180000),
        line("wants", "wants", 20000),
        line("debt", "debt", 50000),
      ],
      debtMinimumsCents: 40000,
    });
    // 3000 - 300 - 1800 - 200 - 400 = 300
    expect(s.suggestedExtraTowardDebtCents).toBe(30000);
    const tight = summarizeBudget({
      incomes: [inc("job", 100000, "monthly")],
      categories: [line("needs", "needs", 120000)],
      debtMinimumsCents: 20000,
    });
    expect(tight.suggestedExtraTowardDebtCents).toBe(0);
    expect(tight.remainingToAssignCents).toBe(-20000);
    expect(tight.isZeroBased).toBe(false);
  });
});
