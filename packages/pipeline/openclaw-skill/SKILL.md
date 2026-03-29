---
name: truthcast
description: "Fact-check any claim using the TruthCast autonomous pipeline. Usage: /truthcast [claim] or mention @TruthCast with 'fact-check: [claim]'. Returns a verdict (TRUE/MOSTLY TRUE/MISLEADING/MOSTLY FALSE/FALSE/CONFLICTING/UNVERIFIABLE), confidence score, reasoning, source tiers, and Solana blockchain proof."
user-invocable: true
triggers:
  - fact-check
  - fact check
  - factcheck
  - is this true
  - is this accurate
  - verify this
  - check this claim
  - check if this is true
  - debunk
permissions:
  - exec
  - read
version: "2.0"
---

# TruthCast Fact-Checker

When the user asks you to fact-check a claim, run the TruthCast pipeline:

```bash
cd ~/TruthCast && npx tsx packages/pipeline/scripts/run-claim.ts "CLAIM_TEXT_HERE"
```

Replace `CLAIM_TEXT_HERE` with the exact claim the user provided, preserving punctuation and casing.

If the user provides a URL instead of a claim, run:
```bash
cd ~/TruthCast && npx tsx packages/pipeline/scripts/run-claim.ts --url "URL_HERE"
```

## Reading the output

The script prints a JSON verdict to stdout. Parse it and present the results in this format:

---
**Verdict: [verdict]** · [confidence]% confidence

**Reasoning:** [reasoning]

**Sources:**
- [domain extracted from url] · Tier [domain_tier] · [stance]

**On-chain proof:** https://explorer.solana.com/tx/[tx_hash]?cluster=devnet
---

If `debate_triggered` is true, add a line: *"Adversarial debate was triggered due to conflicting evidence."*

If `minority_view` is not null, add: *"Minority view: [minority_view]"*

If `tx_hash` is null, omit the on-chain proof line and note the local verdict is still valid.

## Error handling

If the script exits with a non-zero code, tell the user the pipeline encountered an error and show the stderr output.

If the claim is longer than 2000 characters, truncate to the first 2000 characters and note the truncation.
