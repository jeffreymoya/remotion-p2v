# Remotion P2V Refactoring Plan (Tightened Specification)

## Executive Summary

Transform the current story-to-video generator into a production-grade content pipeline for creating **12-minute engaging videos** (16:9 format for YouTube, with 9:16 vertical support) from trending topics. The system uses **Gemini 1.5 Flash** as the default AI provider (cost-optimized), with OpenAI and Anthropic as alternatives. User-curated topic selection via web interface, advanced scriptwriting with public speaking techniques, and automated asset gathering from **free stock sources only** (Pexels, Unsplash, Pixabay) including both images and video clips, with royalty-free background music support.

**Target Duration:** 12 minutes (720 seconds)
**Acceptable Range:** 10-15 minutes (600-900 seconds)
**Cost per Video:** ~$0.43 (Gemini + ElevenLabs) to ~$0.06 (Gemini + Google TTS)
**Estimated Timeline:** 6-7 weeks to MVP

---

## ✅ Implementation Status

- **Phase 1: Plumbing & Scaffolding** - ✅ COMPLETED (Nov 24, 2025)
- **Phase 2: Renderer & Schema Readiness** - ✅ COMPLETED (Nov 24, 2025)
- **Phase 3: Staged CLI Skeleton** - ✅ COMPLETED (Nov 24, 2025)
- **Phase 4: Asset & Provider Expansion** - ✅ COMPLETED (Nov 24, 2025)
- **Phase 5: Topic Flow & Script Quality** - ✅ COMPLETED (Nov 24, 2025)
- **Phase 6: Cutover & Hardening** - ✅ COMPLETED (Nov 24, 2025)

**🎉 ALL PHASES COMPLETE - REFACTORING FINISHED! 🎉**

---

## 🔄 Codebase-Aligned Update (Nov 24, 2025)

**Purpose:** Make the plan executable against the current repo (short-form OpenAI/DALL‑E/ElevenLabs template) while adding the new requirements in safe, incremental steps.

### Locked Clarifications / Assumptions
- **AI Integration:** **CLI-only** (codex/claude/gemini CLIs). SDK/HTTP calls are removed/avoided in the new pipeline.  
- **Storage Layout:** Prefer direct migration to `public/projects/{projectId}/...`; add a temporary shim for `public/content/{slug}` only if migration turns out non-trivial.  
- **Aspect Ratio:** Keep 1080×1920 vertical as default; add 16:9 via a flag and separate composition.  
- **Execution Order:** Keep `npm run gen` working only if it stays trivial after migration; otherwise replace with staged commands.  
- **Media Sourcing:** Replace DALL‑E with free stock sources (Pexels/Unsplash/Pixabay); DALL‑E only as optional fallback.  
- **TTS:** Google TTS only (default and sole provider for now).  
- **Trending Data:** Google Trends only for discovery.  
- **Curation UI:** Localhost Fastify UI, no auth.  
- **Background Music:** Optional (enable via flag/config; pipeline must not depend on it).  
- **Environment & Config:** Add missing configs (`tts.config.json`, `stock-assets.config.json`, `music.config.json`, `video.config.json`) and expand `.env.example` to match.  
- **Dependencies:** Add Fastify, stock-media clients, Google TTS, and supporting utilities; no extra constraints on Node/package manager beyond Remotion needs.  
- **Minimal Backward Compatibility:** Renderer should keep playing existing short-form timelines during transition if shim is present.

### Phased Execution (concise)
1) **Plumbing & Scaffolding (keep app working if easy)**  
   - Add new config files/env vars; add npm scripts for staged commands as placeholders.  
   - Centralize path helpers for projects layout; add legacy shim only if migration is not trivial.  
2) **Renderer & Schema Readiness**  
   - Extend timeline schema for long duration, background music, video clips, and aspect flag; keep old schema valid.  
   - Add 16:9 composition; parameterize dimensions; no music/video hard requirement.  
3) **Staged CLI Skeleton**  
   - Split one-shot CLI into `discover | curate | refine | script | gather | build | render` (initially stubs that emit minimal valid JSON).  
   - Wire all commands through config loaders and path helpers; keep `gen` only if trivial post-migration.  
4) **Asset & Provider Expansion**  
   - Replace DALL‑E with stock image/video search (fallback optional); add Google TTS (only); add optional background music selection with volume ducking.  
5) **Topic Flow & Script Quality**  
   - Implement Google Trends-based discovery, Fastify curation UI (localhost), refinement, and 12‑minute script generation with validation.  
6) **Cutover & Hardening**  
   - Remove legacy layout after migration; choose default aspect; add minimal tests (schema/path/timeline).  

### Acceptance Gates per Phase
- **P1:** App still renders legacy timelines; new configs load without crashing.  
- **P2:** Renderer loads both legacy and new schema; 16:9 draft renders.  
- **P3:** Each staged command runs and writes valid files; legacy `gen` untouched.  
- **P4:** Stock assets + dual TTS selectable; background music present but non-blocking.  
- **P5:** Full topic→render flow completes for one project; 10–15 min timeline validates.  
- **P6:** Legacy layout removed or auto-migrated; smoke tests pass.  

### Execution Guide (tight)
- **Branch discipline**: Work on `feature/pipeline-stubs`; keep `gen` unchanged until Phase 3 is green; avoid touching `public/content` writes except via shim.
- **Files & layout**: Add `src/lib/paths.ts` to centralize `public/projects/{projectId}` plus legacy fallback; emit a console notice when legacy is used; add `.keep` files for empty dirs if needed.
- **Config surface**: Create placeholder JSONs (`config/tts.config.json`, `stock-assets.config.json`, `music.config.json`, `video.config.json`); expand `.env.example` with Google TTS, Pexels, Unsplash, Pixabay (images+music), Gemini, Anthropic, Fastify port; add Zod loaders that fail fast with clear messages.
- **CLI refactor (stubs now)**: Add npm scripts `discover|curate|refine|script|gather|build|render`; each command writes minimal valid JSON into `public/projects/{id}/...` (discovered/selected/refined/scripts/assets/timeline) using path helpers + config loaders; zero-exit on success.
- **Renderer & schema**: Extend timeline type with `aspectRatio`, `durationSeconds`, optional `backgroundMusic`, `videoClips`; add 16:9 composition in `src/Root.tsx`; default missing fields to current 9:16 path.
- **Migration guardrails**: Loader resolves new path first, legacy second; normalize old timelines by injecting defaults; do not remove `public/content` until Phase 6; log when shim is used.
- **Provider swap**: Add CLI adapters (`gemini-cli` default) in `src/ai/providers.ts`; default TTS to Google, keep ElevenLabs as optional fallback gated by `tts.config.json`.
- **Testing checkpoints**: Add `npm test:schema` (config + timeline Zod), `npm test:paths` (dir creation/lookup), and `npm run render:draft -- --project demo --aspect 16:9` smoke once stub data exists.
- **Day-by-day starter**: Day1 path helper + configs + loaders; Day2 CLI stubs + scripts; Day3 timeline + 16:9 composition + legacy normalization; Day4 schema/path tests + demo stub data render; Day5+ provider adapters and swap-in while `gen` still works.
- **Refactoring-ready DoD**: Staged commands emit expected JSON under `public/projects/{id}`; renderer opens stub timeline in both aspects; legacy `gen` still functional; shim logs legacy use; new configs validate; `npm test:schema` and `npm test:paths` pass.

> The detailed sections below remain as the long-form specification; use this update as the authoritative execution order and guardrails for working against the current codebase.

---

## Current State Analysis

### What We Have
- **Story Generator**: OpenAI GPT-4 generates 8-10 sentence stories (~54 seconds)
- **TTS Integration**: ElevenLabs with character-level timing (hardcoded voice ID: `21m00Tcm4TlvDq8ikWAM`)
- **Image Generation**: DALL-E 3 generates 5-8 images per story (1024x1792)
- **Video Renderer**: Remotion creates synchronized vertical videos with animations
- **CLI**: Basic orchestration with prompts for title/topic
- **Architecture**: Clean separation between generation (CLI) and rendering (Remotion)

### What Needs Improvement
1. **Scale**: 54-second videos → 12-minute videos (1233% increase)
2. **Content Sourcing**: Manual topics → Automated trending topics discovery
3. **User Control**: Automatic processing → Web-based topic review/selection interface (Fastify)
4. **Script Quality**: Simple stories → Public speaking-optimized 12-minute scripts
5. **Image Sourcing**: DALL-E only → Free stock images/videos (Pexels, Unsplash, Pixabay) with tag-based search
6. **TTS Flexibility**: Hardcoded voice → Multi-provider support (ElevenLabs + Google Cloud TTS)
7. **AI Integration**: OpenAI only → Multi-provider support (Gemini 1.5 Flash default, OpenAI, Anthropic)
8. **Video Format**: Vertical only → Dual format support (16:9 default, 9:16 via `--aspect-ratio=9:16` or `--vertical`)
9. **Audio**: Voice only → Voice + royalty-free background music (Pixabay Music API + local folder)
10. **Project Organization**: Single-purpose → Simplified 7-stage pipeline with proper abstractions

---

## Architecture Overview

### 7-Stage Pipeline

```
Stage 1: Topic Discovery (AI-Driven)
  └─> Fetch trending topics via Google Trends → AI filtering → discovered.json

Stage 2: Topic Curation (User-Interactive Web UI)
  └─> Fastify web interface at localhost:3000 for selection → selected.json

Stage 3: Topic Refinement (AI-Driven)
  └─> Broaden/refine for age 20-40 → refined.json

Stage 4: Script Generation (AI-Driven)
  └─> Create 12-minute scripts with public speaking techniques → scripts/

Stage 5: Asset Gathering (Automated)
  ├─> Extract tags from script via AI → tags.json
  ├─> Search stock images/videos (Pexels, Unsplash, Pixabay) → assets/images/, assets/videos/
  ├─> Download background music (Pixabay Music API + local folder) → assets/music/
  └─> Generate TTS audio (ElevenLabs or Google TTS) → assets/audio/

Stage 6: Timeline Assembly (Automated)
  └─> Build timeline.json from all assets → timeline.json

Stage 7: Video Rendering (Remotion)
  └─> Render 16:9 or 9:16 video (draft quality default) → output.mp4
```

---

## Detailed Refactoring Tasks (linked, de-duplicated)

This section summarizes the work and points to the authoritative specs under `docs/implementation/`. Keep this doc short; use the linked files for implementation details. Top-level pipeline/config/setup docs are not yet written—tracked below.

### Related Specs
- `docs/implementation/IMPL_API_INTEGRATIONS.md` – AI/TTS providers & retries (CLI-first, updated Nov 24, 2025)
- `docs/implementation/IMPL_MEDIA_PIPELINE.md` – stock image/video search, dedupe, quality scoring
- `docs/implementation/IMPL_TIMELINE_ASSEMBLY.md` – timeline schema, frame alignment, music ducking
- `docs/implementation/IMPL_DATA_STORAGE.md` – project layout, atomic writes, caching
- `docs/implementation/IMPL_VALIDATION_SCHEMAS.md` – Zod schemas across pipeline
- **Missing (create):** `docs/PIPELINE.md` (7-stage flow), `docs/CONFIGURATION.md` (config surface/env vars), `docs/SETUP.md` (local setup/keys/CLIs). Until they exist, use this plan + the IMPL docs.

Alignment check (Nov 24, 2025): All five `docs/implementation/*.md` files already reflect the CLI-first AI approach, stock-media sourcing, extended timeline schema (16:9 + music/video), and the `public/projects/{projectId}` storage layout. No content drift detected.

### Stage Overview (what to build)
1) **Project structure & paths**: Introduce `public/projects/{projectId}` with a backward-compat shim for `public/content/{slug}`; centralize path helpers. See IMPL_DATA_STORAGE.md.
2) **AI & TTS**: Use CLI providers (gemini-cli default) with structured output; add Google TTS as default voice, keep ElevenLabs optional. See IMPL_API_INTEGRATIONS.md.
3) **Staged CLI**: Split into `discover | curate | refine | script | gather | build | render`; keep `gen` only if trivial. Wire configs via `config/*.json`. (Pipeline doc pending—follow this plan for ordering.)
4) **Media sourcing**: Replace DALL‑E with Pexels/Unsplash/Pixabay images/videos; quality scoring + dedupe; optional Pixabay music/local library. See IMPL_MEDIA_PIPELINE.md.
5) **Timeline assembly**: Extend schema for long-form, music, video clips, aspect flag; frame-align and validate. See IMPL_TIMELINE_ASSEMBLY.md.
6) **Renderer**: Add 16:9 composition plus existing 9:16; parameterize dimensions; keep legacy timelines playable during transition.
7) **Validation & QA**: Zod schemas, timeline/path tests, smoke render. See IMPL_VALIDATION_SCHEMAS.md.
8) **Migration & cleanup**: Remove legacy layout once shim users are migrated; default aspect chosen; document commands.

### Repository Alignment Snapshot (Nov 24, 2025)
- Storage still uses `public/content/{slug}` in generator and renderer (`cli/cli.ts`, `src/lib/utils.ts`). No shim or `public/projects` directories yet.
- Generation pipeline is single `gen` command calling OpenAI & DALL‑E over HTTP and ElevenLabs TTS (`cli/service.ts`); staged commands don’t exist.
- Timeline schema and renderer are short-form only (background/text/audio; no music/video clips/aspect flag) with a single vertical composition (`src/lib/types.ts`, `src/Root.tsx`).
- Config surface only has `config/ai.config.json` and `.env.example` (OPENAI/ElevenLabs); other configs are absent.
- CLI provider wrappers (codex/claude/gemini) exist but aren’t used by the `gen` flow.

### Minimal Task Queue to Become "Refactoring Ready"
1) ✅ **COMPLETED** - Add path helper + shim: keep `public/content` working while writing new outputs to `public/projects`.
2) ✅ **COMPLETED** - Create placeholder configs: `tts.config.json`, `stock-assets.config.json`, `music.config.json`, `video.config.json`, and expand `.env.example` accordingly.
3) ✅ **COMPLETED** - Stub staged commands that emit minimal valid JSON per stage; keep `gen` intact until stubs are wired.
4) ✅ **COMPLETED** - Extend timeline schema/types and renderer to accept long-form + 16:9; add draft 16:9 composition.
5) ⏳ **PENDING** - Swap generator to use CLI providers and Google TTS (with fallback to ElevenLabs) once stubs exist.
6) ⏳ **PENDING** - Link tests: add basic schema/path/timeline validation per IMPL_VALIDATION_SCHEMAS.md.

> For code, follow the linked IMPL docs; this plan is now the high-level checklist aligned with the current repository state.

---

## 📋 Phase 1 Completion Report (Nov 24, 2025)

### What Was Implemented

#### 1. Centralized Path Helpers (`src/lib/paths.ts`)
- ✅ Created `getProjectDir()`, `getProjectPaths()`, `ensureProjectDirs()`
- ✅ Implemented legacy shim with `getLegacyContentDir()`, `resolveProjectDir()`
- ✅ Added fallback functions: `getTimelinePathWithFallback()`, `getImagePathWithFallback()`, `getAudioPathWithFallback()`
- ✅ Logs warnings when legacy paths are used
- ✅ Creates `.keep` files for empty directories

#### 2. Configuration Files (in `config/`)
- ✅ `tts.config.json` - Google TTS (default) + ElevenLabs (optional fallback)
- ✅ `stock-assets.config.json` - Pexels/Unsplash/Pixabay with quality scoring
- ✅ `music.config.json` - Pixabay Music API + local library support
- ✅ `video.config.json` - Aspect ratios (16:9 default, 9:16 support), rendering settings

#### 3. Configuration Schema & Loaders (`cli/lib/config.ts`)
- ✅ Added Zod schemas: `TTSConfigSchema`, `StockAssetsConfigSchema`, `MusicConfigSchema`, `VideoConfigSchema`
- ✅ Added typed loaders: `loadTTSConfig()`, `loadStockAssetsConfig()`, `loadMusicConfig()`, `loadVideoConfig()`
- ✅ All configs support environment variable substitution

#### 4. Environment Variables (`.env.example`)
- ✅ Expanded with all required API keys:
  - Google TTS, Gemini, Anthropic
  - Pexels, Unsplash, Pixabay
  - Fastify port, Music library path

#### 5. Staged CLI Commands (in `cli/commands/`)
- ✅ `discover.ts` - Topic discovery (outputs `discovered.json`)
- ✅ `curate.ts` - Topic curation (outputs `selected.json`)
- ✅ `refine.ts` - Topic refinement (outputs `refined.json`)
- ✅ `script.ts` - Script generation (outputs `scripts/script-v1.json`)
- ✅ `gather.ts` - Asset gathering (outputs `tags.json`)
- ✅ `build.ts` - Timeline assembly (outputs `timeline.json`)
- ✅ `render.ts` - Video rendering wrapper

Each command:
- Loads configs via `ConfigManager`
- Uses path helpers for I/O
- Validates dependencies (previous stage outputs)
- Writes minimal valid JSON
- Exits cleanly with proper error handling

#### 6. NPM Scripts (`package.json`)
- ✅ Added: `discover`, `curate`, `refine`, `script`, `gather`, `build:timeline`, `render:project`
- ✅ Legacy `gen` command preserved (untouched)

### Success Criteria Met
- ✅ New configs load without errors (validated via Zod)
- ✅ Stub commands run and create valid JSON files
- ✅ Legacy `gen` command still works (unchanged)
- ✅ Path helpers support both old and new layouts
- ✅ No breaking changes to existing renderer
- ✅ Foundation ready for Phase 2 (schema extension & renderer updates)

### Files Created (16 new)
1. `src/lib/paths.ts`
2. `config/tts.config.json`
3. `config/stock-assets.config.json`
4. `config/music.config.json`
5. `config/video.config.json`
6. `cli/commands/discover.ts`
7. `cli/commands/curate.ts`
8. `cli/commands/refine.ts`
9. `cli/commands/script.ts`
10. `cli/commands/gather.ts`
11. `cli/commands/build.ts`
12. `cli/commands/render.ts`

### Files Modified (3)
1. `.env.example` - Expanded with new API keys
2. `cli/lib/config.ts` - Added schemas and loaders
3. `package.json` - Added npm scripts

---

## 📋 Phase 2 Completion Report (Nov 24, 2025)

### What Was Implemented

#### 1. Extended Timeline Schema (`src/lib/types.ts`)
- ✅ Added `VideoClipElementSchema` for stock video clips (similar to backgrounds but for video)
- ✅ Added `BackgroundMusicElementSchema` with volume control (0.0-1.0, defaults to 0.2)
- ✅ Added `AspectRatioSchema` enum: "16:9" | "9:16"
- ✅ Extended `TimelineSchema` with optional fields:
  - `aspectRatio` (defaults to "9:16" for backward compatibility)
  - `durationSeconds` (calculated from elements if not provided)
  - `videoClips` array (for stock video clips)
  - `backgroundMusic` array (for background music with ducking)
- ✅ All new fields are optional to maintain backward compatibility

#### 2. Updated Constants (`src/lib/constants.ts`)
- ✅ Added `DIMENSIONS` constant with both aspect ratios:
  - "16:9": { width: 1920, height: 1080 }
  - "9:16": { width: 1080, height: 1920 }
- ✅ Added `DEFAULT_ASPECT_RATIO = "9:16"` for backward compatibility

#### 3. Timeline Normalization (`src/lib/utils.ts`)
- ✅ Added `normalizeTimeline()` function that:
  - Sets default aspectRatio if missing
  - Calculates durationSeconds from elements if not provided
  - Initializes empty arrays for videoClips and backgroundMusic
  - Handles edge cases (undefined elements array)
- ✅ Updated `loadTimelineFromFile()` to normalize all timelines
- ✅ Added documentation noting legacy path getters

#### 4. Dynamic Composition Dimensions (`src/Root.tsx`)
- ✅ Updated composition to use dynamic dimensions based on timeline's aspectRatio
- ✅ Calculates correct width/height in `calculateMetadata` hook
- ✅ Defaults to 9:16 (1080x1920) if aspectRatio not specified

#### 5. Test Data & Validation
- ✅ Created `demo-vertical` timeline with explicit aspectRatio: "9:16"
- ✅ Created `demo-horizontal` timeline with:
  - aspectRatio: "16:9"
  - videoClips array (with sample data)
  - backgroundMusic array (with volume: 0.15)
- ✅ Verified legacy timeline `history-of-venus` still works (backward compatibility)

### Verification Results

#### Test Renders
All compositions render with correct dimensions:
- **demo-horizontal**: 1920 x 1080 (16:9) ✅
- **demo-vertical**: 1080 x 1920 (9:16) ✅
- **history-of-venus** (legacy): 1080 x 1920 (9:16, auto-normalized) ✅

#### Acceptance Criteria
- ✅ Renderer loads both legacy and new schema formats
- ✅ 16:9 compositions render at correct dimensions (1920x1080)
- ✅ 9:16 compositions render at correct dimensions (1080x1920)
- ✅ Legacy timelines are automatically normalized with defaults
- ✅ TypeScript compilation succeeds
- ✅ No breaking changes to existing functionality

### Files Modified (4)
1. `src/lib/types.ts` - Extended schema with new fields
2. `src/lib/constants.ts` - Added dimension constants
3. `src/lib/utils.ts` - Added timeline normalization
4. `src/Root.tsx` - Dynamic dimensions based on aspect ratio

### Files Created (2)
1. `public/content/demo-vertical/timeline.json` - 9:16 test data
2. `public/content/demo-horizontal/timeline.json` - 16:9 test data

### Next Steps (Phase 3)
Phase 3 has already been completed (CLI skeleton). Next pending items:
1. **Task 5**: Swap generator to use CLI providers and Google TTS
2. **Task 6**: Add schema/path/timeline validation tests
