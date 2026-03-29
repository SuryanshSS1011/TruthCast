import type { VerdictLabelType } from "@truthcast/shared/schema";
import { tokens, type VerdictTokens } from "./design-tokens";

/**
 * Get verdict color tokens for a given verdict label.
 */
export function getVerdictTokens(label: VerdictLabelType): VerdictTokens {
  return tokens.verdict[label];
}

/**
 * Get the display configuration for a verdict label.
 */
export function getVerdictConfig(label: VerdictLabelType) {
  return tokens.verdictConfig[label];
}

/**
 * Get the color for a source tier.
 */
export function getTierColor(tier: string): string {
  return (
    tokens.tierColors[tier as keyof typeof tokens.tierColors] ||
    tokens.tierColors.UNKNOWN
  );
}

/**
 * Get the stage color for pipeline stages.
 */
export function getStageColor(stage: string): string {
  return (
    tokens.stageColors[stage as keyof typeof tokens.stageColors] ||
    tokens.accentSolana
  );
}

/**
 * Format a verdict label for display (e.g., "MOSTLY_TRUE" -> "MOSTLY TRUE")
 */
export function formatVerdictLabel(label: VerdictLabelType): string {
  return label.replace(/_/g, " ");
}

/**
 * Get tier badge letter from tier name
 */
export function getTierBadgeLetter(tier: string): string {
  const tierMap: Record<string, string> = {
    HIGH: "A",
    "MEDIUM-HIGH": "B",
    MEDIUM: "B",
    LOW: "C",
    UNKNOWN: "?",
  };
  return tierMap[tier] || "?";
}

/**
 * Calculate sub-claim confidence penalty
 */
export function getConfidencePenalty(numSubClaims: number): number {
  return Math.pow(0.9, numSubClaims - 1);
}

/**
 * Get confidence cap message for sub-claims
 */
export function getConfidenceCapMessage(numSubClaims: number): string | null {
  if (numSubClaims <= 1) return null;
  const cap = Math.round(getConfidencePenalty(numSubClaims) * 100);
  return `Confidence capped at ${cap}% (${numSubClaims} sub-claims)`;
}
