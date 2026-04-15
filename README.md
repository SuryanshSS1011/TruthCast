# TruthCast

<div align="center">

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana)](https://explorer.solana.com/?cluster=devnet)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

**Autonomous AI Fact-Checking with Immutable Blockchain Provenance**

[Demo](https://truthcast.tech) · [Architecture](#architecture) · [Quick Start](#quick-start) · [API Reference](#api-endpoints)

</div>

---

## Overview

TruthCast is a fully autonomous, multi-agent fact-checking pipeline that:

1. **Receives** a claim as input (text or URL)
2. **Decomposes** it into atomic sub-claims using the HiSS method
3. **Retrieves** evidence from multiple sources via Gemini API with google_search grounding
4. **Evaluates** source credibility using the MBFC dataset (~4,000 expert-rated domains)
5. **Debates** ambiguous claims through adversarial AI agents (when agreement < 80%)
6. **Produces** a credibility-weighted verdict with 7-label taxonomy
7. **Writes** the result to an immutable Solana ledger
8. **Generates** a natural voice summary via ElevenLabs TTS

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TruthCast Pipeline                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌───────┐ │
│  │  Input  │───▶│ Ingestion│───▶│Researcher│───▶│ Moderator │───▶│Publish│ │
│  │ (Claim) │    │ Stage 1  │    │ Stage 2  │    │  Stage 3  │    │Stage 4│ │
│  └─────────┘    └──────────┘    └──────────┘    └───────────┘    └───────┘ │
│                      │              │                │               │      │
│              ┌───────┴───────┐     │         ┌──────┴──────┐       │      │
│              │ Checkworthy   │     │         │ Debate      │       │      │
│              │ + Decompose   │     │         │ (if <80%)   │       │      │
│              └───────────────┘     │         └─────────────┘       │      │
│                                    │                               │      │
│                           ┌────────┴────────┐             ┌────────┴────┐ │
│                           │ Gemini API      │             │ • Solana TX │ │
│                           │ + MBFC Scoring  │             │ • SQLite    │ │
│                           └─────────────────┘             │ • TTS Audio │ │
│                                                           └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Research** | Gemini 2.0 Flash | Evidence retrieval with google_search grounding |
| **Credibility** | MBFC Dataset | ~4,000 expert-rated domains for source scoring |
| **Debate** | Adversarial Agents | Pro/Con debate for claims with <80% agreement |
| **Verdicts** | 7-Label Taxonomy | TRUE, MOSTLY_TRUE, MISLEADING, MOSTLY_FALSE, FALSE, CONFLICTING, UNVERIFIABLE |
| **Immutability** | Solana Memo | Permanent on-chain verdict storage (devnet) |
| **Voice** | ElevenLabs TTS | Natural voice verdict summaries |
| **Frontend** | Next.js 14 | Real-time SSE progress streaming |
| **Database** | SQLite + better-sqlite3 | Fast verdict caching with TTL policies |

---

## Quick Start

### Prerequisites

- Node.js >= 22.0.0
- npm >= 9.0.0

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/TruthCast.git
cd TruthCast
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in required API keys in `.env`:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key
SOLANA_PRIVATE_KEY=your_solana_private_key
SOLANA_RPC_URL=https://api.devnet.solana.com

# Optional (for voice summaries)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL  # Sarah voice

# Optional (for error tracking)
SENTRY_DSN=your_sentry_dsn
```

**Get API Keys:**
- Gemini: https://makersuite.google.com/app/apikey
- ElevenLabs: https://elevenlabs.io/api
- Sentry: https://sentry.io/signup/

### 3. Generate Solana Keypair (if needed)

```bash
npm run test-solana
```

This will:
1. Generate a new keypair (if not set)
2. Request a devnet airdrop
3. Write a test memo to verify the connection

Copy the generated private key to your `.env` file.

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 to use TruthCast.

### 5. Build for Production

```bash
npm run build
```

---

## API Endpoints

### POST /api/check

Start a new fact-check pipeline.

**Request:**
```json
{ "claim": "Your claim text here" }
```

**Response:**
```json
{ "session_id": "uuid-v4" }
```

### GET /api/check/stream?session={uuid}

Server-Sent Events stream for real-time progress updates.

**Events:**
- `progress` - Stage started with progress percentage
- `stage_complete` - Stage finished with results
- `complete` - Full pipeline finished, includes verdict
- `error` - Pipeline failed

### GET /api/review/{claim_hash}

Retrieve a cached verdict by claim hash.

### GET /api/stats

Get aggregated platform statistics.

### GET /api/history

Get recent verdicts with pagination.

---

## Project Structure

```
truthcast/
├── packages/
│   ├── shared/               # Shared types and constants
│   │   ├── schema.ts         # Zod VerdictSchema (single source of truth)
│   │   ├── constants.ts      # TTL policies, aggregation rules
│   │   └── mbfc.json         # MBFC expert-rated domains (~4000)
│   │
│   ├── pipeline/             # Core fact-checking engine
│   │   ├── orchestrator.ts   # Main pipeline coordinator
│   │   ├── checkworthiness.ts# Full Fact criteria filter
│   │   ├── decomposition.ts  # HiSS atomic claim extraction
│   │   ├── gemini-researcher.ts # Evidence retrieval
│   │   ├── mbfc-scorer.ts    # Domain credibility scoring
│   │   ├── debate.ts         # Adversarial debate system
│   │   ├── helpers.ts        # Solana write, TTS generation
│   │   └── db/init.ts        # SQLite connection + cache
│   │
│   └── web/                  # Next.js 14 frontend
│       ├── app/              # App Router pages
│       │   ├── api/          # API routes
│       │   ├── verdict/      # Verdict detail pages
│       │   └── page.tsx      # Homepage
│       └── components/       # React components
│           └── mui/          # MUI-based UI components
│
├── .env.example              # Environment template
├── package.json              # Workspace root
└── README.md                 # This file
```

---

## Verdict Taxonomy

| Label | Description | Confidence Range |
|-------|-------------|------------------|
| **TRUE** | Claim is accurate based on reliable sources | 70-100% |
| **MOSTLY_TRUE** | Claim is largely accurate with minor issues | 60-85% |
| **MISLEADING** | Contains truth but misrepresents context | 50-75% |
| **MOSTLY_FALSE** | Claim has significant inaccuracies | 40-65% |
| **FALSE** | Claim is factually incorrect | 50-100% |
| **CONFLICTING** | Reliable sources disagree | 40-60% |
| **UNVERIFIABLE** | Cannot be fact-checked (opinion/prediction) | 0% |

---

## Testing

```bash
# Test Solana integration
npm run test-solana

# Test Gemini API
npm run test-gemini --workspace=packages/pipeline

# Test ElevenLabs TTS
npm run test-phase3 --workspace=packages/pipeline

# Test full pipeline
npm run test-phase4 --workspace=packages/pipeline
```

---

## Demo Claims

Test the pipeline with these pre-selected claims:

1. **"The Great Wall of China is visible from space with the naked eye."**
   - Expected: `FALSE` (NASA sources confirm this is a myth)

2. **"Vaccines cause autism."**
   - Expected: `FALSE` (WHO, CDC, peer-reviewed studies)

3. **"NASA confirmed the existence of water ice on the Moon."**
   - Expected: `TRUE` (verified by multiple NASA missions)

4. **"Social media companies do more harm than good for democracy."**
   - Expected: `UNVERIFIABLE` (opinion, fails checkworthiness)

5. **"5G towers were used to spread COVID-19 and were destroyed in protests across Europe."**
   - Expected: `MISLEADING` (towers destroyed = true, 5G spreads COVID = false)

---

## Key Design Decisions

### Why Solana?

A database can be edited, deleted, or taken offline. Once a verdict is written to Solana, it is **permanent**. No company, government, or bad actor can change it.

### Why Multi-Agent Debate?

Single-agent systems are vulnerable to misleading evidence. When high-quality sources genuinely disagree, TruthCast runs adversarial debate and can return a `CONFLICTING` verdict with arguments from both sides.

### Why 7-Label Taxonomy?

Binary TRUE/FALSE is insufficient. Real-world claims involving cherry-picked evidence, outdated sources, or genuine expert disagreement require nuanced labels.

### Why MBFC Dataset?

Domain-level credibility scoring is the strongest signal for source quality. MBFC provides ~4,000 expert-rated domains with high accuracy.

---

## Research Foundations

- **Standard fact-checking pipeline**: Guo et al., TACL 2022
- **Atomic claim decomposition**: Chen et al., ACL 2025 (HiSS method)
- **Checkworthiness classification**: Konstantinovskiy et al., 2018 (Full Fact)
- **Source credibility scoring**: WebTrust 2025 (Tsinghua/Chandigarh)
- **Adversarial debate**: He et al., WWW 2026 (DebateCV)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini API key for research |
| `SOLANA_PRIVATE_KEY` | Yes | Base58 encoded Solana keypair |
| `SOLANA_RPC_URL` | Yes | Solana RPC endpoint (devnet) |
| `ELEVENLABS_API_KEY` | No | ElevenLabs API for TTS |
| `ELEVENLABS_VOICE_ID` | No | Voice ID (default: Sarah) |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `SQLITE_PATH` | No | Custom SQLite path |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org), [Solana](https://solana.com), [Gemini](https://ai.google.dev)
- Source credibility data from [Media Bias/Fact Check](https://mediabiasfactcheck.com)
- Voice synthesis by [ElevenLabs](https://elevenlabs.io)

---

<div align="center">

**TruthCast** - Verifiable facts, permanent record.

</div>
