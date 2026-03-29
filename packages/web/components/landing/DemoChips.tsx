"use client";

import { cn } from "@/lib/cn";
import { VerdictDot } from "@/components/ui/Badge";
import { DEMO_CLAIMS } from "@/lib/constants";
import { tokens } from "@/lib/design-tokens";

export interface DemoChipsProps {
  /** Called when a chip is clicked */
  onSelect: (claim: string) => void;
  /** Whether interaction is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Demo Claim Chips - Pre-populated example claims
 *
 * Specs from design doc:
 * - Five rounded pills (border-radius: 20px)
 * - Each chip labeled with expected verdict (colored dot prefix)
 * - On click: auto-fill and submit
 * - Mobile: horizontal scroll rail with scroll-snap
 */
export function DemoChips({ onSelect, disabled, className }: DemoChipsProps) {
  return (
    <div
      className={cn(
        // Mobile: horizontal scroll
        "flex gap-3 overflow-x-auto pb-2",
        "snap-x snap-mandatory",
        // Hide scrollbar
        "scrollbar-none",
        // Desktop: wrap
        "md:flex-wrap md:justify-center md:overflow-visible",
        className
      )}
    >
      {DEMO_CLAIMS.map((demo, index) => {
        const verdictColor = tokens.verdict[demo.expectedVerdict].solid;

        return (
          <button
            key={index}
            onClick={() => !disabled && onSelect(demo.text)}
            disabled={disabled}
            className={cn(
              // Layout
              "flex-shrink-0 snap-start",
              "inline-flex items-center gap-2",
              "px-4 py-2",
              // Style
              "rounded-pill",
              "bg-transparent",
              "border border-[var(--border-subtle)]",
              // Typography
              "font-body text-[13px] italic",
              "text-[var(--text-secondary)]",
              // Interaction
              "transition-all duration-150",
              "hover:border-[var(--border-mid)]",
              "hover:text-[var(--text-primary)]",
              "hover:translate-y-[-1px]",
              // Disabled
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              // Focus
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verdict-true)]"
            )}
            title={`Try: ${demo.text}`}
          >
            {/* Verdict dot prefix */}
            <VerdictDot verdict={demo.expectedVerdict} />

            {/* Truncated claim text */}
            <span className="max-w-[200px] truncate">{demo.text}</span>

            {/* Verdict hint */}
            <span
              className="font-mono text-[10px] uppercase tracking-[0.05em]"
              style={{ color: verdictColor }}
            >
              {demo.expectedVerdict.replace("_", " ")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default DemoChips;
