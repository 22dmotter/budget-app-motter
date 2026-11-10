import type { AppState, PaymentEntry, TrackedDebt } from "@motter/shared";
import { addMonths } from "./money.js";
import { planDebts, type PayoffResult } from "./payoff.js";
import { currentBalanceCents, progressTotals } from "./progress.js";

export type JourneyStation = {
  id: string;
  label: string;
  achieved: boolean;
  /** Date of the first logged fact that crossed this station; never invented. */
  achievedOn: string | null;
  remainingCents: number;
  projectedDate: string | null;
};

export type JourneyNext = {
  station: JourneyStation;
  remainingCents: number;
  projectedDate: string | null;
} | null;

export type Badge = {
  id: string;
  label: string;
  earned: boolean;
  earnedOn: string | null;
  /** One badge per closed debt uses this. */
  debtId?: string;
};

export type Streaks = {
  onPlanMonths: number;
  onPlanMonthsBest: number;
  checkInWeeks: number;
  checkInWeeksBest: number;
};

export type Journey = {
  stations: JourneyStation[];
  next: JourneyNext;
  percentPaid: number;
  paidDownCents: number;
  startingCents: number;
  remainingCents: number;
  streaks: Streaks;
  badges: Badge[];
  /** Minimum-only interest minus current-plan interest. Estimate. */
  interestAvoidedCents: number | null;
  interestAvoidedIsEstimate: true;
  projectedDebtFreeDate: string | null;
  payoff: PayoffResult | null;
};

type HistoryEvent = {
  date: string;
  debtId: string;
  entry: PaymentEntry;
  remainingCents: number;
  reductionCents: number;
  paidOff: boolean;
  prevBalanceCents: number;
};

function startingTotal(debts: TrackedDebt[]): number {
  return debts.reduce((s, d) => s + d.startingCents, 0);
}

function openingRemaining(debts: TrackedDebt[]): number {
  return debts.reduce((s, d) => s + d.openingCents, 0);
}

function latestOpeningDate(debts: TrackedDebt[]): string | null {
  if (!debts.length) return null;
  return debts.reduce((max, d) => (d.openingDate > max ? d.openingDate : max), debts[0]!.openingDate);
}

function chronologicalEntries(debts: TrackedDebt[]): { debtId: string; entry: PaymentEntry }[] {
  const all: { debtId: string; entry: PaymentEntry }[] = [];
  for (const d of debts) {
    for (const e of d.entries) all.push({ debtId: d.id, entry: e });
  }
  all.sort((a, b) => a.entry.date.localeCompare(b.entry.date) || a.entry.id.localeCompare(b.entry.id));
  return all;
}

function walkHistory(debts: TrackedDebt[]): { openingReduction: number; events: HistoryEvent[] } {
  const start = startingTotal(debts);
  const bal = new Map(debts.map((d) => [d.id, d.openingCents]));
  const events: HistoryEvent[] = [];
  for (const item of chronologicalEntries(debts)) {
    const prev = bal.get(item.debtId) ?? 0;
    bal.set(item.debtId, item.entry.balanceCents);
    let remaining = 0;
    for (const v of bal.values()) remaining += v;
    events.push({
      date: item.entry.date,
      debtId: item.debtId,
      entry: item.entry,
      remainingCents: remaining,
      reductionCents: start - remaining,
      paidOff: prev > 0 && item.entry.balanceCents === 0,
      prevBalanceCents: prev,
    });
  }
  return { openingReduction: start - openingRemaining(debts), events };
}

function firstDateFor(
  debts: TrackedDebt[],
  crossed: (reduction: number, event: HistoryEvent | null) => boolean
): string | null {
  const { openingReduction, events } = walkHistory(debts);
  if (crossed(openingReduction, null)) return latestOpeningDate(debts);
  for (const e of events) {
    if (crossed(e.reductionCents, e)) return e.date;
  }
  return null;
}

function plannedMonthlyPayment(state: AppState): number {
  const mins = state.debts.reduce((s, d) => s + d.minimumPaymentCents, 0);
  return mins + state.plan.extraMonthlyCents;
}

/** Monday-start ISO-like week key: YYYY-Www from a YYYY-MM-DD date. */
export function weekKey(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7; // 1..7, Monday=1
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function weekStart(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (day - 1));
  return date.toISOString().slice(0, 10);
}

function weeksInclusive(fromDate: string, toDate: string): string[] {
  const keys: string[] = [];
  let cursor = weekStart(fromDate);
  const end = weekStart(toDate);
  while (cursor <= end) {
    keys.push(weekKey(cursor));
    cursor = addDays(cursor, 7);
  }
  return keys;
}

function monthsInclusive(fromYm: string, toYm: string): string[] {
  const out: string[] = [];
  let cur = fromYm;
  while (cur <= toYm) {
    out.push(cur);
    cur = addMonths(cur, 1);
  }
  return out;
}

/**
 * Check-in streak: consecutive weeks with a log. One missed week per calendar
 * month is forgiven and does not break the streak (and does not add to the count).
 * An in-progress week with no log yet does not break the streak.
 */
export function checkInStreaks(
  debts: TrackedDebt[],
  today: string
): { current: number; best: number } {
  const dates = chronologicalEntries(debts).map((e) => e.entry.date);
  if (!dates.length) return { current: 0, best: 0 };
  const checked = new Set(dates.map(weekKey));
  const weeks = weeksInclusive(dates[0]!, today);
  const currentWeek = weekKey(today);
  let run = 0;
  let best = 0;
  const graceUsed = new Set<string>();
  for (const w of weeks) {
    if (checked.has(w)) {
      run++;
      best = Math.max(best, run);
      continue;
    }
    if (w === currentWeek) {
      // In progress — don't break, don't count.
      break;
    }
    const weekMonth = weekStartFromKey(w).slice(0, 7);
    if (!graceUsed.has(weekMonth)) {
      graceUsed.add(weekMonth);
      best = Math.max(best, run);
      continue;
    }
    best = Math.max(best, run);
    run = 0;
  }
  best = Math.max(best, run);
  return { current: run, best };
}

function weekStartFromKey(key: string): string {
  // Approximate: find a Thursday in that ISO week, then back to Monday.
  const [ys, ws] = key.split("-W");
  const year = Number(ys);
  const week = Number(ws);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (day - 1) + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

/**
 * On-plan months: consecutive calendar months whose logged payments are
 * at least the planned monthly total (minimums + extra). The current month
 * only counts once the target is met; until then it neither adds nor breaks.
 */
export function onPlanMonthStreaks(
  debts: TrackedDebt[],
  plannedMonthlyCents: number,
  today: string
): { current: number; best: number } {
  const entries = chronologicalEntries(debts);
  if (!entries.length) return { current: 0, best: 0 };
  const paidByMonth = new Map<string, number>();
  for (const { entry } of entries) {
    const mk = monthKey(entry.date);
    paidByMonth.set(mk, (paidByMonth.get(mk) ?? 0) + entry.paymentCents);
  }
  const first = monthKey(entries[0]!.entry.date);
  const current = monthKey(today);
  const months = monthsInclusive(first, current);
  let run = 0;
  let best = 0;
  for (const mk of months) {
    const paid = paidByMonth.get(mk) ?? 0;
    const met = plannedMonthlyCents <= 0 ? paid > 0 : paid >= plannedMonthlyCents;
    if (met) {
      run++;
      best = Math.max(best, run);
      continue;
    }
    if (mk === current) break;
    best = Math.max(best, run);
    run = 0;
  }
  best = Math.max(best, run);
  return { current: run, best };
}

function projectDateForReduction(
  payoff: PayoffResult | null,
  startingCents: number,
  targetReduction: number
): string | null {
  if (!payoff?.ok || targetReduction <= 0) return payoff?.debtFreeYearMonth ?? null;
  for (const row of payoff.schedule) {
    if (startingCents - row.endBalanceCents >= targetReduction) {
      return row.yearMonth;
    }
  }
  return payoff.debtFreeYearMonth;
}

function projectDateForDebtClosed(
  payoff: PayoffResult | null,
  debtId: string
): string | null {
  if (!payoff?.ok) return null;
  const summary = payoff.debts.find((d) => d.id === debtId);
  return summary?.payoffYearMonth ?? null;
}

const VERSES = {
  galatians: {
    text: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.",
    citation: "Galatians 6:9, ESV",
  },
  philippians: {
    text: "I can do all things through him who strengthens me.",
    citation: "Philippians 4:13, ESV",
  },
  proverbs: {
    text: "The rich rules over the poor, and the borrower is the slave of the lender.",
    citation: "Proverbs 22:7, ESV",
  },
  romans: {
    text: "Owe no one anything, except to love each other, for the one who loves another has fulfilled the law.",
    citation: "Romans 13:8, ESV",
  },
} as const;

export const MILESTONE_VERSES = VERSES;

export function verseForStation(stationId: string): { text: string; citation: string } {
  if (stationId === "debt-free" || stationId.startsWith("percent-100")) return VERSES.romans;
  if (stationId === "percent-50" || stationId === "first-thousand") return VERSES.proverbs;
  if (stationId.startsWith("debt-closed") || stationId === "first-debt-paid") return VERSES.galatians;
  return VERSES.philippians;
}

function station(
  partial: Omit<JourneyStation, "remainingCents" | "projectedDate"> & {
    remainingCents?: number;
    projectedDate?: string | null;
  }
): JourneyStation {
  return {
    remainingCents: 0,
    projectedDate: null,
    ...partial,
  };
}


function reductionAtPayoffMonth(
  payoff: PayoffResult | null,
  startingCents: number,
  yearMonth: string | null
): number | null {
  if (!payoff?.ok || !yearMonth) return null;
  const row = payoff.schedule.find((r) => r.yearMonth === yearMonth);
  if (!row) return null;
  return startingCents - row.endBalanceCents;
}

type RankedStation = { station: JourneyStation; threshold: number; tie?: number };

function compareRanked(a: RankedStation, b: RankedStation): number {
  if (a.station.achieved !== b.station.achieved) return a.station.achieved ? -1 : 1;
  if (a.station.achieved) {
    const da = a.station.achievedOn ?? "0000-00-00";
    const db = b.station.achievedOn ?? "0000-00-00";
    if (da !== db) return da.localeCompare(db);
  } else {
    const pa = a.station.projectedDate ?? "9999-99";
    const pb = b.station.projectedDate ?? "9999-99";
    if (pa !== pb) return pa.localeCompare(pb);
  }
  if (a.threshold !== b.threshold) return a.threshold - b.threshold;
  const ta = a.tie ?? 0;
  const tb = b.tie ?? 0;
  if (ta !== tb) return ta - tb;
  return a.station.id.localeCompare(b.station.id);
}


function debtAttackIndex(
  debts: TrackedDebt[],
  strategy: AppState["plan"]["strategy"],
  customOrder?: string[] | null
): Map<string, number> {
  const customIndex = new Map((customOrder ?? []).map((id, i) => [id, i]));
  const sorted = debts.slice().sort((a, b) => {
    const ba = currentBalanceCents(a);
    const bb = currentBalanceCents(b);
    if (strategy === "custom") {
      const ai = customIndex.has(a.id) ? customIndex.get(a.id)! : 10_000;
      const bi = customIndex.has(b.id) ? customIndex.get(b.id)! : 10_000;
      return ai - bi;
    }
    if (strategy === "avalanche") return b.aprBps - a.aprBps || ba - bb;
    return ba - bb || b.aprBps - a.aprBps;
  });
  return new Map(sorted.map((d, i) => [d.id, i]));
}

export function deriveJourney(state: AppState, today: string): Journey {
  const debts = state.debts;
  const totals = progressTotals(debts);
  const start = totals.startingCents;
  const reduction = totals.reductionCents;
  const remaining = totals.remainingCents;

  const inputs = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balanceCents: currentBalanceCents(d),
    aprBps: d.aprBps,
    minimumPaymentCents: d.minimumPaymentCents,
  }));
  const payoff =
    inputs.some((d) => d.balanceCents > 0)
      ? planDebts({
          debts: inputs,
          extraMonthlyCents: state.plan.extraMonthlyCents,
          strategy: state.plan.strategy,
          customOrder: state.plan.customOrder,
          lumpSums: state.plan.lumpSums,
          startMonth: today.slice(0, 7),
          compare: true,
        })
      : debts.length
        ? planDebts({
            debts: inputs.map((d) => ({ ...d, balanceCents: 0 })),
            extraMonthlyCents: 0,
            strategy: state.plan.strategy,
            startMonth: today.slice(0, 7),
            compare: false,
          })
        : null;

  const interestAvoidedCents =
    payoff?.vsMinimumOnly?.interestSavedCents != null
      ? Math.max(0, payoff.vsMinimumOnly.interestSavedCents)
      : null;

  const planMade = state.onboardingComplete || debts.length > 0;
  const firstPaymentOn = firstDateFor(debts, (_r, e) => !!e && e.entry.paymentCents > 0);
  const thousandOn = firstDateFor(debts, (r) => r >= 100_000);
  const pct = (p: number) => firstDateFor(debts, (r) => start > 0 && r * 100 >= start * p);

  const payoffEvents: { debtId: string; date: string; name: string; reductionCents: number }[] = [];
  const seenPaid = new Set<string>();
  const { events } = walkHistory(debts);
  for (const e of events) {
    if (e.paidOff && !seenPaid.has(e.debtId)) {
      seenPaid.add(e.debtId);
      const name = debts.find((d) => d.id === e.debtId)?.name ?? "Debt";
      payoffEvents.push({ debtId: e.debtId, date: e.date, name, reductionCents: e.reductionCents });
    }
  }
  // Relock: a later rise means not currently paid off — station "achieved" follows current status,
  // but achievedOn stays the first crossing if currently cleared; if currently not cleared, achieved=false.
  const currentlyCleared = new Set(
    debts.filter((d) => currentBalanceCents(d) === 0 && seenPaid.has(d.id)).map((d) => d.id)
  );

  const need = (targetReduction: number) => Math.max(0, targetReduction - reduction);

  const planMadeStation = station({
    id: "plan-made",
    label: "Plan made",
    achieved: planMade,
    achievedOn: planMade ? latestOpeningDate(debts) : null,
  });
  const firstPaymentStation = station({
    id: "first-payment",
    label: "First payment logged",
    achieved: !!firstPaymentOn,
    achievedOn: firstPaymentOn,
  });

  type Ranked = RankedStation;

  const ranked: Ranked[] = [
    {
      threshold: 100_000,
      station: station({
        id: "first-thousand",
        label: "First $1,000 paid down",
        achieved: reduction >= 100_000,
        achievedOn: thousandOn,
        remainingCents: need(100_000),
        projectedDate: projectDateForReduction(payoff, start, 100_000),
      }),
    },
    {
      threshold: Math.ceil(start * 0.1),
      station: station({
        id: "percent-10",
        label: "10% paid down",
        achieved: start > 0 && reduction * 100 >= start * 10,
        achievedOn: pct(10),
        remainingCents: need(Math.ceil(start * 0.1)),
        projectedDate: projectDateForReduction(payoff, start, Math.ceil(start * 0.1)),
      }),
    },
    {
      threshold: Math.ceil(start * 0.25),
      station: station({
        id: "percent-25",
        label: "25% paid down",
        achieved: start > 0 && reduction * 100 >= start * 25,
        achievedOn: pct(25),
        remainingCents: need(Math.ceil(start * 0.25)),
        projectedDate: projectDateForReduction(payoff, start, Math.ceil(start * 0.25)),
      }),
    },
    {
      threshold: Math.ceil(start * 0.5),
      station: station({
        id: "percent-50",
        label: "50% Halfway Home",
        achieved: start > 0 && reduction * 100 >= start * 50,
        achievedOn: pct(50),
        remainingCents: need(Math.ceil(start * 0.5)),
        projectedDate: projectDateForReduction(payoff, start, Math.ceil(start * 0.5)),
      }),
    },
    {
      threshold: Math.ceil(start * 0.75),
      station: station({
        id: "percent-75",
        label: "75% paid down",
        achieved: start > 0 && reduction * 100 >= start * 75,
        achievedOn: pct(75),
        remainingCents: need(Math.ceil(start * 0.75)),
        projectedDate: projectDateForReduction(payoff, start, Math.ceil(start * 0.75)),
      }),
    },
  ];

  const attack = debtAttackIndex(debts, state.plan.strategy, state.plan.customOrder);
  for (const d of debts) {
    const ev = payoffEvents.find((p) => p.debtId === d.id);
    const cleared = currentlyCleared.has(d.id);
    const projectedDate = projectDateForDebtClosed(payoff, d.id);
    const threshold = ev
      ? ev.reductionCents
      : (reductionAtPayoffMonth(payoff, start, projectedDate) ?? start);
    ranked.push({
      threshold,
      tie: attack.get(d.id) ?? 999,
      station: station({
        id: `debt-closed:${d.id}`,
        label: `Paid off: ${d.name}`,
        achieved: cleared,
        achievedOn: cleared ? ev?.date ?? null : null,
        remainingCents: currentBalanceCents(d),
        projectedDate,
      }),
    });
  }

  ranked.push({
    threshold: start,
    tie: 10_000,
    station: station({
      id: "debt-free",
      label: "100% Debt-Free",
      achieved: start > 0 && remaining === 0 && currentlyCleared.size === debts.length && debts.length > 0,
      achievedOn: pct(100),
      remainingCents: remaining,
      projectedDate: payoff?.debtFreeYearMonth ?? null,
    }),
  });

  ranked.sort(compareRanked);
  const firstDebt = ranked.find((r) => r.station.id.startsWith("debt-closed:"));
  if (firstDebt) {
    const name = debts.find((d) => `debt-closed:${d.id}` === firstDebt.station.id)?.name ?? "Debt";
    firstDebt.station.label = `First debt paid off: ${name}`;
  }

  const stations: JourneyStation[] = [planMadeStation, firstPaymentStation, ...ranked.map((r) => r.station)];

  // Fix remaining for already-achieved
  for (const s of stations) {
    if (s.achieved) s.remainingCents = 0;
  }

  const nextStation = stations.find((s) => !s.achieved) ?? null;
  const next: JourneyNext = nextStation
    ? {
        station: nextStation,
        remainingCents: nextStation.remainingCents,
        projectedDate: nextStation.projectedDate,
      }
    : null;

  const planned = plannedMonthlyPayment(state);
  const onPlan = onPlanMonthStreaks(debts, planned, today);
  const checkIn = checkInStreaks(debts, today);

  const extraMileOn = extraMileDate(debts, planned);
  const firstClosed = payoffEvents.find((p) => currentlyCleared.has(p.debtId));

  const badges: Badge[] = [
    {
      id: "first-step",
      label: "First Step",
      earned: !!firstPaymentOn,
      earnedOn: firstPaymentOn,
    },
    {
      id: "snowball-rolling",
      label: "Snowball Rolling",
      earned: currentlyCleared.size > 0 && debts.length > 1,
      earnedOn:
        currentlyCleared.size > 0 && debts.length > 1 ? firstClosed?.date ?? null : null,
    },
    ...debts.map((d) => ({
      id: `debt-closed:${d.id}`,
      label: `Debt Closed: ${d.name}`,
      earned: currentlyCleared.has(d.id),
      earnedOn: currentlyCleared.has(d.id)
        ? payoffEvents.find((p) => p.debtId === d.id)?.date ?? null
        : null,
      debtId: d.id,
    })),
    {
      id: "extra-mile",
      label: "Extra Mile",
      earned: !!extraMileOn,
      earnedOn: extraMileOn,
    },
    {
      id: "halfway-home",
      label: "Halfway Home",
      earned: start > 0 && reduction * 100 >= start * 50,
      earnedOn: pct(50),
    },
    {
      id: "faithful-giver",
      label: "Faithful Giver",
      earned: state.categories.some((c) => c.group === "giving" && c.plannedCents > 0),
      earnedOn: null,
    },
    {
      id: "debt-free",
      label: "Debt-Free",
      earned: start > 0 && remaining === 0 && debts.length > 0 && currentlyCleared.size === debts.length,
      earnedOn: pct(100),
    },
  ];

  return {
    stations,
    next,
    percentPaid: totals.percent,
    paidDownCents: Math.max(0, totals.reductionCents),
    startingCents: start,
    remainingCents: remaining,
    streaks: {
      onPlanMonths: onPlan.current,
      onPlanMonthsBest: onPlan.best,
      checkInWeeks: checkIn.current,
      checkInWeeksBest: checkIn.best,
    },
    badges,
    interestAvoidedCents,
    interestAvoidedIsEstimate: true,
    projectedDebtFreeDate: payoff?.ok ? payoff.debtFreeYearMonth : null,
    payoff: payoff,
  };
}

function extraMileDate(debts: TrackedDebt[], plannedMonthlyCents: number): string | null {
  const mins = debts.reduce((s, d) => s + d.minimumPaymentCents, 0);
  const target = Math.max(plannedMonthlyCents, mins);
  if (target <= 0) return null;
  const byMonth = new Map<string, { paid: number; firstDate: string }>();
  for (const { entry } of chronologicalEntries(debts)) {
    const mk = monthKey(entry.date);
    const cur = byMonth.get(mk) ?? { paid: 0, firstDate: entry.date };
    cur.paid += entry.paymentCents;
    byMonth.set(mk, cur);
  }
  const months = [...byMonth.keys()].sort();
  for (const mk of months) {
    const row = byMonth.get(mk)!;
    if (row.paid > target) return row.firstDate;
  }
  return null;
}

export function uncelebratedStations(journey: Journey, celebratedIds: string[]): JourneyStation[] {
  const seen = new Set(celebratedIds);
  const firstDebt = journey.stations.find((s) => s.id.startsWith("debt-closed:"));
  return journey.stations.filter((s) => {
    if (!s.achieved || seen.has(s.id)) return false;
    if (firstDebt && s.id === firstDebt.id && seen.has("first-debt-paid")) return false;
    return true;
  });
}
