> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Wave 1: Foundation & Project Management

> Detailed specification for setting up the Next.js application, database, and basic project CRUD operations.

## Overview

**Goal:** Establish the technical foundation for StoryFlow, including the Next.js app structure, Prisma database, UI component library, and basic project management functionality.

**Prerequisites:** None (first wave)

**Outcome:** Users can create, view, and delete projects. Settings page allows AI provider configuration.

**Important Clarifications:**
- **Single-user MVP:** No authentication required. The `(auth)/` directory is reserved for future multi-user support but is not implemented in MVP.
- **Desktop-first:** Visual editors (viewport, boards) are optimized for desktop. Mobile provides viewing only.

---

## 1. Technical Setup

### 1.1 Next.js Application

**Create new Next.js 14+ app with App Router:**

```bash
npx create-next-app@latest storyflow --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Key configurations:**
- TypeScript strict mode
- App Router (not Pages Router)
- Tailwind CSS
- ESLint with Next.js config

### 1.2 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.0.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.300.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### 1.3 shadcn/ui Setup

```bash
npx shadcn-ui@latest init
```

**Components to install:**
- Button
- Card
- Dialog
- Form
- Input
- Label
- Select
- Tabs
- Toast
- Dropdown Menu
- Avatar
- Badge
- Skeleton

### 1.4 Prisma Setup

**Initialize Prisma:**
```bash
npx prisma init --datasource-provider sqlite
```

**Schema for Wave 1:**
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  topic       String?
  status      String   @default("DRAFT")
  aspectRatio String   @default("16:9")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AppSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json     // Prisma Json type for structured settings
  updatedAt DateTime @updatedAt
}
```

---

## 2. File Structure (Wave 1)

```
storyflow/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Redirect to /projects
│   ├── globals.css             # Global styles
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── projects/
│   │   │   ├── page.tsx        # Projects list
│   │   │   └── new/
│   │   │       └── page.tsx    # New project form
│   │   └── settings/
│   │       └── page.tsx        # App settings
│   └── api/
│       ├── projects/
│       │   ├── route.ts        # GET (list), POST (create)
│       │   └── [id]/
│       │       └── route.ts    # GET, PUT, DELETE
│       └── settings/
│           └── route.ts        # GET, PUT
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx         # Navigation sidebar
│   │   ├── header.tsx          # Page header
│   │   └── page-container.tsx  # Page wrapper
│   └── projects/
│       ├── project-card.tsx    # Project card component
│       ├── project-list.tsx    # Projects grid
│       ├── create-project-dialog.tsx
│       └── delete-project-dialog.tsx
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── utils.ts                # Utility functions (cn, etc.)
│   └── types.ts                # TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── projects/               # Project assets directory
└── .env.local                  # Environment variables
```

---

## 3. UI Components

### 3.1 Dashboard Layout

```tsx
// app/(dashboard)/layout.tsx

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

### 3.2 Sidebar Navigation

**Navigation Items:**
- Projects (icon: FolderVideo)
- Discover (icon: TrendingUp) - disabled until Wave 2
- Settings (icon: Settings)

```tsx
// components/layout/sidebar.tsx

const navigation = [
  { name: 'Projects', href: '/projects', icon: FolderVideo },
  { name: 'Discover', href: '/discover', icon: TrendingUp, disabled: true },
  { name: 'Settings', href: '/settings', icon: Settings },
]
```

### 3.3 Projects List Page

**Features:**
- Grid layout of project cards
- "New Project" button
- Empty state when no projects
- Project status badges

```tsx
// app/(dashboard)/projects/page.tsx

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        action={<CreateProjectDialog />}
      />
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <ProjectGrid projects={projects} />
      )}
    </PageContainer>
  )
}
```

### 3.4 Project Card

**Display:**
- Project name
- Topic (if set)
- Status badge
- Created date
- Thumbnail (placeholder)

**Actions:**
- Click to open project
- Delete button (with confirmation)

### 3.5 Create Project Dialog

**Form Fields:**
- Project name (required)
- Aspect ratio (select: 16:9, 9:16)

```tsx
// Zod schema for validation
const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9')
})

// Note: aspectRatio is validated at API level via Zod.
// SQLite doesn't support enums, so the String type stores the validated value.
```

### 3.6 Settings Page

**Sections:**
1. **AI Provider Settings**
   - Provider selection (Gemini CLI, Claude Code)
   - Model selection
   - Temperature slider
   - API key input (masked)

2. **TTS Settings**
   - Voice selection (Chirp HD variants)
   - Speaking rate
   - Pitch adjustment

3. **Rendering Defaults**
   - Default quality preset
   - Default aspect ratio

---

## 4. API Routes

### 4.1 Projects API

**GET /api/projects**
```typescript
// Response
{
  projects: Project[]
}
```

**POST /api/projects**
```typescript
// Request
{
  name: string
  aspectRatio?: '16:9' | '9:16'
}

// Response
{
  project: Project
}
```

**GET /api/projects/[id]**
```typescript
// Response
{
  project: Project
}
```

**DELETE /api/projects/[id]**
```typescript
// Response
{
  success: boolean
}
```

### 4.2 Settings API

**GET /api/settings**
```typescript
// Response
{
  settings: {
    ai: AISettings
    tts: TTSSettings
    render: RenderSettings
  }
}
```

**PUT /api/settings**
```typescript
// Request (partial update)
{
  ai?: Partial<AISettings>
  tts?: Partial<TTSSettings>
  render?: Partial<RenderSettings>
}
```

---

## 5. Type Definitions

```typescript
// lib/types.ts

export type AspectRatio = '16:9' | '9:16'

export type ProjectStatus =
  | 'DRAFT'
  | 'SCRIPT_READY'
  | 'ASSETS_READY'
  | 'VIEWPORT_READY'
  | 'BOARDS_READY'
  | 'RENDER_READY'
  | 'RENDERING'
  | 'COMPLETED'
  | 'ERROR'

export interface Project {
  id: string
  name: string
  topic: string | null
  status: ProjectStatus
  aspectRatio: AspectRatio
  createdAt: Date
  updatedAt: Date
}

export interface AISettings {
  provider: 'gemini-cli' | 'claude-code'
  model: string
  temperature: number
}

export interface TTSSettings {
  voice: string
  speakingRate: number
  pitch: number
}

export interface RenderSettings {
  defaultQuality: 'draft' | 'medium' | 'high' | 'production'
  defaultAspectRatio: AspectRatio
}
```

---

## 6. Database Utilities

```typescript
// lib/db.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

## 7. Project Directory Management

When creating a project, also create its asset directory:

```typescript
// lib/services/project.ts

import { mkdir } from 'fs/promises'
import path from 'path'

export async function createProjectDirectory(projectId: string) {
  const projectPath = path.join(process.cwd(), 'public', 'projects', projectId)

  await mkdir(path.join(projectPath, 'assets', 'images'), { recursive: true })
  await mkdir(path.join(projectPath, 'assets', 'audio'), { recursive: true })
  await mkdir(path.join(projectPath, 'assets', 'videos'), { recursive: true })
  await mkdir(path.join(projectPath, 'assets', 'music'), { recursive: true })
}

export async function deleteProjectDirectory(projectId: string) {
  const projectPath = path.join(process.cwd(), 'public', 'projects', projectId)
  await rm(projectPath, { recursive: true, force: true })
}
```

---

## 8. Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="file:./storyflow.db"

# AI Provider (from existing setup)
GEMINI_MODEL=gemini-2.5-pro

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 9. Acceptance Criteria

### Must Have
- [done] Next.js app runs on localhost:3000
- [done] SQLite database created and migrated (storyflow.db)
- [done] Projects list shows all projects
- [done] Can create new project with name and aspect ratio
- [done] Can delete project (with confirmation)
- [done] Settings page shows/saves AI configuration
- [done] Project directories created in public/projects/

### Should Have
- [done] Loading states on all async operations
- [done] Error handling with toast notifications
- [done] Empty states for lists
- [done] Responsive design (mobile-friendly)

### Nice to Have
- [ ] Keyboard shortcuts (Cmd+N for new project)
- [ ] Project search/filter
- [ ] Dark mode toggle

---

## 10. Testing Checklist

1. **Project CRUD:**
   - Create project → appears in list
   - Delete project → removed from list + directory
   - Refresh page → projects persist

2. **Settings:**
   - Change AI provider → saves correctly
   - Change TTS voice → saves correctly
   - Refresh page → settings persist

3. **Error Handling:**
   - Submit empty project name → shows validation error
   - API error → shows toast notification

---

## 11. Migration from CLI

### Files to Reference (from remotion-p2v)
- `cli/lib/config.ts` → Pattern for loading/saving settings
- `cli/lib/types.ts` → Type definitions to adapt
- `config/*.json` → Default values for settings

### No Direct Migration Needed
Wave 1 is new implementation, not migration.

---

*Wave 1 Complete → Proceed to Wave 2: Script Generation*
