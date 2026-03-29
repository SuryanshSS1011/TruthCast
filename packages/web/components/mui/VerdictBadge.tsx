'use client';

import { Box, Typography } from '@mui/material';
import { getVerdictColors } from '@/theme/theme';

interface VerdictBadgeProps {
  verdict: string;
  size?: 'small' | 'medium' | 'large';
}

export default function VerdictBadge({ verdict, size = 'medium' }: VerdictBadgeProps) {
  const colors = getVerdictColors(verdict);

  const sizes = {
    small: { fontSize: '0.5625rem', px: 1, py: 0.25, minWidth: 60 },
    medium: { fontSize: '0.6875rem', px: 1.5, py: 0.5, minWidth: 80 },
    large: { fontSize: '0.75rem', px: 2, py: 0.75, minWidth: 100 },
  };

  const s = sizes[size];

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 0.5,
        minWidth: s.minWidth,
        px: s.px,
        py: s.py,
      }}
    >
      <Typography
        sx={{
          fontFamily: "'DM Mono', monospace",
          fontSize: s.fontSize,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: colors.fg,
        }}
      >
        {verdict.replace(/_/g, ' ')}
      </Typography>
    </Box>
  );
}
