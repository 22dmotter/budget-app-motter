import { z } from "zod";
import {
  AprBpsSchema,
  CategoryGroupSchema,
  CentsSchema,
  DebtTypeSchema,
  EntityIdSchema,
  IncomeFrequencySchema,
  IsoDateSchema,
  PayoffStrategySchema,
  PlanTierSchema,
  YearMonthSchema,
} from "./money.js";

export const SCHEMA_VERSION = 1 as const;

export const IncomeSourceSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string().trim().min(1).max(80),
    amountCents: CentsSchema,
    frequency: IncomeFrequencySchema,
  })
  .strict();
export type IncomeSource = z.infer<typeof IncomeSourceSchema>;

export const BudgetLineSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string().trim().min(1).max(80),
    group: CategoryGroupSchema,
    plannedCents: CentsSchema,
    actualCents: CentsSchema.default(0),
  })
  .strict();
export type BudgetLine = z.infer<typeof BudgetLineSchema>;

/** A fact the user logged — never invented by the app. */
export const PaymentEntrySchema = z
  .object({
    id: EntityIdSchema,
    date: IsoDateSchema,
    paymentCents: CentsSchema,
    balanceCents: CentsSchema,
    note: z.string().max(200).optional(),
  })
  .strict();
export type PaymentEntry = z.infer<typeof PaymentEntrySchema>;

export const TrackedDebtSchema = z
  .object({
    id: EntityIdSchema,
    name: z.string().trim().min(1).max(60),
    type: DebtTypeSchema.optional(),
    startDate: IsoDateSchema,
    startingCents: z.number().int().positive().max(1_000_000_000),
    openingDate: IsoDateSchema,
    openingCents: CentsSchema,
    aprBps: AprBpsSchema,
    minimumPaymentCents: CentsSchema,
    entries: z.array(PaymentEntrySchema).max(5000),
  })
  .strict();
export type TrackedDebt = z.infer<typeof TrackedDebtSchema>;

export const LumpSumSchema = z
  .object({
    month: z.number().int().positive().max(600),
    amountCents: z.number().int().positive().max(1_000_000_000),
  })
  .strict();
export type LumpSum = z.infer<typeof LumpSumSchema>;

export const PlanSchema = z
  .object({
    strategy: PayoffStrategySchema,
    customOrder: z.array(EntityIdSchema).optional(),
    extraMonthlyCents: CentsSchema,
    lumpSums: z.array(LumpSumSchema).default([]),
    startMonth: YearMonthSchema,
  })
  .strict();
export type Plan = z.infer<typeof PlanSchema>;

/**
 * Versioned household plan stored in the browser today and synced via the API later.
 * Keep this object strict so corrupt / unexpected keys are rejected on import.
 */
export const AppStateSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    entitlements: z
      .object({
        tier: PlanTierSchema.default("free"),
      })
      .strict()
      .default({ tier: "free" }),
    incomes: z.array(IncomeSourceSchema).max(50),
    categories: z.array(BudgetLineSchema).max(100),
    debts: z.array(TrackedDebtSchema).max(50),
    plan: PlanSchema,
    onboardingComplete: z.boolean(),
    onboardingStep: z.number().int().min(1).max(4).optional(),
    /** Station ids the user has already seen a celebration for. Achievements themselves are derived. */
    celebratedIds: z.array(z.string()).max(200).default([]),
    /** User can hide the optional "Walking this road too" card. */
    hideDanielStory: z.boolean().optional(),
  })
  .strict();
export type AppState = z.infer<typeof AppStateSchema>;
