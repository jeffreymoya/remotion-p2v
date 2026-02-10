# Regression Test Checklist

Date: January 31, 2026

Use this checklist before releases to verify the full web UI pipeline (CLI deprecated). Focus on user-visible flows, AI integrations, persistence, and rendering outputs. Skip items that are feature-flagged off (e.g., Script Builder) and note the flag state in test notes.

## Environment & Configuration
- `.env` present; required keys set: `GOOGLE_TTS_API_KEY`, `STORYFLOW_DATABASE_URL`/`DATABASE_URL`; optional: `ENABLE_SCRIPT_BUILDER`, provider overrides.
- Gemini CLI installed/authenticated (`gemini --version`); AI calls succeed from the app (no 401/timeout errors surfaced in UI logs).
- Database migrations applied (`npm run db:push:storyflow`); Prisma client generated.
- Public artifacts directory writable: `public/projects/<project-id>/` created on first run.
- Feature flags: record `ENABLE_SCRIPT_BUILDER` state; ensure legacy CLI UI not exposed.
- Security headers & cookies: CSP present, secure/sameSite cookies on auth.
- Missing/invalid provider keys handled gracefully (blocked flows, descriptive errors, no crash).

## Auth & Permissions
- Login/session flows work; session expiry logs user out and redirects without losing unsaved work.
- Unauthorized user cannot access another project's assets or API routes (UI + direct URL guard).
- CSRF/forged requests blocked on mutations.
- Feature-flagged routes/components hidden when flag off.

## Project Lifecycle
- Create project flow (`/projects/new`): name, aspect ratios (1:1, 4:5, 9:16, 16:9) selectable; project appears in list and navigates to overview.
- Project overview loads topic refinement panel; project metadata persisted after reload.
- Delete/cancel actions (if present) behave without orphaned artifacts.

## Topic Refinement
- Enter title+description; AI refinement returns optimized title, angles, hooks, suggested duration.
- "Start Over" resets refinement and allows re-run; history stored in metadata.
- Error handling: upstream AI error shows non-blocking toast and preserves user inputs.

## Script Generation
- Single-prompt generator: submits, returns segments ordered; handles re-run regenerations.
- Script Builder (when `ENABLE_SCRIPT_BUILDER=true`): multi-phase workflow completes all phases; segment edits saved.
- Validation: empty prompt blocked with inline error; long prompt still accepted.
- Persistence: segments reload after page refresh; no duplicate entries.

## TTS + Emphasis
- Emphasis analysis marks words as high/medium; shows in UI.
- Batch TTS generation runs to completion; per-segment audio files saved under `assets/audio/`.
- Per-segment regenerate replaces audio and timestamps; waveform/word highlights update.
- Failure mode: transient TTS error surfaces but does not delete existing audio.

## Assets Management
- Music tab: Pixabay search executes with API key; preview audio works; selecting a track saves choice + volume; persists after reload.
- Upload tab: image/audio/video upload accepts allowed types; upload progress + error states; files saved to correct subfolders (images/video/audio).
- Deleting/replacing assets updates timeline references (no broken links in preview).
- Large file handling: oversize or disallowed uploads blocked client/server-side with clear error; progress stable on 100MB+ files.
- Media completion guard: Media stage only advances when board prompts exist and at least one asset is present (guarded in status machine).

## Boards Pipeline
1. Media → Create & Upload tab: Config step saves duration + style guide; values persist.
2. Media → Create & Upload tab: Plan step groups script segments into boards; counts align with script segments.
3. Media → Create & Upload tab: Prompts step generates prompts per board; manual edits saved.
4. Media → Create & Upload tab: Upload step saves board images as `Asset` records (deterministic `{boardId}.*` filenames), attaches per board via `assetId`, handles re-upload, and shows missing image warnings with CTA back to Media.
5. Storyboard page: Regions step loads images via `assetId`; AI detects regions; canvas editor allows add/move/delete; saves to `board-regions.json`; missing-image state renders guidance + link to Media and allows retry.
6. Storyboard page: Triggers step generates word-level camera triggers aligned to regions; regenerating updates triggers without loss.
7. Storyboard page: Viewport build generates `viewport.json`; preview scrub works; missing-image state renders guidance + link to Media and allows retry; errors reported if upstream artifacts missing.

## Concurrency & Cache
- Same project opened in two tabs: edits reconcile without silent overwrite; mutation invalidates TanStack caches.
- Duplicate submissions (e.g., double-click generate/render) are prevented or deduped.
- Render re-run after edits uses latest artifacts (no stale data served from cache).

## Timeline Preview
- `/projects/[id]/preview` loads timeline with script captions, TTS audio, music mix, viewport motion.
- Seek/scrub works; captions sync with audio word timings; missing asset gracefully handled (placeholder, warning).
- Navigation links back to script/tts/boards for edits.

## Render
- `/projects/[id]/render`: quality presets selectable; render job starts and shows progress.
- Render outputs saved to `public/projects/<project-id>/renders/<render-id>.mp4`; download/playback works.
- Render handles absent optional music/boards gracefully.

## API & Error Handling
- API routes follow `withErrorHandler` pattern; malformed input returns ValidationError (400) without server crash.
- NotFound/Conflict errors surfaced correctly; no raw stack traces in responses.
- Retry/timeout logic uses `retry.ts` helpers for AI/IO operations (spot-check existing calls when touched).
- Background job resilience: render/AI/TTS jobs recover after restart, show failure states, and surface retry/queue status to user.
- Third-party outage handling: Pixabay/Gemini/TTS failures produce fallbacks or actionable errors; missing keys block flows safely.

## Persistence & Paths
- All file operations use `src/lib/paths.ts` helpers; artifacts appear in expected subfolders (assets, boards, viewport, renders).
- Cleaning a project (if feature exists) removes artifacts without touching other projects.
- Backups/restores: project artifacts restore correctly; migrations rollback does not corrupt data.
- Orphan cleanup: deleting/canceling projects removes associated assets/renders without affecting others.

## Queries & Caching
- Data fetching uses TanStack Query hooks in `src/hooks/queries`; loading/error states rendered; stale data invalidates after mutations.

## Accessibility & UI Polish
- Critical forms have client validation + disabled state during async actions.
- Buttons/links keyboard accessible; focus not lost after async completion on main flows.
- Toasts/alerts appear for success/failure on long-running steps.
- Mobile/responsive: core flows usable on phone viewport; Safari/Firefox smoke pass.
- A11y: contrast meets WCAG AA; landmarks/aria labels present; skip links on main pages.

## Observability & Logs
- AI calls logged via `AiLogger`/gateway; log viewer (if present) renders entries and errors.
- No secrets written to logs or UI; redact API keys in error messages.
- Sentry/monitoring: job failures raise alerts; queue depth visible; PII scrubbed from logs beyond AI keys.

## Regression Smoke (CLI Removed)
- Legacy CLI entry points not exposed in UI; no dead links referring to CLI.
- `npm run web:dev`, `npm run dev`, `npm run build`, `npm run lint`, `npm run test` succeed locally.

## Fast Sanity Sequence (for quick checks)
- Create project → refine topic → generate script → TTS → upload one image + select music → run boards (plan→prompts→regions→triggers→viewport) → preview → render a short video.

Document deviations, feature-flag states, API keys used, and links to failing artifacts (project IDs, render IDs) with each run.
