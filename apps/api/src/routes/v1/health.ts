import type { FastifyPluginAsync } from "fastify";
import type { HealthResponse } from "@motter/shared";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      service: "@motter/api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    };
  });
};
