"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { VerdictLabelType } from "@truthcast/shared/schema";
import { tokens } from "@/lib/design-tokens";
import { VERDICT_LABELS } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface VerdictLabelProps {
  /** Verdict type */
  verdict: VerdictLabelType;
  /** Whether to animate entrance */
  animate?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Verdict Label - The judicial stamp moment
 *
 * Specs from design doc:
 * - Playfair Display 700 italic, all-caps, letter-spacing 0.08em
 * - 64px default, 72px for FALSE
 * - TRUE: 12 green particle confetti burst over 400ms
 * - FALSE: Pulsing red glow (box-shadow 0 0 0 1px + 0 0 32px)
 */
export function VerdictLabel({
  verdict,
  animate = true,
  className,
}: VerdictLabelProps) {
  const config = tokens.verdictConfig[verdict];
  const color = tokens.verdict[verdict].solid;
  const prefersReducedMotion = useReducedMotion();
  const labelRef = useRef<HTMLDivElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti for TRUE verdict
  useEffect(() => {
    if (verdict === "TRUE" && animate && !prefersReducedMotion) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 500);
      return () => clearTimeout(timer);
    }
  }, [verdict, animate, prefersReducedMotion]);

  return (
    <div
      ref={labelRef}
      className={cn(
        "relative inline-block",
        // FALSE glow pulse animation
        verdict === "FALSE" &&
          !prefersReducedMotion &&
          "animate-glow-pulse-false rounded-lg",
        className
      )}
    >
      {/* Main label */}
      <h2
        className={cn(
          "font-display uppercase",
          "tracking-[0.08em]",
          // Size: desktop vs mobile
          "text-verdict-mobile md:text-verdict-desktop",
          // Special FALSE size
          verdict === "FALSE" && "md:text-verdict-false"
        )}
        style={{ color }}
        aria-label={`Verdict: ${VERDICT_LABELS[verdict]}`}
      >
        {VERDICT_LABELS[verdict]}
      </h2>

      {/* Confetti particles for TRUE */}
      {showConfetti && verdict === "TRUE" && (
        <ConfettiParticles color={color} />
      )}
    </div>
  );
}

/**
 * Confetti particles animation
 */
interface ConfettiParticlesProps {
  color: string;
}

function ConfettiParticles({ color }: ConfettiParticlesProps) {
  // Generate 12 particles in a radial pattern
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const distance = 40 + Math.random() * 20;
    const delay = i * 30;

    return {
      id: i,
      angle,
      distance,
      delay,
      size: 3 + Math.random() * 2,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            transform: `translate(-50%, -50%)`,
            animation: `confetti-particle 400ms ease-out ${particle.delay}ms forwards`,
            // Custom properties for the animation
            ["--angle" as string]: `${particle.angle}deg`,
            ["--distance" as string]: `${particle.distance}px`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes confetti-particle {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(var(--angle))
              translateY(0px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(var(--angle))
              translateY(calc(-1 * var(--distance)));
          }
        }
      `}</style>
    </div>
  );
}

export default VerdictLabel;
