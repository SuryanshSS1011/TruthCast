"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { VerdictLabelType } from "@truthcast/shared/schema";
import { tokens } from "@/lib/design-tokens";
import { FormulaPill } from "@/components/ui/Badge";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface ConfidenceBarProps {
  /** Confidence percentage (0-100) */
  confidence: number;
  /** Verdict type (for color) */
  verdict: VerdictLabelType;
  /** Whether to animate fill */
  animate?: boolean;
  /** Show formula breakdown pills */
  showFormula?: boolean;
  /** Formula components (optional) */
  formula?: {
    sourceTier: number;
    agreement: number;
    debate?: number;
  };
  /** Additional class names */
  className?: string;
}

/**
 * Confidence Bar - Animated fill bar with formula breakdown
 *
 * Specs from design doc:
 * - scaleX animation on transform-origin:left over 800ms expo
 * - Fill color glows at its leading edge during animation
 * - Three formula pills below: 'source tier × 0.40', 'agreement × 0.35', 'debate × 0.25'
 */
export function ConfidenceBar({
  confidence,
  verdict,
  animate = true,
  showFormula = true,
  formula,
  className,
}: ConfidenceBarProps) {
  const color = tokens.verdict[verdict].solid;
  const prefersReducedMotion = useReducedMotion();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger animation after mount
  useEffect(() => {
    if (animate && !prefersReducedMotion) {
      const timer = setTimeout(() => setShouldAnimate(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(true);
    }
  }, [animate, prefersReducedMotion]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Confidence label */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[13px] text-[var(--text-secondary)]">
          confidence:
        </span>
        <span
          className="font-mono text-[28px] font-bold"
          style={{ color }}
        >
          {confidence}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
        {/* Filled portion */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            shouldAnimate && !prefersReducedMotion && "transition-transform duration-800 ease-expo"
          )}
          style={{
            backgroundColor: color,
            transform: `scaleX(${shouldAnimate ? confidence / 100 : 0})`,
            transformOrigin: "left",
            // Glow at leading edge
            boxShadow: shouldAnimate
              ? `4px 0 8px ${tokens.verdict[verdict].glow || color}40`
              : "none",
          }}
        />
      </div>

      {/* Formula pills */}
      {showFormula && formula && (
        <div className="flex flex-wrap gap-2">
          <FormulaPill
            label="source tier"
            value={formula.sourceTier}
            tooltip="Average credibility score of sources (0.3-0.9)"
          />
          <FormulaPill
            label="agreement"
            value={formula.agreement}
            tooltip="Consensus among sub-claim verdicts (0.0-1.0)"
          />
          {formula.debate !== undefined && (
            <FormulaPill
              label="debate"
              value={formula.debate}
              tooltip="Debate consensus factor (0.0-1.0)"
            />
          )}
        </div>
      )}
    </div>
  );
}

export default ConfidenceBar;
