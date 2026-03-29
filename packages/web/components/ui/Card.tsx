"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: "surface" | "elevated" | "glass";
  /** Whether to show border */
  bordered?: boolean;
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
  /** Whether card is interactive (hover effects) */
  interactive?: boolean;
}

/**
 * Card component - Container with elevation
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "surface",
      bordered = true,
      padding = "md",
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      surface: "bg-[var(--bg-surface)]",
      elevated: "bg-[var(--bg-elevated)]",
      glass: "bg-[var(--bg-glass)] backdrop-blur-sm",
    };

    const paddingStyles = {
      none: "",
      sm: "p-3",
      md: "p-4 md:p-6",
      lg: "p-6 md:p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg",
          variantStyles[variant],
          bordered && "border border-[var(--border-mid)]",
          paddingStyles[padding],
          interactive && [
            "cursor-pointer",
            "transition-all duration-150",
            "hover:border-[var(--border-strong)]",
            "hover:translate-y-[-1px]",
            "hover:shadow-lg",
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * Card Header
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left accent bar color */
  accentColor?: string;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, accentColor, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3",
          accentColor && "pl-3 border-l-[3px]",
          className
        )}
        style={accentColor ? { borderLeftColor: accentColor } : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

/**
 * Card Title
 */
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-mono text-[13px] uppercase tracking-[0.1em]",
        "text-[var(--text-secondary)]",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

/**
 * Card Content
 */
export const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

/**
 * Card Footer
 */
export const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-4 pt-4",
        "border-t border-[var(--border-subtle)]",
        "flex items-center gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";

export default Card;
