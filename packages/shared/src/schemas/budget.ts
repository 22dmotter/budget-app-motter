import { z } from "zod";

export const BudgetCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  plannedCents: z.number().int().nonnegative(),
  spentCents: z.number().int().nonnegative().default(0),
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(120),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  currency: z.string().length(3).default("USD"),
  categories: z.array(BudgetCategorySchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const CreateBudgetSchema = z.object({
  name: z.string().min(1).max(120),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  currency: z.string().length(3).default("USD"),
  categories: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        plannedCents: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
