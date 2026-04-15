'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, alpha, Slide } from '@mui/material';
import { Close, ErrorOutline, Warning, Info } from '@mui/icons-material';
import { COLORS } from '@/theme/theme';

export type ToastSeverity = 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  severity: ToastSeverity;
  title: string;
  message: string;
  details?: string;
}

interface ErrorToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const severityConfig = {
  error: {
    icon: ErrorOutline,
    fg: COLORS.verdict.FALSE.fg,
    bg: COLORS.verdict.FALSE.bg,
    border: COLORS.verdict.FALSE.border,
  },
  warning: {
    icon: Warning,
    fg: COLORS.verdict.MISLEADING.fg,
    bg: COLORS.verdict.MISLEADING.bg,
    border: COLORS.verdict.MISLEADING.border,
  },
  info: {
    icon: Info,
    fg: COLORS.verdict.CONFLICTING.fg,
    bg: COLORS.verdict.CONFLICTING.bg,
    border: COLORS.verdict.CONFLICTING.border,
  },
};

function ErrorToast({ toast, onClose }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = severityConfig[toast.severity];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, 8000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <Slide direction="left" in={isVisible} mountOnEnter unmountOnExit>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          p: 2,
          mb: 2,
          minWidth: 340,
          maxWidth: 420,
          backgroundColor: alpha(config.bg, 0.95),
          border: `1px solid ${config.border}`,
          borderLeft: `4px solid ${config.fg}`,
          borderRadius: 1,
          boxShadow: `0 4px 20px ${alpha('#000', 0.4)}, 0 0 30px ${alpha(config.fg, 0.15)}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Icon */}
        <Icon
          sx={{
            fontSize: 24,
            color: config.fg,
            mt: 0.25,
            filter: `drop-shadow(0 0 6px ${alpha(config.fg, 0.5)})`,
          }}
        />

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: config.fg,
              mb: 0.5,
            }}
          >
            {toast.title}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              color: COLORS.text.primary,
            }}
          >
            {toast.message}
          </Typography>
          {toast.details && (
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.6875rem',
                lineHeight: 1.4,
                color: COLORS.text.muted,
                mt: 1,
                p: 1,
                backgroundColor: alpha(COLORS.bg.base, 0.5),
                borderRadius: 0.5,
                wordBreak: 'break-word',
              }}
            >
              {toast.details}
            </Typography>
          )}
        </Box>

        {/* Close button */}
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: COLORS.text.muted,
            p: 0.5,
            '&:hover': {
              color: config.fg,
              backgroundColor: alpha(config.fg, 0.1),
            },
          }}
        >
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Slide>
  );
}

// Toast Container and Context
interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showApiError: (error: string, details?: string) => void;
  showTokenLimitError: () => void;
}

import { createContext, useContext, ReactNode } from 'react';

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const showApiError = useCallback((error: string, details?: string) => {
    console.error('[TruthCast API Error]', error, details);
    showToast({
      severity: 'error',
      title: 'API Error',
      message: error,
      details,
    });
  }, [showToast]);

  const showTokenLimitError = useCallback(() => {
    console.error('[TruthCast] API token usage limit reached');
    showToast({
      severity: 'warning',
      title: 'Token Limit Reached',
      message: 'The AI service has reached its usage limit. Please try again later or contact support.',
      details: 'Error code: RESOURCE_EXHAUSTED / 429',
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showApiError, showTokenLimitError }}>
      {children}
      {/* Toast container */}
      <Box
        sx={{
          position: 'fixed',
          top: 80,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map((toast) => (
          <ErrorToast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </Box>
    </ToastContext.Provider>
  );
}

export default ErrorToast;
