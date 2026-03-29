"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { VerdictLabelType } from "@truthcast/shared/schema";
import { VerdictBadge } from "@/components/ui/Badge";
import { tokens } from "@/lib/design-tokens";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Sub-claim with verdict information
 * Note: The schema only stores sub-claims as strings, but for display purposes
 * we may want to show individual verdicts. This interface supports both cases.
 */
export interface SubClaim {
  text: string;
  verdict?: VerdictLabelType | string;
  confidence?: number;
  reasoning?: string;
}

export interface SubClaimsAccordionProps {
  /** Array of sub-claims */
  subClaims: SubClaim[];
  /** Additional class names */
  className?: string;
}

/**
 * Sub-Claims Accordion - Expandable list of atomic sub-claims
 *
 * Specs from design doc:
 * - Each row: claim text + verdict pill
 * - Click to expand/collapse
 * - Expanded state shows reasoning and confidence
 * - Staggered entrance animation (50ms delay per item)
 */
export function SubClaimsAccordion({
  subClaims,
  className,
}: SubClaimsAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  if (!subClaims || subClaims.length === 0) {
    return null;
  }

  // Don't show accordion for single sub-claim (it's the main claim)
  if (subClaims.length === 1) {
    return null;
  }

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
          Sub-claims
        </span>
        <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
          ({subClaims.length})
        </span>
      </div>

      {/* Sub-claim items */}
      <div className="space-y-1">
        {subClaims.map((subClaim, index) => (
          <SubClaimItem
            key={index}
            subClaim={subClaim}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => toggleExpanded(index)}
            animationDelay={prefersReducedMotion ? 0 : index * 50}
          />
        ))}
      </div>
    </div>
  );
}

interface SubClaimItemProps {
  subClaim: SubClaim;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  animationDelay: number;
}

function SubClaimItem({
  subClaim,
  index,
  isExpanded,
  onToggle,
  animationDelay,
}: SubClaimItemProps) {
  const verdictType = (subClaim.verdict || "UNVERIFIABLE") as VerdictLabelType;
  const verdictColor = tokens.verdict[verdictType]?.solid || tokens.verdict.UNVERIFIABLE.solid;

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        "border border-[var(--border-subtle)]",
        "transition-all duration-200",
        isExpanded && "border-[var(--border-default)]"
      )}
      style={{
        animation: `subclaim-enter 0.3s ease-out ${animationDelay}ms both`,
      }}
    >
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-3",
          "text-left",
          "transition-colors duration-150",
          "hover:bg-[var(--bg-elevated)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        )}
        aria-expanded={isExpanded}
      >
        {/* Index number */}
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono"
          style={{ backgroundColor: `${verdictColor}20`, color: verdictColor }}
        >
          {index + 1}
        </span>

        {/* Claim text */}
        <span className="flex-1 text-[13px] text-[var(--text-primary)] line-clamp-1">
          {subClaim.text}
        </span>

        {/* Verdict badge */}
        {subClaim.verdict && (
          <VerdictBadge
            verdict={verdictType}
            size="sm"
          />
        )}

        {/* Expand chevron */}
        <svg
          className={cn(
            "w-4 h-4 text-[var(--text-tertiary)]",
            "transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[var(--border-subtle)]">
          <div className="pt-3 space-y-3">
            {/* Full claim text */}
            <div className="text-[13px] text-[var(--text-secondary)]">
              {subClaim.text}
            </div>

            {/* Reasoning */}
            {subClaim.reasoning && (
              <div className="space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                  Reasoning
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  {subClaim.reasoning}
                </p>
              </div>
            )}

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                Confidence
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${subClaim.confidence}%`,
                      backgroundColor: verdictColor,
                    }}
                  />
                </div>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: verdictColor }}
                >
                  {subClaim.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubClaimsAccordion;
