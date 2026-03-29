'use client';

import { Box, Typography, Paper, LinearProgress, IconButton, Tooltip, Collapse, alpha, Chip } from '@mui/material';
import { ContentCopy, OpenInNew, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';
import { COLORS, getVerdictColors } from '@/theme/theme';
import VerdictBadge from './VerdictBadge';
import type { Verdict, Source } from '@truthcast/shared/schema';

interface VerdictCardProps {
  verdict: Verdict;
}

// Map tier names to display labels
const tierLabels: Record<string, string> = {
  TIER_1: 'T1',
  TIER_2: 'T2',
  TIER_3: 'T3',
  HIGH: 'HIGH',
  MEDIUM: 'MED',
  LOW: 'LOW',
  UNKNOWN: '—',
};

function SourceRow({ source }: { source: Source }) {
  const tierKey = source.domain_tier as keyof typeof COLORS.tier;
  const tierColors = COLORS.tier[tierKey] || COLORS.tier.UNKNOWN;
  const tierLabel = tierLabels[source.domain_tier] || '—';

  const stanceColor = source.stance === 'SUPPORTS'
    ? COLORS.verdict.TRUE.fg
    : source.stance === 'REFUTES'
      ? COLORS.verdict.FALSE.fg
      : COLORS.text.muted;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.5,
        borderBottom: `1px solid ${alpha(COLORS.bg.border, 0.5)}`,
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Tier pill */}
      <Box
        sx={{
          minWidth: 44,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(tierColors.bg, 0.8),
          borderRadius: '11px',
          border: `1px solid ${alpha(tierColors.fg, 0.4)}`,
          boxShadow: `0 0 8px ${alpha(tierColors.fg, 0.15)}`,
        }}
      >
        <Typography
          sx={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: tierColors.fg,
            textTransform: 'uppercase',
          }}
        >
          {tierLabel}
        </Typography>
      </Box>

      {/* Domain */}
      <Typography
        sx={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.8125rem',
          color: COLORS.text.secondary,
          flex: 1,
          letterSpacing: '0.02em',
        }}
      >
        {source.domain || new URL(source.url).hostname}
      </Typography>

      {/* Link icon */}
      <IconButton
        size="small"
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: COLORS.text.muted,
          '&:hover': {
            color: COLORS.green.primary,
            backgroundColor: alpha(COLORS.green.primary, 0.1),
          }
        }}
      >
        <OpenInNew sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

export default function VerdictCard({ verdict }: VerdictCardProps) {
  const [showMinority, setShowMinority] = useState(false);
  const colors = getVerdictColors(verdict.verdict);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/verdict/${verdict.claim_hash}`);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(verdict, null, 2));
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderLeft: `3px solid ${colors.fg}`,
        backgroundColor: alpha(colors.bg, 0.5),
        border: `1px solid ${colors.border}`,
        borderLeftWidth: 3,
        overflow: 'hidden',
        animation: 'verdict-rise 0.3s ease-out',
        '@keyframes verdict-rise': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Debate indicator */}
      {verdict.debate_triggered && (
        <Box
          sx={{
            px: 3,
            py: 1.5,
            backgroundColor: alpha(COLORS.verdict.MISLEADING.fg, 0.1),
            borderBottom: `1px solid ${COLORS.verdict.MISLEADING.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.6875rem',
              color: COLORS.verdict.MISLEADING.fg,
            }}
          >
            ⚑ ADVERSARIAL DEBATE TRIGGERED — conflicting evidence detected
          </Typography>
        </Box>
      )}

      <Box sx={{ p: 3 }}>
        {/* Top row: verdict + confidence */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <VerdictBadge verdict={verdict.verdict} size="large" />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '1.25rem',
                fontWeight: 500,
                color: colors.fg,
                textShadow: `0 0 20px ${alpha(colors.fg, 0.4)}`,
              }}
            >
              {verdict.confidence}%
            </Typography>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.text.muted,
              }}
            >
              Confidence
            </Typography>
            <Box sx={{ width: 120 }}>
              <LinearProgress
                variant="determinate"
                value={verdict.confidence}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(COLORS.bg.border, 0.5),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors.fg,
                    borderRadius: 3,
                    boxShadow: `0 0 12px ${alpha(colors.fg, 0.6)}`,
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Reasoning */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.625rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.text.muted,
              mb: 1.5,
            }}
          >
            Reasoning
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Lora', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '1.0625rem',
              lineHeight: 1.8,
              color: COLORS.text.primary,
            }}
          >
            {verdict.reasoning}
          </Typography>
        </Box>

        {/* Sources */}
        {verdict.sources && verdict.sources.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.text.muted,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              Sources
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 20,
                  height: 18,
                  px: 0.75,
                  borderRadius: '9px',
                  backgroundColor: alpha(COLORS.text.muted, 0.15),
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: COLORS.text.secondary,
                }}
              >
                {verdict.sources.length}
              </Box>
            </Typography>
            <Box
              sx={{
                backgroundColor: alpha(COLORS.bg.elevated, 0.5),
                borderRadius: 1.5,
                border: `1px solid ${alpha(COLORS.bg.border, 0.7)}`,
                px: 2.5,
                py: 1,
              }}
            >
              {verdict.sources.map((source, i) => (
                <SourceRow key={i} source={source} />
              ))}
            </Box>
          </Box>
        )}

        {/* Minority view */}
        {verdict.minority_view && (
          <Box sx={{ mb: 3 }}>
            <Box
              onClick={() => setShowMinority(!showMinority)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                py: 1,
                px: 1.5,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(COLORS.bg.border, 0.3),
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.625rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLORS.text.muted,
                }}
              >
                Minority View
              </Typography>
              {showMinority ? (
                <ExpandLess sx={{ fontSize: 18, color: COLORS.text.muted }} />
              ) : (
                <ExpandMore sx={{ fontSize: 18, color: COLORS.text.muted }} />
              )}
            </Box>
            <Collapse in={showMinority}>
              <Typography
                sx={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '0.9375rem',
                  lineHeight: 1.8,
                  color: COLORS.text.secondary,
                  mt: 1.5,
                  ml: 1.5,
                  pl: 2,
                  borderLeft: `2px solid ${alpha(COLORS.bg.border, 0.8)}`,
                }}
              >
                {verdict.minority_view}
              </Typography>
            </Collapse>
          </Box>
        )}
      </Box>

      {/* Blockchain ledger row */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          backgroundColor: alpha(COLORS.bg.elevated, 0.7),
          borderTop: `1px solid ${COLORS.bg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Solana hexagon icon with glow */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polygon
                points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"
                stroke={COLORS.green.primary}
                strokeWidth="1.5"
                fill="none"
                style={{ filter: `drop-shadow(0 0 4px ${COLORS.green.primary})` }}
              />
            </svg>
            {/* Live indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: COLORS.green.primary,
                  boxShadow: `0 0 8px ${COLORS.green.primary}`,
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography
                sx={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: COLORS.green.text,
                  textTransform: 'uppercase',
                }}
              >
                Verified
              </Typography>
            </Box>
          </Box>

          {/* Divider */}
          <Box
            sx={{
              width: '1px',
              height: 20,
              backgroundColor: COLORS.bg.border,
              mx: 0.5,
            }}
          />

          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.625rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.text.muted,
            }}
          >
            Solana Devnet
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Transaction hash pill */}
          {verdict.tx_hash && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: '12px',
                backgroundColor: alpha(COLORS.bg.border, 0.5),
                border: `1px solid ${COLORS.bg.border}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6875rem',
                  color: COLORS.text.muted,
                  letterSpacing: '0.02em',
                }}
              >
                {verdict.tx_hash.slice(0, 6)}...{verdict.tx_hash.slice(-4)}
              </Typography>
            </Box>
          )}

          {/* Copy link button */}
          <Tooltip title="Copy verdict link">
            <IconButton
              size="small"
              onClick={handleCopyLink}
              sx={{
                color: COLORS.text.muted,
                '&:hover': {
                  color: COLORS.green.primary,
                  backgroundColor: alpha(COLORS.green.primary, 0.1),
                },
              }}
            >
              <ContentCopy sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Explorer link */}
          {verdict.tx_hash && (
            <Box
              component="a"
              href={`https://explorer.solana.com/tx/${verdict.tx_hash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.75,
                borderRadius: '14px',
                backgroundColor: alpha(COLORS.green.primary, 0.1),
                border: `1px solid ${alpha(COLORS.green.primary, 0.3)}`,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(COLORS.green.primary, 0.2),
                  border: `1px solid ${alpha(COLORS.green.primary, 0.5)}`,
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  color: COLORS.green.primary,
                }}
              >
                Explorer
              </Typography>
              <OpenInNew sx={{ fontSize: 12, color: COLORS.green.primary }} />
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
