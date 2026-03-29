'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, alpha } from '@mui/material';
import type { Verdict } from '@truthcast/shared/schema';
import { COLORS } from '@/theme/theme';

import Navbar from '@/components/mui/Navbar';
import HeroSection from '@/components/mui/HeroSection';
import ClaimInput from '@/components/mui/ClaimInput';
import PipelineProgress from '@/components/mui/PipelineProgress';
import VerdictCard from '@/components/mui/VerdictCard';

interface Stats {
  total: number;
  caught: number;
  unique_claims: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [message, setMessage] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState('');

  // Fetch stats on mount and poll every 30s
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (claim: string) => {
    setIsLoading(true);
    setProgress(0);
    setCurrentStage('ingestion');
    setMessage('Starting...');
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
          setMessage(data.message);
          // Extract stage from message
          const stageMatch = data.message.match(/Stage \d+: (\w+)/i);
          if (stageMatch) {
            setCurrentStage(stageMatch[1].toLowerCase());
          }
        }

        if (data.event === 'complete') {
          setIsLoading(false);
          setProgress(100);
          setVerdict(data.data.verdict);
          eventSource.close();
          // Refresh stats
          fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
        }

        if (data.event === 'error') {
          setIsLoading(false);
          setError(data.message);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setIsLoading(false);
        setError('Connection to server lost');
        eventSource.close();
      };
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  const handleReset = () => {
    setVerdict(null);
    setError('');
    setProgress(0);
    setCurrentStage('');
    setMessage('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: COLORS.bg.base,
      }}
    >
      <Navbar />

      <Container
        maxWidth="md"
        sx={{
          pt: 12,
          pb: 8,
        }}
      >
        {/* Hero */}
        {!isLoading && !verdict && !error && (
          <>
            <HeroSection stats={stats} />
            <Box sx={{ mt: 6 }}>
              <ClaimInput onSubmit={handleSubmit} isLoading={isLoading} />
            </Box>
          </>
        )}

        {/* Loading state */}
        {isLoading && (
          <Box sx={{ mt: 8 }}>
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                mb: 4,
              }}
            >
              Verifying claim...
            </Typography>
            <PipelineProgress
              currentStage={currentStage}
              progress={progress}
              message={message}
            />
          </Box>
        )}

        {/* Error state */}
        {error && (
          <Box
            sx={{
              mt: 8,
              textAlign: 'center',
              p: 4,
              backgroundColor: alpha(COLORS.verdict.FALSE.fg, 0.1),
              border: `1px solid ${COLORS.verdict.FALSE.border}`,
              borderRadius: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.875rem',
                color: COLORS.verdict.FALSE.fg,
                mb: 3,
              }}
            >
              {error}
            </Typography>
            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{
                borderColor: COLORS.verdict.FALSE.border,
                color: COLORS.verdict.FALSE.fg,
                '&:hover': {
                  borderColor: COLORS.verdict.FALSE.fg,
                  backgroundColor: alpha(COLORS.verdict.FALSE.fg, 0.1),
                },
              }}
            >
              Try Again
            </Button>
          </Box>
        )}

        {/* Verdict state */}
        {verdict && (
          <Box sx={{ mt: 8 }}>
            <VerdictCard verdict={verdict} />

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                Check Another Claim
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
