import {
  AppStateSchema,
  SCHEMA_VERSION,
  type AppState,
  type PaymentEntry,
  type TrackedDebt,
} from "@motter/shared";
import { currentYearMonth, isValidIsoDate } from "./money.js";

export const MAX_STATE_BYTES = 2_000_000;
export const LOCAL_PLAN_KEY = "budget-app-plan-v1";
export const LOCAL_CALCULATOR_KEY = "budget-app-calculator-v1";

export class StateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateError";
  }
}

export function emptyAppState(now = new Date()): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    entitlements: { tier: "free" },
    incomes: [],
    categories: [],
    debts: [],
    plan: {
      strategy: "snowball",
      extraMonthlyCents: 0,
      lumpSums: [],
      startMonth: currentYearMonth(now),
    },
    onboardingComplete: false,
    onboardingStep: 1,
    celebratedIds: [],
    hideDanielStory: false,
  };
}

function uniqueIds(state: AppState) {
  const seen = new Set<string>();
  const take = (id: string, label: string) => {
    if (seen.has(id)) throw new StateError(`Duplicate ${label} id.`);
    seen.add(id);
  };
  for (const i of state.incomes) take(i.id, "income");
  for (const c of state.categories) take(c.id, "category");
  for (const d of state.debts) {
    take(d.id, "debt");
    for (const e of d.entries) take(e.id, "entry");
  }
}

function assertDateOrder(debt: TrackedDebt, today: string) {
  if (!isValidIsoDate(debt.startDate) || !isValidIsoDate(debt.openingDate)) {
    throw new StateError("Use a real calendar date (YYYY-MM-DD).");
  }
  if (debt.startDate < "1900-01-01" || debt.openingDate < "1900-01-01") {
    throw new StateError("Dates must be on or after 1900-01-01.");
  }
  if (debt.startDate > today || debt.openingDate > today) {
    throw new StateError("Dates cannot be in the future.");
  }
  if (debt.openingDate < debt.startDate) {
    throw new StateError("The first balance date cannot be before the journey start date.");
  }
  let last = debt.openingDate;
  for (const e of debt.entries) {
    if (!isValidIsoDate(e.date)) throw new StateError("Use a real calendar date (YYYY-MM-DD).");
    if (e.date > today) throw new StateError("Dates cannot be in the future.");
    if (e.date < last) {
      throw new StateError(
        "Entries must be in date order, on or after the first balance date."
      );
    }
    last = e.date;
  }
}

/** Validate a parsed app state, including chronology that Zod cannot see. */
export function validateAppState(input: unknown, today: string): AppState {
  const parsed = AppStateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new StateError(first?.message ?? "Backup has missing or invalid fields.");
  }
  const state = parsed.data;
  uniqueIds(state);
  for (const d of state.debts) assertDateOrder(d, today);
  return state;
}

export function parseAppState(raw: string, today: string): AppState {
  if (typeof raw !== "string" || raw.length > MAX_STATE_BYTES) {
    throw new StateError("Backup must be a JSON file no larger than 2 MB.");
  }
  if (new TextEncoder().encode(raw).length > MAX_STATE_BYTES) {
    throw new StateError("Backup must be a JSON file no larger than 2 MB.");
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new StateError("This file is not valid JSON. Your current plan has not been changed.");
  }
  return validateAppState(data, today);
}

export function serializeAppState(state: AppState, today: string): string {
  return JSON.stringify(validateAppState(state, today), null, 2);
}

export function cloneState(state: AppState): AppState {
  return structuredClone(state);
}

export function addDebt(state: AppState, debt: TrackedDebt, today: string): AppState {
  const next = cloneState(state);
  next.debts.push(debt);
  return validateAppState(next, today);
}

export function removeDebt(state: AppState, debtId: string, today: string): AppState {
  if (!state.debts.some((d) => d.id === debtId)) throw new StateError("Debt not found.");
  return validateAppState(
    { ...state, debts: state.debts.filter((d) => d.id !== debtId) },
    today
  );
}

export function addPaymentEntry(
  state: AppState,
  debtId: string,
  entry: PaymentEntry,
  today: string
): AppState {
  const next = cloneState(state);
  const debt = next.debts.find((d) => d.id === debtId);
  if (!debt) throw new StateError("Debt not found.");
  debt.entries.push(entry);
  return validateAppState(next, today);
}

/** Undo the most recent history entry on a debt. */
export function undoLastEntry(state: AppState, debtId: string, today: string): AppState {
  const next = cloneState(state);
  const debt = next.debts.find((d) => d.id === debtId);
  if (!debt) throw new StateError("Debt not found.");
  if (!debt.entries.length) throw new StateError("No entry to undo.");
  debt.entries.pop();
  return validateAppState(next, today);
}

/** Undo the chronologically latest entry across all debts (ties: last debt wins). */
export function undoLatestEntry(state: AppState, today: string): AppState {
  let best: { debtId: string; date: string; index: number } | null = null;
  for (const d of state.debts) {
    if (!d.entries.length) continue;
    const idx = d.entries.length - 1;
    const e = d.entries[idx]!;
    if (!best || e.date >= best.date) best = { debtId: d.id, date: e.date, index: idx };
  }
  if (!best) throw new StateError("No entry to undo.");
  return undoLastEntry(state, best.debtId, today);
}
