'use client';

import { createTheme, alpha } from '@mui/material/styles';

export const COLORS = {
  // Backgrounds — layered depth, not pure black
  bg: {
    base: '#0A0C0F',
    surface: '#0F1318',
    elevated: '#141920',
    border: '#1E2530',
    borderStrong: '#2A3340',
  },

  // Greens — primary accent, sophisticated not electric
  green: {
    primary: '#00C896',
    dim: '#00A077',
    muted: '#00C89622',
    text: '#4DFFCC',
  },

  // Verdict semantic colors
  verdict: {
    TRUE:          { fg: '#4ADE80', bg: '#052010', border: '#166534' },
    MOSTLY_TRUE:   { fg: '#86EFAC', bg: '#031A0C', border: '#14532D' },
    MISLEADING:    { fg: '#FCD34D', bg: '#1A1200', border: '#92400E' },
    MOSTLY_FALSE:  { fg: '#FB923C', bg: '#1A0A00', border: '#9A3412' },
    FALSE:         { fg: '#F87171', bg: '#1A0404', border: '#991B1B' },
    CONFLICTING:   { fg: '#A78BFA', bg: '#0D0A1A', border: '#5B21B6' },
    UNVERIFIABLE:  { fg: '#94A3B8', bg: '#0F1118', border: '#334155' },
  },

  // Source tier badges
  tier: {
    A: { fg: '#4ADE80', bg: '#05200F' },
    B: { fg: '#93C5FD', bg: '#040F1A' },
    C: { fg: '#FCD34D', bg: '#1A1000' },
    UNKNOWN: { fg: '#64748B', bg: '#0F1118' },
  },

  // Text hierarchy
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#475569',
    accent: '#00C896',
  },
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: COLORS.bg.base,
      paper: COLORS.bg.surface,
    },
    primary: {
      main: COLORS.green.primary,
      dark: COLORS.green.dim,
      contrastText: COLORS.bg.base,
    },
    text: {
      primary: COLORS.text.primary,
      secondary: COLORS.text.secondary,
      disabled: COLORS.text.muted,
    },
    divider: COLORS.bg.border,
  },

  typography: {
    fontFamily: "'DM Mono', 'Courier New', monospace",

    h1: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 700,
      fontSize: 'clamp(2.5rem, 6vw, 5rem)',
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      color: COLORS.text.primary,
    },
    h2: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 700,
      fontSize: 'clamp(1.75rem, 4vw, 3rem)',
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: "'Lora', Georgia, serif",
      fontWeight: 400,
      fontStyle: 'italic',
      fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
      color: COLORS.text.secondary,
    },
    h4: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 700,
      fontSize: '1.25rem',
    },
    body1: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '0.875rem',
      lineHeight: 1.7,
      color: COLORS.text.secondary,
    },
    body2: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '0.75rem',
      color: COLORS.text.muted,
    },
    caption: {
      fontFamily: "'DM Mono', monospace",
      fontSize: '0.6875rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      color: COLORS.text.muted,
    },
    button: {
      fontFamily: "'DM Mono', monospace",
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
  },

  shape: {
    borderRadius: 4,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: COLORS.bg.base,
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${alpha(COLORS.green.primary, 0.06)} 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 100%, ${alpha('#1E3A5F', 0.3)} 0%, transparent 60%)
          `,
          backgroundAttachment: 'fixed',
          scrollbarWidth: 'thin',
          scrollbarColor: `${COLORS.bg.borderStrong} transparent`,
        },
        '::selection': {
          backgroundColor: alpha(COLORS.green.primary, 0.25),
          color: COLORS.text.primary,
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '10px 24px',
          transition: 'all 0.15s ease',
        },
        contained: {
          backgroundColor: COLORS.green.primary,
          color: COLORS.bg.base,
          fontWeight: 700,
          boxShadow: `0 0 20px ${alpha(COLORS.green.primary, 0.25)}`,
          '&:hover': {
            backgroundColor: COLORS.green.dim,
            boxShadow: `0 0 30px ${alpha(COLORS.green.primary, 0.4)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          borderColor: COLORS.bg.borderStrong,
          color: COLORS.text.secondary,
          '&:hover': {
            borderColor: COLORS.green.primary,
            color: COLORS.green.primary,
            backgroundColor: alpha(COLORS.green.primary, 0.05),
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: COLORS.bg.elevated,
            fontFamily: "'DM Mono', monospace",
            fontSize: '1rem',
            borderRadius: 4,
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: COLORS.bg.borderStrong,
              transition: 'border-color 0.2s ease',
            },
            '&:hover fieldset': {
              borderColor: COLORS.green.dim,
            },
            '&.Mui-focused fieldset': {
              borderColor: COLORS.green.primary,
              borderWidth: 1,
              boxShadow: `0 0 0 3px ${alpha(COLORS.green.primary, 0.12)}, 0 0 20px ${alpha(COLORS.green.primary, 0.08)}`,
            },
            '& input': {
              color: COLORS.text.primary,
              '&::placeholder': {
                color: COLORS.text.muted,
                fontStyle: 'italic',
              },
            },
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.6875rem',
          letterSpacing: '0.05em',
          borderRadius: 3,
          height: 28,
          border: `1px solid ${COLORS.bg.borderStrong}`,
          backgroundColor: COLORS.bg.elevated,
          color: COLORS.text.secondary,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: COLORS.bg.borderStrong,
            borderColor: COLORS.green.primary,
            color: COLORS.text.primary,
            cursor: 'pointer',
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.bg.border,
          borderRadius: 2,
          height: 2,
        },
        bar: {
          backgroundColor: COLORS.green.primary,
          boxShadow: `0 0 8px ${alpha(COLORS.green.primary, 0.6)}`,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: COLORS.bg.border,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: COLORS.bg.surface,
          border: `1px solid ${COLORS.bg.border}`,
        },
        elevation1: {
          boxShadow: `0 1px 3px ${alpha('#000', 0.4)}, 0 1px 2px ${alpha('#000', 0.3)}`,
        },
        elevation2: {
          boxShadow: `0 4px 6px ${alpha('#000', 0.4)}, 0 2px 4px ${alpha('#000', 0.3)}`,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLORS.bg.elevated,
          border: `1px solid ${COLORS.bg.borderStrong}`,
          color: COLORS.text.secondary,
          fontFamily: "'DM Mono', monospace",
          fontSize: '0.6875rem',
        },
      },
    },
  },
});

export type VerdictLabel = keyof typeof COLORS.verdict;

export function getVerdictColors(verdict: string) {
  const key = verdict.toUpperCase().replace(/ /g, '_') as VerdictLabel;
  return COLORS.verdict[key] || COLORS.verdict.UNVERIFIABLE;
}
