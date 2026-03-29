'use client';

import { Box, Typography, alpha } from '@mui/material';
import { COLORS } from '@/theme/theme';

interface Stats {
  total: number;
  caught: number;
  unique_claims: number;
}

interface HeroSectionProps {
  stats: Stats | null;
}

export default function HeroSection({ stats }: HeroSectionProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        pt: 4,
        pb: 6,
      }}
    >
      {/* Eyebrow */}
      <Typography
        sx={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.6875rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: COLORS.text.muted,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="span"
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: COLORS.green.primary,
            boxShadow: `0 0 6px ${COLORS.green.primary}`,
          }}
        />
        AI Fact-Checking
        <Box
          component="span"
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: COLORS.green.primary,
            boxShadow: `0 0 6px ${COLORS.green.primary}`,
          }}
        />
        Blockchain Verified
        <Box
          component="span"
          sx={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: COLORS.green.primary,
            boxShadow: `0 0 6px ${COLORS.green.primary}`,
          }}
        />
      </Typography>

      {/* Main headline */}
      <Typography
        variant="h1"
        sx={{
          mb: 2,
        }}
      >
        The truth,
        <br />
        <Box
          component="span"
          sx={{
            color: COLORS.green.primary,
            textShadow: `0 0 40px ${alpha(COLORS.green.primary, 0.4)}`,
          }}
        >
          verified.
        </Box>
      </Typography>

      {/* Subheadline */}
      <Typography
        variant="h3"
        sx={{
          maxWidth: 540,
          mx: 'auto',
          mb: 5,
        }}
      >
        Autonomous AI fact-checking with immutable Solana provenance.
      </Typography>

      {/* Stats bar */}
      {stats && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '1.5rem',
                fontWeight: 500,
                color: COLORS.green.text,
              }}
            >
              {stats.total.toLocaleString()}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.text.muted,
                mt: 0.5,
              }}
            >
              claims verified
            </Typography>
          </Box>

          <Box
            sx={{
              width: '1px',
              height: 32,
              backgroundColor: COLORS.bg.border,
              flexShrink: 0,
            }}
          />

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '1.5rem',
                fontWeight: 500,
                color: COLORS.verdict.FALSE.fg,
              }}
            >
              {stats.caught}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.text.muted,
                mt: 0.5,
              }}
            >
              false caught
            </Typography>
          </Box>

          <Box
            sx={{
              width: '1px',
              height: 32,
              backgroundColor: COLORS.bg.border,
              flexShrink: 0,
            }}
          />

          <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <polygon
                  points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"
                  stroke={COLORS.green.primary}
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              <Typography
                sx={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: COLORS.green.text,
                }}
              >
                LIVE
              </Typography>
            </Box>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.text.muted,
                mt: 0.5,
              }}
            >
              Solana ledger
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
