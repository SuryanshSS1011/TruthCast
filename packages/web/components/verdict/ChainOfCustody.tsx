"use client";

import { cn } from "@/lib/cn";
import { TTLBadge } from "@/components/ui/Badge";
import { GhostLink } from "@/components/ui/Button";
import { getSolanaExplorerUrl, truncateHash } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

export interface ChainOfCustodyProps {
  /** Solana transaction hash */
  txHash: string | null | undefined;
  /** Timestamp when checked */
  checkedAt: number;
  /** TTL policy */
  ttlPolicy: "SHORT" | "LONG" | "STATIC";
  /** Additional class names */
  className?: string;
}

/**
 * Chain of Custody - Solana blockchain provenance
 *
 * Specs from design doc:
 * - Solana logo SVG + "Solana Devnet" in --accent-solana
 * - Tx hash: first 8 + '...' + last 4 chars, full hash on hover tooltip
 * - "View on Explorer →" ghost button
 * - Relative timestamp with ISO date on hover
 * - TTL policy badge (SHORT / LONG / STATIC)
 */
export function ChainOfCustody({
  txHash,
  checkedAt,
  ttlPolicy,
  className,
}: ChainOfCustodyProps) {
  const checkedDate = new Date(checkedAt * 1000);
  const relativeTime = formatDistanceToNow(checkedDate, { addSuffix: true });
  const isoDate = checkedDate.toISOString();

  return (
    <div
      className={cn(
        "space-y-3",
        "font-mono text-[12px]",
        className
      )}
    >
      {/* Solana branding */}
      <div className="flex items-center gap-2">
        <SolanaLogo className="w-4 h-4" />
        <span className="text-[var(--accent-solana)] uppercase tracking-[0.1em]">
          Solana Devnet
        </span>
      </div>

      {/* Transaction hash */}
      {txHash ? (
        <div className="space-y-1">
          <div className="text-[var(--text-tertiary)]">TX HASH</div>
          <div
            className="text-[var(--text-primary)] font-code cursor-help"
            title={txHash}
          >
            {truncateHash(txHash)}
          </div>
        </div>
      ) : (
        <div className="text-[var(--text-tertiary)] italic">
          Pending blockchain confirmation
        </div>
      )}

      {/* Explorer link */}
      {txHash && (
        <GhostLink
          href={getSolanaExplorerUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Explorer
        </GhostLink>
      )}

      {/* Timestamp */}
      <div className="space-y-1">
        <div className="text-[var(--text-tertiary)]">VERIFIED</div>
        <div
          className="text-[var(--text-secondary)] cursor-help"
          title={isoDate}
        >
          {relativeTime}
        </div>
      </div>

      {/* TTL Policy */}
      <div className="space-y-1">
        <div className="text-[var(--text-tertiary)]">CACHE POLICY</div>
        <TTLBadge policy={ttlPolicy} />
      </div>
    </div>
  );
}

/**
 * Solana logo SVG
 */
function SolanaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 397.7 311.7"
      fill="currentColor"
      style={{ color: "var(--accent-solana)" }}
    >
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
    </svg>
  );
}

export default ChainOfCustody;
