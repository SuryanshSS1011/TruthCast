'use client';

import { Box, Typography, LinearProgress, alpha } from '@mui/material';
import { Check, RadioButtonUnchecked } from '@mui/icons-material';
import { COLORS } from '@/theme/theme';

const STAGES = [
  { id: 'ingestion', name: 'INGESTION', label: 'Analyzing claim structure...' },
  { id: 'decomposition', name: 'DECOMPOSITION', label: 'Extracting atomic claims...' },
  { id: 'researcher', name: 'RESEARCHER', label: 'Gathering evidence...' },
  { id: 'debate', name: 'DEBATE', label: 'Adversarial analysis...' },
  { id: 'moderator', name: 'MODERATOR', label: 'Synthesizing verdict...' },
  { id: 'publisher', name: 'PUBLISHER', label: 'Writing to blockchain...' },
];

interface PipelineProgressProps {
  currentStage: string;
  progress: number;
  message: string;
}

export default function PipelineProgress({ currentStage, progress, message }: PipelineProgressProps) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <Box
      sx={{
        backgroundColor: COLORS.bg.surface,
        border: `1px solid ${COLORS.bg.border}`,
        borderRadius: 1,
        p: 3,
        animation: 'slide-down 0.3s ease-out',
        '@keyframes slide-down': {
          from: { opacity: 0, transform: 'translateY(-12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          mb: 3,
          height: 2,
        }}
      />

      {/* Stages */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <Box
              key={stage.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                opacity: isPending ? 0.4 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              {/* Status icon */}
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isCompleted ? (
                  <Check
                    sx={{
                      fontSize: 16,
                      color: COLORS.green.primary,
                    }}
                  />
                ) : isActive ? (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: COLORS.green.primary,
                      boxShadow: `0 0 8px ${COLORS.green.primary}`,
                      animation: 'pulse-green 1s ease-in-out infinite',
                      '@keyframes pulse-green': {
                        '0%, 100%': {
                          opacity: 1,
                          transform: 'scale(1)',
                          boxShadow: `0 0 0 0 ${alpha(COLORS.green.primary, 0.4)}`,
                        },
                        '50%': {
                          opacity: 0.9,
                          transform: 'scale(1.15)',
                          boxShadow: `0 0 0 4px ${alpha(COLORS.green.primary, 0)}`,
                        },
                      },
                    }}
                  />
                ) : (
                  <RadioButtonUnchecked
                    sx={{
                      fontSize: 14,
                      color: COLORS.text.muted,
                    }}
                  />
                )}
              </Box>

              {/* Stage name */}
              <Typography
                sx={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.1em',
                  color: isActive ? COLORS.text.primary : COLORS.text.secondary,
                  minWidth: 120,
                }}
              >
                {stage.name}
              </Typography>

              {/* Label */}
              <Typography
                sx={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '0.8125rem',
                  color: COLORS.text.muted,
                  flex: 1,
                }}
              >
                {isActive ? message || stage.label : isCompleted ? 'Complete' : stage.label}
              </Typography>

              {/* Progress dot */}
              {isCompleted && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: COLORS.green.primary,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
