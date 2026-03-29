import { db } from '../../../../pipeline/db/init';
import styles from './history.module.css';
import Link from 'next/link';

interface VerdictRow {
  claim_hash: string;
  claim_text: string;
  verdict_label: string;
  confidence: number;
  checked_at: number;
  tx_hash: string | null;
}

export const metadata = {
  title: 'Verdict History - TruthCast',
  description: 'Browse recently fact-checked claims',
};

export default function HistoryPage() {
  const verdicts = db
    .prepare(
      `SELECT claim_hash, claim_text, verdict_label, confidence, checked_at, tx_hash
       FROM verdicts
       ORDER BY checked_at DESC
       LIMIT 20`
    )
    .all() as VerdictRow[];

  const verdictColors: Record<string, string> = {
    TRUE: '#10b981',
    MOSTLY_TRUE: '#34d399',
    MISLEADING: '#fbbf24',
    MOSTLY_FALSE: '#fb923c',
    FALSE: '#ef4444',
    CONFLICTING: '#8b5cf6',
    UNVERIFIABLE: '#6b7280',
  };

  function getRelativeTime(timestamp: number): string {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Verdict History</h1>
          <p className={styles.subtitle}>Recently fact-checked claims</p>
          <Link href="/" className={styles.backLink}>
            ← Check another claim
          </Link>
        </header>

        {verdicts.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>No verdicts yet</p>
            <span>Check your first claim to see it here</span>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Verdict</th>
                  <th>Claim</th>
                  <th>Confidence</th>
                  <th>Checked</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>
                {verdicts.map((verdict) => (
                  <tr key={verdict.claim_hash}>
                    <td>
                      <span
                        className={styles.verdictBadge}
                        style={{
                          backgroundColor: verdictColors[verdict.verdict_label] || '#6b7280',
                        }}
                      >
                        {verdict.verdict_label.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={styles.claimCell}>
                      <Link
                        href={`/verdict/${verdict.claim_hash}`}
                        className={styles.claimLink}
                      >
                        {truncate(verdict.claim_text, 80)}
                      </Link>
                    </td>
                    <td className={styles.confidenceCell}>
                      {verdict.confidence}%
                    </td>
                    <td className={styles.timeCell}>
                      {getRelativeTime(verdict.checked_at)}
                    </td>
                    <td className={styles.linksCell}>
                      <div className={styles.linkIcons}>
                        <Link
                          href={`/verdict/${verdict.claim_hash}`}
                          className={styles.iconLink}
                          title="View verdict"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                        {verdict.tx_hash && (
                          <a
                            href={`https://explorer.solana.com/tx/${verdict.tx_hash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.iconLink}
                            title="View on Solana Explorer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
