import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { loadEnv } from "../src/env.js";
import type { FastifyInstance } from "fastify";

describe("GET /v1/health", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const env = loadEnv({
      NODE_ENV: "test",
      PORT: "4000",
      CORS_ORIGINS: "http://localhost:3000",
    });
    app = await buildApp(env);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns ok status", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("@motter/api");
    expect(body.version).toBe("0.1.0");
    expect(typeof body.timestamp).toBe("string");
  });

  it("stub auth route returns 501", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: "a@b.com", password: "password1" },
    });
    expect(res.statusCode).toBe(501);
  });
});
