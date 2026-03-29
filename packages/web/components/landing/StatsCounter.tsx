"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { StatsDisplay } from "@/components/ui/AnimatedCounter";
import { ANIMATION } from "@/lib/constants";

export interface Stats {
  total: number;
  caught: number;
  sources?: number;
}

export interface StatsCounterProps {
  /** Initial stats (from server) */
  initialStats?: Stats;
  /** Whether to auto-refresh */
  autoRefresh?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Stats Counter - Live statistics with auto-refresh
 *
 * Specs from design doc:
 * - Three numbers in horizontal row
 * - Auto-refresh every 30s
 * - Count-up animation on load (1.2s expo)
 */
export function StatsCounter({
  initialStats,
  autoRefresh = true,
  className,
}: StatsCounterProps) {
  const [stats, setStats] = useState<Stats | null>(initialStats || null);
  const [loading, setLoading] = useState(!initialStats);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats({
        total: data.total || 0,
        caught: data.caught || 0,
        sources: data.sources,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Unable to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!initialStats) {
      fetchStats();
    }
  }, [initialStats, fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, ANIMATION.STATS_REFRESH);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats]);

  if (error) {
    return (
      <div
        className={cn(
          "text-center font-mono text-[12px]",
          "text-[var(--text-tertiary)]",
          className
        )}
      >
        {error}
      </div>
    );
  }

  return (
    <StatsDisplay
      stats={stats || { total: 0, caught: 0 }}
      loading={loading}
      className={className}
    />
  );
}

/**
 * Hook for fetching stats
 */
export function useStats(autoRefresh = true) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setStats({
        total: data.total || 0,
        caught: data.caught || 0,
        sources: data.sources,
      });
    } catch {
      // Silently fail, keep existing stats
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (autoRefresh) {
      const interval = setInterval(fetchStats, ANIMATION.STATS_REFRESH);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export default StatsCounter;
