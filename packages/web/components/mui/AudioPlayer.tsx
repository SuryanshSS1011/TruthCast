'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, IconButton, Typography, alpha } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';
import { COLORS, getVerdictColors } from '@/theme/theme';
import type { VerdictLabelType } from '@truthcast/shared/schema';

interface AudioPlayerProps {
  /** Audio source (base64 data URL or regular URL) */
  src: string | null | undefined;
  /** Verdict type (for accent color) */
  verdict: VerdictLabelType;
}

/**
 * MUI Audio Player - ElevenLabs TTS playback
 *
 * Features:
 * - Play/pause button with verdict color
 * - Waveform visualization (animated bars)
 * - Time display: current / duration
 */
export default function AudioPlayer({ src, verdict }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const colors = getVerdictColors(verdict);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  }, [isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  if (!src) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          backgroundColor: alpha(COLORS.bg.elevated, 0.5),
          borderRadius: 1.5,
          border: `1px solid ${alpha(COLORS.bg.border, 0.7)}`,
        }}
      >
        <VolumeOff sx={{ fontSize: 20, color: COLORS.text.muted }} />
        <Typography
          sx={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.75rem',
            color: COLORS.text.muted,
            fontStyle: 'italic',
          }}
        >
          Audio unavailable
        </Typography>
      </Box>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        backgroundColor: alpha(COLORS.bg.elevated, 0.5),
        borderRadius: 1.5,
        border: `1px solid ${alpha(COLORS.bg.border, 0.7)}`,
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <IconButton
        onClick={togglePlay}
        disabled={!isLoaded}
        sx={{
          width: 40,
          height: 40,
          backgroundColor: alpha(colors.fg, 0.15),
          color: colors.fg,
          '&:hover': {
            backgroundColor: alpha(colors.fg, 0.25),
          },
          '&:disabled': {
            opacity: 0.5,
            color: COLORS.text.muted,
          },
        }}
      >
        {isPlaying ? (
          <Pause sx={{ fontSize: 20 }} />
        ) : (
          <PlayArrow sx={{ fontSize: 20 }} />
        )}
      </IconButton>

      {/* Waveform + progress */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Waveform bars */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: 24 }}>
          <WaveformBars isPlaying={isPlaying} progress={progress} color={colors.fg} />
        </Box>

        {/* Progress bar */}
        <Box
          sx={{
            height: 3,
            backgroundColor: alpha(COLORS.bg.border, 0.5),
            borderRadius: 1.5,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: colors.fg,
              boxShadow: `0 0 8px ${alpha(colors.fg, 0.5)}`,
              transition: 'width 0.1s linear',
            }}
          />
        </Box>
      </Box>

      {/* Time display */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography
          sx={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.6875rem',
            color: isPlaying ? colors.fg : COLORS.text.muted,
          }}
        >
          {formatTime(currentTime)}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.6875rem',
            color: COLORS.text.muted,
          }}
        >
          /
        </Typography>
        <Typography
          sx={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.6875rem',
            color: COLORS.text.muted,
          }}
        >
          {formatTime(duration)}
        </Typography>
      </Box>

      {/* Volume icon */}
      <VolumeUp sx={{ fontSize: 18, color: COLORS.text.muted }} />
    </Box>
  );
}

interface WaveformBarsProps {
  isPlaying: boolean;
  progress: number;
  color: string;
}

function WaveformBars({ isPlaying, progress, color }: WaveformBarsProps) {
  // Generate random heights for bars
  const [heights] = useState(() =>
    Array.from({ length: 20 }, () => 0.3 + Math.random() * 0.7)
  );

  return (
    <>
      {heights.map((height, i) => {
        const barProgress = (i / heights.length) * 100;
        const isPast = barProgress <= progress;

        return (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: `${height * 100}%`,
              backgroundColor: isPast ? color : alpha(color, 0.2),
              borderRadius: 0.5,
              transition: 'background-color 0.1s ease',
              animation: isPlaying && isPast ? 'waveform-pulse 0.5s ease-in-out infinite alternate' : 'none',
              animationDelay: `${i * 30}ms`,
              '@keyframes waveform-pulse': {
                '0%': { transform: 'scaleY(1)' },
                '100%': { transform: 'scaleY(0.7)' },
              },
            }}
          />
        );
      })}
    </>
  );
}
