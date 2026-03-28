#!/usr/bin/env node
/**
 * Phase 4: Full Pipeline Test with SSE Progress Tracking
 *
 * Tests the complete 4-stage autonomous pipeline:
 * Stage 0: Cache check
 * Stage 1: Ingestion (checkworthiness + decomposition)
 * Stage 2: Researcher (Gemini evidence retrieval)
 * Stage 3: Moderator (verdict synthesis)
 * Stage 4: Publisher (Solana + audio + cache)
 */

import { startPipeline, getSession, pipelineEmitter } from "../orchestrator.js";
import type { PipelineEvent } from "../orchestrator.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test claims
const TEST_CLAIMS = [
  {
    claim: "NASA confirmed the existence of water ice on the Moon.",
    description: "Simple factual claim - no decomposition needed",
  },
  {
    claim: "5G towers were used to spread COVID-19 and were destroyed in protests across Europe.",
    description: "Compound claim - should decompose and trigger debate (conflicting evidence)",
  },
  {
    claim: "Social media companies do more harm than good for democracy.",
    description: "Opinion - should fail checkworthiness",
  },
];

async function testPhase4() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TruthCast Phase 5: Adversarial Debate Test ===");
  console.log("=".repeat(70) + "\n");

  const testClaim = TEST_CLAIMS[1]; // Use 5G/COVID compound claim for debate test

  console.log(`Test claim: "${testClaim.claim}"`);
  console.log(`Description: ${testClaim.description}\n`);

  console.log("Starting pipeline with SSE progress tracking...\n");

  // Start pipeline
  const session_id = startPipeline(testClaim.claim);
  console.log(`✓ Pipeline session started: ${session_id}\n`);

  // Listen to SSE events
  pipelineEmitter.on(session_id, (event: PipelineEvent) => {
    const timestamp = new Date().toISOString().substring(11, 23);

    if (event.event === "progress") {
      console.log(`[${timestamp}] [${event.progress}%] ${event.stage}: ${event.message}`);
    } else if (event.event === "stage_complete") {
      console.log(
        `[${timestamp}] [${event.progress}%] ✓ ${event.stage} complete: ${event.message}`
      );
      if (event.data) {
        // Special formatting for debate data
        if (event.stage === "debate") {
          console.log(`           Affirmative confidence: ${event.data.affirmative_confidence}%`);
          console.log(`           Negative confidence: ${event.data.negative_confidence}%`);
          console.log(`           Debate agreement: ${(event.data.debate_agreement * 100).toFixed(0)}%`);
        } else {
          console.log(`           Data: ${JSON.stringify(event.data)}`);
        }
      }
    } else if (event.event === "complete") {
      console.log(`\n[${timestamp}] [${event.progress}%] ✅ ${event.message}\n`);
    } else if (event.event === "error") {
      console.log(`\n[${timestamp}] ❌ ERROR: ${event.message}\n`);
    }
  });

  // Poll for completion
  await new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      const session = getSession(session_id);

      if (session && (session.status === "completed" || session.status === "failed")) {
        clearInterval(checkInterval);

        console.log("=".repeat(70));
        console.log("=== Pipeline Complete ===");
        console.log("=".repeat(70));

        if (session.status === "completed" && session.verdict) {
          const v = session.verdict;
          console.log(`\n📝 Final Verdict:`);
          console.log(`   Claim: "${session.claim}"`);
          console.log(`   Hash: ${v.claim_hash.substring(0, 16)}...`);
          console.log(`   Verdict: ${v.verdict}`);
          console.log(`   Confidence: ${v.confidence}%`);
          console.log(`   Sources: ${v.sources.length}`);
          console.log(`   Sub-claims: ${v.sub_claims.length}`);
          console.log(`   Reasoning: ${v.reasoning.substring(0, 100)}...`);
          console.log(`   TTL Policy: ${v.ttl_policy}`);
          console.log(`   Checked at: ${new Date(v.checked_at * 1000).toISOString()}`);

          if (v.debate_triggered) {
            console.log(`\n⚔️  Adversarial Debate:`);
            console.log(`   Debate triggered: YES (low agreement: ${(v.agreement_score * 100).toFixed(0)}%)`);
            if (v.minority_view) {
              console.log(`   Minority view: ${v.minority_view.substring(0, 100)}...`);
            }
          }

          if (v.sources.length > 0) {
            console.log(`\n🔗 Top 3 Sources:`);
            v.sources.slice(0, 3).forEach((s, i) => {
              console.log(`   ${i + 1}. [${s.domain_tier}] ${s.domain}`);
            });
          }

          // Show Solana transaction if available
          const dbPath = join(__dirname, "../db/truthcast.db");
          const db = new Database(dbPath, { readonly: true });
          const row = db.prepare("SELECT tx_hash FROM verdicts WHERE claim_hash = ?").get(v.claim_hash) as any;
          db.close();

          if (row?.tx_hash) {
            console.log(`\n⛓️  Blockchain Record:`);
            console.log(`   Tx Hash: ${row.tx_hash.substring(0, 20)}...`);
            console.log(`   Solana Explorer: https://explorer.solana.com/tx/${row.tx_hash}?cluster=devnet`);
            console.log(`   On-chain proof: {"h":"${v.claim_hash.substring(0, 8)}...","v":"${v.verdict}","c":${v.confidence},"t":${v.checked_at},"pv":"${v.pipeline_version}"}`);
          }

          console.log(`\n⏱️  Total Time: ${((Date.now() - session.started_at) / 1000).toFixed(2)}s`);
          console.log("\n" + "=".repeat(70));
          console.log("✅ Phase 5 COMPLETE: Adversarial debate with 7-label taxonomy!");
          console.log("=".repeat(70));
          console.log("\nNext: Phase 6 - Next.js frontend with real-time SSE progress bar\n");
        } else {
          console.log(`\n❌ Pipeline failed: ${session.error}\n`);
          process.exit(1);
        }

        resolve();
      }
    }, 500);
  });
}

// Run test
testPhase4().catch((error) => {
  console.error("\n❌ Test failed:", error);
  process.exit(1);
});
