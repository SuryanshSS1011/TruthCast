'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Skeleton,
  alpha,
  Collapse,
} from '@mui/material';
import { Visibility, OpenInNew, ExpandMore, ExpandLess } from '@mui/icons-material';
import { COLORS, getVerdictColors } from '@/theme/theme';
import Navbar from '@/components/mui/Navbar';
import type { VerdictLabelType } from '@truthcast/shared/schema';

interface VerdictRow {
  claim_hash: string;
  claim_text: string;
  verdict_label: string;
  confidence: number;
  checked_at: number;
  tx_hash: string | null;
  reasoning?: string;
}

const VERDICT_FILTERS = [
  'ALL',
  'TRUE',
  'MOSTLY_TRUE',
  'MISLEADING',
  'MOSTLY_FALSE',
  'FALSE',
  'CONFLICTING',
  'UNVERIFIABLE',
] as const;

function getRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

function VerdictRowItem({ verdict, expanded, onToggle }: { verdict: VerdictRow; expanded: boolean; onToggle: () => void }) {
  const colors = getVerdictColors(verdict.verdict_label as VerdictLabelType);

  return (
    <>
      <TableRow
        onClick={onToggle}
        sx={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: alpha(COLORS.bg.elevated, 0.5) },
          transition: 'background-color 0.2s ease',
        }}
      >
        {/* Verdict Badge */}
        <TableCell sx={{ py: 2, borderBottom: expanded ? 'none' : undefined }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: colors.fg,
                mr: 1,
              }}
            />
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.625rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: colors.fg,
                textTransform: 'uppercase',
              }}
            >
              {verdict.verdict_label.replace(/_/g, ' ')}
            </Typography>
          </Box>
        </TableCell>

        {/* Claim Text */}
        <TableCell sx={{ py: 2, borderBottom: expanded ? 'none' : undefined }}>
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              color: COLORS.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 400,
            }}
          >
            {verdict.claim_text}
          </Typography>
        </TableCell>

        {/* Confidence */}
        <TableCell sx={{ py: 2, borderBottom: expanded ? 'none' : undefined }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: colors.fg,
                minWidth: 36,
              }}
            >
              {verdict.confidence}%
            </Typography>
            <Box sx={{ width: 50 }}>
              <LinearProgress
                variant="determinate"
                value={verdict.confidence}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: alpha(COLORS.bg.border, 0.5),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: colors.fg,
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </Box>
        </TableCell>

        {/* Time */}
        <TableCell sx={{ py: 2, borderBottom: expanded ? 'none' : undefined }}>
          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.75rem',
              color: COLORS.text.muted,
            }}
          >
            {getRelativeTime(verdict.checked_at)}
          </Typography>
        </TableCell>

        {/* Links */}
        <TableCell sx={{ py: 2, borderBottom: expanded ? 'none' : undefined }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              component={Link}
              href={`/verdict/${verdict.claim_hash}`}
              size="small"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              sx={{
                color: COLORS.text.muted,
                '&:hover': { color: COLORS.green.primary, backgroundColor: alpha(COLORS.green.primary, 0.1) },
              }}
            >
              <Visibility sx={{ fontSize: 18 }} />
            </IconButton>
            {verdict.tx_hash && (
              <IconButton
                component="a"
                href={`https://explorer.solana.com/tx/${verdict.tx_hash}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                sx={{
                  color: COLORS.text.muted,
                  '&:hover': { color: COLORS.green.primary, backgroundColor: alpha(COLORS.green.primary, 0.1) },
                }}
              >
                <OpenInNew sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        </TableCell>
      </TableRow>

      {/* Expanded reasoning row */}
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, borderBottom: `1px solid ${COLORS.bg.border}` }}>
          <Collapse in={expanded}>
            <Box
              sx={{
                py: 2,
                px: 2,
                backgroundColor: alpha(COLORS.bg.elevated, 0.3),
                borderTop: `1px solid ${alpha(COLORS.bg.border, 0.5)}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: COLORS.text.secondary,
                  mb: 2,
                }}
              >
                {verdict.reasoning || 'View full verdict for detailed reasoning.'}
              </Typography>
              <Box
                component={Link}
                href={`/verdict/${verdict.claim_hash}`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: COLORS.green.primary,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                View Full Verdict
                <OpenInNew sx={{ fontSize: 12 }} />
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<string>('ALL');
  const [verdicts, setVerdicts] = useState<VerdictRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        if (response.ok) {
          const data = await response.json();
          setVerdicts(data.verdicts || []);
          setTotalCount(data.totalCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredVerdicts = filter === 'ALL'
    ? verdicts
    : verdicts.filter((v) => v.verdict_label === filter);

  const toggleRow = (claimHash: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(claimHash)) {
        next.delete(claimHash);
      } else {
        next.add(claimHash);
      }
      return next;
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: COLORS.bg.base }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 3, mb: 1 }}>
            <Typography
              sx={{
                fontFamily: "'Lora', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '2.5rem',
                fontWeight: 400,
                color: COLORS.text.primary,
              }}
            >
              Truth Ledger
            </Typography>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '1.5rem',
                fontWeight: 500,
                color: COLORS.green.text,
              }}
            >
              {totalCount}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.625rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: COLORS.text.muted,
            }}
          >
            Immutable record of verified claims
          </Typography>
        </Box>

        {/* Filter Pills */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 4,
            flexWrap: 'wrap',
          }}
        >
          {VERDICT_FILTERS.map((label) => {
            const isActive = filter === label;
            const colors = label !== 'ALL' ? getVerdictColors(label as VerdictLabelType) : null;

            return (
              <Chip
                key={label}
                label={label.replace(/_/g, ' ')}
                onClick={() => setFilter(label)}
                sx={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: '16px',
                  height: 32,
                  transition: 'all 0.2s ease',
                  ...(isActive && colors
                    ? {
                        backgroundColor: alpha(colors.bg, 0.8),
                        border: `1px solid ${colors.border}`,
                        color: colors.fg,
                        '&:hover': {
                          backgroundColor: colors.bg,
                        },
                      }
                    : isActive
                    ? {
                        backgroundColor: COLORS.bg.elevated,
                        border: `1px solid ${COLORS.bg.border}`,
                        color: COLORS.text.primary,
                        '&:hover': {
                          backgroundColor: COLORS.bg.elevated,
                        },
                      }
                    : {
                        backgroundColor: 'transparent',
                        border: `1px solid ${COLORS.bg.border}`,
                        color: COLORS.text.muted,
                        '&:hover': {
                          backgroundColor: alpha(COLORS.bg.border, 0.3),
                          color: COLORS.text.secondary,
                        },
                      }),
                }}
              />
            );
          })}
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={60}
                sx={{ borderRadius: 1, backgroundColor: alpha(COLORS.bg.border, 0.3) }}
              />
            ))}
          </Box>
        ) : filteredVerdicts.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 12,
              color: COLORS.text.muted,
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, opacity: 0.5 }}>
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Typography
              sx={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.875rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              No verdicts found
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                color: COLORS.text.secondary,
              }}
            >
              {filter === 'ALL'
                ? 'Check your first claim to see it here'
                : `No ${filter.replace(/_/g, ' ').toLowerCase()} verdicts yet`}
            </Typography>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              backgroundColor: alpha(COLORS.bg.surface, 0.5),
              border: `1px solid ${COLORS.bg.border}`,
              borderRadius: 2,
              boxShadow: 'none',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: COLORS.text.muted,
                      borderBottom: `1px solid ${COLORS.bg.border}`,
                      backgroundColor: alpha(COLORS.bg.elevated, 0.5),
                      width: 140,
                    }}
                  >
                    Verdict
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: COLORS.text.muted,
                      borderBottom: `1px solid ${COLORS.bg.border}`,
                      backgroundColor: alpha(COLORS.bg.elevated, 0.5),
                    }}
                  >
                    Claim
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: COLORS.text.muted,
                      borderBottom: `1px solid ${COLORS.bg.border}`,
                      backgroundColor: alpha(COLORS.bg.elevated, 0.5),
                      width: 130,
                    }}
                  >
                    Confidence
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: COLORS.text.muted,
                      borderBottom: `1px solid ${COLORS.bg.border}`,
                      backgroundColor: alpha(COLORS.bg.elevated, 0.5),
                      width: 100,
                    }}
                  >
                    Checked
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.625rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: COLORS.text.muted,
                      borderBottom: `1px solid ${COLORS.bg.border}`,
                      backgroundColor: alpha(COLORS.bg.elevated, 0.5),
                      width: 80,
                    }}
                  >
                    Links
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVerdicts.map((verdict) => (
                  <VerdictRowItem
                    key={verdict.claim_hash}
                    verdict={verdict}
                    expanded={expandedRows.has(verdict.claim_hash)}
                    onToggle={() => toggleRow(verdict.claim_hash)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
}
