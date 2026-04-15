// packages/pipeline/db/init.ts
// Hybrid database: Turso (serverless) + SQLite (local)

import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { VerdictSchema, type Verdict } from "@truthcast/shared/schema";
import { TTL_POLICIES } from "@truthcast/shared/constants";
import { createClient, type Client } from "@libsql/client";

// Schema for SQLite/Turso
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

// Database clients
let sqliteDb: any = null;
let tursoClient: Client | null = null;
let dbType: "turso" | "sqlite" | "none" = "none";

// Initialize database - prefer Turso on serverless, SQLite locally
async function initDatabase(): Promise<void> {
  // Try Turso first (for Vercel/serverless)
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    try {
      tursoClient = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      // Initialize schema
      await tursoClient.executeMultiple(SCHEMA_SQL);

      dbType = "turso";
      console.log("[TruthCast] Using Turso database");
      return;
    } catch (error: any) {
      console.warn("[TruthCast] Failed to initialize Turso:", error.message);
    }
  }

  // Skip SQLite on serverless environments without Turso
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log("[TruthCast] Serverless environment without Turso - no database");
    dbType = "none";
    return;
  }

  // Try SQLite for local development
  try {
    const Database = eval('require')("better-sqlite3");
    const dbPath = resolveDbPath();
    const dbDir = join(dbPath, "..");

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    sqliteDb = new Database(dbPath);
    sqliteDb.exec(SCHEMA_SQL);
    dbType = "sqlite";
    console.log("[TruthCast] Using SQLite database:", dbPath);
  } catch (error: any) {
    console.warn("[TruthCast] SQLite unavailable:", error.message);
    dbType = "none";
  }
}

function resolveDbPath(): string {
  if (process.env.SQLITE_PATH) return process.env.SQLITE_PATH;
  const cwd = process.cwd();
  if (cwd.endsWith("/packages/web")) {
    return join(cwd, "../pipeline/db/truthcast.db");
  }
  return join(cwd, "packages/pipeline/db/truthcast.db");
}

// Initialize on import
const initPromise = initDatabase();

// ============ DATABASE OPERATIONS ============

export async function getCachedVerdict(claimHash: string): Promise<Verdict | null> {
  await initPromise; // Ensure initialization is complete

  try {
    if (dbType === "turso" && tursoClient) {
      const result = await tursoClient.execute({
        sql: "SELECT verdict_json, checked_at, ttl_policy FROM verdicts WHERE claim_hash = ?",
        args: [claimHash],
      });

      if (!result.rows.length) return null;

      const row = result.rows[0];
      // TTL check
      const ageSeconds = Math.floor(Date.now() / 1000) - Number(row.checked_at);
      const ttl = TTL_POLICIES[row.ttl_policy as keyof typeof TTL_POLICIES];
      if (ageSeconds > ttl) return null;

      return VerdictSchema.parse(JSON.parse(row.verdict_json as string));
    }

    if (dbType === "sqlite" && sqliteDb) {
      const row = sqliteDb
        .prepare("SELECT verdict_json, checked_at, ttl_policy FROM verdicts WHERE claim_hash = ?")
        .get(claimHash) as any;

      if (!row) return null;

      // TTL check
      const ageSeconds = Math.floor(Date.now() / 1000) - row.checked_at;
      const ttl = TTL_POLICIES[row.ttl_policy as keyof typeof TTL_POLICIES];
      if (ageSeconds > ttl) return null;

      return VerdictSchema.parse(JSON.parse(row.verdict_json));
    }
  } catch (error) {
    console.error("[TruthCast] Database lookup error:", error);
  }
  return null;
}

export async function writeVerdict(verdict: Verdict, txHash: string | null): Promise<void> {
  await initPromise;

  try {
    // Update verdict with tx_hash
    const verdictWithTx = { ...verdict, tx_hash: txHash };

    if (dbType === "turso" && tursoClient) {
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO verdicts
              (claim_hash, claim_text, verdict_json, verdict_label, confidence,
               tx_hash, checked_at, ttl_policy, pipeline_version)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          verdict.claim_hash,
          verdict.claim_text,
          JSON.stringify(verdictWithTx),
          verdict.verdict,
          verdict.confidence,
          txHash,
          verdict.checked_at,
          verdict.ttl_policy,
          verdict.pipeline_version,
        ],
      });
      console.log("[TruthCast] Verdict saved to Turso");
      return;
    }

    if (dbType === "sqlite" && sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO verdicts
        (claim_hash, claim_text, verdict_json, verdict_label, confidence,
         tx_hash, checked_at, ttl_policy, pipeline_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        verdict.claim_hash,
        verdict.claim_text,
        JSON.stringify(verdictWithTx),
        verdict.verdict,
        verdict.confidence,
        txHash,
        verdict.checked_at,
        verdict.ttl_policy,
        verdict.pipeline_version
      );
      console.log("[TruthCast] Verdict saved to SQLite");
      return;
    }

    console.log("[TruthCast] No database available - verdict not persisted");
  } catch (error) {
    console.error("[TruthCast] Database write error:", error);
  }
}

export async function getAllVerdicts(limit = 50): Promise<Verdict[]> {
  await initPromise;

  try {
    if (dbType === "turso" && tursoClient) {
      const result = await tursoClient.execute({
        sql: "SELECT verdict_json FROM verdicts ORDER BY checked_at DESC LIMIT ?",
        args: [limit],
      });
      return result.rows.map((row) => VerdictSchema.parse(JSON.parse(row.verdict_json as string)));
    }

    if (dbType === "sqlite" && sqliteDb) {
      const rows = sqliteDb
        .prepare("SELECT verdict_json FROM verdicts ORDER BY checked_at DESC LIMIT ?")
        .all(limit) as any[];
      return rows.map((row) => VerdictSchema.parse(JSON.parse(row.verdict_json)));
    }
  } catch (error) {
    console.error("[TruthCast] Get all verdicts error:", error);
  }
  return [];
}

export async function getStats(): Promise<{ total: number; caught: number; unique_claims: number }> {
  await initPromise;

  try {
    if (dbType === "turso" && tursoClient) {
      const result = await tursoClient.execute(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN verdict_label IN ('FALSE', 'MOSTLY_FALSE', 'MISLEADING') THEN 1 ELSE 0 END) as caught,
          COUNT(DISTINCT claim_hash) as unique_claims
        FROM verdicts
      `);
      const row = result.rows[0];
      return {
        total: Number(row.total) || 0,
        caught: Number(row.caught) || 0,
        unique_claims: Number(row.unique_claims) || 0,
      };
    }

    if (dbType === "sqlite" && sqliteDb) {
      const total = sqliteDb.prepare("SELECT COUNT(*) as count FROM verdicts").get() as any;
      const caught = sqliteDb
        .prepare("SELECT COUNT(*) as count FROM verdicts WHERE verdict_label IN ('FALSE', 'MOSTLY_FALSE', 'MISLEADING')")
        .get() as any;
      return {
        total: total?.count || 0,
        caught: caught?.count || 0,
        unique_claims: total?.count || 0,
      };
    }
  } catch (error) {
    console.error("[TruthCast] Get stats error:", error);
  }
  return { total: 0, caught: 0, unique_claims: 0 };
}

// Export database status (for debugging)
export { dbType, sqliteDb as db };
