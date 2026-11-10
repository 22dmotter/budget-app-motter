import { dollarsToCents, MAX_MONTHS, monthlyInterestCents } from "./money.js";

export type AmortizeResult =
  | {
      ok: true;
      months: number;
      interestCents: number;
      totalPaidCents: number;
      lastPaymentCents: number;
      rows: { month: number; paymentCents: number; interestCents: number; balanceCents: number }[];
    }
  | { ok: false; reason: "interest" | "cap"; months?: number; remainingCents?: number };

/**
 * Required *unrounded* dollar payment to repay `principalDollars` over `months`
 * at APR% — standard amortization formula. Callers should ceil this to a cent
 * and bump until `amortize` finishes on time (rounding of monthly interest
 * can otherwise slip a month).
 */
export function requiredPaymentDollars(
  principalDollars: number,
  aprPercent: number,
  months: number
): number {
  if (months <= 0) return principalDollars;
  const r = aprPercent / 1200;
  if (r === 0) return principalDollars / months;
  return (principalDollars * r) / (1 - Math.pow(1 + r, -months));
}

/** Amortize one loan with a fixed payment (cents). Last payment may be partial. */
export function amortize(
  principalCents: number,
  aprBps: number,
  paymentCents: number,
  maxMonths: number = MAX_MONTHS
): AmortizeResult {
  const rows: {
    month: number;
    paymentCents: number;
    interestCents: number;
    balanceCents: number;
  }[] = [];
  if (principalCents <= 0) {
    return {
      ok: true,
      months: 0,
      interestCents: 0,
      totalPaidCents: 0,
      lastPaymentCents: 0,
      rows,
    };
  }
  const firstInterest = monthlyInterestCents(principalCents, aprBps);
  if (paymentCents <= firstInterest) return { ok: false, reason: "interest" };

  let bal = principalCents;
  let interest = 0;
  let paid = 0;
  let m = 0;
  let pay = 0;
  while (bal > 0 && m < maxMonths) {
    const i = monthlyInterestCents(bal, aprBps);
    bal += i;
    interest += i;
    pay = Math.min(paymentCents, bal);
    bal -= pay;
    paid += pay;
    m++;
    rows.push({
      month: m,
      paymentCents: pay,
      interestCents: i,
      balanceCents: bal,
    });
  }
  if (bal > 0) return { ok: false, reason: "cap", months: m, remainingCents: bal };
  return {
    ok: true,
    months: m,
    interestCents: interest,
    totalPaidCents: paid,
    lastPaymentCents: pay,
    rows,
  };
}

export type PaymentNeededResult = AmortizeResult & { paymentCents: number };

/** Level payment (cents) needed to pay off a balance in `targetMonths`. */
export function paymentNeeded(
  balanceCents: number,
  aprBps: number,
  targetMonths: number
): PaymentNeededResult {
  const aprPercent = aprBps / 100;
  const raw = requiredPaymentDollars(balanceCents / 100, aprPercent, targetMonths);
  let pc = Math.ceil(dollarsToCents(raw / 1) - 1e-9);
  // requiredPayment is in dollars already
  pc = Math.ceil(raw * 100 - 1e-9);
  if (pc < 1 && balanceCents > 0) pc = 1;
  let res = amortize(balanceCents, aprBps, pc, targetMonths + 1);
  while (res.ok && res.months > targetMonths) {
    pc++;
    res = amortize(balanceCents, aprBps, pc, targetMonths + 1);
  }
  return { ...res, paymentCents: pc };
}

/** Months to pay off a balance at a given payment, or a failure reason. */
export function monthsToPayoff(
  balanceCents: number,
  aprBps: number,
  paymentCents: number,
  maxMonths: number = MAX_MONTHS
): AmortizeResult {
  return amortize(balanceCents, aprBps, paymentCents, maxMonths);
}
