import type { PlanTier } from "@motter/shared";

/**
 * Feature flags for a future free vs Plus split.
 *
 * Nothing is locked today — `canUse` always returns true until payments exist.
 * UI may show a "Plus" badge via `showPlusBadge` so the catalog is ready to gate later.
 *
 * Free today (and later): journey path, % milestones, debt-closed badges, celebrations.
 * Plus (badge only, not locked): streak reminders, shareable milestone cards,
 * PDF progress report, accountability partner, full timeline.
 */
export const PLUS_FEATURES = {
  pdfProgressReport: {
    id: "pdfProgressReport",
    label: "PDF progress report",
    description: "A printable snapshot of your payoff progress to keep or share.",
  },
  monthlyCheckIn: {
    id: "monthlyCheckIn",
    label: "Monthly check-in reminders",
    description: "A gentle nudge to log payments and update balances.",
  },
  streakReminders: {
    id: "streakReminders",
    label: "Streak reminders",
    description: "A calm reminder when a check-in week is still open.",
  },
  shareableMilestoneCard: {
    id: "shareableMilestoneCard",
    label: "Shareable milestone cards",
    description: "A simple image of a milestone you can save or share.",
  },
  accountabilityPartner: {
    id: "accountabilityPartner",
    label: "Accountability partner",
    description: "Invite someone you trust to walk the plan with you.",
  },
  fullTimeline: {
    id: "fullTimeline",
    label: "Full payment timeline",
    description: "Every logged payment and milestone in one place.",
  },
} as const;

export type PlusFeatureId = keyof typeof PLUS_FEATURES;

export const FREE_FEATURES = {
  journeyPath: { id: "journeyPath", label: "Your road to debt-free" },
  percentMilestones: { id: "percentMilestones", label: "Percent milestones" },
  debtClosedBadges: { id: "debtClosedBadges", label: "Debt-closed badges" },
  celebrations: { id: "celebrations", label: "Milestone celebrations" },
} as const;

export type Entitlements = {
  tier: PlanTier;
};

export function defaultEntitlements(): Entitlements {
  return { tier: "free" };
}

export function isPlusFeature(id: string): id is PlusFeatureId {
  return id in PLUS_FEATURES;
}

/**
 * Whether a feature may be used. Until checkout exists, every feature is open.
 * Later: return id in FREE_FEATURES || entitlements.tier === "plus".
 */
export function canUse(_entitlements: Entitlements, _feature: PlusFeatureId): boolean {
  return true;
}

/** Show a Plus badge without locking the action. */
export function showPlusBadge(_entitlements: Entitlements, feature: PlusFeatureId): boolean {
  return isPlusFeature(feature);
}

export const PLUS_FEATURE_LIST = Object.values(PLUS_FEATURES);
