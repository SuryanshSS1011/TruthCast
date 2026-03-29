"use client";

import { cn } from "@/lib/cn";
import { StageNode } from "./StageNode";
import { PIPELINE_STAGES, type StageStatus } from "@/lib/constants";

export interface StageRailProps {
  /** Current stages state */
  stages: Array<{
    id: string;
    name: string;
    status: StageStatus;
  }>;
  /** Current progress percentage (0-100) */
  progress?: number;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Stage Rail - Horizontal progress rail with 6 nodes
 *
 * Specs from design doc:
 * - Six nodes on a horizontal track connected by a line
 * - 14px circle nodes
 * - Connecting line fills left-to-right with gradient
 * - Gradient: --accent-solana → --verdict-true
 */
export function StageRail({
  stages,
  progress = 0,
  compact = false,
  className,
}: StageRailProps) {
  // Calculate line fill percentage based on completed stages
  const completedCount = stages.filter(
    (s) => s.status === "complete" || s.status === "skipped"
  ).length;
  const lineFill = Math.min((completedCount / (stages.length - 1)) * 100, 100);

  return (
    <div
      className={cn(
        "relative w-full",
        compact ? "px-2" : "px-4",
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Pipeline progress"
    >
      {/* Connecting line (background) */}
      <div
        className={cn(
          "absolute top-[7px] left-0 right-0 mx-auto",
          "h-[2px]",
          "bg-[var(--border-subtle)]",
          compact ? "w-[calc(100%-32px)]" : "w-[calc(100%-48px)]"
        )}
        style={{
          left: compact ? 16 : 24,
          right: compact ? 16 : 24,
        }}
      />

      {/* Connecting line (filled gradient) */}
      <div
        className={cn(
          "absolute top-[7px] left-0",
          "h-[2px]",
          "transition-all duration-300 ease-expo",
          "origin-left"
        )}
        style={{
          left: compact ? 16 : 24,
          width: `calc((100% - ${compact ? 32 : 48}px) * ${lineFill / 100})`,
          background: `linear-gradient(90deg, var(--accent-solana) 0%, var(--verdict-true) 100%)`,
        }}
      />

      {/* Stage nodes */}
      <div className="relative flex justify-between">
        {stages.map((stage) => (
            <StageNode
              key={stage.id}
              stageId={stage.id}
              name={stage.name}
              status={stage.status}
              showLabel={!compact}
              size={compact ? 10 : 14}
            />
          ))}
      </div>
    </div>
  );
}

/**
 * Compact mobile stage indicator
 * Shows only active stage number and label
 */
export interface CompactStageIndicatorProps {
  stages: Array<{
    id: string;
    name: string;
    status: StageStatus;
  }>;
  className?: string;
}

export function CompactStageIndicator({
  stages,
  className,
}: CompactStageIndicatorProps) {
  const activeIndex = stages.findIndex((s) => s.status === "active");
  const activeStage = stages[activeIndex];
  const completedCount = stages.filter(
    (s) => s.status === "complete" || s.status === "skipped"
  ).length;

  if (!activeStage && completedCount === stages.length) {
    return (
      <div className={cn("font-mono text-[13px]", className)}>
        <span className="text-[var(--verdict-true)]">Complete</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        "font-mono text-[13px]",
        className
      )}
    >
      <span className="text-[var(--accent-solana)]">
        {activeIndex + 1}/{stages.length}
      </span>
      <span className="text-[var(--text-secondary)]">
        {activeStage?.name || "Starting..."}
      </span>
    </div>
  );
}

export default StageRail;
