'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Chip, CircularProgress, alpha } from '@mui/material';
import { COLORS } from '@/theme/theme';

const EXAMPLES = [
  { text: "The moon landing was faked", verdict: "FALSE" },
  { text: "Water boils at 100°C at sea level", verdict: "TRUE" },
  { text: "COVID vaccines contain microchips", verdict: "FALSE" },
];

interface ClaimInputProps {
  onSubmit: (claim: string) => void;
  isLoading: boolean;
}

export default function ClaimInput({ onSubmit, isLoading }: ClaimInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
    }
  };

  const handleExample = (text: string) => {
    setValue(text);
    inputRef.current?.focus();
    // Auto-submit after a brief delay
    setTimeout(() => {
      onSubmit(text);
    }, 100);
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, isLoading]);

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', px: 2 }}>
      {/* Input container */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          position: 'relative',
          mb: 4,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            backgroundColor: COLORS.bg.elevated,
            borderRadius: 1,
            border: `1px solid ${isFocused ? COLORS.green.primary : COLORS.bg.borderStrong}`,
            boxShadow: isFocused
              ? `0 0 0 3px ${alpha(COLORS.green.primary, 0.12)}, 0 0 20px ${alpha(COLORS.green.primary, 0.08)}`
              : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            placeholder="Paste a claim, URL, tweet, or YouTube video..."
            style={{
              width: '100%',
              height: 64,
              padding: '0 140px 0 20px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: "'Lora', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '1rem',
              color: COLORS.text.primary,
            }}
          />

          {/* Submit button */}
          <Button
            type="submit"
            variant="contained"
            disabled={!value.trim() || isLoading}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 100,
              height: 44,
              fontSize: '0.75rem',
            }}
          >
            {isLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              'CHECK →'
            )}
          </Button>
        </Box>

        {/* Keyboard hint */}
        {isFocused && value.trim() && (
          <Typography
            sx={{
              position: 'absolute',
              right: 120,
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.625rem',
              color: COLORS.text.muted,
            }}
          >
            ↵ to check
          </Typography>
        )}
      </Box>

      {/* Example chips */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          sx={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.625rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: COLORS.text.muted,
            mb: 2,
          }}
        >
          Try an example
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 1.5,
          }}
        >
          {EXAMPLES.map((ex, i) => {
            const isTrue = ex.verdict === 'TRUE';
            const dotColor = isTrue ? COLORS.verdict.TRUE.fg : COLORS.verdict.FALSE.fg;

            return (
              <Chip
                key={i}
                onClick={() => handleExample(ex.text)}
                disabled={isLoading}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: dotColor,
                      }}
                    >
                      {ex.verdict}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '0.6875rem',
                        color: COLORS.text.muted,
                      }}
                    >
                      ·
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '0.6875rem',
                        color: COLORS.text.secondary,
                      }}
                    >
                      {ex.text}
                    </Typography>
                  </Box>
                }
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
