import { notFound } from 'next/navigation';
import { getCachedVerdict } from '@truthcast/pipeline/db/init';
import type { Verdict } from '@truthcast/shared/schema';
import styles from '../../page.module.css';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { claim_hash: string } }): Promise<Metadata> {
  const verdict = getCachedVerdict(params.claim_hash);

  if (!verdict) {
    return {
      title: 'Verdict Not Found - TruthCast',
    };
  }

  const firstSentence = verdict.reasoning.split('.')[0] + '.';

  // Generate ClaimReview JSON-LD
  const claimReviewSchema = {
    "@context": "https://schema.org",
    "@type": "ClaimReview",
    "url": `https://truthcast.tech/verdict/${params.claim_hash}`,
    "claimReviewed": verdict.claim_text,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": verdict.confidence,
      "bestRating": 100,
      "worstRating": 0,
      "alternateName": verdict.verdict
    },
    "author": {
      "@type": "Organization",
      "name": "TruthCast",
      "url": "https://truthcast.tech"
    },
    "datePublished": new Date(verdict.checked_at * 1000).toISOString(),
    "itemReviewed": {
      "@type": "Claim",
      "appearance": verdict.sources.map((s) => ({
        "@type": "Article",
        "url": s.url,
        "publisher": {
          "@type": "Organization",
          "name": s.domain
        }
      }))
    }
  };

  return {
    title: `${verdict.verdict.replace(/_/g, ' ')} - ${verdict.claim_text.substring(0, 60)}... - TruthCast`,
    description: firstSentence,
    openGraph: {
      title: `${verdict.verdict.replace(/_/g, ' ')}: ${verdict.claim_text}`,
      description: firstSentence,
      type: 'article',
      url: `https://truthcast.tech/verdict/${params.claim_hash}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${verdict.verdict.replace(/_/g, ' ')}: ${verdict.claim_text}`,
      description: firstSentence,
    },
    other: {
      'script:ld+json': JSON.stringify(claimReviewSchema),
    },
  };
}

export default function VerdictPage({ params }: { params: { claim_hash: string } }) {
  const verdict = getCachedVerdict(params.claim_hash);

  if (!verdict) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>TruthCast</h1>
          <p className={styles.subtitle}>
            Autonomous AI Fact-Checking with Immutable Blockchain Provenance
          </p>
        </header>

        <VerdictCard verdict={verdict} standalone={true} claimHash={params.claim_hash} />

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/" style={{ color: 'white', textDecoration: 'underline' }}>
            Check another claim
          </a>
        </div>
      </div>
    </main>
  );
}

function VerdictCard({ verdict, standalone, claimHash }: { verdict: Verdict; standalone?: boolean; claimHash?: string }) {
  const verdictColors: Record<string, string> = {
    TRUE: '#10b981',
    MOSTLY_TRUE: '#34d399',
    MISLEADING: '#fbbf24',
    MOSTLY_FALSE: '#fb923c',
    FALSE: '#ef4444',
    CONFLICTING: '#8b5cf6',
    UNVERIFIABLE: '#6b7280',
  };

  const color = verdictColors[verdict.verdict] || '#6b7280';

  return (
    <div className={styles.verdictCard}>
      <div className={styles.verdictHeader}>
        <div
          className={styles.verdictLabel}
          style={{ backgroundColor: color }}
        >
          {verdict.verdict.replace(/_/g, ' ')}
        </div>
        <div className={styles.confidence}>
          {verdict.confidence}% confidence
        </div>
      </div>

      <div className={styles.verdictBody}>
        {standalone && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <strong style={{ color: '#374151', fontSize: '0.9rem' }}>Claim:</strong>
            <p style={{ marginTop: '0.5rem', color: '#111827', fontSize: '1rem', lineHeight: '1.5' }}>
              {verdict.claim_text}
            </p>
          </div>
        )}

        <p className={styles.reasoning}>{verdict.reasoning}</p>

        {verdict.sources.length > 0 && (
          <div className={styles.sources}>
            <h3>Sources ({verdict.sources.length}):</h3>
            <ul>
              {verdict.sources.slice(0, 5).map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    [{source.domain_tier}] {source.domain}
                  </a>
                  <span className={styles.credibility}>
                    {' '}
                    (credibility: {(source.credibility_score * 100).toFixed(0)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {verdict.debate_triggered && (
          <div className={styles.debate}>
            <h3>⚔️ Adversarial Debate Triggered</h3>
            <p>
              Low agreement detected ({(verdict.agreement_score * 100).toFixed(0)}%).
              Debate agents argued both sides before reaching this verdict.
            </p>
            {verdict.minority_view && (
              <details>
                <summary>Minority view</summary>
                <p>{verdict.minority_view}</p>
              </details>
            )}
          </div>
        )}

        <div className={styles.metadata}>
          <p>
            <strong>Checked:</strong>{' '}
            {new Date(verdict.checked_at * 1000).toLocaleString()}
          </p>
          <p>
            <strong>TTL Policy:</strong> {verdict.ttl_policy}
          </p>
          <p>
            <strong>Pipeline Version:</strong> {verdict.pipeline_version}
          </p>
          <p>
            <strong>Claim Hash:</strong>{' '}
            <code>{verdict.claim_hash.substring(0, 16)}...</code>
          </p>
          {verdict.tx_hash && (
            <p>
              <strong>Solana TX:</strong>{' '}
              <a
                href={`https://explorer.solana.com/tx/${verdict.tx_hash}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'underline' }}
              >
                {verdict.tx_hash.substring(0, 16)}...
              </a>
            </p>
          )}
        </div>

        {standalone && claimHash && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <CopyLinkButton claimHash={claimHash} />
          </div>
        )}
      </div>
    </div>
  );
}

function CopyLinkButton({ claimHash }: { claimHash: string }) {
  'use client';

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/verdict/${claimHash}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        width: '100%',
        padding: '0.75rem',
        background: copied ? '#10b981' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Link Copied!' : 'Copy Shareable Link'}
    </button>
  );
}

// Need React import for client component
import React from 'react';
