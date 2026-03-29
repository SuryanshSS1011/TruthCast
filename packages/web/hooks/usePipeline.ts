"use client";

import { useState, useCallback } from "react";
import type { Verdict } from "@truthcast/shared/schema";

export interface DebateLine {
  side: "AFFIRMATIVE" | "NEGATIVE";
  text: string;
  timestamp: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: "pending" | "active" | "complete" | "skipped";
}

interface PipelineState {
  stage: string | null;
  progress: number;
  message: string;
  verdict: Verdict | null;
  debateLines: DebateLine[];
  stages: PipelineStage[];
  error: string | null;
  isLoading: boolean;
  fastPath: boolean;
}

const INITIAL_STAGES: PipelineStage[] = [
  { id: "cache_check", name: "Cache", status: "pending" },
  { id: "ingestion", name: "Ingest", status: "pending" },
  { id: "researcher", name: "Research", status: "pending" },
  { id: "debate", name: "Debate", status: "pending" },
  { id: "moderator", name: "Moderate", status: "pending" },
  { id: "publisher", name: "Publish", status: "pending" },
];

/**
 * Hook for managing the fact-checking pipeline state.
 * Handles SSE connection and real-time progress updates.
 */
export function usePipeline() {
  const [state, setState] = useState<PipelineState>({
    stage: null,
    progress: 0,
    message: "",
    verdict: null,
    debateLines: [],
    stages: INITIAL_STAGES,
    error: null,
    isLoading: false,
    fastPath: false,
  });

  const reset = useCallback(() => {
    setState({
      stage: null,
      progress: 0,
      message: "",
      verdict: null,
      debateLines: [],
      stages: INITIAL_STAGES,
      error: null,
      isLoading: false,
      fastPath: false,
    });
  }, []);

  const run = useCallback(async (claim: string) => {
    // Reset state
    setState((prev) => ({
      ...prev,
      stage: null,
      progress: 0,
      message: "Starting pipeline...",
      verdict: null,
      debateLines: [],
      stages: INITIAL_STAGES,
      error: null,
      isLoading: true,
      fastPath: false,
    }));

    try {
      // Start pipeline
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start pipeline");
      }

      const { session_id } = await response.json();

      // Open SSE connection
      const eventSource = new EventSource(
        `/api/check/stream?session=${session_id}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.event === "progress" || data.event === "stage_complete") {
          setState((prev) => {
            // Calculate current stage index from progress
            const stageIndex = Math.min(
              Math.floor(data.progress / (100 / 6)),
              5
            );

            // Update stages based on progress
            const newStages = prev.stages.map((stage, index) => {
              if (index < stageIndex) {
                return { ...stage, status: "complete" as const };
              } else if (index === stageIndex) {
                return { ...stage, status: "active" as const };
              }
              return stage;
            });

            return {
              ...prev,
              stage: data.stage || prev.stage,
              progress: data.progress,
              message: data.message,
              stages: newStages,
            };
          });
        }

        // Handle debate lines (streamed during debate stage)
        if (data.debate_line) {
          setState((prev) => ({
            ...prev,
            debateLines: [
              ...prev.debateLines.slice(-4),
              {
                side: data.debate_line.side,
                text: data.debate_line.text,
                timestamp: Date.now(),
              },
            ],
          }));
        }

        // Handle fast path (debate skipped)
        if (data.fast_path) {
          setState((prev) => ({
            ...prev,
            fastPath: true,
            stages: prev.stages.map((s) =>
              s.id === "debate" ? { ...s, status: "skipped" as const } : s
            ),
          }));
        }

        if (data.event === "complete") {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            progress: 100,
            verdict: data.data?.verdict || null,
            stages: prev.stages.map((s) =>
              s.status !== "skipped"
                ? { ...s, status: "complete" as const }
                : s
            ),
          }));
          eventSource.close();
        }

        if (data.event === "error") {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: data.message,
          }));
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Connection to server lost",
        }));
        eventSource.close();
      };
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  return {
    ...state,
    run,
    reset,
  };
}
