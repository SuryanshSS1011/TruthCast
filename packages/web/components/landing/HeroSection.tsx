"use client";

import { cn } from "@/lib/cn";

export interface HeroSectionProps {
  className?: string;
}

/**
 * Hero Section - Headline and tagline above input
 *
 * Specs from design doc:
 * - Tagline: AUTONOMOUS · ADVERSARIAL · IMMUTABLE
 * - DM Mono 11px, letter-spacing 0.35em
 */
export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div className={cn("text-center", className)}>
      {/* Main headline */}
      <h1 className="sr-only">TruthCast - AI Fact-Checking</h1>

      {/* Tagline - small, precise */}
      <div
        className={cn(
          "font-mono text-ui-xs uppercase",
          "text-[var(--text-secondary)]",
          "mb-8"
        )}
      >
        <span>AUTONOMOUS</span>
        <span className="mx-3 text-[var(--text-tertiary)]">·</span>
        <span>ADVERSARIAL</span>
        <span className="mx-3 text-[var(--text-tertiary)]">·</span>
        <span>IMMUTABLE</span>
      </div>

      {/* Optional: Visual wordmark for impact */}
      <div className="mb-12">
        <span className="font-display text-[48px] md:text-[64px] text-[var(--text-primary)]">
          TRUTH
        </span>
        <span className="font-display text-[48px] md:text-[64px] text-[var(--verdict-true)]">
          CAST
        </span>
      </div>
    </div>
  );
}

export default HeroSection;
