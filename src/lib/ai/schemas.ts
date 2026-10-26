import { z } from "zod";

export const JdSchema = z.object({
  title: z.string(),
  seniority: z.enum(["intern", "junior", "mid", "senior", "lead", "unknown"]).catch("unknown"),
  yearsRequired: z.number().nullable().catch(null),
  required: z.array(z.string()),
  preferred: z.array(z.string()),
});
export type JdData = z.infer<typeof JdSchema>;

const rating = z.number().transform((n) => Math.min(5, Math.max(1, Math.round(n))));

export const ResumeAiSchema = z.object({
  bullets: z.array(
    z.object({
      n: z.number().int(),
      rating,
      issue: z.string(),
      rewrite: z.string().nullable(),
    })
  ),
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  jdFit: z
    .object({
      demonstrated: z.array(z.string()),
      notDemonstrated: z.array(z.string()),
      assessment: z.string(),
    })
    .nullable()
    .catch(null),
});
export type ResumeAiData = z.infer<typeof ResumeAiSchema>;