import type {
  CalculatorDebtInput,
  LumpSum,
  PayoffStrategy,
} from "@motter/shared";
import { addMonths, MAX_MONTHS, monthlyInterestCents } from "./money.js";

export type PayoffDebtInput = CalculatorDebtInput & { id: string };

export type MonthDebtRow = {
  id: string;
  name: string;
  startBalanceCents: number;
  interestCents: number;
  paymentCents: number;
  endBalanceCents: number;
};

export type MonthScheduleRow = {
  month: number;
  yearMonth: string | null;
  debts: MonthDebtRow[];
  paymentCents: number;
  interestCents: number;
  endBalanceCents: number;
};

export type DebtPayoffSummary = {
  id: string;
  name: string;
  startBalanceCents: number;
  aprBps: number;
  minimumPaymentCents: number;
  interestCents: number;
  paidCents: number;
  payoffMonth: number | null;
  payoffYearMonth: string | null;
};

export type NonAmortizingWarning = {
  id: string;
  name: string;
  monthlyInterestCents: number;
  minimumPaymentCents: number;
};

export type PayoffComparison = {
  interestSavedCents: number | null;
  monthsSaved: number | null;
  otherCapped: boolean;
  otherMonths: number | null;
  otherInterestCents: number | null;
};

export type PayoffResult = {
  ok: boolean;
  reason?: "interest" | "cap" | "empty";
  months: number;
  interestCents: number;
  totalPaidCents: number;
  startTotalCents: number;
  budgetCents: number;
  debtFreeYearMonth: string | null;
  strategy: PayoffStrategy;
  debts: DebtPayoffSummary[];
  schedule: MonthScheduleRow[];
  warnings: NonAmortizingWarning[];
  remainingCents: number;
  vsMinimumOnly?: PayoffComparison;
  vsSnowball?: PayoffComparison;
  vsAvalanche?: PayoffComparison;
};

export type PlanDebtsInput = {
  debts: PayoffDebtInput[];
  extraMonthlyCents: number;
  strategy: PayoffStrategy;
  customOrder?: string[];
  lumpSums?: LumpSum[];
  startMonth?: string;
  maxMonths?: number;
  /** When true, also run min-only and the alternate strategy for comparisons. */
  compare?: boolean;
};

function orderIds(
  active: PayoffWorking[],
  strategy: PayoffStrategy,
  customOrder: string[] | undefined
): PayoffWorking[] {
  const customIndex = new Map((customOrder ?? []).map((id, i) => [id, i]));
  return active.slice().sort((a, b) => {
    if (strategy === "custom") {
      const ai = customIndex.has(a.id) ? customIndex.get(a.id)! : 10_000 + a.idx;
      const bi = customIndex.has(b.id) ? customIndex.get(b.id)! : 10_000 + b.idx;
      return ai - bi || a.idx - b.idx;
    }
    if (strategy === "avalanche") {
      return b.aprBps - a.aprBps || a.bal - b.bal || a.idx - b.idx;
    }
    return a.bal - b.bal || b.aprBps - a.aprBps || a.idx - b.idx;
  });
}

type PayoffWorking = {
  id: string;
  name: string;
  idx: number;
  aprBps: number;
  start: number;
  bal: number;
  min: number;
  interest: number;
  paid: number;
  payoffMonth: number | null;
};

function lumpForMonth(lumps: LumpSum[], month: number): number {
  let n = 0;
  for (const l of lumps) {
    if (l.month === month) n += l.amountCents;
  }
  return n;
}

function runPlan(input: PlanDebtsInput): PayoffResult {
  const maxMonths = input.maxMonths ?? MAX_MONTHS;
  const lumps = input.lumpSums ?? [];
  const startMonth = input.startMonth;
  const ym = (month: number) =>
    startMonth ? addMonths(startMonth, month - 1) : null;

  const ds: PayoffWorking[] = input.debts.map((d, idx) => ({
    id: d.id,
    name: d.name,
    idx,
    aprBps: d.aprBps,
    start: d.balanceCents,
    bal: d.balanceCents,
    min: d.minimumPaymentCents,
    interest: 0,
    paid: 0,
    payoffMonth: d.balanceCents > 0 ? null : 0,
  }));

  const budget = ds.reduce((s, d) => s + d.min, 0) + input.extraMonthlyCents;
  const startTotal = ds.reduce((s, d) => s + d.bal, 0);
  const firstInterest = ds.reduce(
    (s, d) => s + monthlyInterestCents(d.bal, d.aprBps),
    0
  );

  const warnings: NonAmortizingWarning[] = ds
    .filter((d) => d.bal > 0 && d.min <= monthlyInterestCents(d.bal, d.aprBps))
    .map((d) => ({
      id: d.id,
      name: d.name,
      monthlyInterestCents: monthlyInterestCents(d.bal, d.aprBps),
      minimumPaymentCents: d.min,
    }));

  const baseDebts = (): DebtPayoffSummary[] =>
    ds.map((d) => ({
      id: d.id,
      name: d.name,
      startBalanceCents: d.start,
      aprBps: d.aprBps,
      minimumPaymentCents: d.min,
      interestCents: d.interest,
      paidCents: d.paid,
      payoffMonth: d.payoffMonth,
      payoffYearMonth:
        d.payoffMonth && d.payoffMonth > 0 ? ym(d.payoffMonth) : startMonth ?? null,
    }));

  if (startTotal <= 0) {
    return {
      ok: true,
      months: 0,
      interestCents: 0,
      totalPaidCents: 0,
      startTotalCents: 0,
      budgetCents: budget,
      debtFreeYearMonth: startMonth ?? null,
      strategy: input.strategy,
      debts: baseDebts(),
      schedule: [],
      warnings: [],
      remainingCents: 0,
    };
  }

  // If this month's whole budget cannot cover this month's interest, balances grow forever.
  if (budget + lumpForMonth(lumps, 1) <= firstInterest) {
    return {
      ok: false,
      reason: "interest",
      months: 0,
      interestCents: 0,
      totalPaidCents: 0,
      startTotalCents: startTotal,
      budgetCents: budget,
      debtFreeYearMonth: null,
      strategy: input.strategy,
      debts: baseDebts(),
      schedule: [],
      warnings,
      remainingCents: startTotal,
    };
  }

  const schedule: MonthScheduleRow[] = [];
  let m = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  while (m < maxMonths) {
    const owing = ds.filter((d) => d.bal > 0);
    if (!owing.length) break;
    m++;

    const starts = new Map(ds.map((d) => [d.id, d.bal]));
    let monthInt = 0;
    const interestById = new Map<string, number>();
    for (const d of owing) {
      const i = monthlyInterestCents(d.bal, d.aprBps);
      d.bal += i;
      d.interest += i;
      monthInt += i;
      interestById.set(d.id, i);
    }

    let left = budget + lumpForMonth(lumps, m);
    const paymentById = new Map<string, number>();
    const addPay = (d: PayoffWorking, p: number) => {
      if (p <= 0) return;
      d.bal -= p;
      d.paid += p;
      left -= p;
      paymentById.set(d.id, (paymentById.get(d.id) ?? 0) + p);
    };

    // 1) each debt's minimum (up to what's owed)
    for (const d of owing) {
      const p = Math.min(d.min, d.bal, left);
      addPay(d, p);
    }

    // 2) extra + freed minimums + lump sum, in strategy order (by remaining after mins)
    const stillOwing = owing.filter((d) => d.bal > 0);
    for (const d of orderIds(stillOwing, input.strategy, input.customOrder)) {
      if (left <= 0) break;
      addPay(d, Math.min(left, d.bal));
    }

    for (const d of owing) {
      if (d.bal === 0 && d.payoffMonth === null) d.payoffMonth = m;
    }

    const endTotal = ds.reduce((s, d) => s + d.bal, 0);
    const monthPaid = [...paymentById.values()].reduce((s, n) => s + n, 0);
    totalInterest += monthInt;
    totalPaid += monthPaid;

    schedule.push({
      month: m,
      yearMonth: ym(m),
      debts: ds.map((d) => ({
        id: d.id,
        name: d.name,
        startBalanceCents: starts.get(d.id) ?? 0,
        interestCents: interestById.get(d.id) ?? 0,
        paymentCents: paymentById.get(d.id) ?? 0,
        endBalanceCents: d.bal,
      })),
      paymentCents: monthPaid,
      interestCents: monthInt,
      endBalanceCents: endTotal,
    });
  }

  const remaining = ds.reduce((s, d) => s + d.bal, 0);
  if (remaining > 0) {
    return {
      ok: false,
      reason: "cap",
      months: m,
      interestCents: totalInterest,
      totalPaidCents: totalPaid,
      startTotalCents: startTotal,
      budgetCents: budget,
      debtFreeYearMonth: null,
      strategy: input.strategy,
      debts: baseDebts(),
      schedule,
      warnings,
      remainingCents: remaining,
    };
  }

  return {
    ok: true,
    months: m,
    interestCents: totalInterest,
    totalPaidCents: totalPaid,
    startTotalCents: startTotal,
    budgetCents: budget,
    debtFreeYearMonth: m === 0 ? (startMonth ?? null) : ym(m),
    strategy: input.strategy,
    debts: baseDebts(),
    schedule,
    warnings,
    remainingCents: 0,
  };
}

function comparison(primary: PayoffResult, other: PayoffResult): PayoffComparison {
  if (!other.ok) {
    return {
      interestSavedCents: primary.ok ? other.interestCents - primary.interestCents : null,
      monthsSaved: primary.ok ? other.months - primary.months : null,
      otherCapped: true,
      otherMonths: other.months,
      otherInterestCents: other.interestCents,
    };
  }
  return {
    interestSavedCents: other.interestCents - primary.interestCents,
    monthsSaved: other.months - primary.months,
    otherCapped: false,
    otherMonths: other.months,
    otherInterestCents: other.interestCents,
  };
}

/** Multi-debt payoff planner. Budget = sum of minimums + extra, held constant; freed payments roll over. */
export function planDebts(input: PlanDebtsInput): PayoffResult {
  const result = runPlan(input);
  if (!input.compare) return result;

  const minOnly = runPlan({ ...input, extraMonthlyCents: 0, lumpSums: [], compare: false });
  result.vsMinimumOnly = comparison(result, minOnly);

  if (input.strategy !== "snowball") {
    result.vsSnowball = comparison(
      result,
      runPlan({ ...input, strategy: "snowball", compare: false })
    );
  }
  if (input.strategy !== "avalanche") {
    result.vsAvalanche = comparison(
      result,
      runPlan({ ...input, strategy: "avalanche", compare: false })
    );
  }
  return result;
}

/**
 * Quick estimate treating all debt as a single 0% balance paid with
 * (minimums + extra) each month. Interest is *not* included — use planDebts
 * with each debt's APR for an exact date.
 */
export function estimateDebtFreeMonths(
  totalDebtCents: number,
  monthlyPaymentCents: number
): { ok: boolean; months: number; reason?: "payment" | "empty" } {
  if (totalDebtCents <= 0) return { ok: true, months: 0 };
  if (monthlyPaymentCents <= 0) return { ok: false, months: 0, reason: "payment" };
  const months = Math.ceil(totalDebtCents / monthlyPaymentCents);
  if (months > MAX_MONTHS) return { ok: false, months: MAX_MONTHS, reason: "payment" };
  return { ok: true, months };
}
