// packages/pipeline/db/init.ts
import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { VerdictSchema, type Verdict } from "@truthcast/shared/schema";
import { TTL_POLICIES } from "@truthcast/shared/constants";

// Schema inlined to avoid file read issues with webpack bundling
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS verdicts (
  claim_hash TEXT PRIMARY KEY,
  claim_text TEXT NOT NULL,
  verdict_json TEXT NOT NULL,
  verdict_label TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  tx_hash TEXT,
  checked_at INTEGER NOT NULL,
  ttl_policy TEXT NOT NULL,
  pipeline_version TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checked_at ON verdicts (checked_at);
CREATE INDEX IF NOT EXISTS idx_verdict_label ON verdicts (verdict_label);
`;

// Resolve database path - works in both direct Node.js and Next.js bundled environments
function resolveDbPath(): string {
  // 1. Check explicit env var first (highest priority)
  if (process.env.SQLITE_PATH) {
    return process.env.SQLITE_PATH;
  }

  // 2. Use process.cwd() which is the project root when running npm scripts
  const cwd = process.cwd();

  // If running from packages/web (Next.js), go up one level
  if (cwd.endsWith('/packages/web')) {
    return join(cwd, '../pipeline/db/truthcast.db');
  }

  // If running from project root
  return join(cwd, 'packages/pipeline/db/truthcast.db');
}

const dbPath = resolveDbPath();

// Ensure directory exists
const dbDir = join(dbPath, '..');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Run schema
db.exec(SCHEMA_SQL);

// Stage 0: Cache lookup function
export function getCachedVerdict(claimHash: string): Verdict | null {
  const row = db
    .prepare(
      "SELECT verdict_json, checked_at, ttl_policy FROM verdicts WHERE claim_hash = ?"
    )
    .get(claimHash) as any;

  if (!row) return null;

  // TTL check for time-sensitive claims
  const ageSeconds = Math.floor(Date.now() / 1000) - row.checked_at;
  const ttlMap = {
    SHORT: TTL_POLICIES.SHORT,
    LONG: TTL_POLICIES.LONG,
    STATIC: TTL_POLICIES.STATIC,
  };

  if (ageSeconds > ttlMap[row.ttl_policy as keyof typeof ttlMap]) return null;

  return VerdictSchema.parse(JSON.parse(row.verdict_json));
}

// Stage 5: Write function
export function writeVerdict(verdict: Verdict, txHash: string | null): void {
  db.prepare(
    `
    INSERT OR REPLACE INTO verdicts
    (claim_hash, claim_text, verdict_json, verdict_label, confidence,
     tx_hash, checked_at, ttl_policy, pipeline_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    verdict.claim_hash,
    verdict.claim_text,
    JSON.stringify(verdict),
    verdict.verdict,
    verdict.confidence,
    txHash,
    verdict.checked_at,
    verdict.ttl_policy,
    verdict.pipeline_version
  );
}
