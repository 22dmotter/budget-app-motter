import { z } from "zod";

export const DebtSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(120),
  balanceCents: z.number().int().nonnegative(),
  interestRateBps: z.number().int().nonnegative().optional(),
  minimumPaymentCents: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Debt = z.infer<typeof DebtSchema>;

export const CreateDebtSchema = z.object({
  name: z.string().min(1).max(120),
  balanceCents: z.number().int().nonnegative(),
  interestRateBps: z.number().int().nonnegative().optional(),
  minimumPaymentCents: z.number().int().nonnegative().optional(),
});

export type CreateDebt = z.infer<typeof CreateDebtSchema>;
