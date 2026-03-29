// packages/pipeline/db/init.ts
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { VerdictSchema, type Verdict } from "@truthcast/shared/schema";
import { TTL_POLICIES } from "@truthcast/shared/constants";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize database - use absolute path from project root
// Find the project root by going up from current directory
const projectRoot = join(__dirname, '../../..');
const dbPath = process.env.SQLITE_PATH || join(projectRoot, 'packages/pipeline/db/truthcast.db');
export const db = new Database(dbPath);

// Run schema
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

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
