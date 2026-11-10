import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { loadEnv } from "../src/env.js";
import type { FastifyInstance } from "fastify";

const valid = {
  email: "test@example.com",
  firstName: "Test",
  source: "snowball-worksheet",
  consent: true,
  ts: "2026-11-10T15:00:00.000Z",
};

describe("POST /v1/leads", () => {
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

  it("accepts a valid lead with 202 and does not claim persistence", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/leads",
      payload: valid,
    });
    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.accepted).toBe(true);
    expect(body.persisted).toBe(false);
  });

  it("accepts firstName-less payloads", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/leads",
      payload: {
        email: "test@example.com",
        source: "snowball-worksheet",
        consent: true,
        ts: "2026-11-10T15:00:00.000Z",
      },
    });
    expect(res.statusCode).toBe(202);
  });

  it("rejects an invalid email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/leads",
      payload: { ...valid, email: "not-an-email" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("ValidationError");
  });

  it("rejects missing consent", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/leads",
      payload: { ...valid, consent: false },
    });
    expect(res.statusCode).toBe(400);
  });
});
