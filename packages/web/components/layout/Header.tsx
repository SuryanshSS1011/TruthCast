"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export interface HeaderProps {
  className?: string;
}

/**
 * Header - Slim top bar with wordmark and navigation
 *
 * Specs from design doc:
 * - TruthCast wordmark (left)
 * - "Truth Ledger" link (right) leading to /history
 * - No traditional multi-link navbar
 */
export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "w-full",
        "bg-[var(--bg-void)]/80 backdrop-blur-md",
        "border-b border-[var(--border-subtle)]",
        className
      )}
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Wordmark */}
          <Link
            href="/"
            className={cn(
              "group flex items-baseline gap-0",
              "transition-opacity duration-150",
              "hover:opacity-80"
            )}
          >
            <span className="font-display text-[20px] text-[var(--text-primary)]">
              TRUTH
            </span>
            <span className="font-display text-[20px] text-[var(--verdict-true)]">
              CAST
            </span>
          </Link>

          {/* Right side navigation */}
          <nav className="flex items-center gap-4">
            {/* Truth Ledger link */}
            <Link
              href="/history"
              className={cn(
                "font-mono text-[12px] uppercase tracking-[0.1em]",
                "text-[var(--text-secondary)]",
                "transition-colors duration-150",
                "hover:text-[var(--text-primary)]"
              )}
            >
              Truth Ledger
            </Link>

            {/* Explorer link */}
            <Link
              href="/explorer"
              className={cn(
                "font-mono text-[12px] uppercase tracking-[0.1em]",
                "text-[var(--text-secondary)]",
                "transition-colors duration-150",
                "hover:text-[var(--accent-solana)]"
              )}
            >
              <span className="hidden md:inline">Blockchain</span>
              <span className="md:hidden">Chain</span>
            </Link>

            {/* Theme toggle */}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
