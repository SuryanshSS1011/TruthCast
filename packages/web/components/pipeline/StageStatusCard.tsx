"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { tokens } from "@/lib/design-tokens";
import { PIPELINE_STAGES, type StageId } from "@/lib/constants";

export interface StageStatusCardProps {
  /** Current stage ID */
  stageId: StageId | string | null;
  /** Status message */
  message: string;
  /** Whether pipeline is loading */
  isLoading?: boolean;
  /** Children (for debate transcript) */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Stage Status Card - Shows current stage message
 *
 * Specs from design doc:
 * - Left edge: 3px vertical bar in stage color
 * - Stage name in DM Mono 13px
 * - Status message in Lora italic 15px
 * - Right side: rotating '...' indicator
 */
export function StageStatusCard({
  stageId,
  message,
  isLoading = true,
  children,
  className,
}: StageStatusCardProps) {
  const stageConfig = PIPELINE_STAGES.find((s) => s.id === stageId);
  const stageColor = stageId
    ? tokens.stageColors[stageId as keyof typeof tokens.stageColors] ||
      tokens.accentSolana
    : tokens.accentSolana;

  return (
    <div
      className={cn(
        "relative",
        "bg-[var(--bg-surface)]",
        "border border-[var(--border-mid)]",
        "rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: stageColor }}
      />

      {/* Content */}
      <div className="pl-5 pr-4 py-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          {/* Stage name */}
          <span
            className={cn(
              "font-mono text-[13px] uppercase tracking-[0.1em]",
              "text-[var(--text-secondary)]"
            )}
          >
            {stageConfig?.label || stageId?.toUpperCase() || "PIPELINE"}
          </span>

          {/* Loading indicator */}
          {isLoading && <LoadingDots />}
        </div>

        {/* Status message */}
        <p
          className={cn(
            "mt-2",
            "font-body text-[15px] italic",
            "text-[var(--text-primary)]"
          )}
        >
          {message}
        </p>

        {/* Expandable content (debate transcript) */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}

/**
 * Loading dots indicator
 * Cycles through · / ·· / ···
 */
function LoadingDots() {
  const [dots, setDots] = useState("·");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "·") return "··";
        if (prev === "··") return "···";
        return "·";
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-[13px] text-[var(--text-tertiary)] w-6 text-right">
      {dots}
    </span>
  );
}

export default StageStatusCard;
