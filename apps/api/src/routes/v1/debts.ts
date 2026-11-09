import type { FastifyPluginAsync } from "fastify";
import { notImplemented } from "../../lib/not-implemented.js";

export const debtRoutes: FastifyPluginAsync = async (app) => {
  app.get("/debts", notImplemented);
  app.post("/debts", notImplemented);
  app.get("/debts/:id", notImplemented);
  app.patch("/debts/:id", notImplemented);
  app.delete("/debts/:id", notImplemented);
};
