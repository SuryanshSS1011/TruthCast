import type { VerdictLabelType } from "@truthcast/shared/schema";

export const tokens = {
  // Base (dark-first)
  bgVoid: "#0A0B0D",
  bgSurface: "#111318",
  bgElevated: "#181C24",
  textPrimary: "#F0EDE8",
  textSecondary: "#8A8882",
  textTertiary: "#4A4845",
  borderSubtle: "rgba(255,255,255,0.06)",
  borderMid: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.20)",
  accentSolana: "#9945FF",

  // Verdict semantic — indexed by VerdictLabel
  verdict: {
    TRUE: {
      solid: "#22C55E",
      dim: "rgba(34,197,94,0.10)",
      glow: "rgba(34,197,94,0.25)",
    },
    MOSTLY_TRUE: {
      solid: "#14B8A6",
      dim: "rgba(20,184,166,0.10)",
      glow: null,
    },
    MISLEADING: {
      solid: "#F59E0B",
      dim: "rgba(245,158,11,0.10)",
      glow: null,
    },
    MOSTLY_FALSE: {
      solid: "#F97316",
      dim: "rgba(249,115,22,0.10)",
      glow: null,
    },
    FALSE: {
      solid: "#EF4444",
      dim: "rgba(239,68,68,0.10)",
      glow: "rgba(239,68,68,0.25)",
    },
    CONFLICTING: {
      solid: "#A78BFA",
      dim: "rgba(167,139,250,0.10)",
      glow: null,
    },
    UNVERIFIABLE: {
      solid: "#6B7280",
      dim: "rgba(107,114,128,0.10)",
      glow: null,
    },
  } as const,

  // Verdict label display config (from design doc page 18)
  verdictConfig: {
    TRUE: {
      labelSize: "64px",
      labelSizeMobile: "40px",
      particle: true,
      particleCount: 12,
      pulseGlow: false,
    },
    MOSTLY_TRUE: {
      labelSize: "64px",
      labelSizeMobile: "40px",
      particle: false,
      particleCount: 0,
      pulseGlow: false,
    },
    MISLEADING: {
      labelSize: "64px",
      labelSizeMobile: "40px",
      particle: false,
      particleCount: 0,
      pulseGlow: false,
    },
    MOSTLY_FALSE: {
      labelSize: "64px",
      labelSizeMobile: "40px",
      particle: false,
      particleCount: 0,
      pulseGlow: false,
    },
    FALSE: {
      labelSize: "72px",
      labelSizeMobile: "40px",
      particle: false,
      particleCount: 0,
      pulseGlow: true,
    },
    CONFLICTING: {
      labelSize: "64px",
      labelSizeMobile: "40px",
      particle: false,
      particleCount: 0,
      pulseGlow: false,
    },
    UNVERIFIABLE: {
      labelSize: "64px",
      labelSizeMobile: "40px",
      particle: false,
      particleCount: 0,
      pulseGlow: false,
    },
  } as const,

  // Stage color mapping
  stageColors: {
    cache_check: "#9945FF", // Solana accent
    ingestion: "#F59E0B", // Amber — processing
    researcher: "#14B8A6", // Teal — retrieving
    debate: "#A78BFA", // Purple — adversarial
    moderator: "#14B8A6", // Teal — synthesizing
    publisher: "#9945FF", // Solana accent — blockchain
  } as const,

  // Tier colors for source credibility
  tierColors: {
    HIGH: "#22C55E",
    "MEDIUM-HIGH": "#14B8A6",
    MEDIUM: "#F59E0B",
    LOW: "#EF4444",
    UNKNOWN: "#6B7280",
  } as const,

  // Debate agent colors
  debateColors: {
    AFFIRMATIVE: "#14B8A6", // Teal
    NEGATIVE: "#F97316", // Coral-red
  } as const,

  // TTL badge colors
  ttlColors: {
    SHORT: "#F59E0B", // Amber - 7 days
    LONG: "#14B8A6", // Teal - 90 days
    STATIC: "#22C55E", // Green - permanent
  } as const,
} as const;

// Type for verdict tokens
export type VerdictTokens = (typeof tokens.verdict)[VerdictLabelType];

// Type for verdict config
export type VerdictConfig = (typeof tokens.verdictConfig)[VerdictLabelType];

/**
 * Get CSS custom property value for a verdict
 */
export function getVerdictCssVar(verdict: VerdictLabelType): string {
  const varMap: Record<VerdictLabelType, string> = {
    TRUE: "var(--verdict-true)",
    MOSTLY_TRUE: "var(--verdict-mostly-true)",
    MISLEADING: "var(--verdict-misleading)",
    MOSTLY_FALSE: "var(--verdict-mostly-false)",
    FALSE: "var(--verdict-false)",
    CONFLICTING: "var(--verdict-conflicting)",
    UNVERIFIABLE: "var(--verdict-unverifiable)",
  };
  return varMap[verdict];
}

/**
 * Get dim variant CSS custom property for a verdict
 */
export function getVerdictDimCssVar(verdict: VerdictLabelType): string {
  const varMap: Record<VerdictLabelType, string> = {
    TRUE: "var(--verdict-true-dim)",
    MOSTLY_TRUE: "var(--verdict-mostly-true-dim)",
    MISLEADING: "var(--verdict-misleading-dim)",
    MOSTLY_FALSE: "var(--verdict-mostly-false-dim)",
    FALSE: "var(--verdict-false-dim)",
    CONFLICTING: "var(--verdict-conflicting-dim)",
    UNVERIFIABLE: "var(--verdict-unverifiable-dim)",
  };
  return varMap[verdict];
}
