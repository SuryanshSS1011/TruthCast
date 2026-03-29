import type { VerdictLabelType } from "@truthcast/shared/schema";

/**
 * Demo claims for landing page chips
 * Each includes expected verdict for colored dot prefix
 */
export const DEMO_CLAIMS: Array<{
  text: string;
  expectedVerdict: VerdictLabelType;
}> = [
  {
    text: "The Great Wall of China is visible from space",
    expectedVerdict: "FALSE",
  },
  {
    text: "Humans share about 60% of their DNA with bananas",
    expectedVerdict: "TRUE",
  },
  {
    text: "Lightning never strikes the same place twice",
    expectedVerdict: "FALSE",
  },
  {
    text: "Goldfish have a 3-second memory",
    expectedVerdict: "MOSTLY_FALSE",
  },
  {
    text: "Mount Everest is the tallest mountain on Earth",
    expectedVerdict: "MISLEADING",
  },
];

/**
 * Pipeline stage configuration
 * Order matches the 6-stage pipeline from architecture doc
 */
export const PIPELINE_STAGES = [
  {
    id: "cache_check",
    name: "Cache",
    label: "CACHE CHECK",
    description: "Checking for existing verdict",
    color: "#9945FF", // Solana purple
  },
  {
    id: "ingestion",
    name: "Ingest",
    label: "INGESTION",
    description: "Analyzing claim checkworthiness",
    color: "#F59E0B", // Amber
  },
  {
    id: "researcher",
    name: "Research",
    label: "RESEARCHER",
    description: "Retrieving evidence with Gemini",
    color: "#14B8A6", // Teal
  },
  {
    id: "debate",
    name: "Debate",
    label: "DEBATE",
    description: "Adversarial reasoning",
    color: "#A78BFA", // Purple
    optional: true, // Only triggers if agreement_score < 0.8
  },
  {
    id: "moderator",
    name: "Moderate",
    label: "MODERATOR",
    description: "Synthesizing verdict",
    color: "#14B8A6", // Teal
  },
  {
    id: "publisher",
    name: "Publish",
    label: "PUBLISHER",
    description: "Writing to Solana blockchain",
    color: "#9945FF", // Solana purple
  },
] as const;

export type StageId = (typeof PIPELINE_STAGES)[number]["id"];

/**
 * Stage status types
 */
export type StageStatus = "pending" | "active" | "complete" | "skipped";

/**
 * Animation timing constants (matching design doc)
 */
export const ANIMATION = {
  // Durations
  FAST: 150,
  NORMAL: 240,
  SLOW: 600,
  VERDICT_REVEAL: 600,
  BAR_FILL: 800,
  STAGE_TRANSITION: 240,
  COUNT_UP: 1200,
  CONFETTI: 400,

  // Easing
  EXPO: "cubic-bezier(0.16, 1, 0.3, 1)",

  // Delays
  SUBCLAIM_STAGGER: 80,
  STATS_REFRESH: 30000, // 30 seconds
} as const;

/**
 * Debate agent colors for transcript
 */
export const DEBATE_COLORS = {
  AFFIRMATIVE: "#14B8A6", // Teal
  NEGATIVE: "#F97316", // Coral-red (orange)
} as const;

/**
 * Verdict label display names (for UI)
 */
export const VERDICT_LABELS: Record<VerdictLabelType, string> = {
  TRUE: "TRUE",
  MOSTLY_TRUE: "MOSTLY TRUE",
  MISLEADING: "MISLEADING",
  MOSTLY_FALSE: "MOSTLY FALSE",
  FALSE: "FALSE",
  CONFLICTING: "CONFLICTING",
  UNVERIFIABLE: "UNVERIFIABLE",
};

/**
 * Verdict descriptions for tooltips
 */
export const VERDICT_DESCRIPTIONS: Record<VerdictLabelType, string> = {
  TRUE: "Supported by Tier A/B sources, high agreement score, no missing context.",
  MOSTLY_TRUE:
    "Core claim is accurate but includes minor imprecision, outdated figures, or missing nuance.",
  MISLEADING:
    "Factually true but presented in a way that creates a false impression — selective context or framing.",
  MOSTLY_FALSE:
    "Core claim is inaccurate but contains some true elements or is partially supported.",
  FALSE: "Contradicted by multiple Tier A sources with a high agreement score.",
  CONFLICTING:
    "High-quality sources genuinely disagree. Debate triggered but no consensus reached.",
  UNVERIFIABLE:
    "Opinion, prediction, ambiguous framing, or insufficient public evidence to form a verdict.",
};

/**
 * Source tier labels
 */
export const TIER_LABELS = {
  HIGH: "A",
  "MEDIUM-HIGH": "B",
  MEDIUM: "B",
  LOW: "C",
  UNKNOWN: "?",
} as const;

/**
 * TTL policy display labels
 */
export const TTL_LABELS = {
  SHORT: "7 days",
  LONG: "90 days",
  STATIC: "Permanent",
} as const;

/**
 * Solana explorer URL
 */
export const SOLANA_EXPLORER_URL = "https://explorer.solana.com/tx";
export const SOLANA_DEVNET_SUFFIX = "?cluster=devnet";

/**
 * Build Solana explorer link
 */
export function getSolanaExplorerUrl(txHash: string): string {
  return `${SOLANA_EXPLORER_URL}/${txHash}${SOLANA_DEVNET_SUFFIX}`;
}

/**
 * Truncate hash for display (first 8 + ... + last 4)
 */
export function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

/**
 * Format confidence as percentage string
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence)}%`;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}
