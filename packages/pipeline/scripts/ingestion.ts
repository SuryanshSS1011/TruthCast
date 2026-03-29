#!/usr/bin/env node
/**
 * Ingestion Agent (Node.js Fallback)
 * Checkworthiness assessment and atomic claim decomposition
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PIPELINE_DIR = process.env.PIPELINE_DIR;
if (!PIPELINE_DIR) {
  console.error('PIPELINE_DIR environment variable not set');
  process.exit(1);
}

async function run() {
  // Read input.json
  const inputPath = join(PIPELINE_DIR, 'input.json');
  const input = JSON.parse(readFileSync(inputPath, 'utf8'));
  const claim = input.claim;

  console.log(`[Ingestion] Processing claim: ${claim.substring(0, 60)}...`);

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Checkworthiness assessment
  const checkPrompt = `Is this claim factually checkworthy? Respond with YES or NO and a brief reason.

Claim: "${claim}"

A claim is checkworthy if it:
- Makes a specific, objective, verifiable statement
- Contains factual assertions that can be proven true or false

A claim is NOT checkworthy if it:
- Is purely opinion (e.g., "pizza is delicious")
- Is a prediction about the future
- Is too vague or ambiguous

Format: YES/NO | Reason`;

  const checkResult = await model.generateContent(checkPrompt);
  const checkText = checkResult.response.text();
  const isCheckworthy = checkText.trim().toUpperCase().startsWith('YES');

  console.log(`[Ingestion] Checkworthiness: ${isCheckworthy ? 'YES' : 'NO'}`);

  if (!isCheckworthy) {
    // Write unverifiable claim result
    const output = {
      claim,
      checkworthy: false,
      reason: checkText,
      sub_claims: [],
      type: 'UNVERIFIABLE',
    };
    writeFileSync(join(PIPELINE_DIR, 'claim.json'), JSON.stringify(output, null, 2));
    console.log('[Ingestion] Claim is not checkworthy, skipping decomposition');
    console.log('[END]');
    process.exit(0);
  }

  // Atomic decomposition
  const decomposePrompt = `Break down this claim into atomic sub-claims. Each sub-claim must be independently verifiable.

Claim: "${claim}"

Rules:
1. If the claim is already atomic, return it as-is in an array
2. If compound, split into separate factual assertions
3. Each sub-claim must be a complete, standalone sentence
4. Preserve the original meaning
5. Maximum 5 sub-claims

## CRITICAL: Exclusivity Language Handling

When a claim contains exclusivity language ("only", "solely", "not both", "exclusively", "neither", "just", "alone", "no one else", "the only"), you MUST preserve the exclusivity constraint as an additional sub-claim.

The exclusivity constraint captures the logical structure that would otherwise be lost when decomposing. Without it, the moderator cannot correctly evaluate claims where individual parts may be true but the exclusive relationship is false.

Examples:

Input: "Only ISRO discovered water on the Moon"
Output: [
  "ISRO discovered water on the Moon",
  "Exclusivity constraint: No other space agency besides ISRO discovered water on the Moon"
]
(The exclusivity constraint is essential — if NASA also discovered water, the original claim is FALSE even though sub-claim 1 is TRUE)

Input: "Einstein was the sole creator of the theory of relativity"
Output: [
  "Einstein created the theory of relativity",
  "Exclusivity constraint: No other scientist contributed to creating the theory of relativity"
]

Input: "The vaccine is the only way to prevent the disease"
Output: [
  "The vaccine prevents the disease",
  "Exclusivity constraint: No other methods besides vaccination prevent the disease"
]

Input: "Neither the US nor China has landed on Mars"
Output: [
  "The US has not landed on Mars",
  "China has not landed on Mars"
]
(No exclusivity sub-claim needed — "neither" is already captured by both negative assertions)

Return ONLY a JSON array of sub-claim strings, nothing else.`;

  const decomposeResult = await model.generateContent(decomposePrompt);
  let subClaimsText = decomposeResult.response.text().trim();

  // Extract JSON from markdown code blocks if present
  if (subClaimsText.includes('```json')) {
    subClaimsText = subClaimsText.split('```json')[1].split('```')[0].trim();
  } else if (subClaimsText.includes('```')) {
    subClaimsText = subClaimsText.split('```')[1].split('```')[0].trim();
  }

  const subClaims = JSON.parse(subClaimsText);

  console.log(`[Ingestion] Decomposed into ${Array.isArray(subClaims) ? subClaims.length : 1} sub-claim(s)`);

  // Write claim.json
  const output = {
    claim,
    checkworthy: true,
    type: 'FACTUAL_CLAIM',
    sub_claims: Array.isArray(subClaims) ? subClaims : [subClaims],
  };

  writeFileSync(join(PIPELINE_DIR, 'claim.json'), JSON.stringify(output, null, 2));
  console.log('[Ingestion] Wrote claim.json');
  console.log('[END]');
}

run().catch((err) => {
  console.error('[Ingestion] Error:', err);
  process.exit(1);
});
