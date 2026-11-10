import type { FastifyPluginAsync } from "fastify";
import {
  BudgetCalculateRequestSchema,
  PaymentNeededRequestSchema,
  PayoffCalculateRequestSchema,
} from "@motter/shared";
import {
  monthsToPayoff,
  paymentNeeded,
  planDebts,
  summarizeBudget,
} from "@motter/core";

function bad(reply: { status: (n: number) => { send: (b: unknown) => unknown } }, message: string) {
  return reply.status(400).send({
    error: "ValidationError",
    message,
    statusCode: 400,
  });
}

export const calculateRoutes: FastifyPluginAsync = async (app) => {
  app.post("/calculate/payoff", async (req, reply) => {
    const parsed = PayoffCalculateRequestSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Invalid request");
    const body = parsed.data;
    const debts = body.debts.map((d, i) => ({
      ...d,
      id: d.id ?? `debt-${i + 1}`,
    }));
    const result = planDebts({
      debts,
      extraMonthlyCents: body.extraMonthlyCents,
      strategy: body.strategy,
      customOrder: body.customOrder,
      lumpSums: body.lumpSums,
      startMonth: body.startMonth,
      compare: body.compare ?? true,
    });
    return { data: result };
  });

  app.post("/calculate/payment-needed", async (req, reply) => {
    const parsed = PaymentNeededRequestSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Invalid request");
    const body = parsed.data;
    if (body.targetMonths !== undefined) {
      const result = paymentNeeded(body.balanceCents, body.aprBps, body.targetMonths);
      return { data: result };
    }
    const result = monthsToPayoff(body.balanceCents, body.aprBps, body.paymentCents ?? 0);
    return { data: result };
  });

  app.post("/calculate/budget", async (req, reply) => {
    const parsed = BudgetCalculateRequestSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Invalid request");
    const body = parsed.data;
    const result = summarizeBudget({
      incomes: body.incomes,
      categories: body.categories,
      debtMinimumsCents: body.debtMinimumsCents,
    });
    return { data: result };
  });
};
