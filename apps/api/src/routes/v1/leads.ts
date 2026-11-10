import type { FastifyPluginAsync } from "fastify";
import { CaptureLeadSchema } from "@motter/shared";

/**
 * Lead capture — validates the shared CaptureLead schema.
 * Persistence is not wired yet: valid leads are logged (without the
 * email address) and accepted with 202 so a future hosted API or
 * Formspree-style endpoint can swap in without changing the client.
 */
export const leadRoutes: FastifyPluginAsync = async (app) => {
  app.post("/leads", async (req, reply) => {
    const parsed = CaptureLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "ValidationError",
        message: "Lead payload is invalid.",
        statusCode: 400,
        issues: parsed.error.flatten(),
      });
    }

    const lead = parsed.data;
    req.log.info(
      {
        source: lead.source ?? "unspecified",
        hasName: Boolean(lead.firstName),
        ts: lead.ts,
      },
      "lead accepted (not persisted)"
    );

    return reply.status(202).send({
      accepted: true,
      persisted: false,
      message:
        "Lead accepted but not stored yet; persistence is not wired.",
    });
  });
};
