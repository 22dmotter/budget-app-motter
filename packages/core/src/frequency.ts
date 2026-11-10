import type { IncomeFrequency } from "@motter/shared";

/**
 * Pay periods per year used when normalizing income to a monthly amount.
 *
 * - weekly:      52 periods / 12 months
 * - biweekly:    26 periods / 12 months (every two weeks, not twice a month)
 * - semimonthly: 24 periods / 12 months = exactly 2
 * - monthly:     12 periods / 12 months = 1
 *
 * Monthly cents = round(amountCents * periodsPerYear / 12).
 */
export const PERIODS_PER_YEAR: Record<IncomeFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

export function toMonthlyCents(
  amountCents: number,
  frequency: IncomeFrequency
): number {
  const periods = PERIODS_PER_YEAR[frequency];
  return Math.round((amountCents * periods) / 12);
}
