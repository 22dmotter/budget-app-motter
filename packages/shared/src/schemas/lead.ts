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
