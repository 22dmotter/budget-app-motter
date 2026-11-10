import { z } from "zod";
import {
  AprBpsSchema,
  CentsSchema,
  DebtTypeSchema,
  EntityIdSchema,
  PayoffStrategySchema,
  YearMonthSchema,
} from "./money.js";
import {
  BudgetLineSchema,
  IncomeSourceSchema,
  LumpSumSchema,
} from "./plan.js";

export const CalculatorDebtInputSchema = z
  .object({
    id: EntityIdSchema.optional(),
    name: z.string().trim().min(1).max(120),
    type: DebtTypeSchema.optional(),
    balanceCents: CentsSchema,
    aprBps: AprBpsSchema,
    minimumPaymentCents: CentsSchema,
  })
  .strict();
export type CalculatorDebtInput = z.infer<typeof CalculatorDebtInputSchema>;

export const PayoffCalculateRequestSchema = z
  .object({
    debts: z.array(CalculatorDebtInputSchema).min(1).max(50),
    extraMonthlyCents: CentsSchema.default(0),
    strategy: PayoffStrategySchema,
    customOrder: z.array(EntityIdSchema).optional(),
    lumpSums: z.array(LumpSumSchema).optional(),
    startMonth: YearMonthSchema.optional(),
    compare: z.boolean().optional(),
  })
  .strict();
export type PayoffCalculateRequest = z.infer<typeof PayoffCalculateRequestSchema>;

export const PaymentNeededRequestSchema = z
  .object({
    balanceCents: CentsSchema,
    aprBps: AprBpsSchema,
    /** When set, compute the level payment needed to finish in this many months. */
    targetMonths: z.number().int().positive().max(600).optional(),
    /** When set (without targetMonths), compute months until payoff at this payment. */
    paymentCents: CentsSchema.optional(),
  })
  .strict()
  .refine(
    (d) => d.targetMonths !== undefined || d.paymentCents !== undefined,
    { message: "Provide targetMonths or paymentCents" }
  );
export type PaymentNeededRequest = z.infer<typeof PaymentNeededRequestSchema>;

export const BudgetCalculateRequestSchema = z
  .object({
    incomes: z.array(IncomeSourceSchema).max(50),
    categories: z.array(BudgetLineSchema).max(100),
    /** Actual debt minimums — used for suggested extra (may differ from planned debt lines). */
    debtMinimumsCents: CentsSchema.optional(),
  })
  .strict();
export type BudgetCalculateRequest = z.infer<typeof BudgetCalculateRequestSchema>;
