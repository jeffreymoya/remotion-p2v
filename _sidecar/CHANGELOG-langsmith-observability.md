# CHANGELOG — LangSmith Observability

**Plan**: `PLAN-langsmith-observability.md`  
**Date**: 2025-01-XX  
**Status**: Complete (typecheck green)

---

## Summary

Added LangSmith tracing across the full inspire pipeline using `traceable` wrappers and a canonical `enrichCurrentRun` helper. Every pipeline phase now emits structured spans with metadata (slug, topic, phase, provider, cacheHit, etc.) to LangSmith. Added an analytics script for querying run data and a kill-switch via `LANGSMITH_TRACING=false`.

## Files Changed

### New Files

| File | Purpose |
|---|---|
| `src/lib/tracing.ts` | `SpanMeta` interface, `buildTags()`, `enrichCurrentRun()` helper |
| `scripts/inspire-analytics.ts` | CLI analytics script — queries LangSmith runs by slug, reports per-phase latency, token usage, cache hits, gate blocks, video sources |

### Modified Files

| File | Change |
|---|---|
| `src/lib/deepseek.ts` | Token usage extraction (`usage_metadata`) on both chat/JSON impls; `enrichCurrentRun({ provider: "deepseek" })` |
| `src/lib/tts-google.ts` | `enrichCurrentRun({ phase: "tts", provider: "google-tts" })` |
| `src/lib/tts-elevenlabs.ts` | `enrichCurrentRun({ phase: "tts", provider: "elevenlabs" })` |
| `src/lib/inspire/pixabay-video-client.ts` | `enrichCurrentRun({ phase: "videos", provider: "pixabay" })` |
| `src/lib/inspire/pexels-video-client.ts` | `enrichCurrentRun({ phase: "videos", provider: "pexels" })` |
| `src/lib/inspire/inspire-pipeline.ts` | Wrapped 4 phase functions (`runNarrationPhase`, `runTtsPhase`, `runVideoPhase`, `runArtDirectPhase`) with `traceable`; enriched with slug/topic/phase/cacheHit |
| `src/lib/inspire/longform-pipeline.ts` | Added `enrichCurrentRun({ slug, topic })` in root pipeline impl |
| `src/lib/inspire/refine/refine-chapter.ts` | Wrapped `refineChapter` with `traceable`; enriched with slug/topic/phase:refine/chapterRole |
| `src/lib/inspire/proofread/proofreader.ts` | Wrapped `proofreadScript` with `traceable`; enriched with phase:proofread |
| `src/lib/inspire/research/research-pipeline.ts` | Wrapped `runResearchPhase` with `traceable`; wrapped Exa search in traceable retriever span with cache-hit tag |
| `src/lib/inspire/research/corpus-builder.ts` | Wrapped `buildCorpus` with `traceable` |
| `src/lib/inspire/research/topical-queries.ts` | Wrapped `planTopicalQueries` with `traceable` |
| `src/lib/inspire/research/research-brainstorm.ts` | Wrapped `brainstormCandidates` with `traceable` |
| `src/lib/inspire/research/anchor-verifier.ts` | Wrapped `verifyAnchor` with `traceable` |
| `src/lib/config.ts` | Added `LANGSMITH_TRACING_ENABLED` config constant |
| `scripts/inspire.ts` | Added tracing kill-switch guard at entrypoint |
| `CLAUDE.md` | Documented `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `LANGSMITH_TRACING` env vars |

## Deviations from Plan

1. **Skipped `withTrace` abstraction** — The plan proposed a `withTrace(fn, opts)` factory. Instead used the existing codebase pattern of `traceable(fnImpl, { name, run_type })` directly at module level. This is simpler, consistent with the project, and avoids an unnecessary abstraction layer.

2. **`runComposePhase` not wrapped** — This function is synchronous (no I/O). `traceable` returns an async wrapper, which would change the function signature. Left as a direct alias.

3. **`runGates` not wrapped** — This is a pure aggregator that calls already-traced gate functions. Wrapping it would add noise without insight.

## Verification

- `npm run typecheck` — passes clean (zero errors)
