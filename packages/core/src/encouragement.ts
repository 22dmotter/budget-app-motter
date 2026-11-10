/**
 * Encouragement copy, grouped by moment. Each line can be toggled with `enabled`
 * so favorites can be picked later without deleting copy.
 *
 * `pickLine` is deterministic for a given seed (date, entry id, station id)
 * so the text does not flicker across re-renders.
 */

export type EncouragementMoment =
  | "home"
  | "paymentLogged"
  | "milestone"
  | "behindPlan"
  | "debtFree";

export type EncouragementLine = {
  id: string;
  text: string;
  enabled: boolean;
  /** When set, only use this line for that milestone station kind. */
  onlyFor?: "debt-closed" | "percent-50";
  citation?: string;
};

export const ENCOURAGEMENT: Record<EncouragementMoment, EncouragementLine[]> = {
  home: [
    { id: "home-1", text: "It's time to get out of debt. Let's find your way out.", enabled: true },
    { id: "home-2", text: "You're not behind. You're starting.", enabled: true },
    { id: "home-3", text: "Your debt-free date is closer than you think.", enabled: true },
    { id: "home-4", text: "Freedom has a date. Let's find yours.", enabled: true },
  ],
  paymentLogged: [
    { id: "pay-1", text: "Every little bit makes progress.", enabled: true },
    { id: "pay-2", text: "That's one step closer to free.", enabled: true },
    { id: "pay-3", text: "Small payments, big faithfulness.", enabled: true },
    { id: "pay-4", text: "Logged. Your future self says thank you.", enabled: true },
  ],
  milestone: [
    { id: "ms-1", text: "Look how far you've come.", enabled: true },
    {
      id: "ms-2",
      text: "One debt down. Keep that snowball rolling.",
      enabled: true,
      onlyFor: "debt-closed",
    },
    {
      id: "ms-3",
      text: "Halfway home. Don't let up now.",
      enabled: true,
      onlyFor: "percent-50",
    },
    { id: "ms-4", text: "Faithful in little, free in much.", enabled: true },
  ],
  behindPlan: [
    { id: "behind-1", text: "A slow month isn't a failed plan.", enabled: true },
    { id: "behind-2", text: "Grace for today. A fresh start next payment.", enabled: true },
    {
      id: "behind-3",
      text: "You don't have to catch up all at once. Just take the next step.",
      enabled: true,
    },
    { id: "behind-4", text: "Progress still counts, even when it's slow.", enabled: true },
  ],
  debtFree: [
    { id: "free-1", text: "You did it. You're free.", enabled: true },
    {
      id: "free-2",
      text: "Owe no one anything, except to love each other. That's you now.",
      enabled: true,
      citation: "Romans 13:8, ESV",
    },
  ],
};

export type MilestoneLineKind = "debt-closed" | "percent-50";

function fnv(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function linesFor(
  moment: EncouragementMoment,
  kind?: MilestoneLineKind
): EncouragementLine[] {
  return ENCOURAGEMENT[moment].filter((line) => {
    if (!line.enabled) return false;
    if (line.onlyFor && line.onlyFor !== kind) return false;
    return true;
  });
}

/**
 * Pick a line for a moment. The same seed always returns the same line.
 * Pass a date, payment entry id, or station id as the seed.
 */
export function pickLine(
  moment: EncouragementMoment,
  seed: string | number,
  kind?: MilestoneLineKind
): EncouragementLine {
  const lines = linesFor(moment, kind);
  const fallback: EncouragementLine = {
    id: "fallback",
    text: "You've got this. Let's see your path out.",
    enabled: true,
  };
  if (!lines.length) return fallback;
  const index = fnv(`${moment}:${String(seed)}`) % lines.length;
  return lines[index] ?? fallback;
}
