#!/usr/bin/env node
/**
 * Phase 3: ElevenLabs TTS Integration Test
 *
 * Tests the full pipeline: Claim → Gemini Verdict → Voice Audio
 * Combines Phase 2 (Gemini) with Phase 3 (ElevenLabs TTS)
 */

import { researchClaim } from "../gemini-researcher.js";
import { elevenLabsTTS } from "../helpers.js";
import { writeFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, "../../../.env") });

/**
 * Convert a verdict object into concise natural voice script
 * Format: verdict label + confidence + first sentence of reasoning only
 */
function formatVerdictForVoice(claim: string, verdict: any): string {
  const verdictLabels: Record<string, string> = {
    TRUE: "true",
    MOSTLY_TRUE: "mostly true",
    MISLEADING: "misleading",
    MOSTLY_FALSE: "mostly false",
    FALSE: "false",
    CONFLICTING: "conflicting evidence",
    UNVERIFIABLE: "unverifiable",
  };

  const verdictText = verdictLabels[verdict.verdict] || verdict.verdict.toLowerCase();
  const confidenceText =
    verdict.confidence >= 90
      ? "with very high confidence"
      : verdict.confidence >= 70
      ? "with high confidence"
      : verdict.confidence >= 50
      ? "with moderate confidence"
      : "with low confidence";

  // Extract first sentence from reasoning
  const firstSentence = verdict.reasoning.split(/[.!?]/)[0].trim() + ".";

  // Build concise voice script: verdict + confidence + first sentence only
  const script = `This claim is ${verdictText}, ${confidenceText}. ${firstSentence}`;

  return script;
}

async function testPhase3() {
  console.log("\n" + "=".repeat(70));
  console.log("=== TruthCast Phase 3: ElevenLabs TTS Integration Test ===");
  console.log("=".repeat(70) + "\n");

  // Check API keys
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY not found in .env file\n");
    process.exit(1);
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error("❌ ERROR: ELEVENLABS_API_KEY not found in .env file\n");
    console.log("Please add your ElevenLabs API key to .env:");
    console.log("ELEVENLABS_API_KEY=<your_api_key>");
    console.log("ELEVENLABS_VOICE_ID=<voice_id>\n");
    console.log("Get a free API key at: https://elevenlabs.io/api\n");
    process.exit(1);
  }

  if (!process.env.ELEVENLABS_VOICE_ID) {
    console.error("❌ ERROR: ELEVENLABS_VOICE_ID not found in .env file\n");
    console.log("Please add a voice ID to .env.");
    console.log("Popular voices:");
    console.log("  - Rachel: 21m00Tcm4TlvDq8ikWAM");
    console.log("  - Clyde: 2EiwWnXFnvU5JabPnv8n");
    console.log("  - Domi: AZnzlk1XvdvUeBnXmlld\n");
    process.exit(1);
  }

  const testClaim = "NASA confirmed the existence of water ice on the Moon.";

  console.log(`Test claim: "${testClaim}"\n`);
  console.log("Step 1: Retrieving evidence with Gemini API...\n");

  try {
    // Step 1: Get verdict from Gemini
    const verdict = await researchClaim(testClaim);

    console.log("✓ Verdict received from Gemini");
    console.log(`  Verdict: ${verdict.verdict}`);
    console.log(`  Confidence: ${verdict.confidence}%`);
    console.log(`  Sources: ${verdict.sources.length}`);
    console.log(`  Reasoning: ${verdict.reasoning.substring(0, 100)}...\n`);

    // Step 2: Format verdict for voice
    console.log("Step 2: Formatting verdict for voice output...\n");
    const voiceScript = formatVerdictForVoice(testClaim, verdict);
    console.log("Voice script:");
    console.log(`"${voiceScript}"\n`);

    // Step 3: Generate audio with ElevenLabs
    console.log("Step 3: Generating audio with ElevenLabs TTS...\n");
    const audioUrl = await elevenLabsTTS(voiceScript);

    if (!audioUrl) {
      console.error("❌ Failed to generate audio");
      process.exit(1);
    }

    console.log("✓ Audio generated successfully\n");

    // Step 4: Save audio to file
    console.log("Step 4: Saving audio to file...\n");

    // Extract base64 from data URL
    const base64Audio = audioUrl.replace("data:audio/mpeg;base64,", "");
    const audioBuffer = Buffer.from(base64Audio, "base64");

    const outputPath = join(__dirname, "../../../output-phase3-test.mp3");
    writeFileSync(outputPath, audioBuffer);

    console.log("=".repeat(70));
    console.log("✅ Phase 3 COMPLETE: Full pipeline working!");
    console.log("=".repeat(70));
    console.log(`\n📝 Test Summary:`);
    console.log(`   Claim: "${testClaim}"`);
    console.log(`   Verdict: ${verdict.verdict} (${verdict.confidence}% confidence)`);
    console.log(`   Sources: ${verdict.sources.length}`);
    console.log(`   Audio file: ${outputPath}`);
    console.log(`   Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Voice script length: ${voiceScript.length} characters\n`);

    console.log("🎧 Play the audio file to hear the verdict:\n");
    console.log(`   open ${outputPath}\n`);

    console.log("=".repeat(70));
    console.log("Next step: Phase 4 - Build OpenClaw multi-agent pipeline");
    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Verify GEMINI_API_KEY is valid");
    console.error("2. Verify ELEVENLABS_API_KEY is valid");
    console.error("3. Verify ELEVENLABS_VOICE_ID is correct");
    console.error("4. Check your internet connection");
    console.error("5. Ensure you have sufficient API credits\n");
    process.exit(1);
  }
}

// Run the test
testPhase3();
