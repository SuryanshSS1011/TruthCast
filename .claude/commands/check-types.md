# Check Types

Run TypeScript compilation check across all packages in the mono-repo. Reports errors with file locations and line numbers.

```bash
echo "=== TypeScript check: packages/shared ===" && \
  cd packages/shared && npx tsc --noEmit 2>&1 && cd ../.. && \
echo "=== TypeScript check: packages/pipeline ===" && \
  cd packages/pipeline && npx tsc --noEmit 2>&1 && cd ../.. && \
echo "=== TypeScript check: packages/web ===" && \
  cd packages/web && npx tsc --noEmit 2>&1 && cd ../.. && \
echo "=== All checks complete ==="
```

If errors are found, fix them before committing. Pay special attention to:
- Types imported from wrong location (must be from @truthcast/shared/schema)
- Missing await on async functions
- Null/undefined not handled in getCachedVerdict return value
- Verdict fields missing from objects
