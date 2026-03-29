'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import styles from './explorer.module.css';
import Link from 'next/link';

const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

interface OnChainVerdict {
  h: string;        // claim_hash
  v: string;        // verdict label
  c: number;        // confidence
  sig: string;      // transaction signature
  blockTime: number; // Unix timestamp
}

export default function ExplorerPage() {
  const [verdicts, setVerdicts] = useState<OnChainVerdict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFromChain();
  }, []);

  async function fetchFromChain() {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
      const publicKey = process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error('Solana public key not configured');
      }

      const connection = new Connection(rpcUrl);
      const pubkey = new PublicKey(publicKey);

      // Get last 50 transaction signatures
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 50 });

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
            console.error('Failed to parse transaction:', err);
            return null;
          }
        })
      );

      const validVerdicts = results.filter((v): v is OnChainVerdict => v !== null);
      setVerdicts(validVerdicts);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch from Solana:', err);
      setError(err.message || 'Failed to connect to Solana');
      setLoading(false);
    }
  }

  const verdictColors: Record<string, string> = {
    TRUE: '#10b981',
    MOSTLY_TRUE: '#34d399',
    MISLEADING: '#fbbf24',
    MOSTLY_FALSE: '#fb923c',
    FALSE: '#ef4444',
    CONFLICTING: '#8b5cf6',
    UNVERIFIABLE: '#6b7280',
  };

  function formatTimestamp(timestamp: number): string {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Solana Verdict Ledger</h1>
          <p className={styles.subtitle}>
            Immutable blockchain record of all TruthCast verdicts
          </p>
          <Link href="/" className={styles.backLink}>
            ← Back to home
          </Link>
        </header>

        <div className={styles.banner}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <strong>This page reads directly from the Solana blockchain.</strong>
            <p>
              No TruthCast server is involved. The data cannot be altered by anyone.
              All verdicts are permanently stored on Solana devnet.
            </p>
          </div>
        </div>

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Reading from Solana blockchain...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && verdicts.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>No on-chain verdicts found</p>
            <span>Verdicts written to Solana will appear here</span>
          </div>
        )}

        {!loading && !error && verdicts.length > 0 && (
          <div className={styles.timeline}>
            {verdicts.map((verdict) => (
              <div key={verdict.sig} className={styles.timelineItem}>
                <div className={styles.timelineMarker}>
                  <div
                    className={styles.timelineDot}
                    style={{ backgroundColor: verdictColors[verdict.v] || '#6b7280' }}
                  />
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.verdictHeader}>
                    <span
                      className={styles.verdictBadge}
                      style={{ backgroundColor: verdictColors[verdict.v] || '#6b7280' }}
                    >
                      {verdict.v.replace(/_/g, ' ')}
                    </span>
                    <span className={styles.confidence}>{verdict.c}% confidence</span>
                  </div>

                  <div className={styles.verdictDetails}>
                    <p>
                      <strong>Claim Hash:</strong>{' '}
                      <Link href={`/verdict/${verdict.h}`} className={styles.claimLink}>
                        {verdict.h.substring(0, 16)}...
                      </Link>
                    </p>
                    <p>
                      <strong>Checked:</strong> {formatTimestamp(verdict.blockTime)}
                    </p>
                    <p>
                      <strong>Transaction:</strong>{' '}
                      <a
                        href={`https://explorer.solana.com/tx/${verdict.sig}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txLink}
                      >
                        {verdict.sig.substring(0, 16)}...
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
            ))}
          </div>
        )}

        {!loading && !error && verdicts.length > 0 && (
          <div className={styles.footer}>
            <p>Showing {verdicts.length} most recent verdicts</p>
            <p>
              Connected to:{' '}
              <code>{process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'Solana Devnet'}</code>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
