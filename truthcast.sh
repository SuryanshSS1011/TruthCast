#!/bin/bash
cd /Users/suryanshss/TruthCast
/opt/homebrew/bin/npx tsx packages/pipeline/scripts/run-claim.ts "$1" 2>/dev/null
