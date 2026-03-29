"use client";

import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { StageRail, CompactStageIndicator } from "./StageRail";
import { StageStatusCard } from "./StageStatusCard";
import { DebateTranscript, type DebateLine } from "./DebateTranscript";
import type { StageStatus } from "@/lib/constants";

export interface PipelineStage {
  id: string;
  name: string;
  status: StageStatus;
}

export interface PipelineContainerProps {
  /** Original claim text */
  claim: string;
  /** Current stages */
  stages: PipelineStage[];
  /** Current stage ID */
  currentStage: string | null;
  /** Progress percentage */
  progress: number;
  /** Status message */
  message: string;
  /** Debate lines (if debate stage) */
  debateLines?: DebateLine[];
  /** Whether pipeline is loading */
  isLoading: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Pipeline Container - Wrapper with pulsing glow effect
 *
 * Specs from design doc:
 * - box-shadow 0 0 120px 0 rgba(153,69,255,0.06) pulsing at 3s
 * - Contains claim card + stage rail + status card
 */
export function PipelineContainer({
  claim,
  stages,
  currentStage,
  progress,
  message,
  debateLines = [],
  isLoading,
  className,
}: PipelineContainerProps) {
  const isDebateActive = currentStage === "debate" && isLoading;

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto",
        "space-y-6",
        // Pulsing glow while active
        isLoading && "animate-pipeline-glow",
        className
      )}
    >
      {/* Claim being checked */}
      <Card variant="elevated" padding="md">
        <div className="flex items-start gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] flex-shrink-0">
            CHECKING
          </span>
          <p className="font-body text-[15px] text-[var(--text-primary)] italic line-clamp-3">
            "{claim}"
          </p>
        </div>
      </Card>

      {/* Stage progress rail */}
      <div>
        {/* Desktop: full rail */}
        <div className="hidden md:block">
          <StageRail stages={stages} progress={progress} />
        </div>

        {/* Mobile: compact indicator + thin progress bar */}
        <div className="md:hidden space-y-2">
          <CompactStageIndicator stages={stages} />
          <div className="h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-solana)] to-[var(--verdict-true)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status card */}
      <StageStatusCard
        stageId={currentStage}
        message={message}
        isLoading={isLoading}
      >
        {/* Debate transcript (expands when debate stage active) */}
        {isDebateActive && debateLines.length > 0 && (
          <DebateTranscript
            lines={debateLines}
            isActive={isDebateActive}
          />
        )}
      </StageStatusCard>

      {/* Progress percentage */}
      <div className="text-center">
        <span className="font-mono text-[24px] text-[var(--text-primary)]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export default PipelineContainer;
