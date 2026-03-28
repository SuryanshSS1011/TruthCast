# TruthCast

**Autonomous AI Fact-Checking with Immutable Blockchain Provenance**

TruthCast is a fully autonomous, multi-agent fact-checking pipeline that receives a claim as input, decomposes it, retrieves and evaluates evidence from multiple sources, produces a credibility-weighted verdict through adversarial debate, and writes the result to an immutable Solana ledger.

---

## Architecture

- **6-stage multi-agent pipeline** using OpenClaw framework
- **Gemini API** with google_search grounding for evidence retrieval
- **MBFC dataset** (~4,000 expert-rated domains) for source credibility scoring
- **Adversarial debate layer** for ambiguous claims (agreement_score < 0.8)
- **7-label verdict taxonomy**: TRUE, MOSTLY_TRUE, MISLEADING, MOSTLY_FALSE, FALSE, CONFLICTING, UNVERIFIABLE
- **Solana Memo Program** for immutable on-chain verdict storage
- **SQLite off-chain index** for fast cache lookups
- **ElevenLabs TTS** for natural voice verdicts
- **Next.js frontend** with real-time SSE progress bar
- **Chrome Manifest V3 extension** for in-browser fact-checking

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in the required values:

```env
# Required for Phase 1 (Solana test)
SOLANA_PRIVATE_KEY=       # Will be generated on first run if not set
SOLANA_RPC_URL=https://api.devnet.solana.com

# Required for full pipeline (add these later)
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

### 3. Phase 1: Test Solana Integration

**This is the critical first step.** Before building any AI code, we must prove the Solana blockchain integration works.

```bash
npm run test-solana --workspace=packages/pipeline
```

This script will:
1. Connect to Solana devnet
2. Generate a keypair (if you don't have one)
3. Request an airdrop of 1 SOL
4. Write a test message using the Memo Program
5. Output a Solana Explorer link to verify the transaction

**Expected output:**

```
=== TruthCast Phase 1: Solana Integration Test ===

1. Connecting to Solana devnet: https://api.devnet.solana.com
2. Generating new keypair (no SOLANA_PRIVATE_KEY found)
   Public Key: 7xKwV...
   Private Key (Base58): 5j8k...

   ⚠️  Save this private key to .env as SOLANA_PRIVATE_KEY

3. Current balance: 0 SOL
   Requesting airdrop of 1 SOL...
   New balance: 1 SOL

4. Writing test memo to Solana devnet...

✅ SUCCESS! Transaction confirmed on Solana devnet

   Transaction Signature: 3Zx4...
   Solana Explorer: https://explorer.solana.com/tx/3Zx4...?cluster=devnet

=== Phase 1 Complete ===
```

**If successful:**
1. Copy the Private Key to your `.env` file as `SOLANA_PRIVATE_KEY`
2. Click the Solana Explorer link to verify the transaction on-chain
3. Proceed to Phase 2

**If the test fails:**
- Check your internet connection
- Verify `SOLANA_RPC_URL` is set correctly
- If airdrop fails, devnet may be congested - retry in a few minutes

---

## Build Order (8 Phases)

Follow this exact sequence from the Architecture Plan:

### Phase 1 (0–1.5h) ✅ COMPLETE
- [x] Solana Memo write with hardcoded string
- [x] Confirm transaction on Solana Explorer
- [x] SQLite schema and init

### Phase 2 (1.5–4h)
- [ ] Gemini grounded verdict (single API call with google_search tool)
- [ ] MBFC domain scoring
- [ ] Test on 5 pre-selected demo claims

### Phase 3 (4–5.5h)
- [ ] ElevenLabs TTS integration
- [ ] Audio playback in browser
- [ ] Combine Phase 2 + 3 for end-to-end claim → voice verdict

### Phase 4 (5.5–11h)
- [ ] OpenClaw 4-agent pipeline (ingestion → researcher → moderator → publisher)
- [ ] SSE progress bar with real-time updates
- [ ] Claim decomposition (HiSS method)
- [ ] Checkworthiness filter

### Phase 5 (11–16h)
- [ ] Debate agents (affirmative + negative)
- [ ] 7-label verdict taxonomy
- [ ] Confidence formula implementation
- [ ] Sub-claim aggregation rules

### Phase 6 (16–22h)
- [ ] Next.js frontend
- [ ] Verdict card component
- [ ] Solana Explorer link
- [ ] Audio player
- [ ] Real-time SSE progress bar

### Phase 7 (22–23h)
- [ ] Chrome Manifest V3 extension
- [ ] Content script (text selection + floating button)
- [ ] Background script (context menu + API calls)
- [ ] Popup UI (verdict display)
- [ ] Local cache (chrome.storage.local)

### Phase 8 (23–24h)
- [ ] Sentry integration
- [ ] API rate limiting
- [ ] Devpost submission
- [ ] 5-minute demo video
- [ ] Domain registration (truthcast.tech)

---

## Repository Structure

```
truthcast/
├── packages/
│   ├── shared/               # Single source of truth for types
│   │   ├── schema.ts         # Zod VerdictSchema (import everywhere)
│   │   ├── mbfc.json         # MBFC expert-rated domains
│   │   └── constants.ts      # TTL policies, verdict labels, aggregation rules
│   ├── pipeline/             # OpenClaw agents + orchestrator
│   │   ├── agents/           # YAML configs (one per agent)
│   │   ├── scripts/          # Node.js fallback scripts
│   │   ├── db/               # SQLite schema + init
│   │   ├── normalize.ts      # Claim normalization + SHA-256 hashing
│   │   ├── helpers.ts        # buildUnverifiableVerdict, writeSolanaVerdict, elevenLabsTTS
│   │   └── orchestrator.ts   # runPipeline(), pipelineEmitter, runWithTimeout()
│   ├── web/                  # Next.js app
│   │   └── app/
│   │       ├── api/check/route.ts        # POST - starts pipeline, returns session_id
│   │       └── api/check/stream/route.ts # GET - SSE stream keyed by session_id
│   └── extension/            # Chrome Manifest V3
│       ├── manifest.json
│       ├── content.js        # Text selection + floating button
│       ├── background.js     # Context menu + API calls + cache
│       └── popup/            # Verdict display UI
├── .env.example              # All required env vars listed
├── package.json              # npm workspaces root
├── CLAUDE.md                 # Complete project conventions and rules
└── README.md                 # This file
```

---

## Critical Package Constraints

| Purpose | Package | Do NOT use |
|---|---|---|
| SQLite | `better-sqlite3` | `sqlite3` (async, worse for this) |
| Solana | `@solana/web3.js` + `@solana/spl-memo` | Any other Solana lib |
| Schema validation | `zod` | `joi`, `yup`, manual validation |
| Error monitoring | `@sentry/node` + `@sentry/nextjs` | Any other tracker |
| Research LLM | Gemini `gemini-2.0-flash` | Any other model for Stage 2 |
| Voice TTS | ElevenLabs | Any other TTS service |

---

## Key Design Decisions

### Why Solana?
A database can be edited, deleted, or taken offline. Once a verdict is written to Solana, it is **permanent**. No company, government, or bad actor can change it. This is architecturally impossible with any centralized database.

### Why Multi-Agent Debate?
Single-agent systems are vulnerable to misleading evidence. When high-quality sources genuinely disagree, TruthCast runs adversarial debate (affirmative vs. negative agents) and returns a `CONFLICTING` verdict with the strongest arguments from both sides. This intellectual honesty is a feature, not a limitation.

### Why 7-Label Taxonomy?
Binary TRUE/FALSE is insufficient for real-world claims. Claims involving cherry-picked evidence, outdated sources, or genuine expert disagreement require nuanced labels like `MISLEADING`, `CONFLICTING`, and `MOSTLY_TRUE`.

### Why MBFC Dataset?
Domain-level credibility scoring is the strongest available signal for source quality. MBFC provides ~4,000 expert-rated domains with Mean Absolute Error of 0.09 on source credibility prediction—far better than any ML-generated score.

---

## Research Foundations

Every architectural decision maps to peer-reviewed research (2023–2026):

- **Standard fact-checking pipeline**: Guo et al., TACL 2022
- **Atomic claim decomposition**: Chen et al., ACL 2025 (HiSS method)
- **Checkworthiness classification**: Konstantinovskiy et al., 2018 (Full Fact)
- **Source credibility scoring**: WebTrust 2025 (Tsinghua/Chandigarh)
- **Adversarial debate**: He et al., WWW 2026 (DebateCV)
- **Explainable verdicts**: Kim et al., arXiv 2024 (MADR)

---

## Demo Claims (Pre-selected for Testing)

1. **"The Great Wall of China is visible from space with the naked eye."**
   → Expected: `FALSE` (NASA sources, high confidence)

2. **"Vaccines cause autism."**
   → Expected: `FALSE` (WHO, CDC, peer-reviewed studies)

3. **"NASA confirmed the existence of water ice on the Moon."**
   → Expected: `TRUE` (shows system handles TRUE claims honestly)

4. **"Social media companies do more harm than good for democracy."**
   → Expected: `UNVERIFIABLE` (opinion, checkworthiness filter)

5. **"5G towers were used to spread COVID-19 and were destroyed in protests across Europe."**
   → Expected: `MISLEADING` (compound: towers destroyed = TRUE, 5G spreads COVID = FALSE)

---

## Next Steps

After Phase 1 completes successfully:

1. **Get API Keys:**
   - Gemini API: https://makersuite.google.com/app/apikey
   - ElevenLabs: https://elevenlabs.io/api
   - Sentry: https://sentry.io/signup/

2. **Phase 2:** Build Gemini evidence retrieval + MBFC scoring

3. **Phase 3:** Add ElevenLabs TTS

4. **Phase 4:** Build OpenClaw multi-agent pipeline

See `CLAUDE.md` and `TruthCast_Architecture_Plan.pdf` for complete technical specifications.

---

## License

MIT

---

## Contact

Built for HackPSU Spring 2026 (March 28–29, 2026)

**Team:** TruthCast
**University:** Penn State
**Hackathon:** HackPSU Spring 2026
