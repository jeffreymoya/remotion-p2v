> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# StoryFlow - Web Application Specification

> Comprehensive specification for refactoring remotion-p2v from CLI to web-based application

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Technical Architecture](#technical-architecture)
3. [Implementation Waves](#implementation-waves)
4. [Sub-Specifications Index](#sub-specifications-index)

---

## Executive Summary

### Project Overview
**StoryFlow** is a web-based AI-powered video generation platform that transforms trending topics into narrative-driven videos with synchronized audio, dynamic text overlays, and cinematic viewport animations.

### Migration Scope
- **Type:** Full rewrite (not incremental migration)
- **CLI Status:** Deprecated entirely
- **Target:** Local web dashboard with form-based wizard workflow

### Key Decisions

| Aspect | Decision |
|--------|----------|
| Frontend Framework | Next.js 14+ (App Router) |
| UI Library | Tailwind CSS + shadcn/ui |
| Database | SQLite + Prisma ORM |
| Real-time Updates | WebSocket (Socket.io) |
| Video Preview | Remotion Player (editing) + Server Render (final) |
| TTS Provider | Google Cloud TTS (Chirp HD voices) |
| AI Provider | Gemini CLI (configurable via settings) |
| Asset Management | Upload only (no stock providers) |
| Viewport Animation | AI-generated + visual editor |
| Script Editing | Read-only (regenerate only) |
| Asset Mapping | User-controlled (drag-drop to segments) |
| Video Mode | Viewport OR Boards (mutually exclusive) |
| Music Library | External free library integration (Pixabay) |
| Render Queue | Sequential queue (one render at a time) |

### Core Features
1. **Topic Discovery** - Google Trends integration with topic selection UI
2. **Script Generation** - AI-powered script creation with regeneration
3. **Asset Management** - Upload images/videos with optional upscaling
4. **TTS Generation** - Google Chirp HD with word-level timestamps
5. **Viewport Editor** - AI-generated pan-scan with visual adjustment
6. **Boards Editor** - Visual storyboard/region editor
7. **Music Library** - Upload + pre-built library
8. **Video Preview** - Real-time Remotion Player
9. **Video Render** - Server-side rendering with progress tracking

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         StoryFlow Web                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │   Next.js App   │  │   API Routes    │  │  WebSocket     │  │
│  │   (Frontend)    │  │   (Backend)     │  │  Server        │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
│           │                    │                    │           │
│  ┌────────┴────────────────────┴────────────────────┴────────┐  │
│  │                      Service Layer                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ AI Svc   │ │ TTS Svc  │ │ Media    │ │ Render Svc   │  │  │
│  │  │ (Gemini) │ │ (Google) │ │ Service  │ │ (Remotion)   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                    Data Layer (Prisma)                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │  │
│  │  │ SQLite DB  │  │ File       │  │ Asset Storage      │   │  │
│  │  │ (metadata) │  │ Storage    │  │ (public/projects)  │   │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
storyflow/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout (future)
│   ├── (dashboard)/              # Main dashboard layout
│   │   ├── page.tsx              # Home/projects list
│   │   ├── projects/
│   │   │   ├── page.tsx          # Projects list
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # New project wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Project detail
│   │   │       ├── script/       # Script stage
│   │   │       ├── assets/       # Asset management
│   │   │       ├── viewport/     # Viewport editor
│   │   │       ├── boards/       # Boards editor
│   │   │       ├── preview/      # Video preview
│   │   │       └── render/       # Render & export
│   │   ├── discover/
│   │   │   └── page.tsx          # Topic discovery
│   │   └── settings/
│   │       └── page.tsx          # App settings
│   ├── api/                      # API routes
│   │   ├── projects/
│   │   ├── discover/
│   │   ├── ai/
│   │   ├── tts/
│   │   ├── render/
│   │   └── ws/                   # WebSocket endpoint
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── wizard/                   # Wizard step components
│   ├── editors/                  # Visual editors
│   │   ├── viewport-editor/
│   │   ├── boards-editor/
│   │   └── timeline-preview/
│   └── video/                    # Remotion components
│       ├── compositions/
│       ├── elements/
│       └── player/
├── lib/
│   ├── db/                       # Prisma client & utils
│   ├── services/                 # Business logic
│   │   ├── ai/
│   │   ├── tts/
│   │   ├── media/
│   │   ├── render/
│   │   └── discovery/
│   ├── hooks/                    # React hooks
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript types
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/
├── public/
│   ├── projects/                 # Project assets
│   └── music-library/            # Pre-built music
├── remotion/                     # Remotion config
│   ├── Root.tsx
│   └── remotion.config.ts
└── config/
    └── prompts/                  # AI prompt templates
```

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./storyflow.db"
}

model Project {
  id          String   @id @default(cuid())
  name        String
  topic       String?
  status      ProjectStatus @default(DRAFT)
  aspectRatio String   @default("16:9")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  script      Script?
  assets      Asset[]
  viewport    Viewport?
  boards      Board[]
  renders     Render[]
  settings    ProjectSettings?
}

model Script {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  segments    Json     // Array of script segments
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Asset {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type        AssetType
  filename    String
  path        String
  metadata    Json?    // width, height, duration, etc.
  createdAt   DateTime @default(now())

  // For images
  upscaled    Boolean  @default(false)
  upscaledPath String?
}

model Viewport {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  keyframes   Json     // Array of viewport keyframes
  regions     Json?    // Detected regions
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Board {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  index       Int
  layout      Json     // Grid layout config
  regions     Json     // Region definitions
  triggers    Json?    // Animation triggers
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([projectId, index])
}

model Render {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  quality     RenderQuality
  status      RenderStatus @default(PENDING)
  progress    Float    @default(0)
  outputPath  String?
  error       String?
  startedAt   DateTime?
  completedAt DateTime?
  createdAt   DateTime @default(now())
}

model ProjectSettings {
  id          String   @id @default(cuid())
  projectId   String   @unique
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  voice       String   @default("en-US-Chirp3-HD-Algieba")
  speakingRate Float   @default(1.0)
  musicTrack  String?
  musicVolume Float    @default(0.3)
}

model AppSettings {
  id          String   @id @default(cuid())
  key         String   @unique
  value       Json
  updatedAt   DateTime @updatedAt
}

model DiscoveredTopic {
  id          String   @id @default(cuid())
  query       String
  traffic     String?
  exploreUrl  String?
  selected    Boolean  @default(false)
  discoveredAt DateTime @default(now())
}

enum ProjectStatus {
  DRAFT
  SCRIPT_READY
  ASSETS_READY
  VIEWPORT_READY
  BOARDS_READY
  RENDER_READY
  RENDERING
  COMPLETED
  ERROR
}

enum AssetType {
  IMAGE
  VIDEO
  AUDIO
  MUSIC
}

enum RenderQuality {
  DRAFT
  MEDIUM
  HIGH
  PRODUCTION
}

enum RenderStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### Project Status Transitions

The following state machine defines valid project status transitions:

```
DRAFT ──────────────────┬──────────────────────────────────────┐
  │                     │                                      │
  ▼                     │                                      │
SCRIPT_READY ───────────┼──────────────────────────────────────┤
  │                     │                                      │
  ▼                     │                                      │
ASSETS_READY ───────────┼──────────────────────────────────────┤
  │                     │                                      │
  ├───────┬─────────────┘                                      │
  │       │                                                    │
  ▼       ▼                                                    │
VIEWPORT_READY  BOARDS_READY ──────────────────────────────────┤
  │               │                                            │
  └───────┬───────┘                                            │
          │                                                    │
          ▼                                                    │
     RENDER_READY ─────────────────────────────────────────────┤
          │                                                    │
          ▼                                                    │
      RENDERING ───────────────────────────────────────────────┤
          │                                                    │
          ├─────────────────────┐                              │
          ▼                     ▼                              │
      COMPLETED               ERROR ◄──────────────────────────┘
```

**Transition Rules:**
- Forward progression only (no going back to earlier states)
- VIEWPORT_READY and BOARDS_READY are mutually exclusive paths
- Any state can transition to ERROR on failure
- ERROR state can transition back to the last successful state for retry
- COMPLETED is a terminal state

### API Routes Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/[id]` | Get project details |
| PUT | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |
| POST | `/api/discover` | Fetch trending topics |
| POST | `/api/ai/script` | Generate script |
| POST | `/api/ai/viewport` | Generate viewport keyframes |
| POST | `/api/ai/boards` | Generate board layouts |
| POST | `/api/tts/generate` | Generate TTS audio |
| POST | `/api/assets/upload` | Upload asset |
| POST | `/api/assets/upscale` | Upscale image |
| POST | `/api/render/start` | Start render job |
| GET | `/api/render/[id]/status` | Get render status |
| WS | `/api/ws` | WebSocket for real-time updates |

### WebSocket Events

```typescript
// Client → Server
interface ClientEvents {
  'subscribe:project': { projectId: string };
  'subscribe:render': { renderId: string };
  'unsubscribe': { channel: string };
}

// Server → Client
interface ServerEvents {
  'job:started': { jobId: string; type: JobType };
  'job:progress': { jobId: string; progress: number; message?: string };
  'job:completed': { jobId: string; result?: any };
  'job:error': { jobId: string; error: string };
  'render:frame': { renderId: string; frame: number; total: number };
}
```

### WebSocket Implementation (Socket.io)

**Why Socket.io:**
- Automatic reconnection with exponential backoff
- Room-based subscriptions for project/render channels
- Fallback to long-polling if WebSocket unavailable
- Built-in heartbeat/ping-pong for connection health

**Server Setup:**
```typescript
// app/api/ws/route.ts
import { Server } from 'socket.io'

const io = new Server({
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL },
  pingTimeout: 60000,
  pingInterval: 25000
})

// Room-based subscriptions
io.on('connection', (socket) => {
  socket.on('subscribe:project', ({ projectId }) => {
    socket.join(`project:${projectId}`)
  })

  socket.on('subscribe:render', ({ renderId }) => {
    socket.join(`render:${renderId}`)
  })
})
```

**Client Hook:**
```typescript
// hooks/useSocket.ts
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    })
  }
  return socket
}
```

---

## Implementation Waves

The refactor is organized into **6 implementation waves**, each building on the previous and delivering a functional increment.

**Wave Progress (local):**
- [done] Wave 1 — Foundation & Project Management
- [done] Wave 2 — Script Generation & TTS (audio, timestamps, progress UI)
- [done] Wave 3 — Asset Management & Upload (upscaling, music library + selection)
- [done] Wave 4 — Viewport & Boards Editors
  - [done · 2026-01-10] AI viewport generation API (Gemini + fallback) exposed at `/api/ai/viewport` and hooked to the viewport editor
  - [done · 2026-01-10] Visual viewport keyframe editor with canvas overlay, timeline scrub, and region-click-to-keyframe flow
  - [done · 2026-01-10] Boards grid editor with drag-drop image palette, layout controls, preview strip, and region bounds inspector
- [done · 2026-01-10] Wave 5 — Video Preview & Remotion Integration
  - [done · 2026-01-10] Timeline builder service + `/api/projects/[id]/timeline` endpoint returning assembled preview timeline
  - [done · 2026-01-10] Preview page with Remotion Player and StoryFlowVideo composition (backgrounds, subtitles, audio, music)
  - [done · 2026-01-10] StoryFlow remotion component library hardening (intro title, music ducking, keyboard shortcuts)
- [done] Wave 6 — Rendering & Final Output
  - [done · 2026-01-10] Render start/status API (`/api/render/start`, `/api/render/[id]/status`) with sequential queue + Prisma model
  - [done · 2026-01-10] Render dashboard step with progress bar, retry, and download link
  - [done · 2026-01-11] Fixed RENDER_READY status transition from viewport/boards save endpoints

**Resolved Issues (local):**
- [done · 2026-01-11] Fixed Next.js 15/16 async route params across dynamic API routes (project details, timeline, boards, viewport, music, assets, render status), unblocking preview and render-status calls
- [done · 2026-01-11] Fixed RENDER_READY status transition blocker - viewport and boards endpoints now transition to RENDER_READY status, enabling end-to-end render workflow

### Wave 1: Foundation & Project Management
**Goal:** Set up Next.js app, database, and basic project CRUD

**Deliverables:**
- Next.js 14 app with App Router
- Prisma + SQLite setup
- shadcn/ui component library
- Project list page
- Create/delete projects
- Basic settings page

**Duration Estimate:** Foundation layer

---

### Wave 2: Script Generation Pipeline
**Goal:** Implement AI-powered script generation with TTS

**Deliverables:**
- Topic discovery UI (Google Trends integration)
- Script generation API (Gemini integration)
- TTS generation (Google Chirp HD)
- Word-level timestamp extraction
- Script display UI (read-only with regenerate)

**Dependencies:** Wave 1

---

### Wave 3: Asset Management & Upload
**Goal:** Implement asset upload, storage, and optional upscaling

**Deliverables:**
- Asset upload UI (drag-drop)
- Image/video file handling
- Asset gallery view
- Optional Real-ESRGAN upscaling
- Music upload + library browser

**Dependencies:** Wave 1

---

### Wave 4: Viewport & Boards Editors
**Goal:** Implement visual editors for viewport animation and boards

**Deliverables:**
- AI viewport generation API
- Visual viewport keyframe editor
- Interactive region picker
- Boards layout editor
- Drag-drop region editor
- Preview thumbnails

**Dependencies:** Wave 2, Wave 3

---

### Wave 5: Video Preview & Remotion Integration
**Goal:** Implement real-time video preview with Remotion Player

**Deliverables:**
- New Remotion component library
- Remotion Player integration
- Timeline assembly from database
- Real-time preview scrubbing
- WebSocket progress updates

**Dependencies:** Wave 4

---

### Wave 6: Rendering & Final Output
**Goal:** Implement server-side rendering and export

**Deliverables:**
- Render queue system
- Server-side Remotion rendering
- Progress tracking via WebSocket
- Quality presets (draft/medium/high/production)
- Download/export completed videos

**Dependencies:** Wave 5

---

## Sub-Specifications Index

Each wave has a detailed sub-specification document:

| Wave | Document | Description |
|------|----------|-------------|
| 1 | [WAVE_1_FOUNDATION.md](./specs/WAVE_1_FOUNDATION.md) | Foundation & Project Management |
| 2 | [WAVE_2_SCRIPT.md](./specs/WAVE_2_SCRIPT.md) | Script Generation Pipeline |
| 3 | [WAVE_3_ASSETS.md](./specs/WAVE_3_ASSETS.md) | Asset Management & Upload |
| 4 | [WAVE_4_EDITORS.md](./specs/WAVE_4_EDITORS.md) | Viewport & Boards Editors |
| 5 | [WAVE_5_PREVIEW.md](./specs/WAVE_5_PREVIEW.md) | Video Preview & Remotion |
| 6 | [WAVE_6_RENDER.md](./specs/WAVE_6_RENDER.md) | Rendering & Final Output |

---

## User Journey

### Complete Workflow (Wizard Steps)

```
1. DISCOVER
   └─> View trending topics from Google Trends
   └─> Select topic to create project

2. CREATE PROJECT
   └─> Enter project name
   └─> Select aspect ratio (16:9 or 9:16)

3. GENERATE SCRIPT
   └─> AI generates script based on topic
   └─> Preview script segments
   └─> Regenerate if needed

4. UPLOAD ASSETS
   └─> Upload background images/videos
   └─> Optional: Upscale images
   └─> Select/upload background music

5. CONFIGURE VIEWPORT
   └─> AI generates pan-scan animation
   └─> Adjust keyframes in visual editor
   └─> Preview animation

6. EDIT BOARDS (optional)
   └─> Configure board layouts
   └─> Adjust regions visually

7. PREVIEW VIDEO
   └─> Real-time Remotion Player preview
   └─> Scrub through timeline
   └─> Make final adjustments

8. RENDER & EXPORT
   └─> Select quality preset
   └─> Start render job
   └─> Monitor progress
   └─> Download completed video
```

---

## Technical Requirements

### Environment
- Node.js 18+
- npm or pnpm
- FFmpeg (for video processing)
- Real-ESRGAN binary (optional, for upscaling)
- Google Cloud credentials (TTS)
- Gemini CLI installed and configured

### Browser Support
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

### Performance Targets
- Page load: < 2s
- API response: < 500ms (non-AI calls)
- WebSocket latency: < 100ms
- Remotion Player: 30fps playback

### Security Requirements

**File Upload Security:**
- Validate MIME types against allowlist (not just extension)
- Strip EXIF metadata from uploaded images (privacy)
- Scan filenames for path traversal attempts (../, etc.)
- Generate random filenames for storage (prevent enumeration)
- Limit file sizes: Images 50MB, Videos 500MB, Audio 50MB

**API Rate Limiting:**
| Endpoint Category | Rate Limit |
|-------------------|------------|
| AI Generation (script, viewport) | 5 requests/minute |
| TTS Generation | 10 requests/minute |
| File Upload | 20 requests/minute |
| Render Start | 2 requests/minute |
| General API | 100 requests/minute |

**Input Validation:**
- All API inputs validated with Zod schemas
- Project names: 1-100 characters, alphanumeric + spaces
- Topic text: 1-500 characters
- Segment text: max 2000 characters per segment

### Error Recovery

**Partial State Handling:**
- TTS generation saves progress per-segment; resume from last successful segment
- Upload failures don't affect already-uploaded files
- Render failures preserve project state; can retry without re-processing

**Retry Strategy:**
```typescript
const retryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000
}
```

**Browser Disconnection:**
- Render jobs continue server-side if browser closes
- User can return and see progress/completion status
- WebSocket reconnection resumes event subscription

### Resource Limits

**Rendering:**
- Memory limit: 4GB per render process
- Timeout: 60 minutes maximum render time
- Concurrent renders: 1 (sequential queue)
- Output cleanup: Keep last 3 renders per project, auto-delete older

**Storage:**
- Max project size: 2GB (assets + renders combined)
- Max projects per instance: No hard limit (disk-dependent)
- Recommend: 50GB free disk space for comfortable operation

**Content Limits:**
- Maximum video duration: 10 minutes
- Maximum script segments: 20
- Maximum images per project: 50
- Maximum video files per project: 10

### Data Persistence

**SQLite Backup:**
- Database file: `prisma/storyflow.db`
- Recommend: Daily backup of database file
- Project assets in `public/projects/` - include in backups

**Recovery Procedure:**
1. Stop the application
2. Replace `storyflow.db` with backup
3. Ensure `public/projects/` matches backup state
4. Restart application

### Testing Requirements

**Acceptance Criteria Testing:**
- All UI-related acceptance criteria **MUST** be tested using Chrome MCP (Model Context Protocol) when possible
- Chrome MCP enables automated browser interaction for verifying:
  - Page rendering and layout correctness
  - User interaction flows (clicks, form submissions, navigation)
  - Visual component states (loading, error, success)
  - Real-time updates via WebSocket
- When Chrome MCP is unavailable, document manual testing steps as fallback

**Testing Levels:**
| Level | Scope | Tool |
|-------|-------|------|
| Unit Tests | Service functions, utilities | Jest/Vitest |
| Integration Tests | API routes, database operations | Jest + Prisma |
| E2E/AC Tests | Full user workflows, UI verification | **Chrome MCP** (preferred) |
| Visual Tests | Component rendering | Storybook (optional) |

**Chrome MCP Test Examples:**
```typescript
// Example: Verify project creation flow
// 1. Navigate to /projects/new
// 2. Fill in project name field
// 3. Select aspect ratio
// 4. Click create button
// 5. Verify redirect to project detail page
// 6. Verify project appears in database
```

---

## Migration Notes

### Files to Archive (CLI)
```
cli/
├── commands/           # All CLI commands → replaced by API routes
├── services/           # Migrate to lib/services/
├── lib/                # Migrate to lib/
└── utils/              # Migrate to lib/utils/
```

### Files to Keep/Adapt
```
config/prompts/         # Keep prompt templates
src/lib/types.ts        # Adapt for new components
src/lib/utils.ts        # Keep utility functions
```

### Files to Replace
```
src/components/         # New Remotion component library
src/Root.tsx            # New composition setup
remotion.config.ts      # Update for web integration
```

---

## Success Criteria

1. **Functional:** All pipeline stages work via web UI
2. **UX:** Wizard flow is intuitive, no CLI knowledge required
3. **Performance:** Video preview plays smoothly at 30fps
4. **Reliability:** Auto-retry handles transient failures
5. **Maintainability:** Clean separation of concerns, typed APIs

---

## Next Steps

1. Review this specification
2. Read detailed wave specifications (docs/specs/WAVE_*.md)
3. Begin Wave 1 implementation
4. Iterate based on feedback

---

*Document Version: 1.0*
*Created: January 2026*
*Last Updated: January 11, 2026*
