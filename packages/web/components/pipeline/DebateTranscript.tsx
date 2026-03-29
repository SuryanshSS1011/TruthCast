"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { DEBATE_COLORS } from "@/lib/constants";

export interface DebateLine {
  side: "AFFIRMATIVE" | "NEGATIVE";
  text: string;
  timestamp: number;
}

export interface DebateTranscriptProps {
  /** Array of debate lines */
  lines: DebateLine[];
  /** Maximum visible lines */
  maxLines?: number;
  /** Whether debate is active */
  isActive?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Debate Transcript - Live streaming debate UI
 *
 * Specs from design doc:
 * - AFFIRMATIVE: prefix in teal
 * - NEGATIVE: prefix in coral-red
 * - 12px monospaced font
 * - Max 2 lines visible with gradient fade-out
 * - Character-by-character reveal with blinking cursor
 */
export function DebateTranscript({
  lines,
  maxLines = 2,
  isActive = true,
  className,
}: DebateTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines added
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  if (lines.length === 0) {
    return null;
  }

  // Show only last N lines
  const visibleLines = lines.slice(-maxLines);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        "max-h-[60px] overflow-hidden",
        className
      )}
    >
      {/* Gradient fade-out at bottom */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-4",
          "bg-gradient-to-t from-[var(--bg-surface)] to-transparent",
          "pointer-events-none z-10"
        )}
      />

      {/* Lines */}
      <div className="space-y-1">
        {visibleLines.map((line, index) => (
          <DebateLineItem
            key={line.timestamp}
            line={line}
            isLatest={index === visibleLines.length - 1 && isActive}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual debate line with animated reveal
 */
interface DebateLineItemProps {
  line: DebateLine;
  isLatest?: boolean;
}

function DebateLineItem({ line, isLatest }: DebateLineItemProps) {
  const sideColor = DEBATE_COLORS[line.side];

  return (
    <div
      className={cn(
        "flex gap-2",
        "font-mono text-[12px]",
        "animate-fade-in"
      )}
    >
      {/* Side prefix */}
      <span
        className="flex-shrink-0 font-bold"
        style={{ color: sideColor }}
      >
        {line.side}:
      </span>

      {/* Text with optional cursor */}
      <span className="text-[var(--text-primary)] line-clamp-2">
        {line.text}
        {isLatest && (
          <span className="animate-cursor-blink text-[var(--accent-solana)]">
            |
          </span>
        )}
      </span>
    </div>
  );
}

export default DebateTranscript;
