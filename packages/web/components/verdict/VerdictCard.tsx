"use client";

import { cn } from "@/lib/cn";
import type { Verdict, VerdictLabelType } from "@truthcast/shared/schema";
import { tokens } from "@/lib/design-tokens";
import { Card, CardContent } from "@/components/ui/Card";
import { VerdictLabel } from "./VerdictLabel";
import { ConfidenceBar } from "./ConfidenceBar";
import { SourcesList } from "./SourceRow";
import { ChainOfCustody } from "./ChainOfCustody";
import { MinorityViewPanel } from "./MinorityViewPanel";
import { SubClaimsAccordion } from "./SubClaimsAccordion";
import { AudioPlayer } from "./AudioPlayer";
import { VerdictActions } from "./VerdictActions";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface VerdictCardProps {
  /** Full verdict object */
  verdict: Verdict;
  /** Whether this is a fresh result (animate) or cached */
  isNew?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Verdict Card - Main verdict display component
 *
 * Specs from design doc:
 * - Background glow based on verdict color
 * - Verdict label with judicial stamp styling
 * - Confidence bar with formula breakdown
 * - Two-column layout: Supporting / Refuting sources
 * - Sub-claims accordion
 * - Audio player
 * - Blockchain provenance
 * - Share actions
 */
export function VerdictCard({
  verdict,
  isNew = true,
  className,
}: VerdictCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const verdictType = verdict.verdict as VerdictLabelType;
  const color = tokens.verdict[verdictType]?.solid || tokens.verdict.UNVERIFIABLE.solid;

  // Separate sources into supporting and refuting (simplified heuristic)
  // In a real implementation, this would come from the pipeline
  const supportingSources = verdict.sources.filter((_, i) => i % 2 === 0);
  const refutingSources = verdict.sources.filter((_, i) => i % 2 === 1);

  // Check if we have sub-claims
  // Transform string array to SubClaim objects
  const subClaimsData = verdict.sub_claims?.map((text) => ({
    text,
    // Note: individual sub-claim verdicts would come from pipeline enhancement
  }));
  const hasSubClaims = verdict.sub_claims && verdict.sub_claims.length > 1;

  // Check for minority view (CONFLICTING verdicts or debate)
  const hasMinorityView = verdict.verdict === "CONFLICTING" || verdict.minority_view;

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        isNew && !prefersReducedMotion && "animate-verdict-enter",
        className
      )}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top center, ${color} 0%, transparent 70%)`,
        }}
      />

      <CardContent className="relative pt-8 pb-6 px-6 space-y-8">
        {/* Header section */}
        <div className="text-center space-y-6">
          {/* Claim text */}
          <blockquote className="font-body text-[18px] md:text-[20px] text-[var(--text-primary)] italic leading-relaxed max-w-2xl mx-auto">
            "{verdict.claim_text}"
          </blockquote>

          {/* Verdict label */}
          <VerdictLabel
            verdict={verdictType}
            animate={isNew && !prefersReducedMotion}
          />

          {/* Confidence bar */}
          <ConfidenceBar
            confidence={verdict.confidence}
            verdict={verdictType}
            animate={isNew}
            showFormula={true}
            formula={{
              sourceTier: 0.4,
              agreement: 0.35,
              debate: verdict.minority_view ? 0.25 : undefined,
            }}
            className="max-w-md mx-auto"
          />
        </div>

        {/* Reasoning */}
        <div className="bg-[var(--bg-surface)] rounded-lg p-4 border border-[var(--border-subtle)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
            Analysis
          </div>
          <p className="font-body text-[14px] text-[var(--text-secondary)] leading-relaxed">
            {verdict.reasoning}
          </p>
        </div>

        {/* Sub-claims accordion */}
        {hasSubClaims && subClaimsData && (
          <SubClaimsAccordion subClaims={subClaimsData} />
        )}

        {/* Sources grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supporting sources */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--verdict-true)]">▲</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                Supporting ({supportingSources.length})
              </span>
            </div>
            <SourcesList sources={supportingSources} maxVisible={3} />
          </div>

          {/* Refuting sources */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--verdict-false)]">▼</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                Refuting ({refutingSources.length})
              </span>
            </div>
            <SourcesList sources={refutingSources} maxVisible={3} />
          </div>
        </div>

        {/* Minority view */}
        {hasMinorityView && (
          <MinorityViewPanel
            text={verdict.minority_view || ""}
            alwaysVisible={verdict.verdict === "CONFLICTING"}
          />
        )}

        {/* Audio player - currently not in schema, will be added later */}
        {/* {verdict.audio_url && (
          <AudioPlayer
            src={verdict.audio_url}
            verdict={verdictType}
          />
        )} */}

        {/* Footer: Blockchain + Actions */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pt-4 border-t border-[var(--border-subtle)]">
          {/* Chain of custody */}
          <ChainOfCustody
            txHash={verdict.tx_hash}
            checkedAt={verdict.checked_at}
            ttlPolicy={verdict.ttl_policy as "SHORT" | "LONG" | "STATIC"}
          />

          {/* Actions */}
          <VerdictActions
            claimHash={verdict.claim_hash}
            claimText={verdict.claim_text}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact verdict card for history list
 */
export interface VerdictCardCompactProps {
  verdict: Verdict;
  className?: string;
  onClick?: () => void;
}

export function VerdictCardCompact({
  verdict,
  className,
  onClick,
}: VerdictCardCompactProps) {
  const verdictType = verdict.verdict as VerdictLabelType;
  const color = tokens.verdict[verdictType]?.solid || tokens.verdict.UNVERIFIABLE.solid;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left",
        "bg-[var(--bg-elevated)] rounded-lg p-4",
        "border border-[var(--border-subtle)]",
        "transition-all duration-150",
        "hover:border-[var(--border-default)]",
        "hover:translate-y-[-1px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Verdict indicator */}
        <div
          className="flex-shrink-0 w-3 h-3 rounded-full mt-1.5"
          style={{ backgroundColor: color }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Claim text */}
          <p className="text-[14px] text-[var(--text-primary)] line-clamp-2">
            {verdict.claim_text}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-tertiary)]">
            <span style={{ color }}>{verdict.verdict}</span>
            <span>·</span>
            <span>{verdict.confidence}%</span>
            <span>·</span>
            <span>{formatRelativeTime(verdict.checked_at)}</span>
          </div>
        </div>

        {/* Arrow */}
        <svg
          className="flex-shrink-0 w-4 h-4 text-[var(--text-tertiary)]"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </div>
    </button>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

export default VerdictCard;
