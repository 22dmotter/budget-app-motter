import type { FastifyPluginAsync } from "fastify";
import { notImplemented } from "../../lib/not-implemented.js";

/**
 * Persisted debt CRUD — stubbed until auth + Postgres.
 * Planned contracts (see docs/DATA_MODEL.md):
 *   GET    /v1/debts          -> { data: TrackedDebt[] }
 *   POST   /v1/debts          -> { data: TrackedDebt }      body: CreateDebt
 *   GET    /v1/debts/:id      -> { data: TrackedDebt }
 *   PATCH  /v1/debts/:id      -> { data: TrackedDebt }
 *   DELETE /v1/debts/:id      -> { data: { ok: true } }
 *   POST   /v1/debts/:id/payments -> { data: TrackedDebt }  body: PaymentEntry
 */
export const debtRoutes: FastifyPluginAsync = async (app) => {
  app.get("/debts", notImplemented);
  app.post("/debts", notImplemented);
  app.get("/debts/:id", notImplemented);
  app.patch("/debts/:id", notImplemented);
  app.delete("/debts/:id", notImplemented);
  app.post("/debts/:id/payments", notImplemented);
};
