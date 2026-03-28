// packages/shared/constants.ts
import type { VerdictLabelType } from "./schema";

// TTL Policies (in seconds)
export const TTL_POLICIES = {
  SHORT: 604800,    // 7 days - for current roles, rankings, live events
  LONG: 7776000,    // 90 days - for institutional facts, established statistics
  STATIC: Infinity, // No expiry - for historical facts, scientific consensus
} as const;

// Verdict Severity Order (most to least severe)
export const VERDICT_SEVERITY: VerdictLabelType[] = [
  "FALSE",
  "MOSTLY_FALSE",
  "CONFLICTING",
  "MISLEADING",
  "MOSTLY_TRUE",
  "TRUE",
  "UNVERIFIABLE",
];

// Sub-claim Aggregation Rule (simple version for verdict labels only)
export function aggregateVerdictLabels(
  verdicts: VerdictLabelType[]
): VerdictLabelType {
  if (verdicts.length === 0) return "UNVERIFIABLE";
  if (verdicts.length === 1) return verdicts[0];

  const counts = verdicts.reduce((acc, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const falseCount = counts["FALSE"] || 0;
  const total = verdicts.length;

  // Rule 1: If >50% are FALSE → FALSE
  if (falseCount > total / 2) return "FALSE";

  // Rule 2: If any FALSE but ≤50% → MISLEADING
  if (falseCount > 0) return "MISLEADING";

  // Rule 3: If no FALSE but any MOSTLY_FALSE in majority → MOSTLY_FALSE
  const mostlyFalseCount = counts["MOSTLY_FALSE"] || 0;
  if (mostlyFalseCount > total / 2) return "MOSTLY_FALSE";
  if (mostlyFalseCount > 0) return "MISLEADING";

  // Rule 4: If any CONFLICTING (no false-family) → CONFLICTING
  if (counts["CONFLICTING"]) return "CONFLICTING";

  // Rule 5: If all true-family → most severe among them
  const trueFamilyVerdicts = verdicts.filter(
    (v) => v === "TRUE" || v === "MOSTLY_TRUE"
  );
  if (trueFamilyVerdicts.length === total) {
    return counts["MOSTLY_TRUE"] > 0 ? "MOSTLY_TRUE" : "TRUE";
  }

  // Rule 6: If all UNVERIFIABLE → UNVERIFIABLE
  if (counts["UNVERIFIABLE"] === total) return "UNVERIFIABLE";

  // Default: return most severe verdict
  for (const verdict of VERDICT_SEVERITY) {
    if (counts[verdict]) return verdict;
  }

  return "UNVERIFIABLE";
}

// Moderator System Prompt Fragment for Sub-claim Aggregation
export const MODERATOR_AGGREGATION_PROMPT = `
## Sub-claim Aggregation Rule

When a claim has been decomposed into multiple sub-claims, synthesize a compound verdict using this algorithm:

**Severity order (most to least severe):**
FALSE > MOSTLY_FALSE > CONFLICTING > MISLEADING > MOSTLY_TRUE > TRUE > UNVERIFIABLE

**Compound verdict assignment:**
1. If >50% of sub-claims are FALSE → compound verdict = FALSE
2. If any FALSE but ≤50% → compound verdict = MISLEADING
3. If no FALSE but any MOSTLY_FALSE in majority → MOSTLY_FALSE
4. If no false-family but any CONFLICTING → CONFLICTING
5. If all sub-claims are TRUE or MOSTLY_TRUE → most severe among them
6. If any sub-claim is UNVERIFIABLE and others are verifiable → process verifiable ones only and flag the unverifiable sub-claim in reasoning

**Confidence penalty:**
Apply sub-claim penalty: multiply base confidence by 0.9^(n_sub_claims - 1). A 4-sub-claim verdict cannot exceed 73% confidence regardless of evidence quality.

**Reasoning chain format for compound claims:**
"This claim contains [N] verifiable assertions.
 Sub-claim 1 ([text]): [TRUE/FALSE/etc] — [one sentence reason].
 Sub-claim 2 ([text]): [TRUE/FALSE/etc] — [one sentence reason].
 Compound verdict: [LABEL] because [aggregation rationale]."
`;

// Confidence Score Formula
export function calculateConfidence(
  sourceTierScore: number,     // 0.0 - 1.0
  agreementScore: number,       // 0.0 - 1.0
  debateConsensus: number,      // 1.0 if fast path, moderator score if debated
  numSubClaims: number          // number of sub-claims
): number {
  const baseConfidence =
    sourceTierScore * 0.4 +
    agreementScore * 0.35 +
    debateConsensus * 0.25;

  const subClaimPenalty = Math.pow(0.9, numSubClaims - 1);

  return Math.round(baseConfidence * subClaimPenalty * 100);
}

// Sub-Claim Aggregation
export function aggregateSubClaimVerdicts(subVerdicts: any[]): {
  verdict: string;
  confidence: number;
  reasoning: string;
  sources: any[];
  agreement_score: number;
} {
  const verdictCounts: Record<string, number> = {};
  let allSources: any[] = [];

  // Count verdicts and collect sources
  for (const v of subVerdicts) {
    verdictCounts[v.verdict] = (verdictCounts[v.verdict] || 0) + 1;
    allSources = allSources.concat(v.sources);
  }

  // Remove duplicate sources
  const uniqueSources = Array.from(
    new Map(allSources.map((s) => [s.url, s])).values()
  ).slice(0, 10);

  const total = subVerdicts.length;
  const falseCount = verdictCounts["FALSE"] || 0;
  const mostlyFalseCount = verdictCounts["MOSTLY_FALSE"] || 0;
  const conflictingCount = verdictCounts["CONFLICTING"] || 0;

  let compoundVerdict: string;
  let reasoning: string;

  // Apply aggregation rules
  if (falseCount / total > 0.5) {
    // Rule 1: >50% FALSE
    compoundVerdict = "FALSE";
    reasoning = `This compound claim is FALSE because more than half of its sub-claims (${falseCount}/${total}) are false.`;
  } else if (falseCount > 0) {
    // Rule 2: Any FALSE but ≤50%
    compoundVerdict = "MISLEADING";
    reasoning = `This compound claim is MISLEADING because it contains ${falseCount} false sub-claim(s) out of ${total} total.`;
  } else if (mostlyFalseCount / total > 0.5) {
    // Rule 3: Majority MOSTLY_FALSE
    compoundVerdict = "MOSTLY_FALSE";
    reasoning = `This compound claim is MOSTLY_FALSE because the majority of sub-claims (${mostlyFalseCount}/${total}) are mostly false.`;
  } else if (conflictingCount > 0) {
    // Rule 4: Any CONFLICTING
    compoundVerdict = "CONFLICTING";
    reasoning = `This compound claim has CONFLICTING evidence across its ${total} sub-claims.`;
  } else {
    // Rule 5: All true-family, pick most severe
    const severityOrder = ["MOSTLY_TRUE", "TRUE"];
    for (const label of severityOrder) {
      if (verdictCounts[label]) {
        compoundVerdict = label;
        break;
      }
    }
    compoundVerdict = compoundVerdict || "TRUE";
    reasoning = `This compound claim is ${compoundVerdict} because all ${total} sub-claims are in the true category.`;
  }

  // Calculate aggregated confidence with sub-claim penalty
  const avgConfidence =
    subVerdicts.reduce((sum, v) => sum + v.confidence, 0) / subVerdicts.length;
  const subClaimPenalty = Math.pow(0.9, subVerdicts.length - 1);
  const confidence = Math.round(avgConfidence * subClaimPenalty);

  // Calculate agreement score (how much sub-verdicts agree)
  const maxCount = Math.max(...Object.values(verdictCounts));
  const agreement_score = maxCount / total;

  return {
    verdict: compoundVerdict,
    confidence,
    reasoning,
    sources: uniqueSources,
    agreement_score,
  };
}
