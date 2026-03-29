# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TruthCast — CLAUDE.md

## What this is

TruthCast is a fully autonomous AI fact-checking pipeline with immutable Solana blockchain provenance. A claim (text or URL) enters a 6-stage multi-agent system, gets decomposed into atomic sub-claims, verified against real-time evidence with adversarial debate for ambiguous cases, and the verdict is written permanently to Solana devnet. The full architecture is in `TruthCast_Architecture_Plan.pdf` — read it before writing any code.

---

## Repo structure

```
truthcast/
├── packages/
│   ├── shared/                          # Single source of truth for types
│   │   ├── schema.ts                    # Zod schemas: VerdictSchema, SourceSchema, VerdictLabel
│   │   ├── constants.ts                 # TTL_POLICIES, VERDICT_SEVERITY, aggregation functions
│   │   └── mbfc.json                    # MBFC expert-rated domain dataset (~4000 domains)
│   │
│   ├── pipeline/                        # Core fact-checking engine
│   │   ├── orchestrator.ts              # Main entry: startPipeline(), executePipeline(), pipelineEmitter
│   │   ├── normalize.ts                 # normalizeAndHash() for claim deduplication
│   │   ├── helpers.ts                   # writeSolanaVerdict(), elevenLabsTTS(), buildUnverifiableVerdict()
│   │   ├── checkworthiness.ts           # Full Fact criteria for opinion/prediction filtering
│   │   ├── decomposition.ts             # HiSS method for atomic claim extraction
│   │   ├── gemini-researcher.ts         # Gemini grounded search with MBFC scoring
│   │   ├── debate.ts                    # Adversarial debate for agreement_score < 0.8
│   │   ├── mbfc-scorer.ts               # Domain credibility lookup and tier assignment
│   │   ├── sentry.ts                    # Sentry singleton for error tracking
│   │   ├── openclaw-runner.ts           # OpenClaw agent executor (if USE_OPENCLAW=true)
│   │   │
│   │   ├── db/
│   │   │   └── init.ts                  # SQLite connection, getCachedVerdict(), writeVerdict()
│   │   │
│   │   └── scripts/                     # Standalone Node.js implementations (USE_OPENCLAW=false)
│   │       ├── runner.ts                # Script executor wrapper
│   │       ├── ingestion.ts             # Checkworthiness + decomposition script
│   │       ├── moderator.ts             # Verdict synthesis script
│   │       ├── test-solana-funded.ts    # Solana devnet integration test
│   │       ├── test-gemini.ts           # Gemini API test
│   │       ├── test-phase3.ts           # Gemini + TTS integration test
│   │       └── test-phase4.ts           # Full pipeline test
│   │
│   ├── web/                             # Next.js 14 app (App Router)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── check/
│   │   │   │   │   ├── route.ts         # POST /api/check - starts pipeline, returns session_id
│   │   │   │   │   └── stream/route.ts  # GET /api/check/stream - SSE event stream
│   │   │   │   ├── stats/route.ts       # GET /api/stats - aggregated metrics
│   │   │   │   └── review/[claim_hash]/route.ts  # GET /api/review/:hash - fetch cached verdict
│   │   │   ├── page.tsx                 # Homepage with claim input
│   │   │   └── layout.tsx               # Root layout
│   │   └── components/                  # React components (when Phase 6 complete)
│   │
│   └── extension/                       # Chrome Manifest V3 extension (Phase 7)
│       ├── manifest.json                # V3 manifest with host permissions
│       ├── content.js                   # Text selection UI (500ms debounce, 10 char min)
│       ├── background.js                # Service worker with chrome.storage.local cache
│       └── popup/                       # Extension popup UI
│
├── .env.example                         # All required env vars with descriptions
├── package.json                         # Workspace root config (Node >=22.0.0)
├── CLAUDE.md                            # This file
└── README.md                            # User-facing documentation
```

---

## Environment setup

Copy `.env.example` to `.env` and fill in required values:

```env
# Gemini API (required for research stage)
GEMINI_API_KEY=

# ElevenLabs TTS (required for audio generation)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=              # Recommended: Sarah (EXAVITQu4vr4xnSDxMaL)

# Solana Devnet (required for blockchain writes)
SOLANA_PUBLIC_KEY=                # Generated on first test-solana run if not set
SOLANA_PRIVATE_KEY=               # Base58 encoded keypair, devnet only
SOLANA_RPC_URL=https://api.devnet.solana.com

# Solana Frontend (public keys safe to expose)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_PUBLIC_KEY=    # Same as SOLANA_PUBLIC_KEY

# Sentry Error Monitoring (optional but recommended for Phase 8)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Database (default path should work)
SQLITE_PATH=./packages/pipeline/db/truthcast.db

# OpenClaw Agent Mode (optional - defaults to Node.js script fallback)
USE_OPENCLAW=false                # Set to 'true' to use OpenClaw agents
```

**Important notes:**
- Run `npm run test-solana` first to generate Solana keypair if you don't have one
- ElevenLabs voice IDs available: Sarah (EXAVITQu4vr4xnSDxMaL), Charlie (IKne3meq5aSn9XLyUdCD), George (JBFqnCBsd6RMkjVDRZzb)
- Never commit `.env` file - it contains secrets

---

## Commands

### Core Development
```bash
npm install                              # install all workspace dependencies
npm run dev                              # start Next.js dev server (shortcut for npm run dev --workspace=packages/web)
npm run build                            # build Next.js for production (shortcut for npm run build --workspace=packages/web)
```

### Testing and Validation
```bash
# Phase-specific tests (run from root)
npm run test-solana                      # Test Solana devnet connection, airdrop, and memo write
npm run test-audio                       # Start test server for audio playback testing

# Individual pipeline component tests (from packages/pipeline)
npm run test-solana --workspace=packages/pipeline       # Same as root test-solana
npm run test-gemini --workspace=packages/pipeline       # Test Gemini API with google_search tool
npm run test-phase3 --workspace=packages/pipeline       # Test Gemini + ElevenLabs TTS integration
npm run test-phase4 --workspace=packages/pipeline       # Test full 4-stage pipeline with SSE streaming
```

### Direct Pipeline Execution
```bash
tsx packages/pipeline/orchestrator.ts    # Run pipeline directly (requires USE_OPENCLAW env var)
```

### TypeScript Execution
All `.ts` files should be run with `tsx` (included in pipeline workspace):
```bash
tsx packages/pipeline/scripts/test-solana-funded.ts
tsx packages/pipeline/scripts/test-gemini.ts
```

---

## Critical package choices — do not substitute

| Purpose | Package | Do NOT use |
|---|---|---|
| SQLite | `better-sqlite3` | `sqlite3` (async, worse for this use case) |
| Solana writes | `@solana/web3.js` + `@solana/spl-memo` | Any other Solana lib |
| Schema validation | `zod` | `joi`, `yup`, or manual validation |
| Error monitoring | `@sentry/node` + `@sentry/nextjs` | Any other error tracker |
| LLM for research | Gemini `gemini-2.0-flash` with `google_search` tool | Any other model for Stage 2 |
| Voice | ElevenLabs `/v1/text-to-speech/{voice_id}` | Any other TTS |

---

## Workspace Architecture

TruthCast uses npm workspaces with three packages:

```json
// Root package.json
{
  "workspaces": ["packages/*"]
}
```

### Package Dependencies

```
@truthcast/shared (no dependencies except zod)
    ↓
@truthcast/pipeline (depends on shared)
    ↓
@truthcast/web (depends on shared, calls pipeline via API)
```

### Import Conventions

**Workspace aliases** (preferred):
```typescript
import { Verdict, VerdictSchema } from "@truthcast/shared/schema";
import { TTL_POLICIES, aggregateSubClaimVerdicts } from "@truthcast/shared/constants";
```

**Relative imports** (only within same package):
```typescript
// Within packages/pipeline/
import { normalizeAndHash } from "./normalize.js";
import { getCachedVerdict } from "./db/init.js";
```

**Never mix:** Don't use relative paths to access other workspace packages. Always use `@truthcast/` aliases.

## Type Conventions

**Always import types from `packages/shared/schema.ts`.** Never redefine `Verdict`, `Source`, or `VerdictLabel` locally. The Zod schema is the source of truth.

```typescript
// Correct
import { VerdictSchema, Verdict, VerdictLabelType, Source } from "@truthcast/shared/schema";
const verdict: Verdict = VerdictSchema.parse(data);

// Wrong - do not redefine
type Verdict = { claim_hash: string; ... };  // ❌ Never do this
```

### Adding New Fields

If a new field is needed in the Verdict type:
1. Add it to `VerdictSchema` in `packages/shared/schema.ts`
2. Update all consumers (pipeline, web)
3. Run `npm run test-phase4 --workspace=packages/pipeline` to validate

The Zod schema ensures runtime validation, not just compile-time types.

---

## Architecture and Data Flow

### Pipeline Execution Model

TruthCast uses a **single-script pipeline** architecture:

- All pipeline logic runs in `packages/pipeline/scripts/run-claim.ts`
- Single entrypoint for web app, CLI, and OpenClaw skill
- Internally uses TypeScript functions from `packages/pipeline/*.ts`
- No subprocess spawning or file-based agent coordination

### OpenClaw Integration

**OpenClaw is a persistent Gateway daemon with skill injection**, not a subprocess runner.

- **Skill file:** `packages/pipeline/openclaw-skill/SKILL.md` (YAML frontmatter + instructions)
- **Skill invocation:** OpenClaw agent calls `node run-claim.ts "claim"` via `exec` permission
- **Output parsing:** Skill reads JSON from stdout and formats for chat
- **Channels:** Telegram and Discord connect to Gateway, route messages to agents with injected skills

### SSE Streaming Architecture

The orchestrator uses a module-level EventEmitter singleton (`pipelineEmitter`) to stream real-time progress:

```typescript
// In orchestrator.ts
export const pipelineEmitter = new EventEmitter();
pipelineEmitter.setMaxListeners(50); // Support concurrent sessions

// Emit progress events
function emitEvent(session_id: string, event: PipelineEvent): void {
  pipelineEmitter.emit(session_id, event);    // Session-specific stream
  pipelineEmitter.emit("global", event);      // Global monitoring
}
```

Client flow:
1. POST `/api/check` with claim → returns `{ session_id: UUID }`
2. Open `EventSource('/api/check/stream?session=UUID')`
3. Receive real-time events: `progress`, `stage_complete`, `complete`, `error`

### Core Helper Functions

These functions are called by `orchestrator.ts` and have specific contracts:

```typescript
// packages/pipeline/normalize.ts
export function normalizeAndHash(text: string): string
// 1. lowercase, 2. strip punctuation, 3. expand contractions,
// 4. remove stop words, 5. sort tokens alphabetically, 6. SHA-256 hex (64 chars)
// Used for cache lookup by semantic equivalence (not exact string match)

// packages/pipeline/helpers.ts
export function buildUnverifiableVerdict(claim: any, claimHash: string): Verdict
// Returns valid Verdict with verdict: "UNVERIFIABLE", confidence: 0
// Used for opinions, predictions, or non-checkworthy claims

export async function writeSolanaVerdict(verdict: Verdict): Promise<string>
// Writes to Solana Memo Program (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr)
// Max 566 bytes → truncates sources to top 3 if needed
// Returns transaction signature or throws (wrapped in try/catch by orchestrator)

export async function elevenLabsTTS(text: string): Promise<string | null>
// POST to ElevenLabs /v1/text-to-speech/{ELEVENLABS_VOICE_ID}
// Returns base64 data URL or null on failure (non-fatal)
// Audio format: MP3, optimized for streaming
```

### Pipeline Entrypoint: run-claim.ts

**Location:** `packages/pipeline/scripts/run-claim.ts`

Single entrypoint for all pipeline executions (web app, CLI, OpenClaw skill).

**Usage:**
```bash
# Direct claim
tsx packages/pipeline/scripts/run-claim.ts "vaccines cause autism"

# URL extraction (future)
tsx packages/pipeline/scripts/run-claim.ts --url "https://example.com/article"
```

**Output:**
- Prints Zod-validated Verdict JSON to stdout
- Logs progress to stderr (doesn't interfere with JSON output)
- Exits 0 on success, non-zero on error

**Key features:**
- Cache lookup before running pipeline
- Automatic claim truncation to 2000 characters
- Session-scoped temp directory for concurrent runs
- Cleanup on completion (success or failure)
- Non-fatal Solana and audio generation (pipeline continues if they fail)

---

## OpenClaw Skill Architecture

### Skill Structure

```
packages/pipeline/openclaw-skill/
├── SKILL.md          # Skill definition with YAML frontmatter
└── package.json      # Metadata for skill
```

**SKILL.md format:**
```markdown
---
name: truthcast
description: "Fact-check any claim..."
triggers:
  - fact-check
  - is this true
  - verify this
permissions:
  - exec
  - read
version: "2.0"
---

# TruthCast Fact-Checker

When user asks to fact-check, run:
\`\`\`bash
cd ~/TruthCast && node packages/pipeline/scripts/run-claim.ts "CLAIM_TEXT_HERE"
\`\`\`

Parse JSON output and format for chat...
```

### How It Works

1. User sends message to Telegram/Discord bot
2. OpenClaw Gateway receives message
3. Gateway loads `truthcast` skill into agent context
4. Agent matches trigger ("fact-check:", "/factcheck")
5. Agent executes `run-claim.ts` with claim text
6. Script prints Verdict JSON to stdout
7. Agent parses JSON and formats response for user
8. Response sent back via Telegram/Discord

### Installation

```bash
# Symlink skill to OpenClaw
./packages/pipeline/scripts/install-skill.sh

# Restart Gateway to load skill
openclaw gateway restart

# Verify skill is loaded
openclaw skills list  # Should show 'truthcast'
```

**Full setup guide:** `packages/pipeline/scripts/setup-openclaw.md`

### Messaging Channels

TruthCast is accessible via three surfaces:

| Channel | Access | Command Format |
|---------|--------|----------------|
| **Telegram** | DM @TruthCastBot | `fact-check: [claim]` |
| **Discord** | `/factcheck` in server | `/factcheck claim:[claim]` |
| **Web App** | truthcast.tech | Paste claim in input |

**Shared infrastructure:**
- All channels use the same `run-claim.ts` entrypoint
- All verdicts write to the same SQLite cache and Solana ledger
- Claim checked on Telegram → instant cache hit on Discord/web

**Discord setup:**
1. Create bot at discord.com/developers
2. Enable MESSAGE_CONTENT intent
3. Add bot token to `.env`
4. Run `tsx packages/pipeline/scripts/register-discord-commands.ts`
5. Invite bot with `bot` + `applications.commands` scopes

**Telegram setup:**
1. Talk to @BotFather on Telegram
2. Create bot, copy token
3. Add token to `.env`
4. Run `openclaw channels add --channel telegram`

---

## Pipeline Stages (Detailed)

### Stage 0: Cache Check
- Normalize claim and compute SHA-256 hash
- Query SQLite for existing verdict
- If found and not expired → return immediately (100% progress)

### Stage 1: Ingestion
- **Checkworthiness Filter** (`checkworthiness.ts`): Apply Full Fact criteria
  - Reject opinions: "I think X", "In my opinion"
  - Reject predictions: "will", "going to", future tense
  - Reject ambiguous statements without verifiable facts
  - If rejected → return `buildUnverifiableVerdict()`, skip remaining stages
- **Atomic Decomposition** (`decomposition.ts`): Use HiSS method
  - Extract 1-10 atomic sub-claims from compound claims
  - Example: "Biden is 80 and Trump is 77" → ["Biden is 80", "Trump is 77"]

### Stage 2: Researcher
- **Evidence Retrieval** (`gemini-researcher.ts`):
  - Call Gemini `gemini-2.0-flash` with `google_search` tool enabled
  - For each sub-claim: retrieve top sources with excerpts
- **MBFC Scoring** (`mbfc-scorer.ts`):
  - Match source domains against `mbfc.json` (~4000 domains)
  - Assign tier: "HIGH" (0.9), "MEDIUM-HIGH" (0.75), "MEDIUM" (0.6), "LOW" (0.3), "UNKNOWN" (0.5)
- **Agreement Score Calculation** (`debate.ts` → `calculateAgreementScore()`):
  - Measure consensus among sub-claim verdicts
  - Range: 0.0 (total disagreement) to 1.0 (unanimous)

### Stage 2.5: Debate (Conditional)
**Triggers when:** `agreement_score < 0.8`

- Run `debater-pro` agent: builds affirmative case (claim is TRUE)
- Run `debater-con` agent: builds negative case (claim is FALSE)
- Each agent receives all evidence, produces:
  - Argument text (max 500 chars)
  - Confidence score (0-100)
  - Key sources supporting their position
- Moderator synthesizes debate into consensus verdict (may be CONFLICTING if no clear winner)

**Fast path:** If `agreement_score >= 0.8`, skip debate and proceed directly to Stage 3.

### Stage 3: Moderator
- If single sub-claim: use research verdict directly
- If multiple sub-claims: apply aggregation rules from `constants.ts`
- If debate occurred: incorporate consensus, store minority view
- Apply confidence penalty: `0.9^(n_sub_claims - 1)`
- Validate with `VerdictSchema.parse()`

### Stage 4: Publisher
- **Solana Write** (`writeSolanaVerdict()`):
  - Truncate to 566 bytes if needed (sources to top 3)
  - Write to devnet via Memo Program
  - Non-fatal: continue if write fails (store `tx_hash: null`)
- **Audio Generation** (`elevenLabsTTS()`):
  - Generate natural voice summary
  - Non-fatal: log error if TTS fails
- **Cache Storage** (`writeVerdict()`):
  - Insert into SQLite with TTL policy
  - Store transaction hash for blockchain provenance

---

## Sub-claim Aggregation Rule

**Implemented in:** `packages/shared/constants.ts` → `aggregateSubClaimVerdicts()`

Severity order (most to least severe): `FALSE > MOSTLY_FALSE > CONFLICTING > MISLEADING > MOSTLY_TRUE > TRUE > UNVERIFIABLE`

### Algorithm

1. If >50% of sub-claims are FALSE → compound verdict = FALSE
2. If any FALSE but ≤50% → compound verdict = MISLEADING
3. If no FALSE but any MOSTLY_FALSE in majority → MOSTLY_FALSE
4. If any CONFLICTING (no false-family) → CONFLICTING
5. If all true-family → most severe among them (MOSTLY_TRUE > TRUE)
6. If all UNVERIFIABLE → UNVERIFIABLE

### Confidence Penalty

```typescript
const subClaimPenalty = Math.pow(0.9, numSubClaims - 1);
const confidence = Math.round(avgConfidence * subClaimPenalty);
```

**Example:** A 4-sub-claim verdict cannot exceed 73% confidence regardless of evidence quality.

### Moderator Integration

The constant `MODERATOR_AGGREGATION_PROMPT` from `constants.ts` is injected into:
- OpenClaw moderator agent YAML system prompt
- Node.js script mode moderator function docstring

This ensures both execution modes apply identical aggregation logic.

---

## Browser extension rules

- **Manifest V3 only.** Never V2.
- **Never use `localStorage`.** Use `chrome.storage.local` exclusively.
- Content script debounce: 500ms before showing floating button.
- Minimum selection length: 10 characters.
- Host permissions must include both `http://localhost:3000/*` (dev) and `https://truthcast.tech/*` (prod).

---

## Solana rules

- **Devnet only.** Never mainnet.
- Airdrop 1 SOL to the keypair on devnet before any write attempts.
- Memo Program ID: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`
- Max memo size: 566 bytes. If verdict JSON exceeds this, truncate `sources` to top 3 by domain_tier.
- Solana write failure is **non-fatal**. Pipeline continues, `tx_hash` is stored as null in SQLite.

---

## Database and Caching

### SQLite Schema

**Location:** `packages/pipeline/db/init.ts`

```sql
CREATE TABLE verdicts (
  claim_hash TEXT PRIMARY KEY,
  claim_text TEXT NOT NULL,
  verdict TEXT NOT NULL,           -- VerdictLabel enum
  confidence INTEGER NOT NULL,     -- 0-100
  reasoning TEXT NOT NULL,
  sources TEXT NOT NULL,           -- JSON array of Source objects
  checked_at INTEGER NOT NULL,     -- Unix timestamp
  ttl_policy TEXT NOT NULL,        -- 'SHORT' | 'LONG' | 'STATIC'
  tx_hash TEXT                     -- Solana transaction signature or NULL
);
```

### Cache Lookup Strategy

1. User submits claim
2. Orchestrator calls `normalizeAndHash(claim)` → 64-char SHA-256 hex
3. Call `getCachedVerdict(claim_hash)`
4. If found AND not expired:
   - Return cached verdict immediately (100% progress, from_cache=true)
5. If not found OR expired:
   - Run full pipeline
   - Call `writeVerdict(verdict, tx_hash)` to cache result

### TTL Expiration Logic

```typescript
// In packages/shared/constants.ts
const TTL_POLICIES = {
  SHORT: 604800,    // 7 days - current events, live claims
  LONG: 7776000,    // 90 days - institutional facts
  STATIC: Infinity, // No expiry - historical facts
};

// In getCachedVerdict()
const now = Math.floor(Date.now() / 1000);
const expiresAt = row.checked_at + TTL_POLICIES[row.ttl_policy];
if (now > expiresAt) return null; // Expired, run pipeline again
```

### Cache Key Normalization

The `normalizeAndHash()` function ensures semantic equivalence:
- "President Biden is 80 years old" → same hash as "president biden is 80 years old"
- "isn't" → "is not" (contraction expansion)
- Stop words removed: "the", "a", "an", etc.
- Tokens sorted alphabetically before hashing

This allows cache hits even when claim phrasing differs slightly.

## SSE Streaming Rules

- Every `/api/check` POST returns `{ session_id: UUID }` immediately
- Client opens `EventSource('/api/check/stream?session=UUID')`
- `pipelineEmitter` is a module-level `EventEmitter` singleton in `orchestrator.ts`
- `pipelineEmitter.setMaxListeners(50)` supports concurrent sessions
- Events emitted: `progress`, `stage_complete`, `complete`, `error`
- Clean up `/tmp/pipeline-{sessionId}/` directory after pipeline completes (OpenClaw mode only)

---

## Sentry instrumentation points

Wrap these specific operations — not everything:

1. Solana `sendAndConfirmTransaction` in `writeSolanaVerdict()`
2. ElevenLabs fetch in `elevenLabsTTS()`
3. `VerdictSchema.parse()` in the orchestrator (catches malformed moderator output)
4. Each `runWithTimeout()` timeout expiry
5. OpenClaw agent stderr output (as warnings, not errors)

---

## Build Order and Current Status

Follow this exact sequence. Each phase produces a demo-able checkpoint.

### Completed Phases

✅ **Phase 1** (0–1.5h): Solana Memo write with hardcoded string → confirm on Explorer → SQLite init
  - Test: `npm run test-solana`
  - Files: `packages/pipeline/helpers.ts` (writeSolanaVerdict), `packages/pipeline/db/init.ts`

✅ **Phase 2** (1.5–4h): Gemini grounded verdict → MBFC scoring → test 5 pre-selected claims
  - Test: `npm run test-gemini --workspace=packages/pipeline`
  - Files: `packages/pipeline/gemini-researcher.ts`, `packages/pipeline/mbfc-scorer.ts`

✅ **Phase 3** (4–5.5h): ElevenLabs TTS → audio in browser → combine with Phase 2
  - Test: `npm run test-phase3 --workspace=packages/pipeline`, `npm run test-audio`
  - Files: `packages/pipeline/helpers.ts` (elevenLabsTTS)

✅ **Phase 4** (5.5–11h): OpenClaw 4-agent pipeline → SSE progress bar → full orchestrator
  - Test: `npm run test-phase4 --workspace=packages/pipeline`
  - Files: `packages/pipeline/orchestrator.ts`, `packages/pipeline/checkworthiness.ts`, `packages/pipeline/decomposition.ts`
  - Features: HiSS decomposition, Full Fact checkworthiness, minimal blockchain proof (~100 bytes)

✅ **Phase 5** (11–16h): Debate agents → 7-label taxonomy → confidence formula
  - Files: `packages/pipeline/debate.ts`, `packages/shared/constants.ts` (aggregateSubClaimVerdicts)
  - Features: Adversarial debate triggers when agreement_score < 0.8

### Remaining Phases

⬜ **Phase 6** (16–22h): Next.js frontend → verdict card → Solana Explorer link → audio player
  - Goal: Build user-facing UI for claim submission and verdict display
  - Files needed: `packages/web/app/components/`, React components for verdict cards

⬜ **Phase 7** (22–23h): Browser extension → content script → popup → extension cache
  - Goal: Chrome Manifest V3 extension for in-page fact-checking
  - Files needed: `packages/extension/content.js`, `packages/extension/background.js`, `packages/extension/popup/`

⬜ **Phase 8** (23–24h): Sentry → rate limiting → Devpost submission → video → register truthcast.tech
  - Goal: Production hardening and deployment
  - Tasks: Sentry instrumentation points (see below), API rate limiting, demo video

---

## API Endpoints (Web Package)

### POST /api/check
**Purpose:** Start a new fact-check pipeline

**Request:**
```json
{ "claim": "Your claim text here" }
```

**Response:**
```json
{ "session_id": "uuid-v4" }
```

**Usage:**
```typescript
const response = await fetch('/api/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ claim: userInput })
});
const { session_id } = await response.json();
```

### GET /api/check/stream?session={uuid}
**Purpose:** Server-Sent Events stream for real-time pipeline progress

**Event Types:**
- `progress`: Stage started (e.g., "Running researcher agent...")
- `stage_complete`: Stage finished with results
- `complete`: Full pipeline finished, includes verdict
- `error`: Pipeline failed

**Example Client:**
```typescript
const eventSource = new EventSource(`/api/check/stream?session=${session_id}`);

eventSource.addEventListener('progress', (e) => {
  const data = JSON.parse(e.data);
  updateProgressBar(data.progress); // 0-100
});

eventSource.addEventListener('complete', (e) => {
  const { verdict } = JSON.parse(e.data);
  displayVerdict(verdict);
  eventSource.close();
});
```

### GET /api/review/{claim_hash}
**Purpose:** Retrieve cached verdict by claim hash

**Response:**
```json
{
  "verdict": { /* Full Verdict object */ },
  "from_cache": true
}
```

### GET /api/stats
**Purpose:** Aggregated platform statistics

**Response:**
```json
{
  "total_claims": 1247,
  "verdicts_by_label": { "TRUE": 340, "FALSE": 180, ... },
  "avg_confidence": 78.3
}
```

## Common Development Tasks

### Adding a New Verdict Field

1. Update Zod schema in `packages/shared/schema.ts`:
```typescript
export const VerdictSchema = z.object({
  // ... existing fields
  new_field: z.string().optional(),
});
```

2. Update TypeScript type (auto-inferred, but check):
```typescript
export type Verdict = z.infer<typeof VerdictSchema>;
```

3. Update SQLite schema if storing in DB:
```sql
-- packages/pipeline/db/init.ts
ALTER TABLE verdicts ADD COLUMN new_field TEXT;
```

4. Update all consumers:
- `packages/pipeline/orchestrator.ts` (moderator stage)
- `packages/web/app/api/check/route.ts` (if exposed via API)

5. Test with:
```bash
npm run test-phase4 --workspace=packages/pipeline
```

### Testing a Single Pipeline Stage

```typescript
// Create test file: packages/pipeline/test-my-stage.ts
import { checkCheckworthiness } from "./checkworthiness.js";

const result = await checkCheckworthiness("Test claim here");
console.log(result);
```

Run with:
```bash
tsx packages/pipeline/test-my-stage.ts
```

### Debugging OpenClaw Agents

1. Set `USE_OPENCLAW=true` in `.env`
2. Add debug logging in agent YAML:
```yaml
# packages/pipeline/agents/researcher.yaml
system_prompt: |
  Debug mode: Print all intermediate variables.
```
3. Check temp directory before cleanup:
```bash
ls -la /tmp/pipeline-*/
cat /tmp/pipeline-*/evidence.json
```

## Important Constraints

### Do Not

- **Never write Rust or Anchor programs.** Use the Solana Memo Program via `@solana/spl-memo` JS library only
- **Never use `sqlite3` package.** Only use `better-sqlite3` (synchronous, faster for this use case)
- **Never use Manifest V2** for the browser extension. Chrome requires V3 as of 2024
- **Never use `localStorage`** in the extension. Only use `chrome.storage.local` (V3 requirement)
- **Never hardcode API keys.** Always read from `process.env` and check for undefined
- **Never define Verdict types** outside `packages/shared/schema.ts`. Import `Verdict`, `Source`, `VerdictLabel` from shared package
- **Never run debate** on claims with `agreement_score >= 0.8` (fast path optimization)
- **Never write to Solana mainnet.** Only devnet is supported (RPC URL validation in helpers.ts)
- **Never commit `.env` file.** It contains secrets. Use `.env.example` as template

### Always Do

- **Always import types from `@truthcast/shared/schema`** using workspace alias (never relative paths)
- **Always validate with Zod** before storing verdicts: `VerdictSchema.parse(verdict)`
- **Always clean up temp directories** in OpenClaw mode after pipeline completes
- **Always handle Solana write failures gracefully** (non-fatal, store `tx_hash: null` in DB)
- **Always use `tsx`** to run TypeScript files directly (included in pipeline workspace)
- **Always check `USE_OPENCLAW` env var** to determine execution mode in orchestrator
- **Always truncate sources to top 3** if verdict JSON exceeds 566 bytes for Solana memo

### Node.js Version

**Required:** Node.js >= 22.0.0 (specified in root `package.json` engines field)

This is necessary for:
- Native `fetch` API support (no polyfill)
- Modern ES module resolution
- Performance optimizations in better-sqlite3

## Troubleshooting

### "Module not found: @truthcast/shared"

**Cause:** Workspace dependencies not linked

**Fix:**
```bash
# From repo root
rm -rf node_modules packages/*/node_modules
npm install
```

### "SOLANA_PRIVATE_KEY is undefined"

**Cause:** Missing Solana keypair in `.env`

**Fix:**
```bash
npm run test-solana  # Generates keypair and prints private key
# Copy the private key to .env as SOLANA_PRIVATE_KEY=...
```

### "Airdrop failed" during test-solana

**Cause:** Solana devnet rate limiting or congestion

**Fix:**
- Wait 60 seconds and retry
- Check devnet status: https://status.solana.com
- If persistent, use a different RPC endpoint (not Helius/Alchemy, use public devnet RPC)

### "VerdictSchema validation failed"

**Cause:** Moderator output doesn't match expected schema

**Debug:**
1. Check error message for specific field that failed
2. Inspect verdict JSON before validation:
```typescript
console.log('Raw verdict:', JSON.stringify(verdict, null, 2));
const validated = VerdictSchema.parse(verdict); // Will throw with details
```
3. Common issues:
   - `confidence` not an integer (should be 0-100, not 0.0-1.0)
   - `claim_hash` not exactly 64 characters
   - `sources` array has invalid URLs

### Pipeline hangs on OpenClaw mode

**Cause:** Agent didn't print `[END]` marker

**Debug:**
1. Check agent stdout/stderr:
```typescript
// In openclaw-runner.ts
console.log('Agent stdout:', agentOutput);
```
2. Verify agent YAML ends with:
```yaml
tasks:
  - action: write_file
    # ...
  - action: print
    message: "[END]"
```

### "fetch failed" for Gemini API

**Cause:** Invalid API key or rate limit

**Fix:**
1. Verify API key is correct: https://makersuite.google.com/app/apikey
2. Check API quota in Google Cloud Console
3. Ensure `GEMINI_API_KEY` has no leading/trailing whitespace in `.env`

### SQLite "database is locked"

**Cause:** Multiple processes accessing DB concurrently

**Fix:**
- Use `better-sqlite3` (already configured, synchronous)
- If using custom queries, wrap in transaction:
```typescript
db.prepare('BEGIN').run();
// ... queries
db.prepare('COMMIT').run();
```

### Browser extension "host permissions" error

**Cause:** Manifest V3 requires explicit host permissions

**Fix:**
```json
// packages/extension/manifest.json
{
  "host_permissions": [
    "http://localhost:3000/*",
    "https://truthcast.tech/*"
  ]
}
```

### TypeScript "Cannot find module" with .js imports

**Cause:** ES modules require `.js` extension even for `.ts` files

**Fix:**
```typescript
// Wrong
import { foo } from "./bar";

// Correct
import { foo } from "./bar.js";
```

This is a TypeScript ES module requirement. The `.js` extension is correct even though the source file is `.ts`.
