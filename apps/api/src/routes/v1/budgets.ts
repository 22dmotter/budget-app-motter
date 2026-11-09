import type { FastifyPluginAsync } from "fastify";
import { notImplemented } from "../../lib/not-implemented.js";

export const budgetRoutes: FastifyPluginAsync = async (app) => {
  app.get("/budgets", notImplemented);
  app.post("/budgets", notImplemented);
  app.get("/budgets/:id", notImplemented);
  app.patch("/budgets/:id", notImplemented);
  app.delete("/budgets/:id", notImplemented);
};
