# UI/UX Refactor Plan for StoryFlow

> 📋 **Changelog:** [2026-01-21-ui-refactor-plan.md](../changelog/2026-01-21-ui-refactor-plan.md)

## Summary

Comprehensive UX overhaul applying industry-proven patterns to transform the current fragmented pipeline into a cohesive, guided experience.

## User Decisions

| Aspect | Decision |
|--------|----------|
| Navigation | Stepper/Wizard with top horizontal bar |
| Error handling | Inline recovery with retry buttons |
| Feedback | Rich (skeletons, progress, auto-save indicators) |
| Asset mapping | Consolidated to single location |
| Stage transitions | Gated progression |
| Script workflow | Script Builder only (remove legacy) |
| Component library | Add shadcn/ui |
| Mobile support | Desktop-only (except Render stage) |
| Onboarding | Guided first-run experience |
| Boards mode | AI with manual override |
| Auto-save | Auto-save with indicator |
| Preview | Integrated into Render stage |
| Discover | Merged into New Project flow |
| User error recovery | Reset to AI Default button (not full undo/redo) |

## Clarification Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Reset to AI Default behavior | **Delete all** | Remove all manual changes, regenerate from scratch - simplest implementation |
| Edit type detection | **Segment count only** | Only segment additions/deletions are structural. Text edits within segments are minor. |
| TTS integration | **Blocking** | User waits for TTS to complete before proceeding to Media stage |
| Script stage completion | **Script text exists** | Any script content generated unlocks Media - minimal friction |
| Media stage completion | **User clicks continue** | Manual "Continue to Storyboard" button - no automatic asset gating |
| Badge clearing | **Auto-clear on visit** | Badge clears when user views the stage - minimal friction |
| Topic suggestions | **Inline chips** | Show 5-8 clickable topic chips below the input field |

## Stage Completion Criteria

| Stage | Completion Requirement |
|-------|----------------------|
| Script | Any script text generated + TTS completed (blocking) |
| Media | User clicks "Continue to Storyboard" button |
| Storyboard | AI boards generated (can proceed immediately) |
| Build | viewport.json and timeline.json generated |
| Render | N/A (final stage) |

## Database Status to UI Stage Mapping

```ts
const stageFromStatus: Record<ProjectStatus, string> = {
  DRAFT: 'script',
  SCRIPT_READY: 'media',
  ASSETS_READY: 'storyboard',
  BOARDS_READY: 'build',
  VIEWPORT_READY: 'build',  // Both map to Build
  RENDER_READY: 'render',
  RENDERING: 'render',
  COMPLETED: 'render',
  ERROR: 'current'  // Stay on current stage
};
```

## User Error Recovery Strategy

Full undo/redo is **out of scope** - too much implementation effort for an AI-assisted workflow where most mistakes can be recovered by re-running AI or making small manual fixes.

Instead, each AI-powered stage provides a **"Reset to AI Default"** button:

| Stage | Reset Behavior |
|-------|----------------|
| Script | Re-generate script from topic (with confirmation) |
| Storyboard | Reset boards to AI-generated plan |
| Build | Reset viewport/triggers to AI-generated defaults |

**Reset Behavior Details (Delete All):**
- Remove all user modifications completely
- Regenerate from original input (topic for Script, boards for Storyboard)
- Show confirmation dialog: "This will delete all your changes and regenerate from AI. Continue?"
- No archival/history preserved - simple delete and regenerate
- If AI regeneration fails, show error with retry option

**Implementation:** `components/ui/reset-to-ai-button.tsx`, confirmation dialog before reset.

## Backward Navigation Rules

When navigating backward to a previous stage:

| Edit Type | Downstream Impact |
|-----------|-------------------|
| Minor text edits (typos, wording) | Preserve downstream work |
| Segment additions/deletions | Mark downstream stages as "needs review" |
| Re-run AI generation | Invalidate downstream, require re-confirmation |

### Edit Type Detection Algorithm (Segment Count Method)

```ts
function detectEditType(before: Script, after: Script): 'minor' | 'structural' {
  const beforeCount = before.segments.length;
  const afterCount = after.segments.length;

  // If segment count changed, it's a structural edit
  if (beforeCount !== afterCount) {
    return 'structural';
  }

  // Otherwise, it's a minor edit (text changes within existing segments)
  return 'minor';
}
```

- **Structural edits** (segment count changed): Mark all downstream stages as "needs review"
- **Minor edits** (text only): Preserve downstream work unchanged

### "Needs Review" Badge Behavior

**Visual indicator:** Yellow "needs review" badge on affected stages in stepper.

**Badge clearing:** Auto-clear on visit
- Badge appears as yellow indicator on stepper for affected downstream stages
- Clears automatically when user navigates to the affected stage
- No explicit confirmation action required - viewing the stage is sufficient

**Implementation:** `lib/storyflow/stage-invalidation.ts`

## New Pipeline Structure (5 Stages)

```
Current (6+ fragmented):
Script → TTS → Assets → Boards → Viewport → Preview → Render

New (5 consolidated):
1. Script    - Topic input, AI script generation, TTS integrated
2. Media     - Asset upload, stock media search, asset mapping (single source)
3. Storyboard - AI board planning with manual override, region detection
4. Build     - Viewport/camera path, triggers, timeline generation
5. Render    - Preview playback + final render + export
```

---

## Implementation Defaults

| Setting | Value | Rationale |
|---------|-------|-----------|
| Auto-save debounce | 1500ms | Standard form auto-save timing |
| Mobile breakpoint | 1024px (lg) | Tailwind lg breakpoint, below this show "desktop only" message |
| Keyboard shortcuts | Cmd/Ctrl+1-5 for stages, Cmd/Ctrl+S for save | Standard navigation patterns |
| Library tab content | Previously uploaded assets from this project | Project-scoped asset history |
| Quality mapping | Draft → DRAFT, Production → PRODUCTION | Map UI labels to DB enum values |

### Topic Suggestions UI ✅

```
New Project Topic Suggestions:
- Display 5-8 inline clickable chips below topic input field
- Source: curated trending topics list (hardcoded initially, API later)
- Clicking chip populates input field with topic text
- Graceful fallback: hide chips if suggestions unavailable
```

Implemented on `app/(dashboard)/projects/new/page.tsx` with hardcoded trending chips that populate the topic field and hide when the list is empty.

### Onboarding Tour Stops

Default tooltip tour for first project (4 stops):
1. **Pipeline Stepper** - "Track your progress through 5 stages"
2. **Script Input** - "Enter your video topic here"
3. **AI Generate Button** - "Click to generate your script with AI"
4. **Save Indicator** - "Your changes are auto-saved"

### Error Taxonomy

| Error Type | Retryable | Default Message |
|------------|-----------|-----------------|
| AI Generation Failed | Yes | "AI generation failed. Click retry to try again." |
| TTS Failed | Yes | "Text-to-speech failed. Click retry to regenerate audio." |
| Stock API Error | Yes | "Could not fetch stock media. Try again or use a different provider." |
| Stock API Rate Limit | Yes (with delay) | "Rate limit reached. Please wait a moment and try again." |
| File Upload Failed | Yes | "Upload failed. Check your file and try again." |
| Network Error | Yes | "Network error. Check your connection and retry." |
| Validation Error | No | "Please fix the errors above before continuing." |
| Render Failed | Yes | "Render failed. Click retry to try again." |

### Stock Search API Handling

- **Rate limits:** Show rate limit message, auto-retry after delay
- **Provider fallback:** If primary provider fails, try secondary (Pexels → Unsplash → Pixabay)
- **Empty results:** Show "No results found. Try different keywords." with suggestions

---

## Implementation Phases

### Phase 1: Foundation (~2 days)

**1.1 Install shadcn/ui ✅**
- Run `npx shadcn@latest init`
- Install components: Dialog, Tabs, Skeleton, Progress, Tooltip, Popover, Alert
- Files: `components/ui/` (new shadcn components)

**1.2 Create Pipeline Stepper Component ✅**
- Horizontal stepper with 5 stages
- Visual states: completed (checkmark), current (highlighted), locked (grayed)
- Click to navigate (only to completed stages)
- File: `components/pipeline/pipeline-stepper.tsx`

**1.3 Create Project Layout Wrapper ✅**
- Layout component that wraps all project pages
- Includes stepper, breadcrumbs, auto-save indicator
- File: `app/(dashboard)/projects/[id]/layout.tsx` (enhance existing)

### Phase 2: Core Components (~2 days)

**2.1 Auto-Save System ✅**
- Debounced auto-save hook
- Visual indicator ("Saving...", "Saved", "Error")
- File: `src/hooks/use-auto-save.ts`, `components/ui/save-indicator.tsx`

**2.2 Inline Error Recovery ✅**
- Error component with retry button, error details, suggestions
- Replace `window.confirm()` with shadcn Dialog
- File: `components/ui/inline-error.tsx`

**2.3 Reset to AI Default Button ✅**
- Reusable component with confirmation dialog
- Calls stage-specific reset API
- File: `components/ui/reset-to-ai-button.tsx`

**2.4 Rich Loading States ✅**
- Skeleton components for project cards, script segments, assets
- Progress bars with percentages
- Files: `components/ui/skeletons/`

**2.5 Guided Onboarding ✅**
- First-run detection (localStorage flag)
- Tooltip tour for first project
- Contextual help icons
- Files: `components/onboarding/`, `hooks/use-first-run.ts`

### Phase 3: Stage Consolidation (~3 days)

**3.1 Script Stage (merge TTS) ✅**
- Combine Script Builder + TTS into single flow
- Script generation → automatic TTS trigger → proceed to Media
- Remove legacy ScriptGenerator
- Files: `app/(dashboard)/projects/[id]/script/page.tsx`, `components/script/`

**3.2 Media Stage (new consolidated) ✅**
- Single asset management page
- Tabs: Upload, Stock Search, Library
- Asset-to-segment mapping (single source of truth)
- Remove duplicate mapping from Boards/Viewport
- Files: `app/(dashboard)/projects/[id]/media/page.tsx`, `components/media/`

**3.3 Storyboard Stage (AI + manual)**
- AI workflow as default with manual override at each step
- Collapsible panels for advanced editing
- "Reset to AI Default" button for reverting manual changes
- Files: `app/(dashboard)/projects/[id]/storyboard/page.tsx`, `components/storyboard/`

**3.4 Build Stage (merge viewport)**
- Viewport editor + trigger generation + timeline assembly
- Preview thumbnail of camera path
- "Reset to AI Default" button for reverting manual changes
- Files: `app/(dashboard)/projects/[id]/build/page.tsx`, `components/build/`

**3.5 Render Stage (with preview)**
- Integrated Remotion preview player
- Quality selection (Draft/Production)
- Progress tracking with download
- **Mobile-responsive** (exception to desktop-only rule for status checking)
- Files: `app/(dashboard)/projects/[id]/render/page.tsx`, `components/render/`

### Phase 4: Navigation & Flow (~1 day)

**4.1 Update Routing ✅**
- Rename routes to match new stages
- Add redirects from old routes
- Update all internal links

**4.2 Gated Progression Logic ✅**
- Stage completion checks
- Visual lock indicators
- Validation before stage transition
- File: `lib/storyflow/stage-validation.ts`

**4.3 Backward Navigation & Stage Invalidation ✅**
- Detect edit types (minor vs structural)
- Mark downstream stages as "needs review" when appropriate
- Yellow badge indicator on stepper
- File: `lib/storyflow/stage-invalidation.ts`

**4.4 Remove Discover Page ✅**
- Merge trending topics into New Project flow
- Add topic suggestions section to project creation
- Delete: `app/(dashboard)/discover/`

### Phase 5: Polish (~1 day)

**5.1 Transitions & Animations**
- Smooth stage transitions
- Loading state animations
- Success/completion celebrations

**5.2 Accessibility ✅**
- Keyboard navigation for stepper (Cmd/Ctrl+1-5)
- ARIA labels (existing in stepper)
- Focus management

**5.3 Final Cleanup**
- Remove legacy components (redirects in place)
- Update types (done as needed)
- Clean up unused routes (redirects in place)

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `app/(dashboard)/projects/[id]/layout.tsx` | Add pipeline stepper wrapper |
| `app/(dashboard)/projects/[id]/page.tsx` | Simplify to redirect to current stage |
| `components/script-builder/` | Keep and enhance |
| `components/projects/` | Add stepper, update cards |
| `package.json` | Add shadcn dependencies |
| `tailwind.config.ts` | Update for shadcn theming |

## Files to Delete

**Routes to merge/remove:**
- `app/(dashboard)/projects/[id]/tts/page.tsx` (merged into Script)
- `app/(dashboard)/projects/[id]/assets/page.tsx` (replaced by Media)
- `app/(dashboard)/projects/[id]/viewport/page.tsx` (merged into Build)
- `app/(dashboard)/projects/[id]/preview/page.tsx` (merged into Render)

**Components to remove:**
- `components/script/script-generator.tsx` (legacy - replaced by Script Builder)

**Note:** No `app/(dashboard)/discover/` directory exists - already removed or never existed

## New Files to Create

```
components/
├── pipeline/
│   ├── pipeline-stepper.tsx
│   ├── stage-gate.tsx
│   └── stage-context.tsx
├── ui/
│   ├── inline-error.tsx
│   ├── save-indicator.tsx
│   ├── reset-to-ai-button.tsx
│   └── skeletons/
│       ├── project-card-skeleton.tsx
│       ├── script-skeleton.tsx
│       └── asset-skeleton.tsx
├── onboarding/
│   ├── tour-provider.tsx
│   ├── tooltip-step.tsx
│   └── first-run-guide.tsx
├── media/
│   ├── media-manager.tsx
│   ├── asset-mapper.tsx (single source)
│   ├── stock-search.tsx
│   └── upload-zone.tsx
├── storyboard/
│   ├── storyboard-editor.tsx
│   ├── ai-workflow.tsx
│   └── manual-override.tsx
├── build/
│   ├── build-editor.tsx
│   ├── viewport-preview.tsx
│   └── timeline-assembly.tsx
└── render/
    ├── render-panel.tsx (enhanced)
    └── preview-player.tsx

hooks/
├── use-auto-save.ts
├── use-first-run.ts
├── use-stage-validation.ts
└── use-pipeline-navigation.ts

lib/storyflow/
├── stage-validation.ts
└── stage-invalidation.ts
```

---

## UX Principles Applied

1. **Progressive Disclosure** - Show complexity only when needed
2. **Recognition over Recall** - Visual stepper shows progress at a glance
3. **Error Prevention** - Gated progression prevents invalid states
4. **Visibility of System Status** - Auto-save indicators, progress bars
5. **User Control** - Manual override always available
6. **Consistency** - Unified component library (shadcn)
7. **Flexibility** - AI-assisted with human control
8. **Reversibility** - Reset to AI Default provides safety net without full undo complexity

---

## Testing Strategy

**Automated tests are deferred.** Only lint and type checks (`npm run lint`) are required during implementation. Manual E2E testing will be performed after implementation to validate functionality. Automated test coverage will be added in a future iteration once the UI/UX refactor is stable.

## Verification Checklist (Manual E2E)

- [ ] **Create new project** → Verify topic suggestions appear, stepper shows Stage 1
- [ ] **Complete Script stage** → Verify TTS runs automatically, Stage 2 unlocks
- [ ] **Navigate between stages** → Verify gated progression works
- [ ] **Trigger errors** → Verify inline recovery with retry
- [ ] **First-run experience** → Clear localStorage, verify guided tour
- [ ] **Auto-save** → Make changes, verify indicator shows "Saved"
- [ ] **Reset to AI Default** → Make manual changes, reset, verify AI output restored
- [ ] **Backward navigation** → Edit script after Build, verify "needs review" badge appears
- [ ] **Mobile render** → Open Render stage on mobile, verify responsive layout
- [ ] **Full pipeline** → Create project through to rendered video

---

## Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | ~2 days | shadcn/ui, stepper, layout wrapper |
| Phase 2: Core Components | ~2 days | Auto-save, error handling, skeletons, onboarding |
| Phase 3: Stage Consolidation | ~3 days | 5 consolidated stage pages |
| Phase 4: Navigation & Flow | ~1 day | Routing, gated progression, cleanup |
| Phase 5: Polish | ~1 day | Animations, accessibility, final cleanup |
| **Total** | **~9 days** | Complete UI/UX refactor |

---

## Data Safety & Reliability

### Auto-Save Data Protection
- Store `last_saved_at` timestamp with each save
- Use localStorage backup as fallback for unsaved changes
- On page load, check for unsaved localStorage data and prompt to restore

### Optimistic Locking
- Include `updatedAt` timestamp in all update requests
- Server rejects updates if timestamp doesn't match (concurrent edit detected)
- Show conflict resolution dialog: "This project was modified elsewhere. Reload to see changes?"

### First-Run Detection Storage
- Primary: localStorage flag `storyflow_onboarding_complete`
- Fallback: If authentication exists, store in user profile DB

### Stage Invalidation Performance
- Debounce invalidation checks (500ms after last edit)
- Use hash comparison for segment content to detect changes efficiently
- Only re-compute downstream impact when edit is saved

---

## Notes

- All existing functionality must be preserved during refactor
- Incremental deployment possible after each phase
- Consider feature flags for gradual rollout
- Test on multiple screen sizes (desktop focus, but ensure no major breakage)

---

## Spec Remediation Log

This section documents clarifications and fixes applied after initial spec analysis.

### Issues Identified and Resolved

| Issue | Resolution |
|-------|------------|
| DB schema mismatch (UI stages vs DB status) | Added "Database Status to UI Stage Mapping" section |
| Reset API behavior undefined | Added "Reset Behavior Details" with delete-all approach |
| Edit detection algorithm missing | Added "Edit Type Detection Algorithm" using segment count method |
| Auto-save debounce timing unspecified | Defined 1500ms default in Implementation Defaults |
| TTS integration flow unclear | Clarified as blocking in Stage Completion Criteria |
| Stage completion criteria undefined | Added "Stage Completion Criteria" table |
| "Needs review" badge behavior undefined | Added badge clearing rules (auto-clear on visit) |
| Topic suggestions UI undefined | Added "Topic Suggestions UI" specification |
| Onboarding tour content missing | Added "Onboarding Tour Stops" with 4 default stops |
| Error taxonomy missing | Added "Error Taxonomy" table with retryable status |
| Keyboard shortcuts undefined | Defined Cmd/Ctrl+1-5 and Cmd/Ctrl+S |
| Mobile breakpoint undefined | Specified 1024px (lg) |
| File paths incorrect | Corrected paths in "Files to Delete" section |
| Data safety concerns | Added "Data Safety & Reliability" section |

### Clarification Decisions Made

All 7 clarification questions were answered with user decisions documented in the "Clarification Decisions" table at the top of this spec.
