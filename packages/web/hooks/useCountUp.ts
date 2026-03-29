"use client";

import { useState, useEffect, useCallback } from "react";

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  easing?: "linear" | "easeOut" | "easeInOut";
}

/**
 * Hook for animating a number from start to end value.
 * Uses requestAnimationFrame for smooth animation.
 */
export function useCountUp({
  start = 0,
  end,
  duration = 1200,
  delay = 0,
  easing = "easeOut",
}: UseCountUpOptions) {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };

  const animate = useCallback(() => {
    const startTime = performance.now();
    const easingFn = easingFunctions[easing];

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentValue = Math.round(start + (end - start) * easedProgress);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setIsAnimating(false);
      }
    };

    setIsAnimating(true);
    requestAnimationFrame(updateCount);
  }, [start, end, duration, easing]);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(animate, delay);
      return () => clearTimeout(timer);
    } else {
      animate();
    }
  }, [animate, delay]);

  return { count, isAnimating };
}

/**
 * Format a number with locale-specific separators.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}
