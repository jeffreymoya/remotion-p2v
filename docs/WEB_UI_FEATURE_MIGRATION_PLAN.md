# Web UI Feature Migration Plan

> **Purpose**: Migrate essential CLI features to the web UI before deprecating the CLI. Focus on AI-generated images via prompts, TTS, and background music. Stock media search (Pexels/Unsplash/Pixabay) is deprecated.

---

## 🎉 ALL PHASES COMPLETE! 🎉

**Migration Status**: ✅ **100% COMPLETE**

All four planned phases have been successfully implemented:

1. ✅ **Phase 1: Boards Pipeline** - Full 7-step wizard workflow
2. ✅ **Phase 2: TTS Enhancements** - Emphasis detection & real-time progress
3. ✅ **Phase 3: Background Music UI** - Volume control & library integration
4. ✅ **Phase 4: Topic Refinement** - AI-powered topic analysis

**The Web UI now has feature parity with the CLI for all essential workflows.**

---

## Revision Notes

### 2026-01-17 (Phase 4 Complete - Topic Refinement) 🎉 MIGRATION COMPLETE

**Completed**: Phase 4 COMPLETE - Topic Refinement ✅ COMPLETE
- ✅ Created `/api/ai/refine` endpoint for AI-powered topic analysis
- ✅ Created `TopicRefinement` component with comprehensive refinement UI
- ✅ Created `ProjectOverview` component to integrate refinement into workflow
- ✅ Integrated refinement into project overview page
- ✅ Automatic persistence of refinement data to project metadata
- ✅ All components pass TypeScript checks

**Status**: Phase 4 COMPLETE! Topic refinement is now available in the web UI:
- ✅ Pre-script topic analysis and optimization
- ✅ AI-generated compelling title and description
- ✅ Target audience identification
- ✅ Key angles discovery (3-5 subtopics)
- ✅ Attention hooks generation (2-3 hooks)
- ✅ Suggested duration recommendation
- ✅ AI reasoning explanation

**What's Available**:
1. **Topic Input** - Enter title, description, and target audience
2. **AI Analysis** - Gemini analyzes and optimizes your topic
3. **Refined Output** - View enhanced title, description, angles, and hooks
4. **Smart Workflow** - Refinement prompts on project overview page
5. **Re-refinement** - "Start Over" option to iterate on refinement

**Files Created**:
- `app/api/ai/refine/route.ts` - API endpoint (141 lines)
- `components/projects/topic-refinement.tsx` - Refinement UI (285 lines)
- `components/projects/project-overview.tsx` - Workflow integration (120 lines)

**🎉 ALL PHASES NOW COMPLETE - Web UI Feature Migration is DONE! 🎉**

### 2026-01-17 (Phase 2 Complete - TTS Enhancements)

**Completed**: Phase 2 COMPLETE - TTS Enhancements ✅ COMPLETE
- ✅ Created `/api/tts/analyze-emphasis` endpoint for AI-powered emphasis detection
- ✅ Added SSE streaming support to `/api/tts/generate-all` for real-time progress
- ✅ Created `TTSProgressIndicator` component with SSE listener and progress bar
- ✅ Created `AudioPreview` component with word-level highlighting during playback
- ✅ Created `TTSManager` component to orchestrate TTS generation workflow
- ✅ Created dedicated `/projects/[id]/tts` page for TTS management
- ✅ Supports both batch generation (all segments) and per-segment regeneration
- ✅ All components pass TypeScript checks

**Status**: Phase 2 COMPLETE! TTS enhancements are now available in the web UI:
- ✅ AI emphasis detection (detects high/med emphasis words with tone modifiers)
- ✅ Real-time progress tracking via Server-Sent Events
- ✅ Audio preview with synchronized word highlighting
- ✅ Per-segment regeneration capability
- ✅ Constraint enforcement (20% total, 5% high, 2-word gap for high emphasis)

**What's Available**:
1. **Emphasis Analysis** - AI tags important words for natural TTS delivery
2. **Batch Generation** - Generate TTS for all script segments with live progress
3. **Per-Segment Regeneration** - Regenerate individual segments on demand
4. **Word Highlighting** - Real-time word synchronization during audio playback
5. **Progress Tracking** - SSE-based progress updates during batch generation

**Next**: Phase 4 (Topic Refinement)

### 2026-01-17 (Phase 3 Complete - Background Music UI)

**Completed**: Phase 3 COMPLETE - Background Music UI ✅ COMPLETE
- ✅ Created `MusicSettings` component with volume slider (0-100%)
- ✅ Integrated `MusicSettings` into assets page Music tab
- ✅ Volume persists across track selections via project settings
- ✅ Real-time volume updates with debounced API calls
- ✅ Audio mixing info display (ducking, fade in/out, normalization)
- ✅ Disabled state when no track selected
- ✅ All components pass TypeScript checks

**Status**: Phase 3 COMPLETE! Background music feature is now fully functional in the web UI:
- ✅ Backend APIs (library search, track selection/download) - already existed
- ✅ `MusicLibrary` component (browse, search, preview) - already existed
- ✅ `MusicTrackCard` component (play/pause player) - already existed
- ✅ `MusicSettings` component (volume control) - **NEW**
- ✅ Integration into assets page with 2-column layout

**What's Available**:
1. **Browse** - Search Pixabay music library by keywords/mood
2. **Preview** - Play/pause track previews before selection
3. **Select** - Download and assign track as project soundtrack
4. **Configure** - Adjust volume (0-100%) with live preview
5. **Upload** - Manual upload of custom music files

**Next**: Phase 2 (TTS Enhancements) or Phase 4 (Topic Refinement)

### 2026-01-17 (Wave 3 Complete - Full Boards Pipeline UI)

**Completed**: Phase 1 COMPLETE - All UI Components and Workflow ✅ COMPLETE
- ✅ Created `PromptDisplay` component with copy-to-clipboard functionality
- ✅ Created `BoardPlanView` component to visualize plan results
- ✅ Created `BoardPlannerWizard` multi-step workflow component (7 steps)
- ✅ Created `BoardsWorkflow` component with AI/Manual mode switcher
- ✅ Created `ImageUploader` component with validation and drag-and-drop
- ✅ Created `RegionEditor` component with interactive canvas editing
- ✅ Created `ViewportPreview` component with real-time animation playback
- ✅ Created `/api/projects/[id]/boards/upload-image` endpoint
- ✅ Updated boards page to integrate full 7-step wizard workflow
- ✅ All components pass TypeScript checks

**Status**: Phase 1 COMPLETE! The full boards pipeline is now available in the web UI:
1. **Config** - Set board duration and style guide
2. **Plan** - AI generates board plan from script
3. **Prompts** - AI generates image prompts for external tools
4. **Upload** - Upload AI-generated board images
5. **Regions** - AI detects regions, manual editing available
6. **Triggers** - Generate word-level camera triggers
7. **Viewport** - Build and preview camera path animation

**Next**: Phase 2 (TTS Enhancements) or Phase 3 (Music UI)

### 2026-01-17 (Wave 2 Complete - Phase 1 DONE)

**Completed**: Phase 1 - Boards Pipeline Core (Steps 1-5) ✅ COMPLETE
- ✅ Updated Prisma schema with Board model fields (`plan`, `prompts`, `imagePath`)
- ✅ Migrated CLI logic to `src/lib/boards/` service layer
  - `plan-service.ts` - Board planning from script
  - `prompts-service.ts` - Image prompt generation
  - `regions-service.ts` - AI region detection
  - `trigger-service.ts` - Word-level trigger generation
  - `viewport-service.ts` - Viewport.json build with keyframes
  - `ai-service.ts` - Shared AI helper functions
- ✅ Created 5 API endpoints:
  - `POST /api/projects/[id]/boards/plan` - Generate board plan
  - `POST /api/projects/[id]/boards/prompts` - Generate image prompts
  - `POST /api/projects/[id]/boards/regions` - Detect regions in uploaded images
  - `POST /api/projects/[id]/boards/triggers` - Generate word-level triggers
  - `POST /api/projects/[id]/boards/viewport` - Build viewport.json with camera path
- ✅ All code passes lint/type checks

**Status**: Phase 1 complete! Ready for UI components (Steps 6-10)

### 2026-01-17 (Initial)

Based on spec analysis comparing this plan against existing codebase implementation:

### User Clarifications Applied
| Question | Decision |
|----------|----------|
| Element types | **Configurable** - Support all 8 CLI types, grouped into basic (4) and advanced (4) in UI |
| Region detection | **AI-first, manual fallback** - Gemini vision API with manual adjustment option |
| Image constraints | **Strict** - Max 50MB, PNG/JPEG/WebP, min 2048x2048, 8K upscale required |
| Progress reporting | **Server-Sent Events** - Real-time progress updates via SSE stream |

### Changes Applied
1. ✅ Fixed API routes to use `/api/projects/[id]/boards/` pattern (matches existing codebase)
2. ✅ Aligned Board schema with existing Prisma model + added missing fields
3. ✅ Documented existing Music API implementation (backend already complete)
4. ✅ Added all 8 element types with basic/advanced grouping
5. ✅ Added `segmentContexts` and `salience` fields to match CLI types
6. ✅ Fixed refine API response to match `config/prompts/refine.prompt.ts` output
7. ✅ Added standard error response specifications
8. ✅ Added image upload specifications (50MB, 2048x2048 min, 8K upscale)
9. ✅ Added SSE progress reporting patterns
10. ✅ Added `Segment` type definition
11. ✅ Fixed Phase 1 API route count (5, not 8) and added dependency chain
12. ✅ Added security requirements (input validation, path traversal protection)

---

## Scope

### Features to Migrate
1. **Boards Pipeline** - AI image prompt generation workflow
2. **TTS Generation** - Text-to-speech with word-level timestamps
3. **Background Music** - Music selection and assignment
4. **Topic Refinement** - Pre-script topic analysis

### Features to Deprecate (NOT migrating)
- Stock image/video search (Pexels, Unsplash, Pixabay)
- Web scraping for images
- Local media library (seeding, stats, garbage collection)
- Google Custom Search integration

---

## Feature 1: Boards Pipeline

**Priority**: CRITICAL
**CLI Source**: `cli/commands/boards.ts`, `cli/lib/board-planner.ts`

### Current CLI Workflow
```
plan → prompts → regions → triggers → build
```

1. **Plan**: Analyze script, group segments into boards
2. **Prompts**: Generate detailed image prompts for AI tools (DALL-E, Midjourney, etc.)
3. **Regions**: Detect regions in uploaded AI-generated images
4. **Triggers**: Map words to regions for camera movement
5. **Build**: Generate `viewport.json` with keyframes

### Web UI Implementation

#### API Routes to Create

```
app/api/projects/[id]/boards/
├── plan/route.ts          # POST - Generate board plan from script
├── prompts/route.ts       # POST - Generate image prompts
├── regions/route.ts       # POST - Detect regions in uploaded image
├── triggers/route.ts      # POST - Generate word-level triggers
└── viewport/route.ts      # POST - Build viewport.json from triggers
```

> **Note**: Routes follow the existing RESTful pattern `/api/projects/[id]/boards/` established in the codebase.

#### Type Definitions

**Segment** (used by multiple endpoints):
```typescript
interface Segment {
  id: string;
  order: number;
  text: string;
  estimatedDurationMs: number;
  speakingNotes?: string;
  words?: WordTimestamp[];  // Present after TTS generation
}

interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
}
```

#### 1.1 Board Planning API

**Endpoint**: `POST /api/projects/[id]/boards/plan`

**Request**:
```typescript
{
  scriptSegments: Segment[];
  options?: {
    maxBoardDuration?: number;  // Default: 60000ms
    gridLayout?: { rows: number; cols: number };
  }
}
```

**Response**:
```typescript
{
  boards: Array<{
    boardId: string;
    segmentIds: string[];
    startTime: number;
    endTime: number;
    suggestedLayout: { rows: number; cols: number };
  }>;
}
```

**Logic to migrate from**: `cli/lib/board-planner.ts:planBoards()`

#### 1.2 Image Prompt Generation API

**Endpoint**: `POST /api/projects/[id]/boards/prompts`

**Request**:
```typescript
{
  boardId: string;
  segments: Segment[];
  styleGuide?: string;  // Default: "Detective investigation board"
}
```

**Response**:
```typescript
{
  boardId: string;
  gridLayout: { rows: number; cols: number };
  styleGuide: string;
  elements: Array<{
    id: string;
    type: BoardElementType;
    gridPosition: { row: number; col: number; rowSpan?: number; colSpan?: number };
    description: string;
    label?: string;
    connectionTo?: string[];
  }>;
  segmentContexts: Array<{
    segmentIndex: number;
    text: string;
    focusElementId: string;
  }>;
  fullPromptText: string;  // Complete prompt for image generation
}

// Element types (8 total)
// Basic: photo, note, document, headline
// Advanced: clipping, string, map, diagram
type BoardElementType =
  | 'photo'      // Photograph or portrait
  | 'note'       // Sticky note or handwritten note
  | 'document'   // Official document or letter
  | 'headline'   // Newspaper headline or title
  | 'clipping'   // Newspaper clipping
  | 'string'     // Connection string (red string conspiracy board style)
  | 'map'        // Location map or floor plan
  | 'diagram';   // Chart, graph, or technical diagram
```

**Logic to migrate from**: `cli/lib/board-planner.ts:generateBoardPrompts()`

**Prompt templates**:
- `config/prompts/boards-plan.prompt.ts`
- `config/prompts/boards-image.prompt.ts`

#### 1.3 Region Detection API

**Endpoint**: `POST /api/projects/[id]/boards/regions`

**Detection Method**: AI-first (Gemini Vision API), with manual fallback
- Primary: Multimodal AI analyzes the uploaded image to locate element regions
- Fallback: Manual region drawing if AI detection fails or needs adjustment

**Request**:
```typescript
{
  boardId: string;
  imagePath: string;  // Path to uploaded AI-generated image
  elements: BoardElement[];  // From prompts response
}
```

**Response**:
```typescript
{
  boardId: string;
  imagePath: string;
  imageMetadata: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  regions: Array<{
    id: string;
    elementId: string;
    gridPosition: { row: number; col: number; rowSpan?: number; colSpan?: number };
    bounds: {
      x: number;      // 0-1 normalized, top-left
      y: number;      // 0-1 normalized, top-left
      width: number;  // 0-1 normalized
      height: number; // 0-1 normalized
    };
    label: string;
    salience: number;  // 0-1, importance for camera focus
    confidence: number;  // AI detection confidence
  }>;
}
```

**Logic to migrate from**: `cli/lib/board-planner.ts:detectRegions()`

**Prompt template**: `config/prompts/boards-region.prompt.ts`

#### 1.4 Trigger Generation API

**Endpoint**: `POST /api/projects/[id]/boards/triggers`

> **Dependency**: Requires TTS generation to be complete (word-level timestamps required)

**Request**:
```typescript
{
  boardId: string;
  regions: BoardRegion[];
  segments: Segment[];  // MUST have word-level timestamps from TTS
}
```

**Response**:
```typescript
{
  triggers: Array<{
    triggerId: string;
    wordId: string;           // "seg-{segIdx}-w-{wordIdx}"
    globalWordIndex: number;
    segmentIndex: number;
    localWordIndex: number;
    word: string;
    wordStartMs: number;
    targetRegionId: string;
    targetBoardId: string;
    transitionMs: number;
    triggerType: "segment_start" | "topic_shift" | "emphasis" | "manual";
  }>;
  totalWords: number;
  totalTriggers: number;
}
```

**Logic to migrate from**: `cli/lib/trigger-generator.ts`

#### 1.5 Viewport Build API

**Endpoint**: `POST /api/projects/[id]/boards/viewport`

**Request**:
```typescript
{
  triggers: BoardTrigger[];
  regions: BoardRegion[];
  imageDimensions: { width: number; height: number };
}
```

**Response**:
```typescript
{
  viewportJson: ViewportAnimation;  // Full viewport.json structure
}
```

### UI Components ✅ COMPLETE

```
components/boards/
├── BoardPlannerWizard.tsx      # ✅ Multi-step wizard for full pipeline (7 steps)
├── BoardPlanView.tsx           # ✅ Display/edit board plan
├── PromptDisplay.tsx           # ✅ Show generated prompts with copy button
├── ImageUploader.tsx           # ✅ Upload AI-generated image with validation
├── RegionEditor.tsx            # ✅ View/adjust detected regions (interactive canvas)
├── ViewportPreview.tsx         # ✅ Preview camera path animation (real-time playback)
└── BoardsWorkflow.tsx          # ✅ AI/Manual mode switcher
```

**Note**: `TriggerTimeline.tsx` was deferred - trigger visualization is shown as stats in the wizard instead.

### UI Page Updates

**File**: `app/(dashboard)/projects/[id]/boards/page.tsx`

Add multi-step workflow:
1. **Plan Step**: Generate board plan, show segment groupings
2. **Prompts Step**: Generate and display image prompts with copy buttons
3. **Upload Step**: Upload AI-generated images (one per board)
4. **Regions Step**: Auto-detect regions, allow manual adjustment
5. **Triggers Step**: Generate triggers, preview timeline
6. **Build Step**: Generate viewport.json, preview animation

---

## Feature 2: TTS Generation ✅ COMPLETE

**Priority**: HIGH
**CLI Source**: `cli/commands/gather.ts`, `cli/services/tts/`
**Status**: ✅ COMPLETE (2026-01-17)

### Implementation Status ✅ COMPLETE
- ✅ `/api/tts/generate` - Single segment TTS generation (already existed)
- ✅ `/api/tts/generate-all` - Batch TTS with SSE progress (enhanced)
- ✅ `/api/tts/analyze-emphasis` - AI emphasis detection (new)
- ✅ TTS management UI with progress tracking (new)
- ✅ Audio preview with word highlighting (new)

### API Endpoints

#### 2.1 Emphasis Detection ✅ IMPLEMENTED

**Endpoint**: `POST /api/tts/analyze-emphasis`
**File**: `app/api/tts/analyze-emphasis/route.ts`

```typescript
// Request
{
  projectId: string;
  segmentId: string;
  text: string;
}

// Response
{
  emphasisMarkers: Array<{
    wordIndex: number;
    word: string;
    emphasisType: "stress" | "pause_before" | "pause_after" | "dramatic";
    intensity: number;  // 0-1
  }>;
}
```

**Logic to migrate from**: `cli/commands/gather.ts` emphasis detection section

#### 2.2 Batch TTS with Progress ✅ IMPLEMENTED

**Endpoint**: `GET/POST /api/tts/generate-all`
**File**: `app/api/tts/generate-all/route.ts`

**Enhanced with**:
- ✅ Server-Sent Events (SSE) for real-time progress reporting
- ✅ Both GET (SSE) and POST (programmatic) support
- ✅ Event types: progress, segment-start, segment-complete, complete, error
- ✅ Backwards compatible (non-streaming mode still works)

### UI Components ✅ COMPLETE

**Location**: `components/tts/`

```
components/tts/
├── TTSManager.tsx           # ✅ Main orchestrator (batch + per-segment generation)
├── TTSProgressIndicator.tsx # ✅ SSE listener with progress bar
└── AudioPreview.tsx         # ✅ Audio player with word highlighting
```

**Integration**: ✅ Dedicated TTS page (`app/(dashboard)/projects/[id]/tts/page.tsx`)
- Batch "Generate All" button with live progress
- Per-segment regeneration capability
- Audio preview for each generated segment
- Real-time word highlighting during playback

---

## Feature 3: Background Music ✅ COMPLETE

**Priority**: MEDIUM
**CLI Source**: `cli/services/music/music-service.ts`
**Status**: ✅ COMPLETE (2026-01-17)

### Implementation Status ✅ COMPLETE
- ✅ `GET /api/music/library` - Pixabay search (already existed)
- ✅ `POST /api/projects/[id]/music` - Track selection/download (already existed)
- ✅ Music stored via `Asset` model with type `MUSIC`
- ✅ Track selection stored in `ProjectSettings.musicTrackId`
- ✅ Volume control via `ProjectSettings.musicVolume`

### Existing Implementation Details

#### 3.1 Music Library API (EXISTING)

**Endpoint**: `GET /api/music/library`
**File**: `app/api/music/library/route.ts`

```typescript
// Query params
{
  q?: string;    // Search query (default: "background")
  mood?: string; // Mood filter
}

// Response
{
  tracks: Array<{
    id: string;
    title: string;
    artist?: string;
    duration: number;
    tags?: string;
    previewUrl: string;
    downloadUrl: string;
  }>;
}
```

#### 3.2 Music Assignment API (EXISTING)

**Endpoint**: `POST /api/projects/[id]/music`
**File**: `app/api/projects/[id]/music/route.ts`

```typescript
// Request - Option 1: Select existing asset
{
  assetId: string;
  volume?: number;  // 0-1, default: 0.3
}

// Request - Option 2: Download new track from Pixabay
{
  track: {
    id: string;
    source: "pixabay";
    title: string;
    downloadUrl: string;
    previewUrl?: string;
    duration?: number;
    tags?: string;
    author?: string;
  };
  volume?: number;  // 0-1, default: 0.3
}

// Response
{
  success: boolean;
  selectedAssetId: string;
  asset?: Asset;  // If new track was downloaded
}
```

### UI Components ✅ COMPLETE

**Location**: `components/assets/` (integrated into assets page)

```
components/assets/
├── MusicLibrary.tsx      # ✅ Browse available tracks from Pixabay (EXISTING)
├── MusicTrackCard.tsx    # ✅ Preview tracks with play/pause (EXISTING)
└── MusicSettings.tsx     # ✅ Volume slider and audio mixing info (NEW - 2026-01-17)
```

**Integration**: ✅ Assets page Music tab (`app/(dashboard)/projects/[id]/assets/page.tsx`)
- 2-column layout: Upload/Gallery (left) + Library/Settings (right)
- Volume control enabled when track is selected
- Real-time volume updates with API persistence

---

## Feature 4: Topic Refinement ✅ COMPLETE

**Priority**: MEDIUM
**CLI Source**: `cli/commands/refine.ts`
**Status**: ✅ COMPLETE (2026-01-17)

### Implementation Status ✅ COMPLETE
- ✅ `/api/ai/refine` - Topic refinement endpoint with Gemini CLI
- ✅ `TopicRefinement` component - AI-powered topic analysis UI
- ✅ `ProjectOverview` component - Integrated refinement workflow
- ✅ Project overview page integration - Seamless pre-script refinement

### Implementation

#### 4.1 Refine API ✅ IMPLEMENTED

**Endpoint**: `POST /api/ai/refine`
**File**: `app/api/ai/refine/route.ts`

```typescript
// Request
{
  projectId: string;
  title: string;           // Original topic title
  description?: string;    // Original description
  category?: string;       // Topic category
  targetAudience?: string; // Default: "ages 20-40"
  minDuration?: number;    // Min duration in seconds (default: 60)
  maxDuration?: number;    // Max duration in seconds (default: 600)
}

// Response (matches config/prompts/refine.prompt.ts output)
{
  refinedTitle: string;       // Compelling YouTube title
  refinedDescription: string; // 3-4 sentence description
  targetAudience: string;     // Specific demographic with interests/pain points
  keyAngles: string[];        // 3-5 key angles or subtopics
  hooks: string[];            // 2-3 attention-grabbing hooks
  suggestedDuration: number;  // Duration in seconds
  reasoning: string;          // Explanation of choices
}
```

**Prompt template**: `config/prompts/refine.prompt.ts`

### UI Integration ✅ IMPLEMENTED

**Implementation**: Option A - Refinement step in project overview (cleaner separation)

**Location**: `app/(dashboard)/projects/[id]/page.tsx`

**Components**:
- `components/projects/topic-refinement.tsx` - Main refinement UI
- `components/projects/project-overview.tsx` - Wrapper with workflow integration

**Features**:
1. ✅ Refinement form with title, description, target audience inputs
2. ✅ AI-generated analysis display (title, description, angles, hooks, duration)
3. ✅ Automatic persistence to project metadata
4. ✅ Show/hide refinement section based on completion status
5. ✅ "Start Over" option to re-refine topics
6. ✅ Loading states and error handling

---

## Implementation Phases

### Phase 1: Boards Pipeline (Core)
**Estimated scope**: 5 API routes, 7 components, 1 page update

#### Dependency Chain (MUST follow this order)
```
1. Script must exist
2. TTS must be generated (provides word timestamps)
3. Board plan must exist
4. Prompts must exist
5. Image must be uploaded (user action)
6. Regions must be detected
7. Triggers can be generated
8. Viewport can be built
```

#### Implementation Steps
1. ✅ Create `/api/projects/[id]/boards/plan` endpoint
2. ✅ Create `/api/projects/[id]/boards/prompts` endpoint
3. ✅ Create `PromptDisplay` component with copy functionality
4. ✅ Update boards page with plan → prompts workflow
5. ✅ Create `/api/projects/[id]/boards/regions` endpoint
6. ✅ Create `RegionEditor` component
7. ✅ Create `/api/projects/[id]/boards/triggers` endpoint
8. ✅ Create `/api/projects/[id]/boards/viewport` endpoint
9. ✅ Create `BoardPlannerWizard` for full workflow
10. ✅ Add viewport preview integration
11. ✅ Create `ImageUploader` component
12. ✅ Create `ViewportPreview` component
13. ✅ Create `/api/projects/[id]/boards/upload-image` endpoint

**Phase 1: ✅ COMPLETE**
- All backend API routes implemented (plan, prompts, regions, triggers, viewport, upload-image)
- All frontend components implemented (7 total)
- Full 7-step wizard workflow integrated
- Image upload with validation
- Interactive region editing
- Real-time viewport preview

### Phase 2: TTS Enhancements
**Estimated scope**: 1 API route, 2 component updates

1. Create `/api/tts/analyze-emphasis` endpoint
2. Add progress tracking to batch TTS
3. Update assets page with TTS controls

### Phase 3: Background Music ✅ BACKEND COMPLETE
**Estimated scope**: ~~2 API routes~~, 3 components, 1 page

APIs already exist - only UI needed:
1. ~~Create `/api/music/library` endpoint~~ ✅ Already exists
2. ~~Create `/api/projects/[id]/music` endpoint~~ ✅ Already exists
3. Create music UI components
4. Add music page or tab

### Phase 4: Topic Refinement
**Estimated scope**: 1 API route, 2 components

1. Create `/api/ai/refine` endpoint
2. Create refinement UI
3. Integrate into project workflow

---

## Files to Migrate

### From CLI to src/lib/

| Source | Destination | Purpose | Status |
|--------|-------------|---------|--------|
| `cli/lib/board-planner.ts` | `src/lib/boards/plan-service.ts`, `prompts-service.ts`, `regions-service.ts`, `viewport-service.ts` | Core planning logic | ✅ Complete |
| `cli/lib/trigger-generator.ts` | `src/lib/boards/trigger-service.ts` | Trigger generation | ✅ Complete |
| `cli/lib/animation-speed.ts` | `src/lib/boards/animation-speed.ts` | Speed calculations | Pending (not needed yet) |
| `cli/services/tts/google-tts.ts` | `src/lib/services/tts/google-tts.ts` | TTS provider | Pending (Phase 2) |
| `cli/services/music/music-service.ts` | `src/lib/services/music/music-service.ts` | Music service | ✅ Not needed (already in storyflow) |

### Prompt Templates (keep in place)

These stay in `config/prompts/` but update imports:
- `boards-plan.prompt.ts`
- `boards-image.prompt.ts`
- `boards-region.prompt.ts`
- `refine.prompt.ts`

---

## Database Schema Updates

### Board Model ✅ COMPLETE

The `Board` model has been updated in `prisma/storyflow.schema.prisma` with all required fields:

```prisma
model Board {
  id         String   @id @default(cuid())
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  index      Int
  layout     Json     // Grid layout configuration (EXISTING)
  regions    Json     // Detected regions (EXISTING)
  triggers   Json?    // Word-level triggers (EXISTING)

  // Fields to ADD for full pipeline support:
  plan       Json?    // Board plan data (segment groupings)
  prompts    Json?    // Generated prompts for AI image generation
  imagePath  String?  // Path to uploaded AI-generated image

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([projectId, index])
  @@index([projectId])
}
```

### Music Model - NOT NEEDED ✅

Music is already implemented using:
- `ProjectSettings.musicTrackId` - References the selected music asset
- `ProjectSettings.musicVolume` - Volume level (0-1)
- `Asset` model with `type: MUSIC` - Stores downloaded tracks

No separate `Music` model is needed.

---

## Image Upload Specifications

### Board Image Requirements

| Constraint | Value | Notes |
|------------|-------|-------|
| Max file size | 50 MB | Enforced on upload |
| Accepted formats | PNG, JPEG, WebP | MIME type validation required |
| Min dimensions | 2048 x 2048 | For quality viewport rendering |
| Recommended | 4096 x 4096+ | AI tools typically output high-res |

### Image Naming Convention

```
public/projects/{projectId}/boards/
├── board-1.png           # Original uploaded image
├── board-1_8k.png        # Upscaled version (required for viewport)
├── board-2.png
├── board-2_8k.png
└── ...
```

### 8K Upscale Requirement

Before viewport can be built, images must be upscaled to 8K (7680x4320 or equivalent aspect ratio). This is required for smooth camera panning at 4K output resolution.

**Options for upscaling**:
1. User uploads already-upscaled image
2. Server-side upscaling via AI service (Real-ESRGAN, etc.)
3. Client-side upscaling before upload

---

## Progress Reporting (SSE)

Long-running operations use Server-Sent Events for real-time progress updates.

### SSE Endpoint Pattern

```typescript
// Request
GET /api/projects/[id]/boards/[stage]/stream?boardId=board-1

// Response: text/event-stream
data: {"status": "processing", "progress": 0.2, "message": "Analyzing image..."}

data: {"status": "processing", "progress": 0.5, "message": "Detecting regions..."}

data: {"status": "complete", "progress": 1.0, "result": {...}}

// On error
data: {"status": "error", "error": "Failed to detect regions", "code": "DETECTION_FAILED"}
```

### Progress Event Schema

```typescript
interface ProgressEvent {
  status: "pending" | "processing" | "complete" | "error";
  progress: number;  // 0-1
  message?: string;  // Human-readable status
  result?: any;      // Present when status = "complete"
  error?: string;    // Present when status = "error"
  code?: string;     // Error code for client handling
}
```

### Operations Requiring Progress Reporting

| Operation | Expected Duration | Stages |
|-----------|------------------|--------|
| Board planning | 5-15s | Analyzing script, grouping segments |
| Prompt generation | 5-10s | Processing each board |
| Region detection | 10-30s | Uploading image, AI analysis |
| TTS batch generation | 30-120s | Per-segment generation |

---

## Error Handling

### Standard Error Response Format

All API errors return a consistent format:

```typescript
interface APIError {
  error: string;     // Human-readable message
  code?: string;     // Machine-readable error code
  details?: any;     // Additional context (validation errors, etc.)
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Invalid request body, validation errors |
| 404 | Not Found | Project, board, or resource not found |
| 409 | Conflict | Dependency not met (e.g., TTS not generated) |
| 422 | Unprocessable Entity | Valid syntax but semantic error |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | AI provider failure |
| 503 | Service Unavailable | Required API key missing |

### Error Codes by Feature

**Boards Pipeline**:
- `SCRIPT_NOT_FOUND` - No script exists for project
- `TTS_NOT_GENERATED` - Word timestamps required but TTS not run
- `BOARD_NOT_FOUND` - Board ID doesn't exist
- `IMAGE_NOT_UPLOADED` - Image required but not present
- `REGIONS_NOT_DETECTED` - Regions required but not detected
- `DETECTION_FAILED` - AI region detection failed
- `INVALID_IMAGE_FORMAT` - Unsupported image format
- `IMAGE_TOO_SMALL` - Image below minimum dimensions

**Music**:
- `PIXABAY_API_KEY_MISSING` - API key not configured
- `DOWNLOAD_FAILED` - Track download failed
- `INVALID_DOWNLOAD_HOST` - Security: disallowed download URL

**TTS**:
- `GOOGLE_TTS_API_KEY_MISSING` - API key not configured
- `SEGMENT_NOT_FOUND` - Invalid segment ID
- `GENERATION_FAILED` - TTS API error

---

## Security Requirements

### Input Validation

All user input must be validated and sanitized:

```typescript
// Example: styleGuide sanitization for prompts endpoint
function sanitizeStyleGuide(input: string): string {
  // Remove potential prompt injection patterns
  return input
    .slice(0, 500)  // Length limit
    .replace(/[<>{}]/g, '')  // Remove special chars
    .trim();
}
```

### Path Traversal Protection

Image paths must be validated to prevent directory traversal:

```typescript
// From src/lib/boards-types.ts
const PROJECT_ID_PATTERN = /^project-\d+$/;

function validateProjectId(projectId: string): void {
  if (!PROJECT_ID_PATTERN.test(projectId.trim())) {
    throw new Error(`Invalid project ID format: ${projectId}`);
  }
}

// Board ID validation
const BOARD_ID_PATTERN = /^board-\d+$/;

function validateBoardId(boardId: string): void {
  if (!BOARD_ID_PATTERN.test(boardId.trim())) {
    throw new Error(`Invalid board ID format: ${boardId}`);
  }
}
```

### Image Path Validation

```typescript
function validateImagePath(imagePath: string, projectId: string): string {
  // Ensure path is within project directory
  const normalized = path.normalize(imagePath);
  const expectedPrefix = `public/projects/${projectId}/`;

  if (!normalized.startsWith(expectedPrefix)) {
    throw new Error('Image path must be within project directory');
  }

  // Check for traversal attempts
  if (normalized.includes('..')) {
    throw new Error('Path traversal detected');
  }

  return normalized;
}
```

### Download URL Allowlist

For music downloads, only allow trusted hosts:

```typescript
const ALLOWED_DOWNLOAD_HOSTS = ['pixabay.com', 'cdn.pixabay.com'];

function assertAllowedHost(urlString: string): URL {
  const parsed = new URL(urlString);
  const host = parsed.hostname.replace(/^www\./, '');
  const allowed = ALLOWED_DOWNLOAD_HOSTS.some(
    h => host === h || host.endsWith(`.${h}`)
  );

  if (!allowed) {
    throw new Error('Download URL host is not allowed');
  }

  return parsed;
}
```

---

## Success Criteria

- [ ] Board planning generates segment groupings
- [ ] Image prompts generated with full text for AI tools
- [ ] Prompts can be copied to clipboard
- [ ] AI-generated images can be uploaded
- [ ] Regions auto-detected from uploaded images
- [ ] Regions editable/adjustable in UI
- [ ] Word-level triggers generated
- [ ] Viewport.json generated from triggers
- [ ] Viewport preview shows camera animation
- [ ] TTS generates with word timestamps
- [ ] Background music selectable and configurable
- [ ] Topic refinement available before scripting
- [ ] All features work without CLI

---

## Deprecation Notes

### Stock Media (NOT migrating)

The following will be removed with CLI:
- `cli/services/media/stock-search.ts`
- `cli/services/media/pexels.ts`
- `cli/services/media/unsplash.ts`
- `cli/services/media/pixabay.ts`
- `cli/services/media/google-search.ts`
- `cli/services/media/web-scraper.ts`
- `cli/services/media/local-repo.ts`
- `cli/services/media/downloader.ts`

### Config Files to Update

Remove stock media settings from:
- `config/stock-assets.config.json` - Can be deleted entirely
- `.env.example` - Remove `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`, `PIXABAY_API_KEY`

### Tests to Delete

```
tests/google-search.test.ts
tests/local-library.test.ts
tests/web-scraper.test.ts
tests/e2e/local-library-gather.test.ts
tests/media-fallback.test.ts
```
