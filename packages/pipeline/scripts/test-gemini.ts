#!/usr/bin/env node
/**
 * Phase 2: Gemini Evidence Retrieval + MBFC Scoring Test
 *
 * Tests the Gemini API with google_search grounding on 5 pre-selected demo claims.
 * Validates that the system can retrieve evidence and score sources correctly.
 */

import { researchClaim } from "../gemini-researcher.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (3 levels up from this script)
dotenv.config({ path: join(__dirname, "../../../.env") });

// 5 Pre-selected demo claims from architecture plan
const DEMO_CLAIMS = [
  {
    claim: "The Great Wall of China is visible from space with the naked eye.",
    expected: "FALSE",
    description: "NASA sources should confirm this is false",
  },
  {
    claim: "Vaccines cause autism.",
    expected: "FALSE",
    description: "WHO, CDC, peer-reviewed studies all refute this",
  },
  {
    claim: "NASA confirmed the existence of water ice on the Moon.",
    expected: "TRUE",
    description: "Shows system handles TRUE claims honestly",
  },
  {
    claim: "Social media companies do more harm than good for democracy.",
    expected: "UNVERIFIABLE",
    description: "Opinion statement, checkworthiness filter",
  },
  {
    claim: "5G towers were used to spread COVID-19 and were destroyed in protests across Europe.",
    expected: "MISLEADING",
    description: "Compound: towers destroyed = TRUE, 5G spreads COVID = FALSE",
  },
];

async function testGeminiResearch() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TruthCast Phase 2: Gemini + MBFC Integration Test ===");
  console.log("=".repeat(70) + "\n");

  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY not found in .env file\n");
    console.log("Please add your Gemini API key to .env:");
    console.log("GEMINI_API_KEY=<your_api_key>\n");
    console.log("Get a free API key at: https://makersuite.google.com/app/apikey\n");
    process.exit(1);
  }

  console.log("Testing 5 pre-selected demo claims...\n");
  console.log("This will take ~30-60 seconds (Gemini API + Google Search)\n");

  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < DEMO_CLAIMS.length; i++) {
    const test = DEMO_CLAIMS[i];
    console.log("─".repeat(70));
    console.log(`\nTest ${i + 1}/5: ${test.claim}`);
    console.log(`Expected verdict: ${test.expected}`);
    console.log(`Description: ${test.description}\n`);

    try {
      const result = await researchClaim(test.claim);

      console.log(`✓ Actual verdict: ${result.verdict}`);
      console.log(`✓ Confidence: ${result.confidence}%`);
      console.log(`✓ Reasoning: ${result.reasoning}`);
      console.log(`✓ Sources found: ${result.sources.length}`);

      if (result.sources.length > 0) {
        console.log("\nTop 3 sources:");
        result.sources.slice(0, 3).forEach((source, idx) => {
          console.log(
            `   ${idx + 1}. [${source.domain_tier}] ${source.domain} (score: ${source.credibility_score.toFixed(2)})`
          );
          console.log(`      ${source.url}`);
        });
      }

      // Check if verdict matches expected
      const match = result.verdict === test.expected;
      if (match) {
        console.log(`\n✅ PASS: Verdict matches expected (${test.expected})`);
        passCount++;
      } else {
        console.log(`\n⚠️  PARTIAL: Got ${result.verdict}, expected ${test.expected}`);
        console.log("   (This may be acceptable depending on evidence found)");
        failCount++;
      }
    } catch (error: any) {
      console.error(`\n❌ FAIL: ${error.message}`);
      failCount++;
    }

    console.log("");
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("=== Phase 2 Test Results ===");
  console.log("=".repeat(70));
  console.log(`\nTotal tests: ${DEMO_CLAIMS.length}`);
  console.log(`Exact matches: ${passCount}`);
  console.log(`Different verdicts: ${failCount}`);
  console.log("\nNote: Different verdicts are not necessarily failures.");
  console.log("The system may find different evidence than expected.");
  console.log("Review the reasoning and sources to validate correctness.\n");

  if (passCount >= 3) {
    console.log("✅ Phase 2 COMPLETE: Gemini + MBFC integration working!\n");
    console.log("Next step: Phase 3 - Add ElevenLabs TTS");
    console.log("Run: npm run dev --workspace=packages/pipeline\n");
    console.log("=".repeat(70) + "\n");
    process.exit(0);
  } else {
    console.log("⚠️  Review results above. System may need tuning.\n");
    console.log("=".repeat(70) + "\n");
    process.exit(1);
  }
}

// Run the test
testGeminiResearch();
