import { describe, it, expect } from "vitest";
import {
  addDebt,
  addPaymentEntry,
  emptyAppState,
  parseAppState,
  removeDebt,
  serializeAppState,
  undoLastEntry,
  validateAppState,
  StateError,
} from "../src/state.js";
import { currentBalanceCents, milestones, progressTotals } from "../src/progress.js";
import { canUse, defaultEntitlements, isPlusFeature, showPlusBadge } from "../src/entitlements.js";
import type { AppState, TrackedDebt, PaymentEntry } from "@motter/shared";

const NOW = "2026-11-08";

function debt(id = "one", overrides: Partial<TrackedDebt> = {}): TrackedDebt {
  return {
    id,
    name: "Test debt",
    startDate: "2026-11-01",
    startingCents: 10000,
    openingDate: "2026-11-05",
    openingCents: 10000,
    aprBps: 0,
    minimumPaymentCents: 1000,
    entries: [],
    ...overrides,
  };
}

function entry(id = "payment", overrides: Partial<PaymentEntry> = {}): PaymentEntry {
  return {
    id,
    date: "2026-11-06",
    paymentCents: 3000,
    balanceCents: 7500,
    ...overrides,
  };
}

function state(...debts: TrackedDebt[]): AppState {
  const base = emptyAppState(new Date("2026-11-08T12:00:00"));
  return validateAppState({ ...base, debts, plan: { ...base.plan, startMonth: "2026-11" } }, NOW);
}

describe("progress from logged history", () => {
  it("does not invent payments on a new debt", () => {
    const s = state(debt("one", { openingCents: 6500 }));
    const t = progressTotals(s.debts);
    expect(t.paidCents).toBe(0);
    expect(t.reductionCents).toBe(3500);
    expect(milestones(s.debts).find((m) => m.id === "payment")?.active).toBe(false);
  });

  it("treats payment and balance reduction as separate facts", () => {
    const t = progressTotals(state(debt("one", { entries: [entry()] })).debts);
    expect(t.paidCents).toBe(3000);
    expect(t.reductionCents).toBe(2500);
    expect(t.remainingCents).toBe(7500);
    expect(t.percent).toBe(25);
  });

  it("requires a logged payoff event, not just a zero opening balance", () => {
    const t = progressTotals(state(debt("one", { openingCents: 0, startingCents: 10000 })).debts);
    expect(t.paidOffCount).toBe(0);
    expect(milestones(state(debt("one", { openingCents: 0, startingCents: 10000 })).debts)
      .find((m) => m.id === "cleared")?.active).toBe(false);
  });

  it("unlocks 25/50/75/100 at exact thresholds and not a cent early", () => {
    for (const p of [25, 50, 75, 100]) {
      const at = state(debt("one", { openingCents: 10000 - p * 100 }));
      expect(milestones(at.debts).find((m) => m.id === `percent-${p}`)?.active).toBe(true);
      const before = state(debt("one", { openingCents: 10001 - p * 100 }));
      expect(milestones(before.debts).find((m) => m.id === `percent-${p}`)?.active).toBe(false);
    }
  });

  it("a later balance rise relocks paid-off status", () => {
    let s = state(debt("one", { entries: [entry("payoff", { balanceCents: 0 })] }));
    expect(progressTotals(s.debts).paidOffCount).toBe(1);
    s = addPaymentEntry(
      s,
      "one",
      entry("borrow", { date: "2026-11-07", paymentCents: 0, balanceCents: 12000 }),
      NOW
    );
    expect(progressTotals(s.debts).paidOffCount).toBe(0);
    expect(milestones(s.debts).find((m) => m.id === "cleared")?.active).toBe(false);
  });

  it("undo restores the prior balance and does not mutate the original", () => {
    const s = state(debt("one", { entries: [entry()] }));
    const u = undoLastEntry(s, "one", NOW);
    expect(currentBalanceCents(u.debts[0]!)).toBe(10000);
    expect(progressTotals(u.debts).paidCents).toBe(0);
    expect(s.debts[0]!.entries.length).toBe(1);
  });
});

describe("import / export validation", () => {
  it("round-trips a valid state", () => {
    const s = state(debt("one", { entries: [entry()] }));
    const n = parseAppState(serializeAppState(s, NOW), NOW);
    expect(n.debts).toEqual(s.debts);
    expect(progressTotals(n.debts)).toEqual(progressTotals(s.debts));
  });

  it("rejects corrupt JSON and unsupported versions", () => {
    expect(() => parseAppState("{", NOW)).toThrow(StateError);
    expect(() => parseAppState(JSON.stringify({ schemaVersion: 2, debts: [] }), NOW)).toThrow(
      /schemaVersion|invalid/i
    );
  });

  it("rejects extra keys (strict schema)", () => {
    const s = state(debt());
    expect(() => validateAppState({ ...s, hacked: true }, NOW)).toThrow(StateError);
  });

  it("rejects out-of-order history, future dates, and duplicate ids", () => {
    expect(() =>
      state(
        debt("one", {
          entries: [
            entry("a", { date: "2026-11-07" }),
            entry("b", { date: "2026-11-06" }),
          ],
        })
      )
    ).toThrow(/date order/i);
    expect(() => state(debt("one"), debt("one"))).toThrow(/duplicate/i);
    expect(() =>
      validateAppState(
        { ...emptyAppState(), debts: [debt("one", { openingDate: "2026-11-09" })], plan: { ...emptyAppState().plan, startMonth: "2026-11" } },
        NOW
      )
    ).toThrow(/future/i);
  });

  it("removeDebt only drops that debt's balances and payments", () => {
    const a = debt("one", { entries: [entry()] });
    const b = debt("two", { startingCents: 3333, openingCents: 3030 });
    const s = removeDebt(state(a, b), "one", NOW);
    expect(progressTotals(s.debts)).toEqual(progressTotals(state(b).debts));
  });

  it("addDebt does not mutate the original state", () => {
    const s = state();
    const n = addDebt(s, debt("two"), NOW);
    expect(s.debts.length).toBe(0);
    expect(n.debts.length).toBe(1);
  });
});

describe("entitlements (unlocked until payments exist)", () => {
  it("marks Plus features but does not lock them", () => {
    const e = defaultEntitlements();
    expect(e.tier).toBe("free");
    expect(isPlusFeature("pdfProgressReport")).toBe(true);
    expect(canUse(e, "pdfProgressReport")).toBe(true);
    expect(showPlusBadge(e, "monthlyCheckIn")).toBe(true);
  });
});
