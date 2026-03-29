'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, alpha } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import Link from 'next/link';
import { COLORS } from '@/theme/theme';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backdropFilter: 'blur(12px)',
        backgroundColor: alpha(COLORS.bg.base, 0.85),
        borderBottom: `1px solid ${scrolled ? COLORS.bg.border : 'transparent'}`,
        transition: 'border-color 0.3s ease',
        height: 56,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: 3,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Checkmark icon with glow */}
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: alpha(COLORS.green.primary, 0.15),
                border: `1.5px solid ${COLORS.green.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 12px ${alpha(COLORS.green.primary, 0.3)}`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12l5 5L20 7"
                  stroke={COLORS.green.primary}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
            <Typography
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: '1.125rem',
                color: COLORS.text.primary,
                letterSpacing: '-0.01em',
              }}
            >
              TruthCast
            </Typography>
          </Box>
        </Link>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Link href="/history" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.6875rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: COLORS.text.muted,
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: COLORS.text.secondary,
                },
              }}
            >
              History
            </Typography>
          </Link>
          <IconButton
            onClick={() => setIsDark(!isDark)}
            sx={{
              color: COLORS.text.muted,
              '&:hover': {
                color: COLORS.text.secondary,
                backgroundColor: alpha(COLORS.green.primary, 0.1),
              },
            }}
          >
            {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
