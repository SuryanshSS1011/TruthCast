"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import type { VerdictLabelType } from "@truthcast/shared/schema";
import { tokens } from "@/lib/design-tokens";

export interface AudioPlayerProps {
  /** Audio source (base64 data URL or regular URL) */
  src: string | null | undefined;
  /** Verdict type (for accent color) */
  verdict: VerdictLabelType;
  /** Additional class names */
  className?: string;
}

/**
 * Audio Player - ElevenLabs TTS playback
 *
 * Specs from design doc:
 * - Play/pause circular button with verdict color
 * - Waveform visualization (animated bars)
 * - Time display: current / duration
 * - Keyboard accessible (Space to play/pause)
 */
export function AudioPlayer({ src, verdict, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const color = tokens.verdict[verdict]?.solid || tokens.verdict.UNVERIFIABLE.solid;

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3",
          "bg-[var(--bg-surface)] rounded-lg",
          "border border-[var(--border-subtle)]",
          className
        )}
      >
        <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
          <svg
            className="w-4 h-4 text-[var(--text-tertiary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 2v0M12 22v0M4.93 4.93l0 0M19.07 19.07l0 0M2 12h0M22 12h0M4.93 19.07l0 0M19.07 4.93l0 0" />
          </svg>
        </div>
        <span className="text-[12px] text-[var(--text-tertiary)] italic">
          Audio unavailable
        </span>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3",
        "bg-[var(--bg-surface)] rounded-lg",
        "border border-[var(--border-subtle)]",
        className
      )}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        disabled={!isLoaded}
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          !isLoaded && "opacity-50 cursor-not-allowed"
        )}
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.5-7.36a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86Z" />
          </svg>
        )}
      </button>

      {/* Waveform visualization */}
      <div className="flex-1 flex items-center gap-0.5 h-8">
        <WaveformBars
          isPlaying={isPlaying}
          progress={progress}
          color={color}
          barCount={24}
        />
      </div>

      {/* Time display */}
      <div className="flex-shrink-0 font-mono text-[11px] text-[var(--text-tertiary)]">
        <span style={{ color: isPlaying ? color : undefined }}>
          {formatTime(currentTime)}
        </span>
        <span className="mx-1">/</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

interface WaveformBarsProps {
  isPlaying: boolean;
  progress: number;
  color: string;
  barCount: number;
}

function WaveformBars({ isPlaying, progress, color, barCount }: WaveformBarsProps) {
  // Generate random heights for bars
  const [heights] = useState(() =>
    Array.from({ length: barCount }, () => 0.3 + Math.random() * 0.7)
  );

  return (
    <>
      {heights.map((height, i) => {
        const barProgress = (i / barCount) * 100;
        const isPast = barProgress <= progress;

        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-all duration-100",
              isPlaying && isPast && "animate-waveform-bar"
            )}
            style={{
              height: `${height * 100}%`,
              backgroundColor: isPast ? color : `${color}30`,
              animationDelay: isPlaying ? `${i * 50}ms` : undefined,
            }}
          />
        );
      })}
    </>
  );
}

export default AudioPlayer;
