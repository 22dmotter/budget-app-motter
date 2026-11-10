import type { FastifyPluginAsync } from "fastify";
import { notImplemented } from "../../lib/not-implemented.js";

/**
 * Persisted budget CRUD — stubbed until auth + Postgres.
 * Planned contracts:
 *   GET    /v1/budgets         -> { data: Budget[] }
 *   POST   /v1/budgets         -> { data: Budget }     body: CreateBudget
 *   GET    /v1/budgets/:id     -> { data: Budget }
 *   PATCH  /v1/budgets/:id     -> { data: Budget }
 *   DELETE /v1/budgets/:id     -> { data: { ok: true } }
 *   GET    /v1/plan            -> { data: AppState }
 *   PUT    /v1/plan            -> { data: AppState }   body: AppState (schemaVersioned)
 */
export const budgetRoutes: FastifyPluginAsync = async (app) => {
  app.get("/budgets", notImplemented);
  app.post("/budgets", notImplemented);
  app.get("/budgets/:id", notImplemented);
  app.patch("/budgets/:id", notImplemented);
  app.delete("/budgets/:id", notImplemented);
  app.get("/plan", notImplemented);
  app.put("/plan", notImplemented);
};
