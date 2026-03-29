#!/usr/bin/env node
/**
 * Moderator Agent (Node.js Fallback)
 * Verdict synthesis from evidence and debate arguments
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MODERATOR_AGGREGATION_PROMPT } from '@truthcast/shared/constants';

const PIPELINE_DIR = process.env.PIPELINE_DIR;
if (!PIPELINE_DIR) {
  console.error('PIPELINE_DIR environment variable not set');
  process.exit(1);
}

async function run() {
  // Read all input files
  const claimPath = join(PIPELINE_DIR, 'claim.json');
  const evidencePath = join(PIPELINE_DIR, 'evidence.json');
  const debatePath = join(PIPELINE_DIR, 'debate.json');

  const claimData = JSON.parse(readFileSync(claimPath, 'utf8'));
  const evidenceData = JSON.parse(readFileSync(evidencePath, 'utf8'));

  let debateData = null;
  if (existsSync(debatePath)) {
    debateData = JSON.parse(readFileSync(debatePath, 'utf8'));
  }

  console.log(`[Moderator] Synthesizing verdict for: ${claimData.claim.substring(0, 60)}...`);

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Build evidence summary
  const evidenceSummary = evidenceData.verdicts.map((v: any, i: number) => {
    const sourcesList = v.sources.map((s: any) => `${s.domain} [${s.domain_tier}]`).join(', ');
    return `Sub-claim ${i+1}: ${v.claim}\nVerdict: ${v.verdict} (${v.confidence}% confidence)\nReasoning: ${v.reasoning}\nSources: ${sourcesList}`;
  }).join('\n\n');

  // Determine if debate was triggered
  const debateTriggered = debateData && debateData.pro_argument && debateData.con_argument;
  const agreementScore = evidenceData.agreement_score;

  let debateContext = '';
  if (debateTriggered) {
    debateContext = `\n\nDebate Arguments:\nAFFIRMATIVE (Pro):\n${debateData.pro_argument}\n\nNEGATIVE (Con):\n${debateData.con_argument}`;
  }

  const prompt = `You are an impartial fact-checking moderator. Your task is to synthesize a final verdict for the ORIGINAL CLAIM based on evidence gathered for its decomposed sub-claims${debateTriggered ? ' and adversarial debate arguments' : ''}.

## ORIGINAL CLAIM (this is what you must ultimately evaluate):
"${claimData.claim}"

## DECOMPOSED SUB-CLAIMS AND EVIDENCE:
${evidenceSummary}

## CRITICAL EVALUATION STEP:
Before applying aggregation rules, you MUST evaluate whether the sub-claims TOGETHER logically satisfy the original claim's structure. Consider:
1. Does verifying each sub-claim individually prove the original claim as a whole?
2. Are there implicit logical connectors (AND, OR, IF-THEN, causation) in the original claim that affect how sub-claim verdicts combine?
3. Could all sub-claims be TRUE individually, but the original claim still be FALSE due to missing context or faulty implication?
4. Could some sub-claims be irrelevant to the original claim's core assertion?

Agreement Score: ${(agreementScore * 100).toFixed(0)}% (consensus among sub-claim verdicts)${debateContext}

${MODERATOR_AGGREGATION_PROMPT}

## OUTPUT FORMAT:
Provide a final verdict in JSON format with these exact fields:
{
  "verdict": "TRUE|MOSTLY_TRUE|MISLEADING|MOSTLY_FALSE|FALSE|CONFLICTING|UNVERIFIABLE",
  "confidence": <0-100 integer>,
  "reasoning": "<2-3 sentences explaining how sub-claims relate to the original claim's truth value>",
  "minority_view": "<opposing perspective if debate was close, otherwise null>",
  "logical_structure_satisfied": <true|false - whether sub-claims together prove the original claim>
}

Respond with ONLY the JSON object, no additional text.`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();

  // Extract JSON from markdown code blocks if present
  if (responseText.includes('```json')) {
    responseText = responseText.split('```json')[1].split('```')[0].trim();
  } else if (responseText.includes('```')) {
    responseText = responseText.split('```')[1].split('```')[0].trim();
  }

  const moderatorVerdict = JSON.parse(responseText);

  console.log(`[Moderator] Final verdict: ${moderatorVerdict.verdict} (${moderatorVerdict.confidence}%)`);

  // Aggregate sources from all sub-claims
  const allSources: any[] = [];
  evidenceData.verdicts.forEach((v: any) => {
    v.sources.forEach((source: any) => {
      // Deduplicate by URL
      if (!allSources.find((s) => s.url === source.url)) {
        allSources.push(source);
      }
    });
  });

  // Sort by credibility (tier + score)
  const tierValues: Record<string, number> = { TIER_1: 3, TIER_2: 2, TIER_3: 1 };
  allSources.sort((a, b) => {
    const tierDiff = (tierValues[b.domain_tier] || 0) - (tierValues[a.domain_tier] || 0);
    if (tierDiff !== 0) return tierDiff;
    return b.credibility_score - a.credibility_score;
  });

  // Build final verdict object
  const verdict = {
    claim_hash: null, // Will be set by orchestrator
    claim_text: claimData.claim,
    sub_claims: claimData.sub_claims,
    verdict: moderatorVerdict.verdict,
    confidence: moderatorVerdict.confidence,
    reasoning: moderatorVerdict.reasoning,
    sources: allSources.slice(0, 10), // Top 10 sources
    minority_view: moderatorVerdict.minority_view || null,
    debate_triggered: debateTriggered,
    agreement_score: agreementScore,
    checked_at: Math.floor(Date.now() / 1000),
    ttl_policy: debateTriggered ? 'SHORT' : 'LONG',
    pipeline_version: '2.0-scripts',
  };

  writeFileSync(join(PIPELINE_DIR, 'verdict.json'), JSON.stringify(verdict, null, 2));
  console.log('[Moderator] Wrote verdict.json');
  console.log('[END]');
}

run().catch((err) => {
  console.error('[Moderator] Error:', err);
  process.exit(1);
});
