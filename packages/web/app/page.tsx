'use client';

import { useState, useEffect } from 'react';
import type { Verdict } from '@truthcast/shared/schema';
import styles from './page.module.css';

interface Stats {
  total: number;
  caught: number;
  unique_claims: number;
}

export default function Home() {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);

  // Fetch stats on mount and poll every 30 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!claim.trim()) return;

    setLoading(true);
    setProgress(0);
    setCurrentStage('Starting...');
    setVerdict(null);
    setError('');

    try {
      // Start the pipeline
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start pipeline');
      }

      const { session_id } = await response.json();

      // Open SSE stream for progress updates
      const eventSource = new EventSource(`/api/check/stream?session=${session_id}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.event === 'progress' || data.event === 'stage_complete') {
          setProgress(data.progress);
          setCurrentStage(data.message);
        }

        if (data.event === 'complete') {
          setLoading(false);
          setProgress(100);
          setVerdict(data.data.verdict);
          eventSource.close();
        }

        if (data.event === 'error') {
          setLoading(false);
          setError(data.message);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setLoading(false);
        setError('Connection to server lost');
        eventSource.close();
      };

    } catch (err: any) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>TruthCast</h1>
          <p className={styles.subtitle}>
            Autonomous AI Fact-Checking with Immutable Blockchain Provenance
          </p>
          <nav style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/history" style={{ color: 'white', opacity: 0.9, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>History</a>
            <span style={{ color: 'white', opacity: 0.5' }}>•</span>
            <a href="/explorer" style={{ color: 'white', opacity: 0.9, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Ledger</a>
          </nav>
        </header>

        {stats ? (
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#667eea' }}>{stats.total}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Claims Verified</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444' }}>{stats.caught}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>False Claims Caught</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#764ba2' }}>{stats.unique_claims}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Unique Claims in Ledger</div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
          }}>
            <div style={{ width: '80px', height: '60px', background: '#f3f4f6', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '80px', height: '60px', background: '#f3f4f6', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '80px', height: '60px', background: '#f3f4f6', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            className={styles.input}
            placeholder="Paste a claim, article URL, tweet, or YouTube video to fact-check..."
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            disabled={loading}
            rows={4}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={loading || !claim.trim()}
          >
            {loading ? 'Checking...' : 'Check Claim'}
          </button>
        </form>

        {loading && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.progressText}>
              {progress}% - {currentStage}
            </p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {verdict && <VerdictCard verdict={verdict} />}
      </div>
    </main>
  );
}

function VerdictCard({ verdict }: { verdict: Verdict }) {
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
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <a
            href={`/verdict/${verdict.claim_hash}`}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Share Verdict
          </a>
        </div>
      </div>
    </div>
  );
}
