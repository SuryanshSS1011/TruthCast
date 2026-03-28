// packages/shared/schema.ts
import { z } from "zod";

export const VerdictLabel = z.enum([
  "TRUE",
  "MOSTLY_TRUE",
  "MISLEADING",
  "MOSTLY_FALSE",
  "FALSE",
  "CONFLICTING",
  "UNVERIFIABLE"
]);

export type VerdictLabelType = z.infer<typeof VerdictLabel>;

export const SourceSchema = z.object({
  url: z.string().url(),
  domain_tier: z.enum(["A", "B", "C", "UNKNOWN"]),
  stance: z.enum(["supports", "refutes", "neutral"]),
  mbfc_score: z.number().min(0).max(1).optional(),
});

export type Source = z.infer<typeof SourceSchema>;

export const VerdictSchema = z.object({
  claim_hash: z.string().length(64),
  claim_text: z.string().min(1).max(2000),
  sub_claims: z.array(z.string()).min(1).max(10),
  verdict: VerdictLabel,
  confidence: z.number().int().min(0).max(100),
  reasoning: z.string().min(1).max(1000),
  sources: z.array(SourceSchema).min(0).max(10),
  minority_view: z.string().nullable(),
  debate_triggered: z.boolean(),
  agreement_score: z.number().min(0).max(1),
  checked_at: z.number().int(),
  ttl_policy: z.enum(["SHORT", "LONG", "STATIC"]),
  pipeline_version: z.string(),
});

export type Verdict = z.infer<typeof VerdictSchema>;
