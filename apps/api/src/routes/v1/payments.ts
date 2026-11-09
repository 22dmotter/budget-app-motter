import type { FastifyPluginAsync } from "fastify";
import { notImplemented } from "../../lib/not-implemented.js";

/**
 * Stripe payment / subscription stubs.
 * Webhook handler intentionally returns 501 until Stripe is wired.
 */
export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payments/checkout", notImplemented);
  app.post("/payments/webhook", notImplemented);
  app.get("/payments/subscription", notImplemented);
};
