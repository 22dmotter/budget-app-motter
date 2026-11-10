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
    expect(j.stations.find((s) => s.id === "debt-closed:a")?.achieved).toBe(false);
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
    const first = j.stations.find((s) => s.id === "debt-closed:visa");
    expect(first?.achieved).toBe(true);
    expect(first?.achievedOn).toBe("2026-03-01");
    expect(first?.label).toBe("First debt paid off: Visa");
    const extra = j.stations.find((s) => s.id === "debt-closed:auto");
    expect(extra?.achieved).toBe(true);
    expect(extra?.achievedOn).toBe("2026-08-01");
    expect(extra?.label).toBe("Paid off: Auto");
    const ids = j.stations.map((s) => s.id);
    expect(ids.indexOf("debt-closed:visa")).toBeLessThan(ids.indexOf("debt-closed:auto"));
    expect(ids.indexOf("debt-closed:auto")).toBeLessThan(ids.indexOf("debt-free"));
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

describe("station ordering", () => {
  function ids(j: ReturnType<typeof deriveJourney>): string[] {
    return j.stations.map((s) => s.id);
  }

  it("orders future stations by projected month under snowball (small debt first, not bunched after 75%)", () => {
    // $500 + $2,000 at 0%, mins $50 / $100, extra $50. Snowball pays the $500 card first.
    const card = debt("card", {
      name: "Card",
      startingCents: 50000,
      openingCents: 50000,
      minimumPaymentCents: 5000,
      aprBps: 0,
    });
    const auto = debt("auto", {
      name: "Auto",
      startingCents: 200000,
      openingCents: 200000,
      minimumPaymentCents: 10000,
      aprBps: 0,
    });
    const j = deriveJourney(app([card, auto], 5000), TODAY);
    const order = ids(j);
    expect(j.stations[0]?.id).toBe("plan-made");
    expect(j.stations[1]?.id).toBe("first-payment");
    expect(j.stations.find((s) => s.id === "debt-closed:card")?.label).toBe("First debt paid off: Card");
    expect(j.stations.find((s) => s.id === "debt-closed:auto")?.label).toBe("Paid off: Auto");
    // The first (smaller) debt should land before 75% and 100%, not after every percent stop.
    expect(order.indexOf("debt-closed:card")).toBeLessThan(order.indexOf("percent-75"));
    expect(order.indexOf("debt-closed:card")).toBeLessThan(order.indexOf("debt-closed:auto"));
    expect(order.indexOf("percent-10")).toBeLessThan(order.indexOf("percent-25"));
    expect(order.indexOf("percent-25")).toBeLessThan(order.indexOf("percent-50"));
    expect(order.indexOf("percent-50")).toBeLessThan(order.indexOf("percent-75"));
    expect(order.indexOf("percent-75")).toBeLessThan(order.indexOf("debt-free"));
    expect(order.at(-1)).toBe("debt-free");
    // Projected months are monotonic along the path (excluding pinned plan/payment).
    const dated = j.stations.filter((s) => s.projectedDate && !s.achieved && s.id !== "first-payment");
    const months = dated.map((s) => s.projectedDate!);
    expect([...months].sort()).toEqual(months);
  });

  it("orders future stations by projected month under avalanche (high APR first)", () => {
    // Low min on the cheap card so it is not paid off by minimums before the high-APR balance.
    const low = debt("store", {
      name: "Store card",
      startingCents: 50000,
      openingCents: 50000,
      minimumPaymentCents: 2500,
      aprBps: 500, // 5%
    });
    const high = debt("visa", {
      name: "Visa",
      startingCents: 200000,
      openingCents: 200000,
      minimumPaymentCents: 4000,
      aprBps: 2499, // 24.99%
    });
    const snow = deriveJourney(app([low, high], 10000), TODAY);
    const av = deriveJourney(
      validateAppState(
        {
          ...app([low, high], 10000),
          plan: { ...app([low, high], 10000).plan, strategy: "avalanche" },
        },
        TODAY
      ),
      TODAY
    );
    // Snowball: smaller Store card first. Avalanche: high-APR Visa first.
    expect(snow.stations.find((s) => s.id === "debt-closed:store")?.label).toBe(
      "First debt paid off: Store card"
    );
    expect(av.stations.find((s) => s.id === "debt-closed:visa")?.label).toBe("First debt paid off: Visa");
    expect(av.stations.find((s) => s.id === "debt-closed:store")?.label).toBe("Paid off: Store card");
    const snowOrder = ids(snow);
    const avOrder = ids(av);
    expect(snowOrder.indexOf("debt-closed:store")).toBeLessThan(snowOrder.indexOf("debt-closed:visa"));
    expect(avOrder.indexOf("debt-closed:visa")).toBeLessThan(avOrder.indexOf("debt-closed:store"));
    expect(snowOrder).not.toEqual(avOrder);
  });

  it("reorders when a debt balance is updated so a different debt is paid first", () => {
    const card = debt("card", {
      name: "Card",
      startingCents: 50000,
      openingCents: 50000,
      minimumPaymentCents: 5000,
      aprBps: 0,
    });
    const auto = debt("auto", {
      name: "Auto",
      startingCents: 200000,
      openingCents: 200000,
      minimumPaymentCents: 10000,
      aprBps: 0,
    });
    const before = deriveJourney(app([card, auto], 5000), TODAY);
    expect(before.stations.find((s) => s.id === "debt-closed:card")?.label).toBe(
      "First debt paid off: Card"
    );

    // Card ballooned past Auto — snowball now finishes Auto first.
    const grown = debt("card", {
      name: "Card",
      startingCents: 50000,
      openingCents: 400000,
      openingDate: TODAY,
      minimumPaymentCents: 5000,
      aprBps: 0,
    });
    const after = deriveJourney(app([grown, auto], 5000), TODAY);
    expect(after.stations.find((s) => s.id === "debt-closed:auto")?.label).toBe(
      "First debt paid off: Auto"
    );
    expect(after.stations.find((s) => s.id === "debt-closed:card")?.label).toBe("Paid off: Card");
    const order = ids(after);
    expect(order.indexOf("debt-closed:auto")).toBeLessThan(order.indexOf("debt-closed:card"));
  });

  it("orders already-achieved stations by the date they were crossed, ties by threshold", () => {
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
    const order = ids(j);
    expect(order.indexOf("first-thousand")).toBeLessThan(order.indexOf("percent-50"));
    expect(order.indexOf("debt-closed:visa")).toBeLessThan(order.indexOf("debt-closed:auto"));
    expect(order.indexOf("percent-50")).toBeLessThan(order.indexOf("debt-closed:auto"));
    expect(j.stations.find((s) => s.id === "debt-closed:visa")?.label).toBe("First debt paid off: Visa");
  });
});
