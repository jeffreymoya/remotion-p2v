# Maintainability Audit (ISO/IEC 25010) — 2026-01-25

Scope: Full repo scan with lint + TypeScript typecheck, spot reviews in `app/`, `src/lib/storyflow`, `components`, `remotion`. ISO 25010 maintainability facets: modularity, reusability, analyzability, modifiability, testability.

## Overall Status
- **Lint**: `npm run lint` passes.
- **Type safety**: `npm run typecheck` fails with 70+ errors across API routes, UI, and core services, blocking builds and reducing analyzability/testability.

## Findings by Facet

### Modularity
- **Leaky config coupling**: `src/lib/services/tts/index.ts` and `src/lib/services/tts/google-tts.ts` import `../../lib/config` / `../../lib/media-types`, which resolves to the non-existent `src/lib/lib/...`, breaking module boundaries and preventing reuse of the shared config layer.
- **Deprecated monolith**: `src/lib/board-planner.deprecated.ts` still referenced (TypeScript runs it) and depends on missing `AIProviderFactory` symbols, causing multiple build-time errors (e.g., lines ~243, ~378). Dead code blocks compilation and obscures the active architecture.

### Reusability
- **UI primitives diverge from consumers**: `components/ui/button.tsx` omits `asChild` and an `icon` size, yet consumers rely on both (`components/video/video-preview.tsx:101,111`, `components/boards/ImageUploader.tsx:181`). Divergence forces ad‑hoc workarounds and discourages reuse of the shared button.
- **Select component API mismatch**: `components/ui/select.tsx` uses raw `React.Children` traversal without typing, producing runtime-type `any` gaps and typecheck failures where `child.props.children` is assumed to exist (lines 29–46). Makes the component brittle and hard to reuse safely.

### Analyzability
- **JSON blobs with unsafe casting**: Multiple API routes cast Prisma `JsonValue` to domain arrays without guards, obscuring data shape during debugging and failing typecheck:
  - `app/api/script-builder/*/route.ts` cast `JsonArray` → `BeatDraft[]` and `ScriptSegment[]` without validation (e.g., `execute/route.ts:97`, `resume/route.ts:37`, `status/route.ts:29`).
  - `src/lib/storyflow/workflow-state.ts:38-79` casts `JsonArray` to `ScriptSegment[]`, `WordTimestamp[]`, `BeatDraft[]`, etc., with no runtime schema; type errors confirm unsound assumptions.
- **Missing modules/types**: `app/api/projects/[id]/timeline/route.ts` imports `../../lib/errors` that does not exist; `src/lib/config.ts` imports `AIProviderConfig` from `./types` (not exported). Such broken references block static analysis and hide actual error sources.
- **Undefined constants**: `src/lib/utils.ts` references `INTRO_DURATION_MS` (line 115) without import/definition; `src/lib/storyflow/timeline-builder.ts` references `DEFAULT_MUSIC_DUCKING`. These make reasoning about time calculations impossible at compile time.

### Modifiability
- **Schema drift in persistence layer**: API routes write fields that Prisma types reject:
  - `app/api/ai/refine/route.ts` writes `metadata` onto `project` despite schema lacking `metadata` type, forcing casts and causing TS2353/2339 errors.
  - `app/api/assets/upload/route.ts` assigns `AssetMetadata | null` directly to JSON field without converting `null` to `Prisma.JsonNull`.
  - `app/api/tts/generate-all/route.ts` and others store arrays (e.g., `ScriptSegment[]`) into Prisma JSON without serialization, violating expected `InputJsonObject` and breaking future schema changes.
- **Navigation data shape drift**: `components/layout/mobile-nav.tsx` and `components/layout/sidebar.tsx` assume `navigation` items include `disabled`, but the type doesn’t. Modifying navigation now requires editing multiple components instead of a single source of truth.
- **Viewport animation contracts**: `components/boards/ViewportPreview.tsx` assumes keyframes expose `time/x/y/scale` while the type definition only exposes viewport + frame range, resulting in dozens of TS2339/18048 errors. Changing animation model will cascade failures until the contract is clarified and centralized.

### Testability
- **Typecheck red status**: With TypeScript failing, CI pipelines cannot rely on static checks, reducing defect detection for test suites. Many failures stem from missing imports or wrong shapes rather than logic, meaning unit tests would also misbehave if added.
- **Unvalidated external inputs**: Config schemas use `z.any()` for providers (`src/lib/config.ts` lines 31–53) and optional fields without defaults, preventing deterministic fixtures and complicating test doubles for providers.
- **Large untyped utilities**: `normalizeTimeline` accepts `Record<string, unknown>` and returns `Timeline` via cast without validation (`src/lib/utils.ts:19-70`), making it difficult to craft reliable test data and detect regressions.

## Quick Wins (ordered)
1) Fix module paths and missing symbols so `npm run typecheck` passes (TTS imports, config types, missing `errors` module, undefined constants). This restores analyzability and unblocks CI.
2) Align shared UI primitives (`Button`, `Select`) with current usage or refactor consumers to the available API; add props typing to avoid `any` leakage.
3) Introduce Zod validation for Prisma JSON reads/writes (beats, scripts, viewport keyframes) and serialize to `Prisma.Json*` helpers to prevent schema drift.
4) Delete or quarantine `src/lib/board-planner.deprecated.ts` from the build (tsconfig `exclude` or migrate needed pieces) to reduce noise.
5) Replace `z.any()` provider configs with explicit schemas and defaults to enable stable mocks in tests.

## Suggested Next Steps
- Run `npm run typecheck` after each fix to retire the current error set; gate CI on typecheck.
- Add fast unit tests around `normalizeTimeline`, `ConfigManager.load*TTSConfig`, and viewport animation transforms to lock contract expectations.
- Centralize navigation item shape (single typed config) and re-export UI primitives with the agreed prop surface.
