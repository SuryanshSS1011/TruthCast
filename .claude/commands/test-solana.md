# Test Solana

Run the Phase 1 Solana integration test. Verifies devnet connection, keypair, airdrop if needed, memo write, and Solana Explorer link.

Use the `solana-tester` subagent to run all 5 verification steps and report results.

This command should be run:
- After first setting up SOLANA_PRIVATE_KEY and SOLANA_RPC_URL in .env
- After any change to packages/pipeline/helpers.ts writeSolanaVerdict()
- Before the hackathon demo to confirm devnet is healthy
- If the publisher agent (Stage 5) is reporting Solana write failures in Sentry

Expected output: Explorer link to a live devnet transaction containing the test memo JSON.
