/**
 * Preview pricing for Budget App. Edit amounts and copy here —
 * the /pricing page reads only from this file.
 *
 * Checkout is not live. These numbers are a proposal, not an offer.
 */
export const pricing = {
  preview: true,
  previewLabel: "Preview — pricing is not final, and checkout is not live yet",
  currency: "USD",
  plus: {
    id: "plus",
    monthlyCents: 599,
    annualCents: 4900,
    /** 4900 / 12, for display only */
    annualMonthlyEquivalentCents: 408,
    annualSavingsPercent: 32,
  },
  roadmap: {
    id: "roadmap",
    oneTimeCents: 3900,
    plusMemberCents: 2900,
  },
  founder: {
    seats: 500,
    lockYears: 2,
    annualCents: 4900,
  },
  trialDays: 30,
  refundDays: 30,
  verse: {
    text: "Owe no one anything, except to love each other.",
    citation: "Romans 13:8, ESV",
    note: "Offered as encouragement, not a rulebook.",
  },
} as const;

export type Pricing = typeof pricing;

export function formatUsdFromCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars)
    ? `$${dollars}`
    : `$${dollars.toFixed(2)}`;
}

export const calculatorHref = "/calculator";
export const worksheetHref = "/free-worksheet";
