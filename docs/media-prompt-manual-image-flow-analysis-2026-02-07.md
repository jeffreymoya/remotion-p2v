# Media Prompt -> External LLM -> Upload Flow Analysis

Date: 2026-02-07  
Status: Analysis only (no behavior changes in this document)

## Context

Requested workflow:

1. Generate an image prompt inside Storyflow.
2. Copy prompt to an external image model site.
3. Generate image externally.
4. Upload generated image back into Storyflow.

The concern is valid: the current stage flow can make it feel like upload is required before prompt generation.

## Current Implementation (Evidence)

### 1) Prompt generation exists, but in Storyboard (Step 3), not Media (Step 2)

- Storyboard page hosts the boards workflow: `app/(dashboard)/projects/[id]/storyboard/page.tsx:35`
- Boards workflow uses `BoardPlannerWizard`: `components/boards/BoardsWorkflow.tsx:65`
- Prompt UI includes explicit copy action:
  - `components/boards/PromptDisplay.tsx:84`
  - `components/boards/PromptDisplay.tsx:90`
  - `components/boards/PromptDisplay.tsx:99`

### 2) Media page does not expose prompt generation

- Media page is upload/stock/library/mapping oriented: `app/(dashboard)/projects/[id]/media/page.tsx:37`
- Media manager tabs are only `upload | stock | library | mapping`: `components/media/media-manager.tsx:29`, `components/media/media-manager.tsx:170`

### 3) Stage gating order blocks Storyboard until Media is complete

- Stage order is `script -> media -> storyboard`: `src/lib/storyflow/stage-validation.ts:5`
- Storyboard unlock requires `ASSETS_READY`: `src/lib/storyflow/stage-validation.ts:64`
- Media stage currently requires at least one asset:
  - `src/lib/storyflow/pipeline/stages/media.ts:27`
  - `src/lib/storyflow/pipeline/stages/media.ts:31`
  - error: "Upload or import assets before marking Media complete.": `src/lib/storyflow/pipeline/stages/media.ts:32`

Net effect: if user wants prompts first, they cannot reach prompt generation until Media is considered complete.

### 4) Messaging is internally inconsistent in current boards wizard

- Prompts step says to upload in the Assets page: `components/boards/BoardPlannerWizard.tsx:421`
- Legacy Assets page now redirects to Media: `app/(dashboard)/projects/[id]/assets/page.tsx:7`
- Same wizard then asks user to continue to an Upload step in the wizard itself: `components/boards/BoardPlannerWizard.tsx:432`

### 5) Board image uploads and Media assets are separate pipelines

- Board upload route writes to `boards/<boardId>.<ext>`: `app/api/projects/[id]/boards/upload-image/route.ts:79`
- Media upload route writes to asset storage and creates `Asset` rows: `app/api/assets/upload/route.ts:60`, `app/api/assets/upload/route.ts:65`

This creates a split source of truth:

- Board images used by storyboard pipeline live under `boards/`.
- Media library images live under `assets/` and are managed as `Asset` records.

### 6) Style guide control appears partially implemented

- UI captures a style guide input: `components/boards/BoardPlannerWizard.tsx:46`, `components/boards/BoardPlannerWizard.tsx:307`
- Prompt generation payload does not include style guide: `components/boards/BoardPlannerWizard.tsx:97`
- Prompt service always uses a hardcoded detective style:
  - `src/lib/boards/prompts-service.ts:93`
  - `src/lib/boards/prompts-service.ts:125`
  - `src/lib/boards/prompts-service.ts:321`

## Why This Feels Wrong to Users

The product asks users to perform an external generation step (copy prompt to another site), but that entrypoint is placed behind a prior stage that currently encourages or requires uploads first. That is backwards for users who do not have images yet and need the prompts to create them.

## Reference to Original Implementation Plan

This behavior aligns with the initial staged architecture documented in `docs/incremental-refactoring-plan.md`:

- Stage orchestration and gating were formalized in Wave 7: `docs/incremental-refactoring-plan.md:542`
- Planned order explicitly lists `storyboard` before `media` complexity discussion and preserves separate stage responsibilities: `docs/incremental-refactoring-plan.md:552`, `docs/incremental-refactoring-plan.md:553`
- Wave 4 migration explicitly split `ImageUploader` (boards hook) and `media-manager` (assets hook), reinforcing two upload paths:
  - `docs/incremental-refactoring-plan.md:311`
  - `docs/incremental-refactoring-plan.md:312`
  - `docs/incremental-refactoring-plan.md:336`
  - `docs/incremental-refactoring-plan.md:340`

Related expected behavior is also reflected in regression checklist where boards flow is `Prompts -> Upload`: `docs/regression-checklist.md:53`, `docs/regression-checklist.md:54`.

## Root Cause Summary

1. Prompt generation is implemented under Storyboard instead of Media.
2. Storyboard is stage-locked behind Media completion.
3. Media completion currently depends on existing assets.
4. Upload responsibilities are split across boards and assets domains.
5. UI copy still references old "Assets page" wording while route now redirects to Media.

## Recommendation

Recommended direction: support a true "prompt-first" path in Step 2 (Media), while keeping downstream board region/trigger/viewport work in Storyboard.

### Proposed UX target

1. Script complete.
2. Media:
   - Generate board prompts.
   - Copy prompts externally.
   - Generate images externally.
   - Upload images back (to media library and/or board slots).
3. Storyboard:
   - Region detection, trigger generation, viewport build, manual overrides.

## Implementation Plan (Proposed)

### Phase 1: Consistency fixes (low risk)

1. Update stale text "Assets page" to "Media page" in wizard copy.
2. Clarify that external generation happens before upload.
3. Either wire style guide into prompt generation or remove the unused input until supported.

### Phase 2: Unlock prompt-first without breaking stage model

1. Add prompt-generation UI entrypoint on Media page (reuse existing boards hooks/APIs).
2. Keep current Storyboard prompt UI temporarily for backward compatibility.
3. Allow Media completion when either:
   - at least one media asset exists, or
   - prompts have been generated and saved.

### Phase 3: Unify image ingestion paths

1. Decide canonical storage:
   - Option A: keep board images under `boards/` and mirror into `Asset` records.
   - Option B: store generated board images as normal IMAGE assets and reference them from boards metadata.
2. Remove duplicate/competing upload instructions once canonical path is selected.

## Risks and Tradeoffs

- Relaxing Media gate too much could allow users into Storyboard without usable images.
- Keeping dual upload systems increases confusion and maintenance cost.
- Migrating board images into asset records affects existing artifact assumptions and tests.

## Acceptance Criteria for Fix

1. A new user can generate prompts before any upload.
2. Instructions are consistent across Media and Storyboard.
3. The upload destination and ownership model are unambiguous.
4. The style guide control either works end-to-end or is removed.
5. Stage progression messaging matches actual required actions.

