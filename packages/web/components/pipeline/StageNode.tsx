"use client";

import { cn } from "@/lib/cn";
import { tokens } from "@/lib/design-tokens";
import type { StageStatus, StageId } from "@/lib/constants";

export interface StageNodeProps {
  /** Stage identifier */
  stageId: StageId | string;
  /** Stage display name */
  name: string;
  /** Current status */
  status: StageStatus;
  /** Whether to show label */
  showLabel?: boolean;
  /** Node size in pixels */
  size?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Stage Node - Individual pipeline stage indicator
 *
 * Specs from design doc:
 * - 14px circle nodes
 * - Pending: empty circle, 1px border
 * - Active: filled purple + pulse animation
 * - Complete: green fill + white checkmark
 * - Skipped: diagonal cross (for debate fast-path)
 */
export function StageNode({
  stageId,
  name,
  status,
  showLabel = false,
  size = 14,
  className,
}: StageNodeProps) {
  const stageColor = tokens.stageColors[stageId as keyof typeof tokens.stageColors] || tokens.accentSolana;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1",
        className
      )}
    >
      {/* Node circle */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          "transition-all duration-240",
          // Pending state
          status === "pending" && [
            "border border-[var(--border-subtle)]",
            "bg-transparent",
          ],
          // Active state with pulse
          status === "active" && [
            "animate-stage-pulse",
          ],
          // Complete state
          status === "complete" && [
            "bg-[var(--verdict-true)]",
          ],
          // Skipped state (debate fast-path)
          status === "skipped" && [
            "border border-[var(--border-mid)]",
            "bg-transparent",
          ]
        )}
        style={{
          width: size,
          height: size,
          ...(status === "active" && {
            backgroundColor: stageColor,
          }),
        }}
        aria-label={`${name}: ${status}`}
      >
        {/* Checkmark for complete */}
        {status === "complete" && (
          <svg
            className="w-2 h-2 text-white"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}

        {/* X for skipped */}
        {status === "skipped" && (
          <svg
            className="w-2 h-2 text-[var(--text-tertiary)]"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.05em]",
            "transition-colors duration-150",
            status === "active" && "font-bold",
            status === "pending" && "text-[var(--text-tertiary)]",
            status === "active" && "text-[var(--text-primary)]",
            status === "complete" && "text-[var(--verdict-true)]",
            status === "skipped" && "text-[var(--text-tertiary)]"
          )}
          style={status === "active" ? { color: stageColor } : undefined}
        >
          {name}
        </span>
      )}
    </div>
  );
}

export default StageNode;
