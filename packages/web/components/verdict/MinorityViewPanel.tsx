"use client";

import { cn } from "@/lib/cn";
import { tokens } from "@/lib/design-tokens";

export interface MinorityViewPanelProps {
  /** Minority view text */
  text: string;
  /** Whether to always show (for CONFLICTING verdicts) */
  alwaysVisible?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Minority View Panel - Shows dissenting argument from debate
 *
 * Specs from design doc:
 * - Full-width inset panel below evidence columns
 * - Left border: 3px solid --verdict-conflicting (violet)
 * - Label: 'MINORITY VIEW' in DM Mono 10px, letter-spacing 0.3em
 * - Text in Lora italic 14px
 * - Surfaces genuine epistemological honesty
 */
export function MinorityViewPanel({
  text,
  alwaysVisible = false,
  className,
}: MinorityViewPanelProps) {
  if (!text && !alwaysVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative",
        "bg-[var(--bg-surface)]",
        "border border-[var(--border-subtle)]",
        "rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: tokens.verdict.CONFLICTING.solid }}
      />

      {/* Content */}
      <div className="pl-5 pr-4 py-4">
        {/* Label */}
        <div
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.3em]",
            "mb-2"
          )}
          style={{ color: tokens.verdict.CONFLICTING.solid }}
        >
          MINORITY VIEW
        </div>

        {/* Text */}
        <p className="font-body text-[14px] italic text-[var(--text-secondary)]">
          {text || "High-quality sources presented conflicting evidence. No clear consensus was reached."}
        </p>
      </div>
    </div>
  );
}

export default MinorityViewPanel;
