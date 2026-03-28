# TruthCast — CLAUDE.md

## What this is

TruthCast is a fully autonomous AI fact-checking pipeline with immutable Solana blockchain provenance. A claim (text or URL) enters a 6-stage multi-agent system, gets decomposed into atomic sub-claims, verified against real-time evidence with adversarial debate for ambiguous cases, and the verdict is written permanently to Solana devnet. The full architecture is in `TruthCast_Architecture_Plan.pdf` — read it before writing any code.

---

## Repo structure

```
truthcast/
├── packages/
│   ├── shared/               # Single source of truth for types
│   │   ├── schema.ts         # Zod VerdictSchema — import this everywhere
│   │   ├── mbfc.json         # MBFC expert-rated domain dataset
│   │   └── constants.ts      # TTL policies, verdict labels, aggregation rules
│   ├── pipeline/
│   │   ├── agents/           # OpenClaw YAML configs (one per agent)
│   │   ├── scripts/          # Fallback Node.js scripts (same logic, no OpenClaw)
│   │   ├── db/               # SQLite schema + init + getCachedVerdict/writeVerdict
│   │   └── orchestrator.ts   # runPipeline(), pipelineEmitter, runWithTimeout()
│   ├── web/                  # Next.js app
│   │   └── app/
│   │       ├── api/check/route.ts        # POST — starts pipeline, returns session_id
│   │       └── api/check/stream/route.ts # GET — SSE stream keyed by session_id
│   └── extension/            # Chrome Manifest V3
│       ├── manifest.json
│       ├── content.js        # Text selection + floating button (500ms debounce)
│       ├── background.js     # Context menu, API calls, chrome.storage.local cache
│       └── popup/
├── .env.example
└── package.json              # npm workspaces root
```

---

## Environment setup

Copy `.env.example` to `.env` and fill in all values before running anything:

```
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
SOLANA_PRIVATE_KEY=       # Base58 encoded keypair, devnet only
SOLANA_RPC_URL=https://api.devnet.solana.com
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SQLITE_PATH=./packages/pipeline/db/truthcast.db
```

---

## Commands

```bash
npm install                         # install all workspaces
npm run dev --workspace=web         # start Next.js dev server
npm run build --workspace=web       # production build
node packages/pipeline/orchestrator.ts  # run pipeline directly
npx ts-node packages/shared/scripts/convert-mbfc.ts  # regenerate mbfc.json
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

## Type conventions

**Always import types from `packages/shared/schema.ts`.** Never redefine `Verdict`, `Source`, or `VerdictLabel` locally. The Zod schema is the source of truth — if a new field is needed, add it to the schema first, then update consuming code.

```typescript
import { VerdictSchema, Verdict, SourceSchema } from "@truthcast/shared/schema";
```

---

## Four helper function signatures

These are called in `orchestrator.ts` and must be implemented as specified:

```typescript
// packages/pipeline/normalize.ts
export function normalizeAndHash(text: string): string {
  // 1. lowercase, 2. strip punctuation, 3. expand contractions,
  // 4. remove stop words, 5. sort tokens alphabetically, 6. SHA-256 hex
}

// packages/pipeline/helpers.ts
export function buildUnverifiableVerdict(claim: any, claimHash: string): Verdict {
  // Returns a fully valid Verdict object with verdict: "UNVERIFIABLE",
  // confidence: 0, reasoning: "This claim is an opinion/prediction/ambiguous
  // statement and cannot be objectively verified.", sources: [],
  // debate_triggered: false, agreement_score: 1.0
}

export async function writeSolanaVerdict(verdict: Verdict): Promise<string> {
  // Uses @solana/spl-memo Memo Program (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr)
  // Encodes JSON.stringify(verdict) as UTF-8 Buffer (max 566 bytes — truncate sources to top 3)
  // Returns transaction signature string
}

export async function elevenLabsTTS(text: string): Promise<string> {
  // POST to ElevenLabs /v1/text-to-speech/{ELEVENLABS_VOICE_ID}
  // Returns a data URL or blob URL for the audio
  // Non-fatal: log and return null if API fails
}
```

---

## Pipeline file handshake

Each OpenClaw agent reads and writes files in a session-scoped directory `/tmp/pipeline-{sessionId}/`:

| File | Written by | Read by |
|---|---|---|
| `input.json` | Orchestrator | ingestion agent |
| `claim.json` | ingestion | researcher, orchestrator |
| `evidence.json` | researcher | debater-pro, debater-con, moderator |
| `debate.json` | debater-pro + debater-con | moderator |
| `verdict.json` | moderator | publisher (orchestrator) |

Every agent YAML receives `PIPELINE_DIR` as an env var. Every agent task ends with printing `[END]` to stdout. The OpenClaw runner wrapper watches stdout for `[END]` and resolves the promise.

---

## OpenClaw agent naming

Five agents, exact names matter for the runner:

- `ingestion` — checkworthiness + atomic decomposition
- `researcher` — Gemini grounded evidence retrieval + MBFC scoring
- `debater-pro` — affirmative debate agent
- `debater-con` — negative debate agent
- `moderator` — verdict synthesis

---

## Sub-claim aggregation rule (moderator must follow this)

Severity order (most to least severe): `FALSE > MOSTLY_FALSE > CONFLICTING > MISLEADING > MOSTLY_TRUE > TRUE > UNVERIFIABLE`

1. If >50% of sub-claims are FALSE → compound verdict = FALSE
2. If any FALSE but ≤50% → compound verdict = MISLEADING
3. If no FALSE but any MOSTLY_FALSE in majority → MOSTLY_FALSE
4. If any CONFLICTING (no false-family) → CONFLICTING
5. If all true-family → most severe among them
6. Confidence penalty: multiply by 0.9^(n_sub_claims − 1)

This rule lives in `packages/shared/constants.ts` and is injected into the moderator agent system prompt.

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

## SSE rules

- Every `/api/check` POST returns `{ session_id: UUID }` immediately.
- Client opens `EventSource('/api/check/stream?session=UUID')`.
- `pipelineEmitter` is a module-level `EventEmitter` singleton in `orchestrator.ts`.
- Set `pipelineEmitter.setMaxListeners(50)` to support concurrent sessions.
- Clean up session-scoped `/tmp/pipeline-{sessionId}/` directory after pipeline completes.

---

## Sentry instrumentation points

Wrap these specific operations — not everything:

1. Solana `sendAndConfirmTransaction` in `writeSolanaVerdict()`
2. ElevenLabs fetch in `elevenLabsTTS()`
3. `VerdictSchema.parse()` in the orchestrator (catches malformed moderator output)
4. Each `runWithTimeout()` timeout expiry
5. OpenClaw agent stderr output (as warnings, not errors)

---

## Build order — follow this sequence

Phase 1 first. Each phase produces a demo-able checkpoint.

1. **Phase 1** (0–1.5h): Solana Memo write with hardcoded string → confirm on Explorer → SQLite init
2. **Phase 2** (1.5–4h): Gemini grounded verdict → MBFC scoring → test 5 pre-selected claims
3. **Phase 3** (4–5.5h): ElevenLabs TTS → audio in browser → combine with Phase 2
4. **Phase 4** (5.5–11h): OpenClaw 4-agent pipeline → SSE progress bar → full orchestrator
5. **Phase 5** (11–16h): Debate agents → 7-label taxonomy → confidence formula
6. **Phase 6** (16–22h): Next.js frontend → verdict card → Solana Explorer link → audio player
7. **Phase 7** (22–23h): Browser extension → content script → popup → extension cache
8. **Phase 8** (23–24h): Sentry → rate limiting → Devpost submission → video → register truthcast.tech

---

## Do not

- Do not write Rust or Anchor programs. Use the Memo Program via JS only.
- Do not use `sqlite3` (use `better-sqlite3`).
- Do not use Manifest V2 for the extension.
- Do not use `localStorage` in the extension.
- Do not hardcode API keys anywhere — always read from `process.env`.
- Do not define Verdict types outside `packages/shared/schema.ts`.
- Do not run debate on claims with agreement_score ≥ 0.8 (fast path).
- Do not write to Solana mainnet under any circumstances.
