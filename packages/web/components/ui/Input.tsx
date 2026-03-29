"use client";

import { forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { CheckButton } from "./Button";

export interface ClaimInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Value of the input */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Detected URL platform (e.g., "youtube.com", "twitter.com") */
  detectedPlatform?: string | null;
}

/**
 * Claim Input Field - The most important element on the landing page
 *
 * Specs from design doc:
 * - Full width, max-width 680px, centered
 * - Height 64px desktop, 56px mobile
 * - Background: --bg-elevated
 * - Border: 1px solid --border-mid, transitions to --verdict-true on focus
 * - Placeholder: Lora italic
 * - Check button: [ CHECK → ] in DM Mono
 */
export const ClaimInput = forwardRef<HTMLInputElement, ClaimInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      loading = false,
      error,
      detectedPlatform,
      className,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !loading && value.trim().length >= 10) {
        onSubmit();
      }
    };

    const isValid = value.trim().length >= 10;

    return (
      <div className={cn("w-full max-w-input", className)}>
        {/* Main input container */}
        <div
          className={cn(
            "relative flex items-center",
            "w-full h-input-mobile md:h-input-desktop",
            "bg-[var(--bg-elevated)]",
            "border rounded-lg",
            "transition-all duration-150",
            isFocused
              ? "border-[var(--verdict-true)] shadow-[0_0_0_3px_var(--verdict-true-glow)]"
              : "border-[var(--border-mid)]",
            error && "border-[var(--verdict-false)]"
          )}
        >
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={loading}
            placeholder="Paste a claim, URL, tweet, or YouTube link..."
            className={cn(
              "flex-1 h-full px-4 md:px-6",
              "bg-transparent",
              "font-body text-[15px] md:text-[16px] italic",
              "text-[var(--text-primary)]",
              "placeholder:text-[var(--text-tertiary)] placeholder:italic",
              "focus:outline-none",
              "disabled:opacity-50"
            )}
            aria-label="Enter a claim to fact-check"
            aria-invalid={!!error}
            {...props}
          />

          {/* Check button */}
          <CheckButton
            onClick={onSubmit}
            disabled={loading || !isValid}
            aria-label="Check this claim"
          >
            {loading ? "···" : "CHECK"}
          </CheckButton>
        </div>

        {/* URL detection feedback */}
        {detectedPlatform && (
          <div
            className={cn(
              "mt-2 px-1",
              "font-mono text-[12px]",
              "text-[var(--text-secondary)]",
              "animate-fade-in"
            )}
          >
            <span className="text-[var(--accent-solana)]">
              {detectedPlatform}
            </span>{" "}
            detected → claim extraction mode
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className={cn(
              "mt-2 px-1",
              "font-mono text-[12px]",
              "text-[var(--verdict-false)]"
            )}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Character count hint */}
        {value.length > 0 && value.length < 10 && (
          <div
            className={cn(
              "mt-2 px-1",
              "font-mono text-[11px]",
              "text-[var(--text-tertiary)]"
            )}
          >
            {10 - value.length} more characters needed
          </div>
        )}

        {/* Drop target hint */}
        <div
          className={cn(
            "mt-3 text-center",
            "font-mono text-[12px]",
            "text-[var(--text-tertiary)]"
          )}
        >
          or drag and drop a PDF · screenshot · article
        </div>
      </div>
    );
  }
);

ClaimInput.displayName = "ClaimInput";

/**
 * URL detection hook
 */
export function useUrlDetection(value: string): string | null {
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    const urlPatterns: Array<{ pattern: RegExp; name: string }> = [
      { pattern: /youtube\.com|youtu\.be/i, name: "youtube.com" },
      { pattern: /twitter\.com|x\.com/i, name: "twitter.com" },
      { pattern: /facebook\.com/i, name: "facebook.com" },
      { pattern: /instagram\.com/i, name: "instagram.com" },
      { pattern: /tiktok\.com/i, name: "tiktok.com" },
      { pattern: /reddit\.com/i, name: "reddit.com" },
      { pattern: /https?:\/\/[^\s]+/i, name: "URL" },
    ];

    for (const { pattern, name } of urlPatterns) {
      if (pattern.test(value)) {
        setPlatform(name);
        return;
      }
    }

    setPlatform(null);
  }, [value]);

  return platform;
}

export default ClaimInput;
