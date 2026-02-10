# CLAUDE.md

## Commands

```bash
npm run web:dev              # Start Next.js web UI (primary workflow)
npm run dev                  # Start Remotion Studio for video preview
npm run lint                 # ESLint + TypeScript check
npm run test                 # Run all unit tests
npm run db:generate:storyflow && npm run db:push:storyflow  # Database setup
```

## Architecture

**Next.js web app** (`app/`) with SQLite/Prisma (`prisma/storyflow.schema.prisma`). No CLI - all operations via web UI.

### Pipeline Stages
1. **Script** → AI script generation via Script Builder
2. **Gather** → TTS audio (Google TTS) + stock media (Pexels/Unsplash/Pixabay)
3. **Boards** → Grid layouts, image prompts, region detection, camera triggers
4. **Build** → Generate `viewport.json` + `timeline.json`
5. **Render** → Final video via Remotion

### Key Directories
| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js UI + API routes |
| `src/components/` | Remotion components (AIVideo, Background, Subtitle, Word) |
| `src/lib/storyflow/` | Core business logic (projects, scripts, TTS, assets, rendering) |
| `src/lib/boards/` | Boards pipeline (plan, prompts, regions, triggers, viewport) |
| `config/prompts/` | AI prompt templates |
| `public/projects/<id>/` | Project artifacts (scripts, assets, timeline, viewport) |

### Types
- `src/lib/types.ts` - Timeline schemas (BackgroundElement, TextElement, AudioElement, ViewportAnimation)
- `src/lib/boards-types.ts` - Boards types (BoardPlan, BoardRegion, ViewportTrigger)
- `src/lib/storyflow/types.ts` - Project types (Project, Script, Asset, Viewport, Board)

## Gemini CLI (Critical)

This project uses **Gemini CLI with subscription** (not API keys).

```bash
gemini --yolo --model <model> --output-format json "<prompt>"
```

| Flag | Purpose |
|------|---------|
| `--yolo` | Auto-approve actions (required for non-interactive) |
| `--model` | Model selection (default: `gemini-2.5-pro`) |
| `--output-format` | `text`, `json`, or `stream-json` |

**Do NOT use `--temperature` or other API-style params** - not supported by CLI.

Files: `src/lib/storyflow/ai.ts`, `script-builder.ts`, `viewport.ts`, `app/api/ai/refine/route.ts`

## Project Structure

```
public/projects/<project-id>/
├── scripts/script-v1.json     # Script
├── assets/audio/segment-*.mp3 # TTS with word timestamps
├── assets/images/             # Media
├── boards/                    # Board pipeline artifacts
├── viewport.json              # Camera path
├── timeline.json              # Remotion timeline
└── preview.mp4 / final.mp4
```

## Database

Schema: `prisma/storyflow.schema.prisma`

Models: `Project` (status: DRAFT → SCRIPT_READY → ASSETS_READY → BOARDS_READY → RENDER_READY → COMPLETED), `Blueprint`, `ScriptDraft`, `Board`, `Asset`, `Render`

## Environment Variables

**Required:**
- `GOOGLE_TTS_API_KEY` - Text-to-speech
- Stock media: `PEXELS_API_KEY` or `UNSPLASH_ACCESS_KEY` or `PIXABAY_API_KEY`
- `DATABASE_URL` / `STORYFLOW_DATABASE_URL` - SQLite path

**AI:** Uses Gemini CLI with subscription. Ensure `gemini` is installed and authenticated.

**Optional:** `GEMINI_MODEL`, `ENABLE_SCRIPT_BUILDER=true`

## Coding Conventions (MUST follow)

### API Routes

Every route handler in `app/api/` MUST use `withErrorHandler` and `parseBody`/`parseQuery` from `@/app/api/lib`. Do NOT write manual try/catch blocks or inline `safeParse` calls in routes.

```typescript
// CORRECT — use this pattern for ALL routes
import { withErrorHandler, parseBody, NotFoundError } from "@/app/api/lib";

export const POST = withErrorHandler(async (req, ctx) => {
  const data = await parseBody(req, mySchema);
  const { id } = await ctx!.params!;
  // ... business logic — throw errors, don't return NextResponse error objects
  if (!project) throw new NotFoundError("Project", id);
  return NextResponse.json(result);
}, "descriptive/route-name");
```

```typescript
// WRONG — never do this in routes
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: ... }, { status: 400 });
    // ...
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

Available error classes: `ValidationError` (400), `NotFoundError` (404), `ConflictError` (409), `UnauthorizedError` (401), `ForbiddenError` (403), `ServiceUnavailableError` (503).

### File Paths

Always use `@/src/lib/paths` for project file system paths. Never construct paths with `path.join(process.cwd(), "public", "projects", ...)`.

```typescript
// CORRECT
import { getProjectPaths, getProjectDir, ensureProjectDirs } from "@/src/lib/paths";
const paths = getProjectPaths(projectId);
const audioDir = paths.assetsAudio;

// WRONG
const dir = path.join(process.cwd(), "public", "projects", projectId, "assets", "audio");
```

### React Components — Data Fetching

Use TanStack Query hooks from `src/hooks/queries/` for ALL data fetching and mutations. Never use raw `useState` + `useEffect` + `fetch()` for server data.

```typescript
// CORRECT — use existing hooks
import { useProject } from "@/src/hooks/queries/use-projects";
import { useBoards } from "@/src/hooks/queries/use-boards";

const { data: project, isLoading, error } = useProject(id);

// WRONG — manual fetch state
const [project, setProject] = useState(null);
const [loading, setLoading] = useState(false);
useEffect(() => { fetch(`/api/projects/${id}`).then(...) }, [id]);
```

Available query hooks: `use-projects`, `use-boards`, `use-assets`, `use-render`, `use-tts`, `use-viewport`, `use-execution-status`, `use-ai-logs`, `use-asset-search`, `use-music-library`, `use-mappings`.

If a query/mutation doesn't exist yet, add it to the appropriate hook file in `src/hooks/queries/` following the existing pattern (query key factory + `useQuery`/`useMutation` + cache invalidation).

API client functions go in `src/lib/api/` — hooks in `src/hooks/queries/` call those functions.

### Retry / Resilience

Use `withRetry`, `withTimeout`, `withTimeoutAndRetry` from `@/src/lib/utils/retry` for any operation that needs retries. Do NOT implement custom retry loops.

```typescript
// CORRECT
import { withRetry } from "@/src/lib/utils/retry";
const result = await withRetry(() => externalCall(), {
  maxRetries: 3, retryDelayMs: 1000, exponentialBackoff: true
}, "operation-name");

// WRONG
let attempts = 0;
while (attempts < 3) { try { ... } catch { attempts++; await sleep(1000); } }
```

### AI / Gemini Calls

- Use `aiGenerate()` from `src/lib/services/ai/ai-gateway.ts` for all AI operations — it wraps logging, schema validation, and retry.
- `geminiCall()` in `src/lib/services/ai/gemini-wrapper.ts` is the low-level helper; avoid bypassing the gateway unless you are extending the gateway itself.
- JSON parsing: `parseGeminiOutput()` from `src/lib/storyflow/gemini-parser.ts`
- Call logging: `AiLogger` from `src/lib/services/ai/ai-logger.ts`
- Do NOT shell out to `gemini` directly from routes or components.

### Database Access

Use `storyflowPrisma` from `@/src/lib/storyflow/prisma`. For repeated query patterns (find project by ID, update status), check if a Prisma client extension method exists before writing raw queries.

### Test Mocks — `vi.mock()` Paths

Always use absolute `@/` paths in `vi.mock()` calls. Never use relative paths (`../`, `./`). Relative paths resolve from the **test file's** directory, not the component's directory, which silently loads the real module instead of the mock — causing OOM crashes or flaky tests.

```typescript
// CORRECT — absolute path always resolves to the real module
vi.mock("@/components/editors/boards/simple-boards-editor", () => ({
  SimpleBoardsEditor: () => <div>mock</div>,
}));

// WRONG — resolves from __tests__/ directory, not the component's directory
vi.mock("../editors/boards/simple-boards-editor", () => ({
  SimpleBoardsEditor: () => <div>mock</div>,
}));
```

This convention is enforced by an eslint `no-restricted-syntax` rule on test files.

### Styling — Design Tokens Over Hardcoded Colors

Use design token classes from `globals.css` instead of hardcoded Tailwind slate colors. The app is **dark-mode only** with a slate-based palette baked into `:root`.

```typescript
// CORRECT — design tokens
className="bg-background text-foreground border-border"
className="bg-card text-card-foreground"
className="bg-input text-foreground"
className="bg-secondary text-secondary-foreground"
className="text-muted-foreground"

// WRONG — hardcoded slate colors
className="bg-slate-950 text-slate-50 border-slate-800"
className="bg-slate-900 text-slate-50"
```

**Token → Slate mapping:**
| Token | Equivalent | Use for |
|-------|-----------|---------|
| `bg-background` | slate-950 | Page backgrounds |
| `bg-card` / `bg-input` | slate-900 | Cards, panels, form inputs |
| `bg-secondary` / `bg-accent` | slate-800 | Secondary surfaces, hover states |
| `text-foreground` | slate-50 | Primary text |
| `text-muted-foreground` | slate-400 | Secondary/dim text |
| `border-border` | slate-800 | Borders, dividers |
| `bg-destructive` | rose-500 | Error/delete actions |

**Semantic colors are fine:** `bg-rose-*`, `bg-emerald-*`, `bg-amber-*` for status indicators (errors, success, warnings) don't need tokens.

This convention is enforced by an eslint `no-restricted-syntax` warning rule on tsx files.
