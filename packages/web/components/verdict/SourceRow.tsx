"use client";

import { cn } from "@/lib/cn";
import type { Source } from "@truthcast/shared/schema";
import { TierBadge, StanceIndicator, type Stance } from "@/components/ui/Badge";
import { tokens } from "@/lib/design-tokens";

export interface SourceRowProps {
  /** Source data */
  source: Source;
  /** Stance (supports/refutes/neutral) - inferred from context */
  stance?: Stance;
  /** Additional class names */
  className?: string;
}

/**
 * Source Row - Individual source with tier badge and MBFC bar
 *
 * Specs from design doc:
 * - Domain name in DM Mono 13px
 * - Colored tier badge (A/B/C pill)
 * - Stance indicator (▲ supports / ▼ refutes / — neutral)
 * - MBFC mini-bar (40px)
 * - Hover: translateY(-1px) lift + background lightens
 */
export function SourceRow({ source, stance, className }: SourceRowProps) {
  const tierKey = source.domain_tier as keyof typeof tokens.tierColors;
  const tierColor = tokens.tierColors[tierKey] || tokens.tierColors.UNKNOWN;

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-3 p-2 -mx-2",
        "rounded-md",
        "transition-all duration-150",
        "hover:bg-[var(--bg-elevated)]",
        "hover:translate-y-[-1px]",
        className
      )}
    >
      {/* Domain name */}
      <span className="font-mono text-[13px] text-[var(--text-primary)] flex-1 truncate">
        {source.domain}
      </span>

      {/* Tier badge */}
      <TierBadge tier={tierKey} size="sm" />

      {/* Stance indicator */}
      {stance && <StanceIndicator stance={stance} />}

      {/* MBFC credibility mini-bar */}
      <MBFCBar score={source.credibility_score} color={tierColor} />

      {/* External link indicator */}
      <svg
        className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path d="M4 1h7v7M11 1L4.5 7.5" />
      </svg>
    </a>
  );
}

/**
 * MBFC credibility mini-bar
 */
interface MBFCBarProps {
  score: number;
  color: string;
}

function MBFCBar({ score, color }: MBFCBarProps) {
  // Score is 0.0-1.0, convert to percentage
  const percentage = Math.round(score * 100);

  return (
    <div
      className="relative w-10 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden"
      title={`MBFC Score: ${percentage}%`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

/**
 * Sources list component
 */
export interface SourcesListProps {
  sources: Source[];
  maxVisible?: number;
  className?: string;
}

export function SourcesList({
  sources,
  maxVisible = 5,
  className,
}: SourcesListProps) {
  const visibleSources = sources.slice(0, maxVisible);
  const remaining = sources.length - maxVisible;

  return (
    <div className={cn("space-y-1", className)}>
      {visibleSources.map((source, index) => (
        <SourceRow key={`${source.url}-${index}`} source={source} />
      ))}

      {remaining > 0 && (
        <div className="pt-2 font-mono text-[11px] text-[var(--text-tertiary)]">
          +{remaining} more sources
        </div>
      )}
    </div>
  );
}

export default SourceRow;
