import { describe, it, expect } from "vitest";
import { deriveJourney, checkInStreaks, onPlanMonthStreaks, weekKey, uncelebratedStations } from "../src/milestones.js";
import { emptyAppState, validateAppState } from "../src/state.js";
import type { AppState, PaymentEntry, TrackedDebt } from "@motter/shared";

const TODAY = "2026-11-10";

function debt(id: string, overrides: Partial<TrackedDebt> = {}): TrackedDebt {
  return {
    id,
    name: id,
    startDate: "2026-01-01",
    startingCents: 100000,
    openingDate: "2026-01-01",
    openingCents: 100000,
    aprBps: 0,
    minimumPaymentCents: 10000,
    entries: [],
    ...overrides,
  };
}

function entry(id: string, date: string, paymentCents: number, balanceCents: number): PaymentEntry {
  return { id, date, paymentCents, balanceCents };
}

function app(debts: TrackedDebt[], extra = 0): AppState {
  const base = emptyAppState(new Date("2026-11-10T12:00:00"));
  return validateAppState(
    {
      ...base,
      onboardingComplete: true,
      debts,
      plan: { ...base.plan, startMonth: "2026-01", extraMonthlyCents: extra },
    },
    TODAY
  );
}

describe("deriveJourney stations", () => {
  it("starts with plan made and no invented payment dates", () => {
    const j = deriveJourney(app([debt("a")]), TODAY);
    expect(j.stations[0]).toMatchObject({ id: "plan-made", achieved: true });
    expect(j.stations.find((s) => s.id === "first-payment")?.achieved).toBe(false);
    expect(j.stations.find((s) => s.id === "first-payment")?.achievedOn).toBeNull();
    expect(j.next?.station.id).toBe("first-payment");
  });

  it("records the date of the first payment that crossed $1,000 / 25% / 50%", () => {
    const d = debt("a", {
      startingCents: 400000,
      openingCents: 400000,
      entries: [
        entry("p1", "2026-02-01", 50000, 350000), // $500 down
        entry("p2", "2026-03-01", 60000, 290000), // $1,100 down, crosses $1k
        entry("p3", "2026-06-01", 110000, 180000), // $2,200 down = 55%
      ],
    });
    const j = deriveJourney(app([d]), TODAY);
    expect(j.stations.find((s) => s.id === "first-thousand")?.achievedOn).toBe("2026-03-01");
    expect(j.stations.find((s) => s.id === "percent-25")?.achievedOn).toBe("2026-03-01");
    expect(j.stations.find((s) => s.id === "percent-50")?.achievedOn).toBe("2026-06-01");
    expect(j.stations.find((s) => s.id === "percent-50")?.achieved).toBe(true);
    expect(j.badges.find((b) => b.id === "halfway-home")?.earned).toBe(true);
  });

  it("reverses paid-off status when a balance rises again", () => {
    const d = debt("a", {
      entries: [
        entry("payoff", "2026-04-01", 100000, 0),
        entry("borrow", "2026-05-01", 0, 20000),
      ],
    });
    const j = deriveJourney(app([d]), TODAY);
    expect(j.stations.find((s) => s.id === "first-debt-paid")?.achieved).toBe(false);
    expect(j.stations.find((s) => s.id === "debt-free")?.achieved).toBe(false);
    expect(j.badges.find((b) => b.id === `debt-closed:a`)?.earned).toBe(false);
  });

  it("adds a station for each additional debt and the Debt Closed badge", () => {
    const a = debt("visa", {
      name: "Visa",
      startingCents: 50000,
      openingCents: 50000,
      entries: [entry("v", "2026-03-01", 50000, 0)],
    });
    const b = debt("auto", {
      name: "Auto",
      startingCents: 200000,
      openingCents: 200000,
      entries: [entry("a", "2026-08-01", 200000, 0)],
    });
    const j = deriveJourney(app([a, b]), TODAY);
    expect(j.stations.find((s) => s.id === "first-debt-paid")?.achieved).toBe(true);
    expect(j.stations.find((s) => s.id === "first-debt-paid")?.achievedOn).toBe("2026-03-01");
    const extra = j.stations.find((s) => s.id === "debt-closed:auto");
    expect(extra?.achieved).toBe(true);
    expect(extra?.achievedOn).toBe("2026-08-01");
    expect(j.stations.find((s) => s.id === "debt-free")?.achieved).toBe(true);
    expect(j.badges.find((b) => b.id === "snowball-rolling")?.earned).toBe(true);
  });

  it("projects a date for the next station from the current plan", () => {
    const d = debt("a", {
      startingCents: 300000,
      openingCents: 300000,
      minimumPaymentCents: 50000,
      aprBps: 0,
    });
    const j = deriveJourney(app([d], 0), TODAY);
    const thousand = j.stations.find((s) => s.id === "first-thousand");
    expect(thousand?.achieved).toBe(false);
    expect(thousand?.remainingCents).toBe(100000);
    expect(thousand?.projectedDate).toBeTruthy();
    expect(j.next?.station.id).toBe("first-payment");
  });

  it("Faithful Giver is earned from a giving budget line, not invented payments", () => {
    const s = app([debt("a")]);
    s.categories.push({
      id: "tithe",
      name: "Giving",
      group: "giving",
      plannedCents: 20000,
      actualCents: 0,
    });
    const j = deriveJourney(s, TODAY);
    expect(j.badges.find((b) => b.id === "faithful-giver")?.earned).toBe(true);
  });

  it("lists newly achieved stations that have not been celebrated", () => {
    const d = debt("a", { entries: [entry("p", "2026-02-01", 1000, 99000)] });
    const j = deriveJourney(app([d]), TODAY);
    const fresh = uncelebratedStations(j, []);
    expect(fresh.some((s) => s.id === "first-payment")).toBe(true);
    expect(uncelebratedStations(j, ["plan-made", "first-payment"]).some((s) => s.id === "first-payment")).toBe(false);
  });
});

describe("streaks", () => {
  it("counts consecutive on-plan months and does not break an in-progress month", () => {
    // Planned $100/mo. Paid 100 in Jan, Feb, Mar. Today is mid-April with $0 — streak stays 3.
    const d = debt("a", {
      minimumPaymentCents: 10000,
      entries: [
        entry("j", "2026-01-15", 10000, 90000),
        entry("f", "2026-02-15", 10000, 80000),
        entry("m", "2026-03-15", 10000, 70000),
      ],
    });
    const r = onPlanMonthStreaks([d], 10000, "2026-04-10");
    expect(r.current).toBe(3);
    expect(r.best).toBe(3);
  });

  it("breaks the on-plan month streak after a missed completed month, and tracks best", () => {
    const d = debt("a", {
      minimumPaymentCents: 10000,
      entries: [
        entry("j", "2026-01-15", 10000, 90000),
        entry("f", "2026-02-15", 10000, 80000),
        // March missed
        entry("a", "2026-04-15", 10000, 70000),
        entry("y", "2026-05-15", 10000, 60000),
      ],
    });
    const r = onPlanMonthStreaks([d], 10000, "2026-05-20");
    expect(r.current).toBe(2);
    expect(r.best).toBe(2);
    // If we include the two early months as a best of 2, yes. Jan-Feb is 2, Apr-May is 2.
  });

  it("treats month boundaries correctly (Jan 31 / Feb 1 are different months)", () => {
    const d = debt("a", {
      minimumPaymentCents: 10000,
      entries: [
        entry("jan", "2026-01-31", 10000, 90000),
        entry("feb", "2026-02-01", 10000, 80000),
      ],
    });
    const r = onPlanMonthStreaks([d], 10000, "2026-02-20");
    expect(r.current).toBe(2);
  });

  it("forgives one missed check-in week per month without breaking the streak", () => {
    // Weekly logs in Jan, skip one week, continue — grace applies.
    // Weeks of 2026-01-05, 01-12, skip 01-19, 01-26, then Feb
    const d = debt("a", {
      entries: [
        entry("a", "2026-01-05", 100, 99900),
        entry("b", "2026-01-12", 100, 99800),
        // skip week of Jan 19 (grace)
        entry("c", "2026-01-26", 100, 99700),
        entry("d", "2026-02-02", 100, 99600),
      ],
    });
    const r = checkInStreaks([d], "2026-02-03");
    expect(r.current).toBeGreaterThanOrEqual(3);
    expect(r.best).toBeGreaterThanOrEqual(r.current);
  });

  it("a second missed week in the same month breaks the check-in streak", () => {
    const d = debt("a", {
      entries: [
        entry("a", "2026-01-05", 100, 99900),
        // skip Jan 12 and Jan 19 (two misses — only one grace)
        entry("c", "2026-01-26", 100, 99800),
      ],
    });
    const r = checkInStreaks([d], "2026-01-27");
    expect(r.current).toBe(1);
    expect(r.best).toBeGreaterThanOrEqual(1);
  });

  it("weekKey groups Mon–Sun together across a month boundary", () => {
    // 2026-03-30 is Monday, 2026-04-01 is Wednesday of the same week
    expect(weekKey("2026-03-30")).toBe(weekKey("2026-04-01"));
    expect(weekKey("2026-03-29")).not.toBe(weekKey("2026-03-30"));
  });
});
