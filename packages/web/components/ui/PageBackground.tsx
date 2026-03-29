"use client";

import { cn } from "@/lib/cn";

export type BackgroundVariant = "default" | "hero" | "pipeline-active";

export interface PageBackgroundProps {
  /** Background variant */
  variant?: BackgroundVariant;
  /** Show grain texture overlay */
  showGrain?: boolean;
  /** Show topographic lines */
  showTopo?: boolean;
  /** Additional class names */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}

/**
 * Page Background - Atmospheric treatment for pages
 *
 * Specs from design doc:
 * - Grain texture: 3-4% opacity, SVG feTurbulence baseFrequency 0.85
 * - Topographic lines: 18px spacing, rgba(255,255,255,0.025)
 * - Hero radial glow: centered, Solana purple rgba(153,69,255,0.04)
 * - Pipeline active: pulsing box-shadow glow
 */
export function PageBackground({
  variant = "default",
  showGrain = true,
  showTopo = false,
  className,
  children,
}: PageBackgroundProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full",
        "bg-[var(--bg-void)]",
        // Grain texture
        showGrain && "bg-grain",
        // Topographic lines (landing page only)
        showTopo && "bg-topo",
        // Hero radial glow
        variant === "hero" && "bg-hero-glow",
        // Pipeline active glow
        variant === "pipeline-active" && "bg-pipeline-active",
        className
      )}
    >
      {/* Content layer - above background effects */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Section background for elevated cards
 */
export interface CardBackgroundProps {
  /** Elevation level */
  elevation?: "surface" | "elevated";
  /** Border style */
  bordered?: boolean;
  /** Rounded corners */
  rounded?: boolean;
  /** Additional class names */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}

export function CardBackground({
  elevation = "surface",
  bordered = true,
  rounded = true,
  className,
  children,
}: CardBackgroundProps) {
  return (
    <div
      className={cn(
        elevation === "surface" && "bg-[var(--bg-surface)]",
        elevation === "elevated" && "bg-[var(--bg-elevated)]",
        bordered && "border border-[var(--border-mid)]",
        rounded && "rounded-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Verdict card background with colored top border
 */
export interface VerdictBackgroundProps {
  /** Verdict color (CSS color value) */
  verdictColor: string;
  /** Dim background color */
  dimColor: string;
  /** Additional class names */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}

export function VerdictBackground({
  verdictColor,
  dimColor,
  className,
  children,
}: VerdictBackgroundProps) {
  return (
    <div
      className={cn("relative rounded-lg overflow-hidden", className)}
      style={{
        backgroundColor: dimColor,
      }}
    >
      {/* Top border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: verdictColor }}
      />
      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

export default PageBackground;
