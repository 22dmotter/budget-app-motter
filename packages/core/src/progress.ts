import type { TrackedDebt } from "@motter/shared";

export function currentBalanceCents(debt: TrackedDebt): number {
  const last = debt.entries[debt.entries.length - 1];
  return last ? last.balanceCents : debt.openingCents;
}

export type ProgressTotals = {
  startingCents: number;
  remainingCents: number;
  paidCents: number;
  reductionCents: number;
  percent: number;
  debtCount: number;
  paidOffCount: number;
};

/**
 * Totals from *logged* history only. Payment cents are what the user recorded;
 * reduction is starting − remaining and can differ from payments (interest,
 * new charges). We never invent payments.
 */
export function progressTotals(debts: TrackedDebt[]): ProgressTotals {
  const t: ProgressTotals = {
    startingCents: 0,
    remainingCents: 0,
    paidCents: 0,
    reductionCents: 0,
    percent: 0,
    debtCount: debts.length,
    paidOffCount: 0,
  };
  for (const d of debts) {
    t.startingCents += d.startingCents;
    t.remainingCents += currentBalanceCents(d);
    let previous = d.openingCents;
    let cleared = false;
    for (const e of d.entries) {
      t.paidCents += e.paymentCents;
      if (previous > 0 && e.balanceCents === 0) cleared = true;
      previous = e.balanceCents;
    }
    // Opening at zero alone is not a payoff event. A later rise relocks this.
    if (currentBalanceCents(d) === 0 && cleared) t.paidOffCount++;
  }
  t.reductionCents = t.startingCents - t.remainingCents;
  t.percent = t.startingCents
    ? Math.max(0, Math.min(100, (t.reductionCents / t.startingCents) * 100))
    : 0;
  return t;
}

export type Milestone = {
  id: string;
  label: string;
  active: boolean;
  verse?: { text: string; citation: string };
};

const VERSES = {
  start: {
    text: "For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?",
    citation: "Luke 14:28, ESV",
  },
  midway: {
    text: "The rich rules over the poor, and the borrower is the slave of the lender.",
    citation: "Proverbs 22:7, ESV",
  },
  free: {
    text: "Owe no one anything, except to love each other, for the one who loves another has fulfilled the law.",
    citation: "Romans 13:8, ESV",
  },
} as const;

export function milestones(debts: TrackedDebt[]): Milestone[] {
  const t = progressTotals(debts);
  const has = t.debtCount > 0;
  const list: Milestone[] = [
    {
      id: "payment",
      label: "First payment recorded",
      active: has && t.paidCents > 0,
      verse: VERSES.start,
    },
    {
      id: "reduction",
      label: "First net balance reduction",
      active: has && t.reductionCents > 0,
    },
    {
      id: "cleared",
      label: "A debt paid off",
      active: has && t.paidOffCount > 0,
      verse: VERSES.midway,
    },
  ];
  for (const p of [25, 50, 75, 100] as const) {
    list.push({
      id: `percent-${p}`,
      label:
        p === 100
          ? "All tracked balances at zero"
          : `${p}% of starting debt paid down`,
      active: has && t.reductionCents * 100 >= t.startingCents * p,
      verse: p === 100 ? VERSES.free : p === 50 ? VERSES.midway : undefined,
    });
  }
  return list;
}
