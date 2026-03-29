/**
 * Claim Decomposition (HiSS Method)
 *
 * Decomposes compound claims into atomic sub-claims for independent verification.
 * Based on Chen et al., ACL 2025 (Hierarchical Step-by-Step decomposition)
 *
 * Examples:
 * - Compound: "5G towers spread COVID-19 and were destroyed in Europe"
 *   → Sub-claims: ["5G towers spread COVID-19", "5G towers were destroyed in protests in Europe"]
 *
 * - Simple: "NASA confirmed water ice on the Moon"
 *   → Sub-claims: ["NASA confirmed water ice on the Moon"] (unchanged)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MAX_CLAIMS_TEXT, MAX_CLAIMS_VIDEO, MAX_CLAIMS_TWEET } from "@truthcast/shared/constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, "../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// URL detection helpers
function isYouTubeURL(text: string): boolean {
  return /youtube\.com|youtu\.be/i.test(text);
}

function isTwitterURL(text: string): boolean {
  return /twitter\.com|x\.com/i.test(text);
}

function isURL(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract factual claims from a URL (YouTube video, Twitter/X post, article)
 */
async function extractClaimsFromURL(url: string): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Determine URL type and max claims
    let maxClaims: number;
    let promptSuffix: string;

    if (isYouTubeURL(url)) {
      maxClaims = MAX_CLAIMS_VIDEO;
      promptSuffix = "Extract the top 3 most significant verifiable factual claims from this video transcript. Ignore opinions, predictions, and subjective statements. Rank by check-worthiness.";
    } else if (isTwitterURL(url)) {
      maxClaims = MAX_CLAIMS_TWEET;
      promptSuffix = "Extract the single main factual claim from this tweet. Strip retweet attribution, hashtags, and engagement context. Return the core verifiable assertion only.";
    } else {
      // Generic article/webpage
      maxClaims = MAX_CLAIMS_TEXT;
      promptSuffix = "Extract the top 5 most significant verifiable factual claims from this article. Ignore opinions, predictions, and subjective statements. Rank by check-worthiness.";
    }

    const prompt = `${promptSuffix}

Return as JSON array: [{claim: string, checkworthiness: number (0-1)}]

Rules:
1. Only include factual claims that can be objectively verified
2. Exclude opinions, predictions, personal anecdotes, and subjective statements
3. Rank by check-worthiness (importance + verifiability)
4. Return at most ${maxClaims} claims

Return ONLY the JSON array, no additional text.`;

    const result = await model.generateContent([
      prompt,
      { text: url }
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("Could not parse URL extraction response");
      return [url]; // Fallback to treating URL as a claim
    }

    const extracted: { claim: string; checkworthiness: number }[] = JSON.parse(jsonMatch[0]);

    // Sort by checkworthiness and take top N
    const sortedClaims = extracted
      .sort((a, b) => b.checkworthiness - a.checkworthiness)
      .slice(0, maxClaims)
      .map((item) => item.claim);

    if (sortedClaims.length === 0) {
      return [url]; // Fallback
    }

    return sortedClaims;
  } catch (error) {
    console.error("URL claim extraction failed:", error);
    return [url]; // Fallback to treating URL as a claim
  }
}

/**
 * Decompose a claim into atomic sub-claims
 *
 * Uses HiSS method: hierarchical step-by-step decomposition
 * Max 10 sub-claims to prevent explosion
 */
export async function decomposeClaim(claim: string): Promise<string[]> {
  try {
    const trimmedClaim = claim.trim();

    // Check if input is a URL
    if (isURL(trimmedClaim)) {
      return await extractClaimsFromURL(trimmedClaim);
    }

    // Regular text decomposition
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Decompose this claim into atomic, independently verifiable sub-claims:

CLAIM: "${claim}"

Rules:
1. Each sub-claim must be independently verifiable (can be fact-checked on its own)
2. Split compound claims connected by "and", "but", "while", "although"
3. Split claims with multiple time periods or locations
4. Keep simple claims as-is (don't over-decompose)
5. Max 10 sub-claims
6. Preserve the original meaning and context

Examples:

Input: "Vaccines cause autism"
Output: ["Vaccines cause autism"]
(Simple claim, no decomposition needed)

Input: "5G towers were used to spread COVID-19 and were destroyed in protests across Europe"
Output: ["5G towers were used to spread COVID-19", "5G towers were destroyed in protests across Europe"]
(Compound claim with "and", split into 2 independent assertions)

Input: "NASA confirmed water ice on the Moon in 2009 and found more in 2020"
Output: ["NASA confirmed water ice on the Moon in 2009", "NASA found more water ice on the Moon in 2020"]
(Multiple time periods, split for independent verification)

Input: "Social media harms democracy"
Output: ["Social media harms democracy"]
(Simple claim, no decomposition)

Return ONLY a JSON array of sub-claims:
["sub-claim 1", "sub-claim 2", ...]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Fallback: return original claim
      console.warn("Could not parse decomposition response, using original claim");
      return [claim];
    }

    const sub_claims: string[] = JSON.parse(jsonMatch[0]);

    // Validate: max 10 sub-claims
    if (sub_claims.length > 10) {
      console.warn(`Decomposition produced ${sub_claims.length} sub-claims, truncating to 10`);
      return sub_claims.slice(0, 10);
    }

    // Validate: at least 1 sub-claim
    if (sub_claims.length === 0) {
      return [claim];
    }

    return sub_claims;
  } catch (error) {
    console.error("Claim decomposition failed:", error);
    // Fallback: return original claim
    return [claim];
  }
}
