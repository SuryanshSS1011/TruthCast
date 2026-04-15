// packages/pipeline/db/init.ts
// Hybrid caching: Upstash Redis (Vercel) + SQLite (local)

import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { VerdictSchema, type Verdict } from "@truthcast/shared/schema";
import { TTL_POLICIES } from "@truthcast/shared/constants";
import { Redis } from "@upstash/redis";

// Schema for SQLite
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

// Cache backends
let sqliteDb: any = null;
let redisClient: Redis | null = null;
let cacheType: "redis" | "sqlite" | "none" = "none";

// Initialize cache - prefer Redis on Vercel, SQLite locally
function initCache() {
  // Try Upstash Redis first (for Vercel)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      cacheType = "redis";
      console.log("[TruthCast] Using Upstash Redis cache");
      return;
    } catch (error: any) {
      console.warn("[TruthCast] Failed to initialize Redis:", error.message);
    }
  }

  // Skip SQLite on serverless
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log("[TruthCast] Serverless environment without Redis - no caching");
    cacheType = "none";
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
    cacheType = "sqlite";
    console.log("[TruthCast] Using SQLite cache:", dbPath);
  } catch (error: any) {
    console.warn("[TruthCast] SQLite unavailable:", error.message);
    cacheType = "none";
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
initCache();

// ============ CACHE OPERATIONS ============

export async function getCachedVerdict(claimHash: string): Promise<Verdict | null> {
  try {
    if (cacheType === "redis" && redisClient) {
      const data = await redisClient.get<string>(`verdict:${claimHash}`);
      if (!data) return null;

      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return VerdictSchema.parse(parsed);
    }

    if (cacheType === "sqlite" && sqliteDb) {
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
    console.error("[TruthCast] Cache lookup error:", error);
  }
  return null;
}

export async function writeVerdict(verdict: Verdict, txHash: string | null): Promise<void> {
  try {
    // Update verdict with tx_hash
    const verdictWithTx = { ...verdict, tx_hash: txHash };

    if (cacheType === "redis" && redisClient) {
      // TTL in seconds
      const ttlSeconds = TTL_POLICIES[verdict.ttl_policy as keyof typeof TTL_POLICIES];
      await redisClient.set(
        `verdict:${verdict.claim_hash}`,
        JSON.stringify(verdictWithTx),
        { ex: ttlSeconds }
      );
      console.log("[TruthCast] Verdict cached to Redis");
      return;
    }

    if (cacheType === "sqlite" && sqliteDb) {
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
      console.log("[TruthCast] Verdict cached to SQLite");
      return;
    }

    console.log("[TruthCast] No cache available - verdict not persisted");
  } catch (error) {
    console.error("[TruthCast] Cache write error:", error);
  }
}

export async function getAllVerdicts(limit = 50): Promise<Verdict[]> {
  try {
    if (cacheType === "redis" && redisClient) {
      // Get all verdict keys
      const keys = await redisClient.keys("verdict:*");
      if (!keys.length) return [];

      // Get all verdicts
      const verdicts: Verdict[] = [];
      for (const key of keys.slice(0, limit)) {
        const data = await redisClient.get<string>(key);
        if (data) {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          verdicts.push(VerdictSchema.parse(parsed));
        }
      }
      return verdicts.sort((a, b) => b.checked_at - a.checked_at);
    }

    if (cacheType === "sqlite" && sqliteDb) {
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
  try {
    if (cacheType === "redis" && redisClient) {
      const keys = await redisClient.keys("verdict:*");
      const total = keys.length;

      let caught = 0;
      for (const key of keys) {
        const data = await redisClient.get<any>(key);
        if (data) {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (["FALSE", "MOSTLY_FALSE", "MISLEADING"].includes(parsed.verdict)) {
            caught++;
          }
        }
      }

      return { total, caught, unique_claims: total };
    }

    if (cacheType === "sqlite" && sqliteDb) {
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

// Export cache status
export { cacheType, sqliteDb as db };
