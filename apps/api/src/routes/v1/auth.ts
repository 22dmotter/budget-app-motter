import type { FastifyPluginAsync } from "fastify";
import { notImplemented } from "../../lib/not-implemented.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/signup", notImplemented);
  app.post("/auth/login", notImplemented);
  app.post("/auth/logout", notImplemented);
  app.get("/auth/me", notImplemented);
};
