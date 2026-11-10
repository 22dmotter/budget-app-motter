import { z } from "zod";

/** Whole cents. $10.00 = 1000. Never use floating-point dollars in persisted data. */
export const CentsSchema = z.number().int().nonnegative().max(1_000_000_000);

/** Annual percentage rate in basis points. 24.99% = 2499 bps. */
export const AprBpsSchema = z.number().int().nonnegative().max(100_000);

/** Stable local/API id (UUID or short slug). */
export const EntityIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,64}$/, "Use a short id of letters, numbers, _ or -");

export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const YearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM");

export const IncomeFrequencySchema = z.enum([
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
]);
export type IncomeFrequency = z.infer<typeof IncomeFrequencySchema>;

export const CategoryGroupSchema = z.enum([
  "giving",
  "saving",
  "debt",
  "needs",
  "wants",
]);
export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;

export const PayoffStrategySchema = z.enum([
  "snowball",
  "avalanche",
  "custom",
]);
export type PayoffStrategy = z.infer<typeof PayoffStrategySchema>;

export const DebtTypeSchema = z.enum([
  "credit_card",
  "auto",
  "student",
  "mortgage",
  "personal",
  "medical",
  "other",
]);
export type DebtType = z.infer<typeof DebtTypeSchema>;

export const PlanTierSchema = z.enum(["free", "plus"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;
