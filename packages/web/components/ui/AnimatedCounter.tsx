"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/cn";
import { formatNumber, ANIMATION } from "@/lib/constants";

export interface AnimatedCounterProps {
  /** Target value to count to */
  value: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Whether to start the animation */
  start?: boolean;
  /** Format function (default: locale number formatting) */
  format?: (value: number) => string;
  /** Additional class names */
  className?: string;
  /** Prefix text */
  prefix?: string;
  /** Suffix text */
  suffix?: string;
}

/**
 * Animated Counter - Numbers animate from 0 to target value
 *
 * Specs from design doc:
 * - Count-up animation over 1.2s
 * - Expo ease-out easing
 * - DM Mono font
 */
export function AnimatedCounter({
  value,
  duration = ANIMATION.COUNT_UP,
  start = true,
  format = formatNumber,
  className,
  prefix,
  suffix,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!start || hasAnimatedRef.current) return;

    // Expo ease-out function
    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      setDisplayValue(Math.round(easedProgress * value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        hasAnimatedRef.current = true;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, start]);

  // Update display value when target changes (after initial animation)
  useEffect(() => {
    if (hasAnimatedRef.current) {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix}
      {format(displayValue)}
      {suffix}
    </span>
  );
}

/**
 * Stats Display - Three animated numbers in a row
 */
export interface StatsDisplayProps {
  stats: {
    total: number;
    caught: number;
    sources?: number;
  };
  loading?: boolean;
  className?: string;
}

export function StatsDisplay({ stats, loading, className }: StatsDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          "font-mono text-[13px] text-[var(--text-secondary)]",
          className
        )}
      >
        <span className="animate-pulse">Loading stats···</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-2 gap-y-1",
        "font-mono text-[13px]",
        className
      )}
    >
      <span className="text-[var(--text-primary)]">
        <AnimatedCounter
          value={stats.total}
          start={mounted}
          className="font-bold"
        />
      </span>
      <span className="text-[var(--text-secondary)]">claims checked</span>

      <span className="text-[var(--text-tertiary)]">·</span>

      <span className="text-[var(--verdict-false)]">
        <AnimatedCounter value={stats.caught} start={mounted} />
      </span>
      <span className="text-[var(--text-secondary)]">false claims caught</span>

      {stats.sources !== undefined && (
        <>
          <span className="text-[var(--text-tertiary)]">·</span>
          <span className="text-[var(--text-primary)]">
            <AnimatedCounter value={stats.sources} start={mounted} />
          </span>
          <span className="text-[var(--text-secondary)]">sources consulted</span>
        </>
      )}
    </div>
  );
}

/**
 * Confidence display with animated fill
 */
export interface ConfidenceDisplayProps {
  confidence: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function ConfidenceDisplay({
  confidence,
  size = "md",
  animated = true,
  className,
}: ConfidenceDisplayProps) {
  const sizeStyles = {
    sm: "text-[16px]",
    md: "text-[24px]",
    lg: "text-[28px]",
  };

  return (
    <span className={cn("font-mono", sizeStyles[size], className)}>
      confidence:{" "}
      {animated ? (
        <AnimatedCounter value={confidence} duration={800} suffix="%" />
      ) : (
        `${confidence}%`
      )}
    </span>
  );
}

export default AnimatedCounter;
