/**
 * TruthCast Pipeline Orchestrator
 *
 * Coordinates the 4-stage autonomous fact-checking pipeline with SSE progress streaming:
 * Stage 1: Ingestion (claim normalization, checkworthiness, decomposition)
 * Stage 2: Researcher (evidence retrieval, MBFC scoring)
 * Stage 3: Moderator (verdict synthesis, confidence calculation)
 * Stage 4: Publisher (Solana write, audio generation, cache storage)
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import type { Verdict } from "@truthcast/shared/schema";
import { normalizeAndHash } from "./normalize.js";
import { getCachedVerdict } from "./db/init.js";

export interface PipelineSession {
  session_id: string;
  claim: string;
  claim_hash: string;
  started_at: number;
  status: "pending" | "running" | "completed" | "failed";
  current_stage: string;
  progress: number; // 0-100
  verdict?: Verdict;
  error?: string;
}

export interface PipelineEvent {
  session_id: string;
  event: "progress" | "stage_complete" | "complete" | "error";
  stage?: string;
  progress: number;
  message: string;
  data?: any;
}

// Module-level EventEmitter singleton for SSE
export const pipelineEmitter = new EventEmitter();
pipelineEmitter.setMaxListeners(50); // Support concurrent sessions

// Active sessions map
const sessions = new Map<string, PipelineSession>();

/**
 * Start a new pipeline session
 */
export function startPipeline(claim: string): string {
  const session_id = uuidv4();
  const claim_hash = normalizeAndHash(claim);

  const session: PipelineSession = {
    session_id,
    claim,
    claim_hash,
    started_at: Date.now(),
    status: "pending",
    current_stage: "cache_check",
    progress: 0,
  };

  sessions.set(session_id, session);

  // Start pipeline execution asynchronously
  executePipeline(session).catch((error) => {
    console.error(`Pipeline ${session_id} failed:`, error);
    session.status = "failed";
    session.error = error.message;
    emitEvent(session_id, {
      session_id,
      event: "error",
      progress: session.progress,
      message: `Pipeline failed: ${error.message}`,
    });
  });

  return session_id;
}

/**
 * Get session status
 */
export function getSession(session_id: string): PipelineSession | null {
  return sessions.get(session_id) || null;
}

/**
 * Execute the full pipeline
 */
async function executePipeline(session: PipelineSession): Promise<void> {
  const { session_id, claim, claim_hash } = session;

  try {
    // Stage 0: Cache check
    session.status = "running";
    session.current_stage = "cache_check";
    session.progress = 5;
    emitEvent(session_id, {
      session_id,
      event: "progress",
      stage: "cache_check",
      progress: 5,
      message: "Checking cache for existing verdict...",
    });

    const cached = getCachedVerdict(claim_hash);
    if (cached) {
      session.status = "completed";
      session.verdict = cached;
      session.progress = 100;
      emitEvent(session_id, {
        session_id,
        event: "complete",
        progress: 100,
        message: "Verdict found in cache",
        data: { verdict: cached, from_cache: true },
      });
      return;
    }

    emitEvent(session_id, {
      session_id,
      event: "stage_complete",
      stage: "cache_check",
      progress: 10,
      message: "No cached verdict found, starting pipeline...",
    });

    // Stage 1: Ingestion (checkworthiness + decomposition)
    session.current_stage = "ingestion";
    session.progress = 15;
    emitEvent(session_id, {
      session_id,
      event: "progress",
      stage: "ingestion",
      progress: 15,
      message: "Analyzing claim checkworthiness...",
    });

    const ingestionResult = await runIngestionStage(claim);

    if (!ingestionResult.is_checkworthy) {
      // Build unverifiable verdict for non-checkworthy claims
      const { buildUnverifiableVerdict } = await import("./helpers.js");
      const verdict = buildUnverifiableVerdict({ claim_text: claim }, claim_hash);

      session.status = "completed";
      session.verdict = verdict;
      session.progress = 100;
      emitEvent(session_id, {
        session_id,
        event: "complete",
        progress: 100,
        message: "Claim is not checkworthy (opinion/prediction)",
        data: { verdict, reason: ingestionResult.reason },
      });
      return;
    }

    emitEvent(session_id, {
      session_id,
      event: "stage_complete",
      stage: "ingestion",
      progress: 30,
      message: `Claim decomposed into ${ingestionResult.sub_claims.length} sub-claim(s)`,
      data: { sub_claims: ingestionResult.sub_claims },
    });

    // Stage 2: Researcher (evidence retrieval)
    session.current_stage = "researcher";
    session.progress = 35;
    emitEvent(session_id, {
      session_id,
      event: "progress",
      stage: "researcher",
      progress: 35,
      message: "Retrieving evidence with Gemini API...",
    });

    const researchResult = await runResearcherStage(ingestionResult.sub_claims);

    emitEvent(session_id, {
      session_id,
      event: "stage_complete",
      stage: "researcher",
      progress: 70,
      message: `Evidence retrieved from ${researchResult.total_sources} sources (agreement: ${(researchResult.agreement_score * 100).toFixed(0)}%)`,
      data: { sources: researchResult.total_sources, agreement_score: researchResult.agreement_score },
    });

    // Stage 2.5: Debate (conditional - only if agreement_score < 0.8)
    let debateResult = null;
    if (researchResult.agreement_score < 0.8) {
      session.current_stage = "debate";
      session.progress = 72;
      emitEvent(session_id, {
        session_id,
        event: "progress",
        stage: "debate",
        progress: 72,
        message: `Low agreement detected (${(researchResult.agreement_score * 100).toFixed(0)}%), initiating adversarial debate...`,
      });

      const { runDebate } = await import("./debate.js");
      debateResult = await runDebate(claim, researchResult.verdicts);

      emitEvent(session_id, {
        session_id,
        event: "stage_complete",
        stage: "debate",
        progress: 80,
        message: `Debate complete: ${debateResult.consensus}`,
        data: {
          affirmative_confidence: debateResult.affirmative.confidence,
          negative_confidence: debateResult.negative.confidence,
          debate_agreement: debateResult.agreement_score,
        },
      });
    }

    // Stage 3: Moderator (verdict synthesis)
    session.current_stage = "moderator";
    session.progress = debateResult ? 82 : 75;
    emitEvent(session_id, {
      session_id,
      event: "progress",
      stage: "moderator",
      progress: debateResult ? 82 : 75,
      message: "Synthesizing verdict...",
    });

    const verdict = await runModeratorStage(claim, claim_hash, researchResult, debateResult);

    emitEvent(session_id, {
      session_id,
      event: "stage_complete",
      stage: "moderator",
      progress: 85,
      message: `Verdict: ${verdict.verdict} (${verdict.confidence}% confidence)`,
      data: { verdict: verdict.verdict, confidence: verdict.confidence },
    });

    // Stage 4: Publisher (Solana + audio + cache)
    session.current_stage = "publisher";
    session.progress = 90;
    emitEvent(session_id, {
      session_id,
      event: "progress",
      stage: "publisher",
      progress: 90,
      message: "Publishing verdict to blockchain...",
    });

    await runPublisherStage(verdict);

    // Complete
    session.status = "completed";
    session.verdict = verdict;
    session.progress = 100;
    emitEvent(session_id, {
      session_id,
      event: "complete",
      progress: 100,
      message: "Pipeline complete!",
      data: { verdict },
    });

  } catch (error: any) {
    session.status = "failed";
    session.error = error.message;
    emitEvent(session_id, {
      session_id,
      event: "error",
      progress: session.progress,
      message: `Error in ${session.current_stage}: ${error.message}`,
    });
    throw error;
  }
}

/**
 * Emit SSE event
 */
function emitEvent(session_id: string, event: PipelineEvent): void {
  pipelineEmitter.emit(session_id, event);
  pipelineEmitter.emit("global", event); // For monitoring
}

/**
 * Stage 1: Ingestion
 */
async function runIngestionStage(claim: string): Promise<{
  is_checkworthy: boolean;
  reason?: string;
  sub_claims: string[];
}> {
  const { checkCheckworthiness } = await import("./checkworthiness.js");
  const { decomposeClaim } = await import("./decomposition.js");

  // Check if claim is worth fact-checking
  const checkworthiness = await checkCheckworthiness(claim);
  if (!checkworthiness.is_checkworthy) {
    return {
      is_checkworthy: false,
      reason: checkworthiness.reason,
      sub_claims: [],
    };
  }

  // Decompose into atomic sub-claims
  const sub_claims = await decomposeClaim(claim);

  return {
    is_checkworthy: true,
    sub_claims,
  };
}

/**
 * Stage 2: Researcher
 */
async function runResearcherStage(sub_claims: string[]): Promise<{
  verdicts: any[];
  total_sources: number;
  agreement_score: number;
}> {
  const { researchClaim } = await import("./gemini-researcher.js");
  const { calculateAgreementScore } = await import("./debate.js");

  const verdicts = [];
  let total_sources = 0;

  for (const sub_claim of sub_claims) {
    const verdict = await researchClaim(sub_claim);
    verdicts.push(verdict);
    total_sources += verdict.sources.length;
  }

  // Calculate agreement score (0.0 - 1.0)
  const agreement_score = calculateAgreementScore(verdicts);

  return { verdicts, total_sources, agreement_score };
}

/**
 * Stage 3: Moderator
 */
async function runModeratorStage(
  claim: string,
  claim_hash: string,
  researchResult: any,
  debateResult: any = null
): Promise<Verdict> {
  const { VerdictSchema } = await import("@truthcast/shared/schema");
  const { aggregateSubClaimVerdicts } = await import("@truthcast/shared/constants");

  // If debate was triggered, use debate consensus
  if (debateResult) {
    // Parse verdict from debate consensus (e.g., "TRUE", "FALSE", "CONFLICTING")
    const debateVerdict = debateResult.consensus.match(/(TRUE|MOSTLY_TRUE|MISLEADING|MOSTLY_FALSE|FALSE|CONFLICTING|UNVERIFIABLE)/i)?.[0].toUpperCase() || "CONFLICTING";

    // Determine minority view (the losing side's argument)
    const minority_view = debateResult.affirmative.confidence < debateResult.negative.confidence
      ? debateResult.affirmative.argument
      : debateResult.negative.argument;

    // Collect all sources from research verdicts
    const allSources = researchResult.verdicts.flatMap((v: any) => v.sources || []);
    const uniqueSources = Array.from(
      new Map(allSources.map((s: any) => [s.url, s])).values()
    ).slice(0, 10);

    const verdict: Verdict = {
      claim_hash,
      claim_text: claim,
      sub_claims: researchResult.verdicts.map((v: any) => v.claim || claim),
      verdict: debateVerdict as any,
      confidence: Math.round((debateResult.affirmative.confidence + debateResult.negative.confidence) / 2),
      reasoning: debateResult.consensus,
      sources: uniqueSources,
      minority_view,
      debate_triggered: true,
      agreement_score: debateResult.agreement_score,
      checked_at: Math.floor(Date.now() / 1000),
      ttl_policy: "SHORT", // Debated verdicts have shorter TTL (more controversial)
      pipeline_version: "2.0",
    };

    return VerdictSchema.parse(verdict);
  }

  // If single claim, use research verdict directly
  if (researchResult.verdicts.length === 1) {
    const research = researchResult.verdicts[0];
    const verdict: Verdict = {
      claim_hash,
      claim_text: claim,
      sub_claims: [claim],
      verdict: research.verdict,
      confidence: research.confidence,
      reasoning: research.reasoning,
      sources: research.sources,
      minority_view: null,
      debate_triggered: false,
      agreement_score: researchResult.agreement_score,
      checked_at: Math.floor(Date.now() / 1000),
      ttl_policy: "LONG",
      pipeline_version: "2.0",
    };

    return VerdictSchema.parse(verdict);
  }

  // Multiple sub-claims: aggregate using rules from constants.ts
  const aggregated = aggregateSubClaimVerdicts(researchResult.verdicts);

  const verdict: Verdict = {
    claim_hash,
    claim_text: claim,
    sub_claims: researchResult.verdicts.map((v: any) => v.claim || claim),
    verdict: aggregated.verdict,
    confidence: aggregated.confidence,
    reasoning: aggregated.reasoning,
    sources: aggregated.sources,
    minority_view: null,
    debate_triggered: false,
    agreement_score: aggregated.agreement_score,
    checked_at: Math.floor(Date.now() / 1000),
    ttl_policy: "LONG",
    pipeline_version: "2.0",
  };

  return VerdictSchema.parse(verdict);
}

/**
 * Stage 4: Publisher
 */
async function runPublisherStage(verdict: Verdict): Promise<void> {
  const { writeSolanaVerdict, elevenLabsTTS } = await import("./helpers.js");
  const { writeVerdict } = await import("./db/init.js");

  // Write to Solana (non-fatal if fails)
  let tx_hash: string | null = null;
  try {
    tx_hash = await writeSolanaVerdict(verdict);
  } catch (error) {
    console.warn("Solana write failed (non-fatal):", error);
  }

  // Generate audio (non-fatal if fails)
  const voiceScript = `This claim is ${verdict.verdict.toLowerCase().replace("_", " ")}, with ${
    verdict.confidence >= 90 ? "very high" : verdict.confidence >= 70 ? "high" : "moderate"
  } confidence. ${verdict.reasoning.split(/[.!?]/)[0]}.`;

  await elevenLabsTTS(voiceScript);

  // Write to SQLite cache
  await writeVerdict(verdict, tx_hash);
}
