#!/usr/bin/env node
/**
 * Debug script to test ElevenLabs API authentication
 */

import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, "../../../.env") });

async function testElevenLabsAuth() {
  console.log("\n=== ElevenLabs API Authentication Test ===\n");

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  console.log("Environment Variables:");
  console.log(`  ELEVENLABS_API_KEY: ${apiKey ? `${apiKey.substring(0, 10)}... (${apiKey.length} chars)` : "NOT FOUND"}`);
  console.log(`  ELEVENLABS_VOICE_ID: ${voiceId || "NOT FOUND"}\n`);

  if (!apiKey) {
    console.error("❌ ELEVENLABS_API_KEY not found in environment");
    process.exit(1);
  }

  if (!voiceId) {
    console.error("❌ ELEVENLABS_VOICE_ID not found in environment");
    process.exit(1);
  }

  console.log("Testing API authentication...\n");

  try {
    // Test 1: Get available voices (most API keys have this permission)
    console.log("Test 1: Fetching available voices...");
    const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (voicesResponse.ok) {
      const voicesData = await voicesResponse.json();
      console.log(`  ✓ Found ${voicesData.voices.length} available voices\n`);

      // Check if the configured voice ID exists
      const selectedVoice = voicesData.voices.find((v: any) => v.voice_id === voiceId);
      if (selectedVoice) {
        console.log(`  ✓ Your configured voice "${selectedVoice.name}" (${voiceId}) is valid\n`);
      } else {
        console.log(`  ⚠️  Your configured voice ID "${voiceId}" was not found`);
        console.log(`  Available voices:`);
        voicesData.voices.slice(0, 5).forEach((v: any) => {
          console.log(`    - ${v.name}: ${v.voice_id}`);
        });
        console.log("\n");
      }
    }

    // Test 2: Generate a small test audio
    console.log("\nTest 2: Generating test audio (2 words)...");
    const testText = "Hello world";
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: testText,
          model_id: "eleven_turbo_v2_5", // Free tier compatible model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    console.log(`  Status: ${ttsResponse.status} ${ttsResponse.statusText}`);

    if (ttsResponse.ok) {
      const audioBuffer = await ttsResponse.arrayBuffer();
      console.log(`  ✓ Audio generated successfully!`);
      console.log(`  Audio size: ${(audioBuffer.byteLength / 1024).toFixed(2)} KB\n`);

      console.log("=".repeat(70));
      console.log("✅ All tests passed! ElevenLabs API is working correctly.");
      console.log("=".repeat(70));
      console.log("\nYou can now run: npm run test-phase3 --workspace=packages/pipeline\n");
    } else {
      const errorText = await ttsResponse.text();
      console.log(`  ❌ TTS generation failed`);
      console.log(`  Error: ${errorText}\n`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

testElevenLabsAuth();
