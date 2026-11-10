import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { loadEnv } from "../src/env.js";
import type { FastifyInstance } from "fastify";

describe("POST /v1/calculate/*", () => {
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

  it("plans a zero-interest snowball payoff", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate/payoff",
      payload: {
        strategy: "snowball",
        extraMonthlyCents: 5000,
        startMonth: "2026-11",
        compare: true,
        debts: [
          { name: "A", balanceCents: 100000, aprBps: 0, minimumPaymentCents: 10000 },
          { name: "B", balanceCents: 50000, aprBps: 0, minimumPaymentCents: 5000 },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.ok).toBe(true);
    expect(body.data.months).toBe(8);
    expect(body.data.debtFreeYearMonth).toBe("2027-06");
    expect(body.data.vsMinimumOnly).toBeTruthy();
  });

  it("rejects invalid payoff payloads", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate/payoff",
      payload: { strategy: "snowball", debts: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns the payment needed for a known amortization case", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate/payment-needed",
      payload: { balanceCents: 1_000_000, aprBps: 700, targetMonths: 60 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.ok).toBe(true);
    expect(body.data.paymentCents).toBe(19802);
  });

  it("summarizes a zero-based budget", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate/budget",
      payload: {
        incomes: [{ id: "job", name: "Job", amountCents: 400000, frequency: "monthly" }],
        categories: [
          { id: "g", name: "Give", group: "giving", plannedCents: 40000, actualCents: 0 },
          { id: "n", name: "Needs", group: "needs", plannedCents: 260000, actualCents: 0 },
          { id: "d", name: "Debt", group: "debt", plannedCents: 100000, actualCents: 0 },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.isZeroBased).toBe(true);
    expect(res.json().data.remainingToAssignCents).toBe(0);
  });
});
