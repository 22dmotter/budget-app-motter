import type { FastifyPluginAsync } from "fastify";
import { healthRoutes } from "./health.js";
import { authRoutes } from "./auth.js";
import { budgetRoutes } from "./budgets.js";
import { debtRoutes } from "./debts.js";
import { paymentRoutes } from "./payments.js";
import { leadRoutes } from "./leads.js";

export const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(budgetRoutes);
  await app.register(debtRoutes);
  await app.register(paymentRoutes);
  await app.register(leadRoutes);
};
