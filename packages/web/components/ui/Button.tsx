"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import type { VerdictLabelType } from "@truthcast/shared/schema";
import { tokens } from "@/lib/design-tokens";

export type ButtonVariant = "ghost" | "primary" | "verdict";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  verdictType?: VerdictLabelType;
  size?: "sm" | "md" | "lg";
  /** Shows arrow that animates on hover */
  showArrow?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * Button component following TruthCast design system
 *
 * Variants:
 * - ghost: Transparent background, border on hover
 * - primary: Elevated background, main CTA style
 * - verdict: Colored based on verdict type
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "ghost",
      verdictType,
      size = "md",
      showArrow = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: "h-8 px-3 text-[11px]",
      md: "h-10 px-4 text-[13px]",
      lg: "h-12 px-6 text-[13px]",
    };

    const variantStyles = {
      ghost: cn(
        "bg-transparent border border-transparent",
        "hover:border-[var(--border-mid)] hover:bg-[var(--bg-glass)]",
        "active:bg-[var(--bg-surface)]"
      ),
      primary: cn(
        "bg-[var(--bg-elevated)] border border-[var(--border-mid)]",
        "hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]",
        "active:bg-[var(--bg-void)]"
      ),
      verdict: cn(
        "border",
        verdictType
          ? `bg-[${tokens.verdict[verdictType].dim}] border-[${tokens.verdict[verdictType].solid}] text-[${tokens.verdict[verdictType].solid}]`
          : "bg-[var(--verdict-true-dim)] border-[var(--verdict-true)] text-[var(--verdict-true)]"
      ),
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center gap-2",
          "font-mono tracking-[0.2em] uppercase",
          "rounded-lg transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verdict-true)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-void)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Size
          sizeStyles[size],
          // Variant
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="animate-pulse">···</span>
        ) : (
          <>
            {children}
            {showArrow && (
              <span className="inline-block transition-transform duration-150 group-hover:translate-x-[3px]">
                →
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * Check button variant - [ CHECK → ] style
 */
export interface CheckButtonProps
  extends Omit<ButtonProps, "variant" | "showArrow"> {
  /** Show left border separator */
  withSeparator?: boolean;
}

export const CheckButton = forwardRef<HTMLButtonElement, CheckButtonProps>(
  ({ className, withSeparator = true, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group inline-flex items-center gap-2",
          "h-full px-4",
          "font-mono text-[13px] tracking-[0.2em] uppercase",
          "text-[var(--text-primary)]",
          "transition-colors duration-150",
          "hover:text-[var(--verdict-true)]",
          "focus-visible:outline-none focus-visible:text-[var(--verdict-true)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          withSeparator && "border-l border-[var(--border-mid)]",
          className
        )}
        {...props}
      >
        <span>[</span>
        <span>{children || "CHECK"}</span>
        <span className="inline-block transition-transform duration-150 group-hover:translate-x-[3px]">
          →
        </span>
        <span>]</span>
      </button>
    );
  }
);

CheckButton.displayName = "CheckButton";

/**
 * Ghost link button - for "View on Explorer →" style links
 */
export interface GhostLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  showArrow?: boolean;
}

export const GhostLink = forwardRef<HTMLAnchorElement, GhostLinkProps>(
  ({ className, showArrow = true, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "group inline-flex items-center gap-1",
          "font-mono text-[12px] tracking-[0.08em]",
          "text-[var(--text-secondary)]",
          "transition-colors duration-150",
          "hover:text-[var(--text-primary)]",
          "focus-visible:outline-none focus-visible:text-[var(--verdict-true)]",
          className
        )}
        {...props}
      >
        {children}
        {showArrow && (
          <span className="inline-block transition-transform duration-150 group-hover:translate-x-[3px]">
            →
          </span>
        )}
      </a>
    );
  }
);

GhostLink.displayName = "GhostLink";

/**
 * Ghost button - for action buttons without heavy styling
 */
export interface GhostButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showArrow?: boolean;
}

export const GhostButton = forwardRef<HTMLButtonElement, GhostButtonProps>(
  ({ className, showArrow = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group inline-flex items-center gap-1",
          "font-mono text-[12px] tracking-[0.08em]",
          "text-[var(--text-secondary)]",
          "transition-colors duration-150",
          "hover:text-[var(--text-primary)]",
          "focus-visible:outline-none focus-visible:text-[var(--verdict-true)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
        {showArrow && (
          <span className="inline-block transition-transform duration-150 group-hover:translate-x-[3px]">
            →
          </span>
        )}
      </button>
    );
  }
);

GhostButton.displayName = "GhostButton";

export default Button;
