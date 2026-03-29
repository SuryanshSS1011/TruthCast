#!/usr/bin/env tsx
/**
 * TruthCast Pipeline Entrypoint
 *
 * Single script that runs the full fact-checking pipeline.
 * Called by the OpenClaw skill, web app, or directly from CLI.
 *
 * Usage:
 *   tsx run-claim.ts "claim text here"
 *   tsx run-claim.ts --url "https://example.com/article"
 *
 * Output:
 *   Prints Zod-validated Verdict JSON to stdout
 *   Exits with code 0 on success, non-zero on error
 */

import { v4 as uuidv4 } from "uuid";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import * as dotenv from "dotenv";
import type { Verdict } from "@truthcast/shared/schema";
import { VerdictSchema } from "@truthcast/shared/schema";
import { normalizeAndHash } from "../normalize.js";
import { getCachedVerdict, writeVerdict } from "../db/init.js";
import { checkCheckworthiness } from "../checkworthiness.js";
import { decomposeClaim } from "../decomposition.js";
import { researchClaim } from "../gemini-researcher.js";
import { runDebate, calculateAgreementScore } from "../debate.js";
import { aggregateSubClaimVerdicts } from "@truthcast/shared/constants";
import { writeSolanaVerdict, elevenLabsTTS, buildUnverifiableVerdict } from "../helpers.js";
import { Sentry } from "../sentry.js";

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env") });

interface PipelineOptions {
  claim?: string;
  url?: string;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): PipelineOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: No claim or URL provided");
    console.error("Usage: tsx run-claim.ts \"claim text\" OR tsx run-claim.ts --url \"https://...\"");
    process.exit(1);
  }

  if (args[0] === "--url") {
    if (!args[1]) {
      console.error("Error: --url flag requires a URL argument");
      process.exit(1);
    }
    return { url: args[1] };
  }

  // First arg is the claim
  return { claim: args.join(" ") };
}

/**
 * Extract claim text from URL
 */
async function extractClaimFromURL(url: string): Promise<string> {
  // TODO: Implement URL scraping with cheerio or similar
  // For now, just return a placeholder
  console.error(`Warning: URL extraction not yet implemented. Using URL as claim text.`);
  return url;
}

/**
 * Run the full pipeline for a single claim
 */
async function runPipeline(claim: string): Promise<Verdict> {
  const sessionId = uuidv4();
  const claimHash = normalizeAndHash(claim);
  const tempDir = join(tmpdir(), `pipeline-${sessionId}`);

  try {
    // Create temp directory
    mkdirSync(tempDir, { recursive: true });
    console.error(`[Pipeline] Session ${sessionId} started`);
    console.error(`[Pipeline] Temp directory: ${tempDir}`);

    // Stage 0: Cache check
    console.error("[Stage 0/4] Checking cache...");
    const cached = getCachedVerdict(claimHash);
    if (cached) {
      console.error("[Stage 0/4] ✓ Cache hit - returning cached verdict");
      return cached;
    }
    console.error("[Stage 0/4] ✓ No cache hit - running full pipeline");

    // Stage 1: Ingestion (checkworthiness + decomposition)
    console.error("[Stage 1/4] Analyzing checkworthiness...");
    const checkworthiness = await checkCheckworthiness(claim);

    if (!checkworthiness.is_checkworthy) {
      console.error(`[Stage 1/4] ✓ Claim is not checkworthy: ${checkworthiness.reason}`);
      const verdict = buildUnverifiableVerdict({ claim_text: claim }, claimHash);
      await writeVerdict(verdict, null);
      return verdict;
    }

    console.error("[Stage 1/4] ✓ Claim is checkworthy, decomposing...");
    const subClaims = await decomposeClaim(claim);
    console.error(`[Stage 1/4] ✓ Decomposed into ${subClaims.length} sub-claim(s)`);

    // Stage 2: Research (evidence retrieval + MBFC scoring)
    console.error("[Stage 2/4] Retrieving evidence with Gemini...");
    const subVerdicts = [];

    for (let i = 0; i < subClaims.length; i++) {
      console.error(`[Stage 2/4] Researching sub-claim ${i + 1}/${subClaims.length}: "${subClaims[i].substring(0, 60)}..."`);
      const subVerdict = await researchClaim(subClaims[i]);
      subVerdicts.push(subVerdict);
    }

    const totalSources = subVerdicts.reduce((sum, v) => sum + v.sources.length, 0);
    const agreementScore = calculateAgreementScore(subVerdicts);
    console.error(`[Stage 2/4] ✓ Retrieved ${totalSources} sources (agreement: ${(agreementScore * 100).toFixed(0)}%)`);

    // Stage 2.5: Conditional debate
    let debateResult = null;
    if (agreementScore < 0.8) {
      console.error(`[Stage 2.5/4] Low agreement detected, running adversarial debate...`);
      debateResult = await runDebate(claim, subVerdicts);
      console.error(`[Stage 2.5/4] ✓ Debate complete: ${debateResult.consensus}`);
    } else {
      console.error(`[Stage 2.5/4] High agreement (${(agreementScore * 100).toFixed(0)}%), skipping debate (fast path)`);
    }

    // Stage 3: Moderator (verdict synthesis)
    console.error("[Stage 3/4] Synthesizing verdict...");
    let verdict: Verdict;

    if (debateResult) {
      // Use debate consensus
      const debateVerdict = debateResult.consensus.match(/(TRUE|MOSTLY_TRUE|MISLEADING|MOSTLY_FALSE|FALSE|CONFLICTING|UNVERIFIABLE)/i)?.[0].toUpperCase() || "CONFLICTING";
      const minorityView = debateResult.affirmative.confidence < debateResult.negative.confidence
        ? debateResult.affirmative.argument
        : debateResult.negative.argument;

      const allSources = subVerdicts.flatMap((v: any) => v.sources || []);
      const uniqueSources = Array.from(
        new Map(allSources.map((s: any) => [s.url, s])).values()
      ).slice(0, 10);

      verdict = {
        claim_hash: claimHash,
        claim_text: claim,
        sub_claims: subClaims,
        verdict: debateVerdict as any,
        confidence: Math.round((debateResult.affirmative.confidence + debateResult.negative.confidence) / 2),
        reasoning: debateResult.consensus,
        sources: uniqueSources,
        minority_view: minorityView,
        debate_triggered: true,
        agreement_score: debateResult.agreement_score,
        checked_at: Math.floor(Date.now() / 1000),
        ttl_policy: "SHORT",
        pipeline_version: "2.0",
      };
    } else if (subVerdicts.length === 1) {
      // Single claim - use research verdict directly
      const research = subVerdicts[0];
      verdict = {
        claim_hash: claimHash,
        claim_text: claim,
        sub_claims: [claim],
        verdict: research.verdict,
        confidence: research.confidence,
        reasoning: research.reasoning,
        sources: research.sources,
        minority_view: null,
        debate_triggered: false,
        agreement_score: agreementScore,
        checked_at: Math.floor(Date.now() / 1000),
        ttl_policy: "LONG",
        pipeline_version: "2.0",
      };
    } else {
      // Multiple sub-claims - aggregate
      const aggregated = aggregateSubClaimVerdicts(subVerdicts);
      verdict = {
        claim_hash: claimHash,
        claim_text: claim,
        sub_claims: subClaims,
        verdict: aggregated.verdict as any,
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
    }

    // Validate with Zod
    try {
      verdict = VerdictSchema.parse(verdict);
    } catch (err) {
      Sentry.captureException(err, {
        extra: { stage: "moderator_validation", claim_hash: claimHash },
      });
      throw err;
    }

    console.error(`[Stage 3/4] ✓ Verdict: ${verdict.verdict} (${verdict.confidence}% confidence)`);

    // Stage 4: Publisher (Solana + cache)
    console.error("[Stage 4/4] Publishing verdict...");

    // Write to Solana (non-fatal)
    let txHash: string | null = null;
    try {
      txHash = await writeSolanaVerdict(verdict);
      console.error(`[Stage 4/4] ✓ Solana write successful: ${txHash}`);
    } catch (error) {
      console.error(`[Stage 4/4] ⚠ Solana write failed (non-fatal):`, error);
    }

    // Generate audio (non-fatal)
    try {
      const voiceScript = `This claim is ${verdict.verdict.toLowerCase().replace("_", " ")}, with ${
        verdict.confidence >= 90 ? "very high" : verdict.confidence >= 70 ? "high" : "moderate"
      } confidence. ${verdict.reasoning.split(/[.!?]/)[0]}.`;
      await elevenLabsTTS(voiceScript);
      console.error(`[Stage 4/4] ✓ Audio generated`);
    } catch (error) {
      console.error(`[Stage 4/4] ⚠ Audio generation failed (non-fatal):`, error);
    }

    // Write to cache
    await writeVerdict(verdict, txHash);
    console.error(`[Stage 4/4] ✓ Verdict cached`);

    console.error(`[Pipeline] ✅ Pipeline complete for session ${sessionId}`);

    return verdict;

  } finally {
    // Cleanup temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
      console.error(`[Pipeline] Cleaned up ${tempDir}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();

    let claim: string;
    if (options.url) {
      console.error(`Extracting claim from URL: ${options.url}`);
      claim = await extractClaimFromURL(options.url);
    } else if (options.claim) {
      claim = options.claim;
    } else {
      throw new Error("No claim or URL provided");
    }

    // Truncate if too long
    if (claim.length > 2000) {
      console.error(`Warning: Claim truncated from ${claim.length} to 2000 characters`);
      claim = claim.substring(0, 2000);
    }

    // Run pipeline
    const verdict = await runPipeline(claim);

    // Print verdict JSON to stdout (this is what the OpenClaw skill parses)
    console.log(JSON.stringify(verdict, null, 2));

    process.exit(0);

  } catch (error: any) {
    console.error("Pipeline error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    Sentry.captureException(error);
    process.exit(1);
  }
}

main();
