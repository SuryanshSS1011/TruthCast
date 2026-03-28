// packages/pipeline/helpers.ts
import { Connection, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";
import { VerdictSchema, type Verdict } from "@truthcast/shared/schema";
import * as Sentry from "@sentry/node";
import bs58 from "bs58";

/**
 * Builds an UNVERIFIABLE verdict for non-factual claims (opinions, predictions, ambiguous statements)
 */
export function buildUnverifiableVerdict(claim: any, claimHash: string): Verdict {
  return {
    claim_hash: claimHash,
    claim_text: claim.text || claim.claim,
    sub_claims: [claim.text || claim.claim],
    verdict: "UNVERIFIABLE",
    confidence: 0,
    reasoning:
      "This claim is an opinion, prediction, or ambiguous statement and cannot be objectively verified.",
    sources: [],
    minority_view: null,
    debate_triggered: false,
    agreement_score: 1.0,
    checked_at: Math.floor(Date.now() / 1000),
    ttl_policy: "STATIC",
    pipeline_version: "2.0",
  };
}

/**
 * Writes a verdict to Solana devnet using the Memo Program
 * Returns the transaction signature or throws on error
 */
export async function writeSolanaVerdict(verdict: Verdict): Promise<string> {
  try {
    // Validate verdict with Zod schema before writing
    VerdictSchema.parse(verdict);

    // Initialize Solana connection
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );

    // Parse keypair from environment
    const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
    if (!privateKeyString) {
      throw new Error("SOLANA_PRIVATE_KEY environment variable not set");
    }

    const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyString));

    // Serialize verdict to JSON
    let verdictJson = JSON.stringify(verdict);

    // Memo Program has max size of 566 bytes
    // If too large, truncate sources to top 3
    if (Buffer.byteLength(verdictJson, "utf8") > 566) {
      const truncatedVerdict = {
        ...verdict,
        sources: verdict.sources.slice(0, 3),
      };
      verdictJson = JSON.stringify(truncatedVerdict);
    }

    // Still too large? Truncate reasoning
    if (Buffer.byteLength(verdictJson, "utf8") > 566) {
      const truncatedVerdict = {
        ...verdict,
        sources: verdict.sources.slice(0, 3),
        reasoning: verdict.reasoning.substring(0, 200) + "...",
      };
      verdictJson = JSON.stringify(truncatedVerdict);
    }

    // Create memo instruction
    const memoInstruction = createMemoInstruction(verdictJson, [keypair.publicKey]);

    // Create and send transaction
    const transaction = new Transaction().add(memoInstruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
      commitment: "confirmed",
    });

    return signature;
  } catch (err) {
    // Capture error in Sentry
    Sentry.captureException(err, {
      extra: {
        stage: "solana_write",
        claim_hash: verdict.claim_hash,
      },
    });
    throw err;
  }
}

/**
 * Generates TTS audio using ElevenLabs API
 * Returns audio URL or null if fails (non-fatal)
 */
export async function elevenLabsTTS(text: string): Promise<string | null> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      console.warn("ElevenLabs credentials not configured, skipping TTS");
      return null;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return audioUrl;
  } catch (err) {
    // Capture error in Sentry but don't fail the pipeline
    Sentry.captureException(err, {
      extra: {
        stage: "elevenlabs_tts",
        text_length: text.length,
      },
    });
    console.error("ElevenLabs TTS failed:", err);
    return null;
  }
}
