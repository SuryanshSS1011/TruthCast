/**
 * Adversarial Debate Agents
 *
 * When research results have low agreement (< 0.8), trigger adversarial debate
 * between affirmative and negative agents to explore conflicting evidence.
 *
 * Based on He et al., WWW 2026 (DebateCV) - adversarial debate improves
 * verdict quality for ambiguous/conflicting claims.
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

export interface DebateArgument {
  position: "affirmative" | "negative";
  argument: string;
  key_evidence: string[];
  confidence: number;
}

export interface DebateResult {
  affirmative: DebateArgument;
  negative: DebateArgument;
  consensus: string;
  agreement_score: number;
}

/**
 * Calculate agreement score from research verdicts
 * Returns 0.0 - 1.0 where 1.0 = perfect agreement
 */
export function calculateAgreementScore(verdicts: any[]): number {
  if (verdicts.length <= 1) return 1.0;

  // Count how many verdicts agree with the majority
  const counts: Record<string, number> = {};
  for (const v of verdicts) {
    counts[v.verdict] = (counts[v.verdict] || 0) + 1;
  }

  const maxCount = Math.max(...Object.values(counts));
  const total = verdicts.length;

  return maxCount / total;
}

/**
 * Debater-Pro: Affirmative Agent
 * Argues that the claim is TRUE based on available evidence
 */
async function debaterPro(claim: string, evidence: any[]): Promise<DebateArgument> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const evidenceSummary = evidence
    .map((v, i) => `${i + 1}. ${v.reasoning} (Sources: ${v.sources.length})`)
    .join("\n");

  const prompt = `You are the AFFIRMATIVE debater. Your role is to argue that this claim is TRUE or MOSTLY TRUE based on available evidence.

CLAIM: "${claim}"

EVIDENCE:
${evidenceSummary}

Your task:
1. Build the strongest possible case that the claim is TRUE
2. Cite the most credible evidence supporting the claim
3. Address potential counterarguments preemptively
4. Be intellectually honest - if evidence is weak, acknowledge it

Provide your argument in JSON format:
{
  "argument": "<Your 2-3 sentence affirmative argument>",
  "key_evidence": ["<evidence point 1>", "<evidence point 2>"],
  "confidence": <0-100 score for how strong the affirmative case is>
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse debater-pro response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    position: "affirmative",
    argument: parsed.argument,
    key_evidence: parsed.key_evidence || [],
    confidence: Math.min(100, Math.max(0, parsed.confidence)),
  };
}

/**
 * Debater-Con: Negative Agent
 * Argues that the claim is FALSE based on available evidence
 */
async function debaterCon(claim: string, evidence: any[]): Promise<DebateArgument> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const evidenceSummary = evidence
    .map((v, i) => `${i + 1}. ${v.reasoning} (Sources: ${v.sources.length})`)
    .join("\n");

  const prompt = `You are the NEGATIVE debater. Your role is to argue that this claim is FALSE or MOSTLY FALSE based on available evidence.

CLAIM: "${claim}"

EVIDENCE:
${evidenceSummary}

Your task:
1. Build the strongest possible case that the claim is FALSE
2. Cite the most credible evidence refuting the claim
3. Point out flaws, biases, or gaps in the affirmative case
4. Be intellectually honest - if evidence is weak, acknowledge it

Provide your argument in JSON format:
{
  "argument": "<Your 2-3 sentence negative argument>",
  "key_evidence": ["<evidence point 1>", "<evidence point 2>"],
  "confidence": <0-100 score for how strong the negative case is>
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse debater-con response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    position: "negative",
    argument: parsed.argument,
    key_evidence: parsed.key_evidence || [],
    confidence: Math.min(100, Math.max(0, parsed.confidence)),
  };
}

/**
 * Run adversarial debate and synthesize consensus
 */
export async function runDebate(claim: string, evidence: any[]): Promise<DebateResult> {
  // Run both debaters in parallel
  const [affirmative, negative] = await Promise.all([
    debaterPro(claim, evidence),
    debaterCon(claim, evidence),
  ]);

  // Synthesize consensus based on debate strength
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const synthesisPrompt = `You are a neutral moderator evaluating an adversarial debate.

CLAIM: "${claim}"

AFFIRMATIVE ARGUMENT (confidence: ${affirmative.confidence}%):
${affirmative.argument}
Key evidence: ${affirmative.key_evidence.join("; ")}

NEGATIVE ARGUMENT (confidence: ${negative.confidence}%):
${negative.argument}
Key evidence: ${negative.key_evidence.join("; ")}

Synthesize a consensus verdict. Consider:
1. Which side has stronger evidence?
2. Are both sides making valid points? (→ CONFLICTING)
3. Is one side clearly stronger? (→ TRUE/FALSE)
4. Is the difference marginal? (→ MOSTLY_TRUE/MOSTLY_FALSE)

Return JSON:
{
  "consensus": "<One sentence explaining the synthesis>",
  "verdict": "<TRUE|MOSTLY_TRUE|CONFLICTING|MOSTLY_FALSE|FALSE>",
  "confidence": <0-100>
}`;

  const synthesisResult = await model.generateContent(synthesisPrompt);
  const synthesisText = synthesisResult.response.text();

  const jsonMatch = synthesisText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse synthesis response");
  }

  const synthesis = JSON.parse(jsonMatch[0]);

  // Calculate final agreement score based on debate
  // If both sides have similar confidence, agreement is low
  const confidenceDiff = Math.abs(affirmative.confidence - negative.confidence);
  const debateAgreementScore = confidenceDiff / 100; // 0.0 = perfect disagreement, 1.0 = perfect agreement

  return {
    affirmative,
    negative,
    consensus: synthesis.consensus,
    agreement_score: debateAgreementScore,
  };
}
