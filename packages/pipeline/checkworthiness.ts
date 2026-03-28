/**
 * Checkworthiness Classification
 *
 * Filters claims that are not worth fact-checking:
 * - Opinions ("I think...", "In my view...")
 * - Predictions ("will happen", "is going to")
 * - Questions
 * - Commands
 * - Ambiguous statements without specific assertions
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, "../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface CheckworthinessResult {
  is_checkworthy: boolean;
  reason: string;
  claim_type: "factual" | "opinion" | "prediction" | "question" | "command" | "ambiguous";
}

/**
 * Determine if a claim is worth fact-checking
 *
 * Based on Full Fact checkworthiness criteria (Konstantinovskiy et al., 2018)
 */
export async function checkCheckworthiness(claim: string): Promise<CheckworthinessResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this statement and determine if it is worth fact-checking:

STATEMENT: "${claim}"

Classify the statement into ONE of these categories:

1. FACTUAL: A specific, verifiable assertion about objective reality
   Examples: "The Earth orbits the Sun", "COVID-19 vaccines were approved in 2020"

2. OPINION: A subjective judgment or personal view
   Examples: "Pizza is the best food", "Democracy is better than autocracy"

3. PREDICTION: A claim about future events
   Examples: "It will rain tomorrow", "The economy will collapse next year"

4. QUESTION: Phrased as a question
   Examples: "Is climate change real?", "Did humans land on the moon?"

5. COMMAND: An imperative statement
   Examples: "Vote for candidate X", "Stop eating meat"

6. AMBIGUOUS: Too vague to verify
   Examples: "Things are getting worse", "Something needs to change"

Return ONLY a JSON object:
{
  "is_checkworthy": true/false,
  "reason": "<brief explanation>",
  "claim_type": "<one of: factual, opinion, prediction, question, command, ambiguous>"
}

Only "factual" claims should be checkworthy. All others should be false.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback: assume checkworthy if parsing fails
      return {
        is_checkworthy: true,
        reason: "Could not parse checkworthiness response",
        claim_type: "factual",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      is_checkworthy: parsed.is_checkworthy,
      reason: parsed.reason,
      claim_type: parsed.claim_type,
    };
  } catch (error) {
    console.error("Checkworthiness check failed:", error);
    // Fail open: allow claim to proceed
    return {
      is_checkworthy: true,
      reason: "Error checking checkworthiness, allowing claim",
      claim_type: "factual",
    };
  }
}
