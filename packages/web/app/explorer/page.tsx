"use client";

import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PageBackground } from "@/components/ui/PageBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { VerdictBadge } from "@/components/ui/Badge";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { tokens } from "@/lib/design-tokens";
import { cn } from "@/lib/cn";
import type { VerdictLabelType } from "@truthcast/shared/schema";

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

interface OnChainVerdict {
  h: string; // claim_hash
  v: string; // verdict label
  c: number; // confidence
  sig: string; // transaction signature
  blockTime: number; // Unix timestamp
}

export default function ExplorerPage() {
  const prefersReducedMotion = useReducedMotion();
  const [verdicts, setVerdicts] = useState<OnChainVerdict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFromChain();
  }, []);

  async function fetchFromChain() {
    try {
      const rpcUrl =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
      const publicKey = process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error("Solana public key not configured");
      }

      const connection = new Connection(rpcUrl);
      const pubkey = new PublicKey(publicKey);

      // Get last 50 transaction signatures
      const signatures = await connection.getSignaturesForAddress(pubkey, {
        limit: 50,
      });

      // Fetch and decode each memo transaction
      const results = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (!tx || !tx.transaction || !tx.transaction.message) {
              return null;
            }

            // Find memo instruction
            const memoIx = tx.transaction.message.instructions.find(
              (ix: any) => ix.programId?.toString() === MEMO_PROGRAM_ID
            ) as any;

            if (!memoIx || !memoIx.parsed) {
              return null;
            }

            // Parse memo data (minimal JSON: {h, v, c})
            const data = JSON.parse(memoIx.parsed);

            return {
              ...data,
              sig: sig.signature,
              blockTime: sig.blockTime || 0,
            };
          } catch (err) {
            console.error("Failed to parse transaction:", err);
            return null;
          }
        })
      );

      const validVerdicts = results.filter(
        (v): v is OnChainVerdict => v !== null
      );
      setVerdicts(validVerdicts);
      setLoading(false);
    } catch (err: any) {
      console.error("Failed to fetch from Solana:", err);
      setError(err.message || "Failed to connect to Solana");
      setLoading(false);
    }
  }

  function formatTimestamp(timestamp: number): string {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleString();
  }

  function getRelativeTime(timestamp: number): string {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  return (
    <PageBackground variant="default">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-primary)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 22 22" fill="none">
              <circle
                cx="11"
                cy="11"
                r="10"
                stroke="var(--verdict-true)"
                strokeWidth="1.5"
              />
              <path
                d="M6 11l3 3 7-7"
                stroke="var(--verdict-true)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-mono text-sm font-medium tracking-wider">
              TRUTHCAST
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/history"
              className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              History
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="relative z-10 min-h-screen px-6 py-8 pt-24">
        <div className="mx-auto max-w-[1000px]">
          {/* Page header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <SolanaLogo className="w-8 h-8" />
              <h1 className="font-display text-4xl italic text-[var(--text-primary)]">
                ON-CHAIN LEDGER
              </h1>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              IMMUTABLE BLOCKCHAIN RECORD · SOLANA DEVNET
            </p>
          </header>

          {/* Info banner */}
          <div className="mb-8 flex items-start gap-4 rounded-xl border border-[var(--accent-solana)] bg-[var(--accent-solana)]/10 p-5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="flex-shrink-0 text-[var(--accent-solana)]"
            >
              <path
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <p className="font-mono text-[13px] font-medium text-[var(--text-primary)]">
                This page reads directly from the Solana blockchain.
              </p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                No TruthCast server is involved. The data cannot be altered by
                anyone. All verdicts are permanently stored on Solana devnet.
              </p>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--text-tertiary)]">
              <motion.div
                className="h-8 w-8 rounded-full border-2 border-[var(--border-mid)] border-t-[var(--accent-solana)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="mt-4 font-mono text-xs uppercase tracking-widest">
                Reading from Solana blockchain...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-[var(--verdict-false)] bg-[var(--verdict-false-dim)] p-6 text-center">
              <p className="text-[var(--verdict-false)]">
                <strong>Error:</strong> {error}
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError("");
                  fetchFromChain();
                }}
                className="mt-4 rounded-lg border border-[var(--border-mid)] px-6 py-2 font-mono text-sm uppercase tracking-wider text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && verdicts.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center py-24 text-[var(--text-tertiary)]"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                className="mb-4 opacity-50"
              >
                <path
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="font-mono text-sm uppercase tracking-widest">
                NO ON-CHAIN VERDICTS FOUND
              </p>
              <span className="mt-2 text-center font-body text-sm">
                Verdicts written to Solana will appear here
              </span>
            </motion.div>
          )}

          {/* Timeline */}
          {!loading && !error && verdicts.length > 0 && (
            <div className="space-y-4">
              <AnimatePresence>
                {verdicts.map((verdict, index) => {
                  const verdictType = verdict.v as VerdictLabelType;
                  const color =
                    tokens.verdict[verdictType]?.solid ||
                    tokens.verdict.UNVERIFIABLE.solid;

                  return (
                    <motion.div
                      key={verdict.sig}
                      className="relative flex gap-4"
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      {/* Timeline marker */}
                      <div className="flex flex-col items-center">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {index < verdicts.length - 1 && (
                          <div className="w-px flex-1 bg-[var(--border-subtle)]" />
                        )}
                      </div>

                      {/* Content card */}
                      <div className="flex-1 pb-4">
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <VerdictBadge verdict={verdictType} size="sm" />
                            <span className="font-mono text-[12px] text-[var(--text-secondary)]">
                              {verdict.c}% confidence
                            </span>
                            <span className="ml-auto font-code text-[11px] text-[var(--text-tertiary)]">
                              {getRelativeTime(verdict.blockTime)}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-2 font-mono text-[12px]">
                            <p className="flex items-center gap-2">
                              <span className="text-[var(--text-tertiary)]">
                                Claim:
                              </span>
                              <Link
                                href={`/verdict/${verdict.h}`}
                                className="text-[var(--text-primary)] transition-colors hover:text-[var(--accent-solana)]"
                              >
                                {verdict.h.substring(0, 16)}...
                              </Link>
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="text-[var(--text-tertiary)]">
                                TX:
                              </span>
                              <a
                                href={`https://explorer.solana.com/tx/${verdict.sig}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[var(--accent-solana)] transition-colors hover:opacity-80"
                              >
                                {verdict.sig.substring(0, 16)}...
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Footer */}
          {!loading && !error && verdicts.length > 0 && (
            <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 text-center">
              <p className="font-mono text-[11px] text-[var(--text-tertiary)]">
                Showing {verdicts.length} most recent verdicts
              </p>
              <p className="mt-1 font-mono text-[11px] text-[var(--text-tertiary)]">
                Connected to:{" "}
                <code className="text-[var(--accent-solana)]">
                  {process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "Solana Devnet"}
                </code>
              </p>
            </div>
          )}
        </div>
      </main>
    </PageBackground>
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
