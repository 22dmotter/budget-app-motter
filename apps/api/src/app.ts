import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Env } from "./env.js";
import { v1Routes } from "./routes/v1/index.js";

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS.length === 1 && env.CORS_ORIGINS[0] === "*"
      ? true
      : env.CORS_ORIGINS,
    credentials: true,
  });

  app.get("/", async () => ({
    name: "Motter Budget API",
    docs: "/v1/health",
    version: "0.1.0",
  }));

  await app.register(v1Routes, { prefix: "/v1" });

  return app;
}
