"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { GhostButton } from "@/components/ui/Button";

export interface VerdictActionsProps {
  /** Claim hash for shareable URL */
  claimHash: string;
  /** Claim text for sharing */
  claimText: string;
  /** Additional class names */
  className?: string;
}

/**
 * Verdict Actions - Share, copy, and report buttons
 *
 * Specs from design doc:
 * - Ghost button style
 * - Copy link with checkmark feedback
 * - Share to Twitter/X
 * - Report button (future feature)
 */
export function VerdictActions({
  claimHash,
  claimText,
  className,
}: VerdictActionsProps) {
  const [copied, setCopied] = useState(false);

  const verdictUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verdict/${claimHash}`
    : `/verdict/${claimHash}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verdictUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [verdictUrl]);

  const handleShareTwitter = useCallback(() => {
    const text = `Fact-check: "${claimText.slice(0, 100)}${claimText.length > 100 ? "..." : ""}"`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verdictUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [claimText, verdictUrl]);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Copy link button */}
      <GhostButton
        onClick={handleCopyLink}
        className="gap-2"
        aria-label={copied ? "Link copied" : "Copy link"}
      >
        {copied ? (
          <>
            <CheckIcon className="w-3.5 h-3.5 text-[var(--verdict-true)]" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Copy link</span>
          </>
        )}
      </GhostButton>

      {/* Share to Twitter */}
      <GhostButton
        onClick={handleShareTwitter}
        className="gap-2"
        aria-label="Share on Twitter"
      >
        <TwitterIcon className="w-3.5 h-3.5" />
        <span>Share</span>
      </GhostButton>

      {/* Report button (placeholder for future) */}
      <GhostButton
        onClick={() => {}}
        className="gap-2 text-[var(--text-tertiary)]"
        aria-label="Report issue"
        disabled
      >
        <FlagIcon className="w-3.5 h-3.5" />
        <span>Report</span>
      </GhostButton>
    </div>
  );
}

// Icon components
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M6.5 9.5l3-3M7 12l-1.5 1.5a2.121 2.121 0 01-3-3L4 9m5-5l1.5-1.5a2.121 2.121 0 013 3L12 7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M3 8l4 4 6-6" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.52 6.775l4.898-5.693h-1.16L8.998 6.003l-3.344-5.12H2l5.136 7.478L2 14.096h1.16l4.49-5.217 3.587 5.217H14L9.52 6.775zm-1.59 1.845l-.52-.745-4.14-5.92h1.782l3.342 4.78.52.745 4.344 6.213h-1.78l-3.548-5.073z" />
    </svg>
  );
}

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M3 14V3l9 4-9 4" />
    </svg>
  );
}

export default VerdictActions;
