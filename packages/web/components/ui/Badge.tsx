"use client";

import { cn } from "@/lib/cn";
import type { VerdictLabelType } from "@truthcast/shared/schema";
import { tokens } from "@/lib/design-tokens";
import { TIER_LABELS, TTL_LABELS, VERDICT_LABELS } from "@/lib/constants";

/**
 * Verdict Badge - Full label pill with colored background
 */
export interface VerdictBadgeProps {
  verdict: VerdictLabelType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerdictBadge({
  verdict,
  size = "md",
  className,
}: VerdictBadgeProps) {
  const color = tokens.verdict[verdict].solid;
  const dimColor = tokens.verdict[verdict].dim;

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-[11px]",
    lg: "px-4 py-1.5 text-[12px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "font-mono uppercase tracking-[0.08em]",
        "rounded-pill",
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: dimColor,
        color: color,
        border: `1px solid ${color}`,
      }}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  );
}

/**
 * Tier Badge - Small circle with A/B/C/? letter
 */
export interface TierBadgeProps {
  tier: keyof typeof tokens.tierColors;
  size?: "sm" | "md";
  className?: string;
}

export function TierBadge({ tier, size = "md", className }: TierBadgeProps) {
  const color = tokens.tierColors[tier];
  const label = TIER_LABELS[tier] || "?";

  const sizeStyles = {
    sm: "w-4 h-4 text-[9px]",
    md: "w-5 h-5 text-[10px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-full font-mono font-bold",
        sizeStyles[size],
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}`,
      }}
      title={`Source tier: ${tier}`}
    >
      {label}
    </span>
  );
}

/**
 * TTL Badge - Shows cache expiry policy
 */
export interface TTLBadgeProps {
  policy: keyof typeof tokens.ttlColors;
  className?: string;
}

export function TTLBadge({ policy, className }: TTLBadgeProps) {
  const color = tokens.ttlColors[policy];
  const label = TTL_LABELS[policy];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "px-2 py-0.5",
        "font-mono text-[10px] uppercase tracking-[0.05em]",
        "rounded",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
      title={`Cache policy: ${policy}`}
    >
      {label}
    </span>
  );
}

/**
 * Stance Indicator - Arrow showing if source supports/refutes claim
 */
export type Stance = "supports" | "refutes" | "neutral";

export interface StanceIndicatorProps {
  stance: Stance;
  className?: string;
}

export function StanceIndicator({ stance, className }: StanceIndicatorProps) {
  const config = {
    supports: { symbol: "▲", color: tokens.verdict.TRUE.solid, title: "Supports claim" },
    refutes: { symbol: "▼", color: tokens.verdict.FALSE.solid, title: "Refutes claim" },
    neutral: { symbol: "—", color: tokens.textSecondary, title: "Neutral" },
  };

  const { symbol, color, title } = config[stance];

  return (
    <span
      className={cn("font-mono text-[11px]", className)}
      style={{ color }}
      title={title}
    >
      {symbol}
    </span>
  );
}

/**
 * Stage Badge - For pipeline stage labels
 */
export interface StageBadgeProps {
  stageId: keyof typeof tokens.stageColors;
  label: string;
  active?: boolean;
  className?: string;
}

export function StageBadge({
  stageId,
  label,
  active = false,
  className,
}: StageBadgeProps) {
  const color = tokens.stageColors[stageId];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "px-2 py-0.5",
        "font-mono text-[10px] uppercase tracking-[0.1em]",
        "rounded",
        active && "font-bold",
        className
      )}
      style={{
        backgroundColor: active ? `${color}20` : "transparent",
        color: active ? color : tokens.textSecondary,
        border: active ? `1px solid ${color}` : "1px solid transparent",
      }}
    >
      {label}
    </span>
  );
}

/**
 * Dot prefix for demo claim chips
 */
export interface VerdictDotProps {
  verdict: VerdictLabelType;
  className?: string;
}

export function VerdictDot({ verdict, className }: VerdictDotProps) {
  const color = tokens.verdict[verdict].solid;

  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full", className)}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

/**
 * Formula Pill - Shows confidence formula component
 */
export interface FormulaPillProps {
  label: string;
  value: number;
  tooltip?: string;
  className?: string;
}

export function FormulaPill({
  label,
  value,
  tooltip,
  className,
}: FormulaPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        "px-2 py-0.5",
        "font-mono text-[11px]",
        "text-[var(--text-secondary)]",
        "bg-[var(--bg-surface)] rounded",
        "border border-[var(--border-subtle)]",
        className
      )}
      title={tooltip}
    >
      <span>{label}</span>
      <span className="text-[var(--text-tertiary)]">×</span>
      <span>{value.toFixed(2)}</span>
    </span>
  );
}

export default VerdictBadge;
