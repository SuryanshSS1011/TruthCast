/**
 * Gemini Evidence Retrieval with Google Search Grounding
 *
 * Uses Gemini 2.0 Flash with google_search tool to retrieve
 * real-time evidence and generate a credibility-scored verdict.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Source } from "@truthcast/shared/schema";
import { scoreMBFCDomain, getTier, extractDomain } from "./mbfc-scorer.js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (2 levels up)
dotenv.config({ path: join(__dirname, "../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface GeminiVerdict {
  verdict: "TRUE" | "MOSTLY_TRUE" | "MISLEADING" | "MOSTLY_FALSE" | "FALSE" | "CONFLICTING" | "UNVERIFIABLE";
  confidence: number;
  reasoning: string;
  sources: Source[];
}

/**
 * Research a claim using Gemini with Google Search grounding
 *
 * @param claim - The claim to fact-check
 * @returns Structured verdict with sources
 */
export async function researchClaim(claim: string): Promise<GeminiVerdict> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `You are a professional fact-checker. Evaluate this claim using real-time evidence from Google Search:

CLAIM: "${claim}"

Instructions:
1. Search for authoritative sources on this topic
2. Analyze the evidence objectively
3. Determine the verdict using this taxonomy:
   - TRUE: Claim is accurate and supported by high-quality evidence
   - MOSTLY_TRUE: Claim is largely accurate with minor inaccuracies
   - MISLEADING: Contains truthful elements but misrepresents context
   - MOSTLY_FALSE: Claim has significant inaccuracies
   - FALSE: Claim is demonstrably incorrect
   - CONFLICTING: High-quality sources genuinely disagree
   - UNVERIFIABLE: Insufficient evidence or unfalsifiable claim

4. Provide confidence score (0-100) based on:
   - Source quality (40% weight)
   - Source agreement (35% weight)
   - Evidence strength (25% weight)

5. Write clear reasoning (2-3 sentences) explaining your verdict

Return ONLY a JSON object with this exact structure:
{
  "verdict": "TRUE|MOSTLY_TRUE|MISLEADING|MOSTLY_FALSE|FALSE|CONFLICTING|UNVERIFIABLE",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "source_urls": ["<url1>", "<url2>", ...]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Extract grounding metadata for additional sources
    const groundingMetadata = (response as any).groundingMetadata;
    const allUrls = new Set<string>(parsed.source_urls || []);

    // Add URLs from grounding metadata if available
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          allUrls.add(chunk.web.uri);
        }
      }
    }

    // Score sources with MBFC
    const sources: Source[] = Array.from(allUrls)
      .slice(0, 10) // Max 10 sources
      .map((url) => {
        const domain = extractDomain(url);
        const credibilityScore = scoreMBFCDomain(url);
        const tier = credibilityScore !== null ? getTier(credibilityScore) : "Unknown";

        return {
          url,
          domain,
          credibility_score: credibilityScore ?? 0.5,
          domain_tier: tier,
          excerpt: "", // Will be populated by full pipeline
        };
      })
      .sort((a, b) => b.credibility_score - a.credibility_score);

    return {
      verdict: parsed.verdict,
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      reasoning: parsed.reasoning,
      sources,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}
