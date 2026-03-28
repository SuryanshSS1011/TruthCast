-- db/schema.sql (run once at startup via db/init.ts)

CREATE TABLE IF NOT EXISTS verdicts (
  claim_hash TEXT PRIMARY KEY,           -- SHA-256 hex of normalized claim
  claim_text TEXT NOT NULL,              -- Original normalized claim text
  verdict_json TEXT NOT NULL,            -- Full Verdict JSON (Zod-validated)
  verdict_label TEXT NOT NULL,           -- Denormalized for fast filtering
  confidence INTEGER NOT NULL,           -- 0-100
  tx_hash TEXT,                          -- Solana transaction signature (null if write failed)
  checked_at INTEGER NOT NULL,           -- Unix timestamp
  ttl_policy TEXT NOT NULL,              -- SHORT | LONG | STATIC
  pipeline_version TEXT NOT NULL         -- e.g. "2.0"
);

CREATE INDEX IF NOT EXISTS idx_checked_at ON verdicts (checked_at);
CREATE INDEX IF NOT EXISTS idx_verdict_label ON verdicts (verdict_label);
