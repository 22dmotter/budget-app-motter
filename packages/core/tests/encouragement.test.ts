import { describe, it, expect } from "vitest";
import {
  ENCOURAGEMENT,
  linesFor,
  pickLine,
  type EncouragementMoment,
} from "../src/encouragement.js";

const MOMENTS: EncouragementMoment[] = [
  "home",
  "paymentLogged",
  "milestone",
  "behindPlan",
  "debtFree",
];

describe("encouragement library", () => {
  it("has the starter lines for every moment", () => {
    expect(ENCOURAGEMENT.home.map((l) => l.text)).toEqual([
      "It's time to get out of debt. Let's find your way out.",
      "You're not behind. You're starting.",
      "Your debt-free date is closer than you think.",
      "Freedom has a date. Let's find yours.",
    ]);
    expect(ENCOURAGEMENT.paymentLogged.map((l) => l.text)).toEqual([
      "Every little bit makes progress.",
      "That's one step closer to free.",
      "Small payments, big faithfulness.",
      "Logged. Your future self says thank you.",
    ]);
    expect(ENCOURAGEMENT.behindPlan.map((l) => l.text)).toEqual([
      "A slow month isn't a failed plan.",
      "Grace for today. A fresh start next payment.",
      "You don't have to catch up all at once. Just take the next step.",
      "Progress still counts, even when it's slow.",
    ]);
    expect(ENCOURAGEMENT.debtFree.some((l) => l.citation === "Romans 13:8, ESV")).toBe(true);
    expect(ENCOURAGEMENT.debtFree.some((l) => l.text === "You did it. You're free.")).toBe(true);
  });

  it("pickLine is deterministic for a given seed and does not flicker", () => {
    const a = pickLine("home", "2026-11-10");
    const b = pickLine("home", "2026-11-10");
    expect(a).toEqual(b);
    expect(a.enabled).toBe(true);
  });

  it("different seeds can rotate to a different enabled line", () => {
    const texts = new Set(
      Array.from({ length: 40 }, (_, i) => pickLine("home", `seed-${i}`).id)
    );
    expect(texts.size).toBeGreaterThan(1);
  });

  it("skips disabled lines", () => {
    const original = ENCOURAGEMENT.home[0]!.enabled;
    ENCOURAGEMENT.home[0]!.enabled = false;
    try {
      const ids = linesFor("home").map((l) => l.id);
      expect(ids).not.toContain("home-1");
      for (let i = 0; i < 20; i++) {
        expect(pickLine("home", i).id).not.toBe("home-1");
      }
    } finally {
      ENCOURAGEMENT.home[0]!.enabled = original;
    }
  });

  it("keeps debt-closed and 50% lines moment-specific", () => {
    const general = linesFor("milestone");
    expect(general.some((l) => l.onlyFor === "debt-closed")).toBe(false);
    expect(general.some((l) => l.onlyFor === "percent-50")).toBe(false);
    expect(linesFor("milestone", "debt-closed").some((l) => l.id === "ms-2")).toBe(true);
    expect(linesFor("milestone", "percent-50").some((l) => l.id === "ms-3")).toBe(true);
    expect(linesFor("milestone", "debt-closed").some((l) => l.id === "ms-3")).toBe(false);
  });

  it("every moment has at least one enabled line", () => {
    for (const m of MOMENTS) {
      expect(linesFor(m).length).toBeGreaterThan(0);
      expect(pickLine(m, "x").text.length).toBeGreaterThan(0);
    }
  });
});
