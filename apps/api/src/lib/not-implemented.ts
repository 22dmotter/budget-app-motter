import type { FastifyReply, FastifyRequest } from "fastify";

/** Stub handler that returns HTTP 501 Not Implemented */
export async function notImplemented(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  return reply.status(501).send({
    error: "NotImplemented",
    message:
      "This endpoint is scaffolded but not implemented yet. See docs/ARCHITECTURE.md and README Next steps.",
    statusCode: 501,
  });
}
