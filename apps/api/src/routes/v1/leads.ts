import type { FastifyPluginAsync } from "fastify";
import { notImplemented } from "../../lib/not-implemented.js";

/** Lead capture stub — returns 501 until persistence is wired */
export const leadRoutes: FastifyPluginAsync = async (app) => {
  app.post("/leads", notImplemented);
};
