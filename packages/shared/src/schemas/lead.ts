import { z } from "zod";

export const LeadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  source: z.string().max(80).optional(),
  createdAt: z.string().datetime(),
});

export type Lead = z.infer<typeof LeadSchema>;

export const CreateLeadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  source: z.string().max(80).optional(),
});

export type CreateLead = z.infer<typeof CreateLeadSchema>;

/**
 * Public lead-capture payload used by the free-worksheet form
 * and POST /v1/leads. firstName is the public field; `name` is
 * accepted as an alias for compatibility with CreateLeadSchema.
 */
export const CaptureLeadSchema = z
  .object({
    email: z.string().email(),
    firstName: z.string().trim().min(1).max(120).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    source: z.string().max(80).optional(),
    consent: z.literal(true),
    ts: z.string().datetime(),
  })
  .transform((data) => ({
    email: data.email,
    firstName: data.firstName ?? data.name,
    source: data.source,
    consent: data.consent as true,
    ts: data.ts,
  }));

export type CaptureLead = z.output<typeof CaptureLeadSchema>;
