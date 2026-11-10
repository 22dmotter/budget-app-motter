import type { BudgetLine, IncomeSource } from "@motter/shared";
import { toMonthlyCents } from "./frequency.js";

export type BudgetSummary = {
  monthlyIncomeCents: number;
  plannedCents: number;
  actualCents: number;
  plannedByGroup: Record<string, number>;
  actualByGroup: Record<string, number>;
  /** Income minus all planned lines. $0 is a zero-based budget. */
  remainingToAssignCents: number;
  /**
   * Income − planned non-debt spending − debt minimums, never negative.
   * This is the extra you can aim at the snowball/avalanche.
   */
  suggestedExtraTowardDebtCents: number;
  isZeroBased: boolean;
};

export function monthlyIncomeTotal(incomes: IncomeSource[]): number {
  return incomes.reduce(
    (s, i) => s + toMonthlyCents(i.amountCents, i.frequency),
    0
  );
}

export function summarizeBudget(input: {
  incomes: IncomeSource[];
  categories: BudgetLine[];
  debtMinimumsCents?: number;
}): BudgetSummary {
  const monthlyIncomeCents = monthlyIncomeTotal(input.incomes);
  const plannedByGroup: Record<string, number> = {};
  const actualByGroup: Record<string, number> = {};
  let plannedCents = 0;
  let actualCents = 0;
  let plannedNonDebt = 0;
  let plannedDebt = 0;

  for (const c of input.categories) {
    plannedCents += c.plannedCents;
    actualCents += c.actualCents;
    plannedByGroup[c.group] = (plannedByGroup[c.group] ?? 0) + c.plannedCents;
    actualByGroup[c.group] = (actualByGroup[c.group] ?? 0) + c.actualCents;
    if (c.group === "debt") plannedDebt += c.plannedCents;
    else plannedNonDebt += c.plannedCents;
  }

  const remainingToAssignCents = monthlyIncomeCents - plannedCents;
  const minimums =
    input.debtMinimumsCents !== undefined
      ? input.debtMinimumsCents
      : plannedDebt;
  const suggestedExtraTowardDebtCents = Math.max(
    0,
    monthlyIncomeCents - plannedNonDebt - minimums
  );

  return {
    monthlyIncomeCents,
    plannedCents,
    actualCents,
    plannedByGroup,
    actualByGroup,
    remainingToAssignCents,
    suggestedExtraTowardDebtCents,
    isZeroBased: remainingToAssignCents === 0 && monthlyIncomeCents > 0,
  };
}
