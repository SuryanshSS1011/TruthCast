'use client';

import Link from 'next/link';
import { Box, Container, Typography, Button, Breadcrumbs, alpha } from '@mui/material';
import { ArrowBack, NavigateNext } from '@mui/icons-material';
import type { Verdict } from '@truthcast/shared/schema';
import { COLORS } from '@/theme/theme';
import Navbar from '@/components/mui/Navbar';
import VerdictCard from '@/components/mui/VerdictCard';

interface VerdictPageClientProps {
  verdict: Verdict;
}

export function VerdictPageClient({ verdict }: VerdictPageClientProps) {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: COLORS.bg.base }}>
      <Navbar />

      <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
        {/* Breadcrumb */}
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 14, color: COLORS.text.muted }} />}
          sx={{ mb: 4 }}
        >
          <Box
            component={Link}
            href="/"
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.text.muted,
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              '&:hover': { color: COLORS.text.primary },
            }}
          >
            Home
          </Box>
          <Box
            component={Link}
            href="/history"
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.text.muted,
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              '&:hover': { color: COLORS.text.primary },
            }}
          >
            History
          </Box>
          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              color: COLORS.text.secondary,
            }}
          >
            {verdict.claim_hash.substring(0, 8)}...
          </Typography>
        </Breadcrumbs>

        {/* Claim text header */}
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
            Claim Analyzed
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: '1.25rem',
              fontStyle: 'italic',
              lineHeight: 1.6,
              color: COLORS.text.primary,
            }}
          >
            "{verdict.claim_text}"
          </Typography>
        </Box>

        {/* Verdict card */}
        <VerdictCard verdict={verdict} />

        {/* Back button */}
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              borderColor: COLORS.bg.border,
              color: COLORS.text.secondary,
              '&:hover': {
                borderColor: COLORS.green.primary,
                color: COLORS.green.primary,
                backgroundColor: alpha(COLORS.green.primary, 0.05),
              },
            }}
          >
            Check Another Claim
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
