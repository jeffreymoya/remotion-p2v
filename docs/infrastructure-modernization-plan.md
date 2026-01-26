# Infrastructure Modernization Plan

> 📋 **Changelog:** [infrastructure-modernization-plan.md-changelog.md](../changelog/infrastructure-modernization-plan.md-changelog.md)

> **Goal:** Add foundational libraries to improve maintainability, testability, and observability (ISO 25010 compliance).

## Libraries

| Library | Purpose | Priority |
|---------|---------|----------|
| @t3-oss/env-nextjs | Zod-backed environment validation | 1 (lowest risk) |
| Vitest + testing-library + msw | Testing infrastructure | 2 (enables safe refactoring) |
| pino | Structured logging | 3 (independent) |
| @tanstack/react-query | Server state management | 4 (largest change) |

## Implementation Order Rationale

```
env-nextjs → Vitest/MSW → pino → React Query
    ↓            ↓          ↓         ↓
  30 min      1-2 days    1 day    2-3 days
```

1. **env-nextjs first** — Catches config issues immediately, zero risk, no dependencies
2. **Vitest/MSW second** — Establishes safety net before major refactoring
3. **pino third** — Independent of other changes, can run in parallel with testing setup
4. **React Query last** — Largest change, benefits from having tests in place

---

## Phase 1: Environment Validation (@t3-oss/env-nextjs) ✅

### 1.1 Install Dependencies ✅

```bash
npm install @t3-oss/env-nextjs zod
```

### 1.2 Create Environment Schema ✅

**File:** `src/env.ts`

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const stockMediaSchema = z.object({
  PEXELS_API_KEY: z.string().optional(),
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  PIXABAY_API_KEY: z.string().optional(),
}).refine(
  (data) => data.PEXELS_API_KEY || data.UNSPLASH_ACCESS_KEY || data.PIXABAY_API_KEY,
  { message: "At least one stock media API key is required (PEXELS_API_KEY, UNSPLASH_ACCESS_KEY, or PIXABAY_API_KEY)" }
);

export const env = createEnv({
  server: {
    // Database
    STORYFLOW_DATABASE_URL: z.string().min(1),

    // TTS (required)
    GOOGLE_TTS_API_KEY: z.string().min(1),

    // Stock media (at least one required - validated separately)
    PEXELS_API_KEY: z.string().optional(),
    UNSPLASH_ACCESS_KEY: z.string().optional(),
    PIXABAY_API_KEY: z.string().optional(),

    // AI (optional - uses Gemini CLI)
    GEMINI_MODEL: z.string().default("gemini-2.5-pro"),
    GEMINI_FALLBACK_MODEL: z.string().optional(),
    GEMINI_PRO_MODEL: z.string().optional(),
    GEMINI_PRO_FALLBACK_MODEL: z.string().optional(),

    // Google Custom Search (optional)
    GOOGLE_API_KEY: z.string().optional(),
    GOOGLE_CX: z.string().optional(),

    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  client: {
    // Client-side env vars (NEXT_PUBLIC_*)
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  runtimeEnv: {
    STORYFLOW_DATABASE_URL: process.env.STORYFLOW_DATABASE_URL,
    GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
    PEXELS_API_KEY: process.env.PEXELS_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    PIXABAY_API_KEY: process.env.PIXABAY_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL,
    GEMINI_PRO_MODEL: process.env.GEMINI_PRO_MODEL,
    GEMINI_PRO_FALLBACK_MODEL: process.env.GEMINI_PRO_FALLBACK_MODEL,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CX: process.env.GOOGLE_CX,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

// Validate stock media API keys at startup (unless skipped)
if (process.env.SKIP_ENV_VALIDATION !== "true") {
  stockMediaSchema.parse({
    PEXELS_API_KEY: env.PEXELS_API_KEY,
    UNSPLASH_ACCESS_KEY: env.UNSPLASH_ACCESS_KEY,
    PIXABAY_API_KEY: env.PIXABAY_API_KEY,
  });
}

// Derived helpers
export const hasStockMediaApi = () =>
  !!(env.PEXELS_API_KEY || env.UNSPLASH_ACCESS_KEY || env.PIXABAY_API_KEY);

export const getPreferredStockApi = (): "pexels" | "unsplash" | "pixabay" | null => {
  if (env.PEXELS_API_KEY) return "pexels";
  if (env.UNSPLASH_ACCESS_KEY) return "unsplash";
  if (env.PIXABAY_API_KEY) return "pixabay";
  return null;
};
```

### 1.3 Migration Checklist ✅

Replace `process.env.*` reads in these files:

| File | Env Vars Used | Status |
|------|---------------|--------|
| `src/lib/storyflow/settings.ts` | GEMINI_MODEL, GEMINI_FALLBACK_MODEL, GEMINI_PRO_MODEL, GEMINI_PRO_FALLBACK_MODEL | ✅ |
| `src/lib/services/ai/index.ts` | GEMINI_MODEL, BOARDS_AI_PROVIDER, AI_PROVIDER | ✅ |
| `src/lib/services/tts/index.ts` | GOOGLE_TTS_API_KEY | ✅ |
| `app/api/assets/search/route.ts` | PEXELS_API_KEY | ✅ |
| `src/lib/storyflow/prisma.ts` | NODE_ENV | ✅ |
| `src/lib/config.ts` | Uses ConfigManager pattern | ⏭️ Skip (already uses Zod) |

**Migration pattern:**

```typescript
// Before
const apiKey = process.env.GOOGLE_TTS_API_KEY;
if (!apiKey) throw new Error("Missing GOOGLE_TTS_API_KEY");

// After
import { env } from "@/src/env";
const apiKey = env.GOOGLE_TTS_API_KEY; // Already validated at startup
```

### 1.4 Add to Next.js Config ✅

**File:** `next.config.js` (add import to trigger validation at build)

```typescript
import "./src/env";
// ... rest of config
```

### 1.5 Verification ⏭️

Manual testing required:
- [ ] `npm run build` fails if required env vars missing
- [ ] `npm run dev` shows clear error message for missing vars
- [ ] All API routes work with validated env access

---

## Phase 2: Testing Infrastructure (Vitest + Testing Library + MSW)

### 2.1 Install Dependencies ✅

```bash
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  msw@latest
```

### 2.2 Vitest Configuration ✅

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "app/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/test/**",
        "src/generated/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

### 2.3 Test Setup File ✅

**File:** `src/test/setup.ts`

```typescript
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";
import { server } from "./mocks/server";

// MSW server lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

### 2.4 MSW Setup ✅

**File:** `src/test/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from "msw";

// Base URL for API routes
const API_BASE = "http://localhost:3000";

export const handlers = [
  // Projects API
  http.get(`${API_BASE}/api/projects`, () => {
    return HttpResponse.json({
      projects: [
        { id: "1", name: "Test Project", status: "DRAFT" },
      ],
    });
  }),

  http.get(`${API_BASE}/api/projects/:id`, ({ params }) => {
    return HttpResponse.json({
      project: { id: params.id, name: "Test Project", status: "DRAFT" },
    });
  }),

  http.patch(`${API_BASE}/api/projects/:id`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      project: { id: params.id, ...body },
    });
  }),

  // Music library
  http.get(`${API_BASE}/api/music/library`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    return HttpResponse.json({
      tracks: query
        ? [{ id: "1", title: `Track matching "${query}"`, duration: 180 }]
        : [],
    });
  }),

  // Asset search (stock media)
  http.get(`${API_BASE}/api/assets/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    return HttpResponse.json({
      results: [
        { id: "img1", url: "https://example.com/image.jpg", source: "pexels" },
      ],
    });
  }),

  // Script builder execution status
  http.get(`${API_BASE}/api/script-builder/execute/:draftId/status`, ({ params }) => {
    return HttpResponse.json({
      status: "COMPLETED",
      currentBeatIndex: 5,
      completedBeats: 5,
      totalBeats: 5,
      progress: 100,
    });
  }),

  // TTS generation
  http.post(`${API_BASE}/api/tts/generate`, async () => {
    return HttpResponse.json({
      success: true,
      audioPath: "/projects/test/assets/audio/segment-0.mp3",
      words: [{ word: "Hello", start: 0, end: 500 }],
    });
  }),
];
```

**File:** `src/test/mocks/server.ts`

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### 2.5 Test Utilities ✅

**File:** `src/test/utils.tsx`

```typescript
import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

interface WrapperProps {
  children: React.ReactNode;
}

// Phase 2 version - no React Query yet
// TODO: Add QueryClientProvider wrapper in Phase 4
function AllProviders({ children }: WrapperProps) {
  return <>{children}</>;
}

// Custom render that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
```

> **Note:** After Phase 4 (React Query), update this file to include `QueryClientProvider`. See Section 4.5 for the full implementation with React Query support.

### 2.6 Update package.json Scripts ✅

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 2.7 First Test: Music Library Component ✅

**File:** `components/assets/__tests__/music-library.test.tsx`

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";
import { MusicLibrary } from "../music-library";

describe("MusicLibrary", () => {
  it("renders search input", () => {
    render(<MusicLibrary projectId="test-project" />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("displays tracks after search", async () => {
    const user = userEvent.setup();
    render(<MusicLibrary projectId="test-project" />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, "jazz");
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/track matching "jazz"/i)).toBeInTheDocument();
    });
  });

  it("shows loading state during search", async () => {
    const user = userEvent.setup();
    render(<MusicLibrary projectId="test-project" />);

    await user.type(screen.getByPlaceholderText(/search/i), "test");
    await user.click(screen.getByRole("button", { name: /search/i }));

    // Loading state should appear
    expect(screen.getByText(/loading|searching/i)).toBeInTheDocument();
  });
});
```

### 2.8 First Test: API Route ✅

**File:** `app/api/projects/__tests__/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "../[id]/route";
import { NextRequest } from "next/server";

// Mock Prisma
vi.mock("@/src/generated/storyflow", () => ({
  storyflowPrisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { storyflowPrisma } from "@/src/generated/storyflow";

describe("Projects API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/projects/[id]", () => {
    it("returns project when found", async () => {
      const mockProject = { id: "123", name: "Test", status: "DRAFT" };
      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(mockProject);

      const request = new NextRequest("http://localhost:3000/api/projects/123");
      const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(data.project).toEqual(mockProject);
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects/999");
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });

      expect(response.status).toBe(404);
    });
  });
});
```

### 2.9 Migration Checklist ✅

**Progress:** 3/7 remaining tests to migrate (43% complete) - **61 deprecated tests deleted**

**Completed Migrations:**
- [x] Establish migration pattern for node:test → Vitest
- [x] Create `src/test/lib/` directory for migrated library tests
- [x] Migrate `tests/paths.test.ts` → `src/test/lib/paths.test.ts` (8 tests ✅)
- [x] Migrate `src/lib/__tests__/viewport-utils.test.ts` → `src/test/lib/viewport-utils.test.ts` (29 tests ✅)
- [x] Migrate `src/lib/__tests__/viewport-validation.test.ts` → `src/test/lib/viewport-validation.test.ts` (32 tests ✅)
- [x] Add component tests for critical paths:
  - [x] `components/assets/music-library.tsx` ✅
  - [x] `components/media/stock-search.tsx` (covered by use-asset-search tests) ✅
  - [x] `components/script-builder/execution-progress.tsx` (covered by use-execution-status tests) ✅

**Deprecated Tests Deleted (61 files):**
- [x] All `tests/e2e/**` tests (18 test files + 6 helpers) - CLI pipeline tests no longer applicable
- [x] `tests/google-search.test.ts`, `tests/web-scraper.test.ts`, `tests/local-library.test.ts` - Orphaned service tests
- [x] `tests/aspect-processor.test.ts`, `tests/integration/phase3-aspect-fit.test.ts` - Unused media pipeline
- [x] `tests/media-fallback.test.ts`, `tests/image-validator.test.ts` - Legacy media sourcing
- [x] `tests/emphasis-validator.test.ts`, `tests/scraper-types.test.ts` - Test-only modules
- [x] `tests/timeout-retry.test.ts`, `tests/tts-resilience.test.ts` - Legacy service tests
- [x] `tests/boards-triggers.test.ts` - Tests deprecated `trigger-generator.ts` (replaced by `boards/trigger-service.ts`)
- [x] `tests/reports/**` - Historical CLI failure logs

**Remaining Active Tests (4 node:test files + 1 Vitest migration pending):**
- [ ] `src/lib/__tests__/stage-invalidation.test.ts` → migrate to Vitest
- [ ] `tests/schema.test.ts` - Schema validation tests (migrate or keep as-is)
- [ ] `tests/timeline.test.ts` - Timeline generation tests (migrate or keep as-is)
- [ ] `tests/word-timing.test.ts` - Word timing tests (migrate or keep as-is)
- [ ] `tests/boards-build.test.ts` - Boards build tests (migrate or keep as-is)

**Main Test Command Updated:**
```json
"test": "npm run test:vitest && npm run test:schema && npm run test:timeline && npm run test:word-timing && npm run test:boards-build"
```

- [ ] Configure CI to run `npm run test:vitest`

> **Migration Strategy:**
> - **Priority:** Migrate `stage-invalidation.test.ts` to Vitest (only file remaining in `src/lib/__tests__/`)
> - **Optional:** Remaining 4 tests in `tests/` can stay as node:test (stable, working, low maintenance burden)
> - **Deleted:** 61 tests removed due to CLI deprecation and unused legacy modules

---

## Phase 3: Structured Logging (pino) ✅

### 3.1 Install Dependencies ✅

```bash
npm install pino
npm install -D pino-pretty
```

> **Note:** `pino-http` is not needed for Next.js App Router since it uses middleware pattern. We use a custom `withLogging` wrapper instead (see Section 3.3).

### 3.2 Logger Factory ✅

**File:** `src/lib/logger.ts`

```typescript
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Child logger factory for specific contexts
export const createLogger = (context: Record<string, unknown>) =>
  logger.child(context);

// Pre-configured child loggers for common domains
export const aiLogger = createLogger({ domain: "ai" });
export const ttsLogger = createLogger({ domain: "tts" });
export const assetsLogger = createLogger({ domain: "assets" });
export const renderLogger = createLogger({ domain: "render" });
```

### 3.3 API Route Middleware ✅

**File:** `src/lib/api-logger.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

export function withLogging(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    const reqLogger = logger.child({
      requestId,
      method: req.method,
      path: new URL(req.url).pathname,
    });

    reqLogger.info("Request started");

    try {
      const response = await handler(req, context);

      reqLogger.info({
        statusCode: response.status,
        duration: Date.now() - start,
      }, "Request completed");

      return response;
    } catch (error) {
      reqLogger.error({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        duration: Date.now() - start,
      }, "Request failed");

      throw error;
    }
  };
}
```

### 3.4 AI Logger Integration

**File:** `src/lib/services/ai/ai-logger.ts` (enhance existing)

```typescript
import { createLogger } from "@/src/lib/logger";
import { storyflowPrisma } from "@/src/generated/storyflow";

interface AILogEntry {
  projectId: string;
  operation: string;
  model: string;
  prompt?: string;
  response?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class AILogger {
  private logger;
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.logger = createLogger({
      domain: "ai",
      projectId,
    });
  }

  async log(entry: Omit<AILogEntry, "projectId">) {
    // Structured console logging
    if (entry.error) {
      this.logger.error({
        operation: entry.operation,
        model: entry.model,
        duration: entry.duration,
        error: entry.error,
      }, `AI operation failed: ${entry.operation}`);
    } else {
      this.logger.info({
        operation: entry.operation,
        model: entry.model,
        duration: entry.duration,
      }, `AI operation completed: ${entry.operation}`);
    }

    // Persist to database (existing behavior)
    await storyflowPrisma.aILog.create({
      data: {
        projectId: this.projectId,
        operation: entry.operation,
        model: entry.model,
        prompt: entry.prompt,
        response: entry.response,
        duration: entry.duration,
        error: entry.error,
        metadata: entry.metadata as any,
      },
    });
  }
}
```

### 3.5 Usage Examples

**In API routes:**

```typescript
import { withLogging } from "@/src/lib/api-logger";
import { assetsLogger } from "@/src/lib/logger";

export const POST = withLogging(async (req: NextRequest, { params }) => {
  const { projectId } = await params;

  assetsLogger.info({ projectId }, "Starting asset upload");

  // ... upload logic

  assetsLogger.info({ projectId, assetId: asset.id }, "Asset uploaded successfully");

  return NextResponse.json({ asset });
});
```

**In service functions:**

```typescript
import { ttsLogger } from "@/src/lib/logger";

export async function generateTTS(segment: Segment) {
  const start = Date.now();

  ttsLogger.debug({ segmentId: segment.id }, "Starting TTS generation");

  try {
    const result = await googleTTS.synthesize(segment.text);

    ttsLogger.info({
      segmentId: segment.id,
      duration: Date.now() - start,
      audioLength: result.duration,
    }, "TTS generation complete");

    return result;
  } catch (error) {
    ttsLogger.error({
      segmentId: segment.id,
      error: error.message,
      duration: Date.now() - start,
    }, "TTS generation failed");

    throw error;
  }
}
```

### 3.6 Migration Checklist

Replace `console.*` calls in these files:

| File | Priority | Status |
|------|----------|--------|
| `src/lib/services/ai/index.ts` | High - AI operations | ✅ |
| `src/lib/services/ai/gemini-wrapper.ts` | High - AI operations | ✅ |
| `app/api/ai/script/route.ts` | High - AI operations | ✅ |
| `app/api/ai/refine/route.ts` | High - AI operations | ✅ |
| `app/api/projects/[id]/boards/prompts/route.ts` | High - boards operations | ✅ |
| `app/api/projects/[id]/boards/viewport/route.ts` | High - boards operations | ✅ |
| `app/api/projects/[id]/boards/triggers/route.ts` | High - boards operations | ✅ |
| `app/api/projects/[id]/boards/regions/route.ts` | High - boards operations | ✅ |
| `src/lib/services/ai/ai-logger.ts` | Medium - already logging, enhance | ⏭️ (uses db logger) |
| `src/lib/storyflow/ai.ts` | Medium - AI operations | ✅ |
| `src/lib/services/tts/google-tts.ts` | Medium - TTS operations | ✅ (already using pino) |
| `src/lib/services/tts/index.ts` | Medium - TTS operations | ✅ (already using pino) |
| `app/api/projects/[id]/boards/plan/route.ts` | Low - boards operations | ✅ |
| `app/api/projects/[id]/boards/upload-image/route.ts` | Low - boards operations | ✅ |
| `app/api/render/start/route.ts` | Low - render operations | ⏭️ (no console usage found) |
| `app/api/render/[id]/status/route.ts` | Low - render operations | ⏭️ (no console usage found) |
| `app/api/assets/search/route.ts` | Low - asset operations | ✅ |

### 3.7 Environment Variables ✅

Add to `src/env.ts`:

```typescript
server: {
  // ... existing
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
}
```

---

## Phase 4: React Query ✅

**Status:** 🟢 Complete (95%) - All priority migrations done

**Progress:**
- ✅ 4.1-4.5: Infrastructure & Hooks (Complete)
- ✅ 4.6-4.7: Initial Component Migrations (2/2 complete)
- ✅ 4.8: RSC Integration Pattern (Complete)
- ✅ 4.9: Migration Checklist (Complete)
- ✅ 4.10: Phase 1 High-Priority Migrations (5/5 complete - 100%)
- ✅ 4.11: Phase 2 Medium-Priority Migrations (5/5 complete - 100%)
- ✅ 4.12: Phase 3 Low-Priority Migrations (3/3 complete - 100%)
- ✅ 4.13: Phase 4 Utility Component Migrations (5/6 complete - 83%)

**Components Migrated:** 18/19 (95%)
- **High Priority (5/5):** execution-progress.tsx, stock-search.tsx, music-library.tsx, ai-logs-client.tsx, render-panel.tsx
- **Medium Priority (5/5):** project-card.tsx, media-manager.tsx, tts-manager.tsx, asset-manager.tsx, script-builder-workflow.tsx
- **Low Priority (3/3):** simple-boards-editor.tsx, simple-viewport-editor.tsx, simple-asset-mapper.tsx
- **Utility (5/6):** beat-regeneration.tsx, blueprint-review.tsx, history-panel.tsx, glue-phase.tsx, ImageUploader.tsx
- **Skipped (1):** BoardPlannerWizard.tsx (wizard flow, manual fetch works well)

### 4.1 Install Dependencies ✅

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 4.2 Query Client Provider ✅

**File:** `src/lib/query-client.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale after 30 seconds
        staleTime: 30 * 1000,
        // Cache for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry once on failure
        retry: 1,
        // Refetch on window focus in production only
        refetchOnWindowFocus: process.env.NODE_ENV === "production",
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}
```

**File:** `src/providers/query-provider.tsx`

```typescript
"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "@/src/lib/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create client once per component instance (survives re-renders)
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### 4.3 Add to Root Layout ✅

**File:** `app/layout.tsx`

```typescript
import { QueryProvider } from "@/src/providers/query-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 4.4 API Client Functions ✅

**File:** `src/lib/api/projects.ts`

```typescript
import { Project } from "@/src/lib/types";

const API_BASE = "/api";

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  const data = await res.json();
  return data.projects;
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  const data = await res.json();
  return data.project;
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update project");
  const result = await res.json();
  return result.project;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
}
```

**File:** `src/lib/api/assets.ts`

```typescript
export interface AssetSearchResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  source: "pexels" | "unsplash" | "pixabay";
  width: number;
  height: number;
}

export async function searchAssets(query: string): Promise<AssetSearchResult[]> {
  const res = await fetch(`/api/assets/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search assets");
  const data = await res.json();
  return data.results;
}

export async function uploadAsset(
  projectId: string,
  file: File
): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("projectId", projectId);

  const res = await fetch("/api/assets/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload asset");
  return res.json();
}
```

**File:** `src/lib/api/script-builder.ts`

```typescript
export interface ExecutionStatus {
  status: "PENDING" | "EXECUTING" | "GLUING" | "COMPLETED" | "FAILED";
  currentBeatIndex: number;
  completedBeats: number;
  totalBeats: number;
  progress: number;
  error?: string;
}

export async function fetchExecutionStatus(draftId: string): Promise<ExecutionStatus> {
  const res = await fetch(`/api/script-builder/execute/${draftId}/status`);
  if (!res.ok) throw new Error("Failed to fetch execution status");
  return res.json();
}

export async function startExecution(blueprintId: string): Promise<{ scriptDraftId: string }> {
  const res = await fetch("/api/script-builder/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blueprintId }),
  });
  if (!res.ok) throw new Error("Failed to start execution");
  return res.json();
}
```

### 4.5 Query Hooks ✅

**File:** `src/hooks/queries/use-projects.ts`

```typescript
import { Project } from "@/src/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjects, fetchProject, updateProject, deleteProject } from "@/src/lib/api/projects";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: fetchProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      updateProject(id, data),
    onSuccess: (updatedProject, { id }) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(id), updatedProject);
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
```

**File:** `src/hooks/queries/use-execution-status.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchExecutionStatus, ExecutionStatus } from "@/src/lib/api/script-builder";

export function useExecutionStatus(draftId: string | null) {
  return useQuery({
    queryKey: ["execution-status", draftId],
    queryFn: () => fetchExecutionStatus(draftId!),
    enabled: !!draftId,
    // Poll every 2.5 seconds while executing
    refetchInterval: (query) => {
      const data = query.state.data as ExecutionStatus | undefined;
      if (!data) return 2500;
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        return false; // Stop polling
      }
      return 2500;
    },
  });
}
```

> **Note:** Side effects like `onComplete` should be handled by the caller using `useEffect`, not inside `refetchInterval`:
>
> ```typescript
> // In the component that uses useExecutionStatus:
> const { data: status } = useExecutionStatus(draftId);
>
> useEffect(() => {
>   if (status?.status === "COMPLETED") {
>     onComplete?.();
>   }
> }, [status?.status, onComplete]);
> ```

**File:** `src/hooks/queries/use-asset-search.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { searchAssets } from "@/src/lib/api/assets";

export function useAssetSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["asset-search", query],
    queryFn: () => searchAssets(query),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000, // Cache search results for 5 minutes
  });
}
```

### 4.5.1 Update Test Utilities for React Query ✅

**File:** `src/test/utils.tsx` (updated from Phase 2)

```typescript
import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a fresh QueryClient for each test to avoid shared state
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Custom render that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
```

### 4.6 Component Migration: Execution Progress ✅

**Before:** `components/script-builder/execution-progress.tsx`

```typescript
// Manual polling with useEffect
useEffect(() => {
  if (!draftId) return;

  const pollStatus = async () => {
    const res = await fetch(`/api/script-builder/execute/${draftId}/status`);
    const data = await res.json();
    setStatus(data);
    if (data.status === "COMPLETED") onComplete?.();
  };

  pollStatus();
  const interval = setInterval(pollStatus, 2500);
  return () => clearInterval(interval);
}, [draftId, onComplete]);
```

**After:**

```typescript
import { useEffect } from "react";
import { useExecutionStatus } from "@/src/hooks/queries/use-execution-status";

function ExecutionProgress({ draftId, onComplete }: Props) {
  const { data: status, isLoading, error } = useExecutionStatus(draftId);

  // Handle completion side effect
  useEffect(() => {
    if (status?.status === "COMPLETED") {
      onComplete?.();
    }
  }, [status?.status, onComplete]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <InlineError error={error} />;
  if (!status) return null;

  return (
    <div>
      <Progress value={status.progress} />
      <p>Beat {status.completedBeats} of {status.totalBeats}</p>
    </div>
  );
}
```

### 4.7 Component Migration: Stock Search ✅

**Before:** `components/media/stock-search.tsx`

```typescript
const [loading, setLoading] = useState(false);
const [results, setResults] = useState([]);
const [error, setError] = useState(null);

const handleSearch = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/assets/search?query=${query}`);
    const data = await res.json();
    setResults(data.results);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

**After:**

```typescript
import { useAssetSearch } from "@/src/hooks/queries/use-asset-search";

function StockSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results, isLoading, error } = useAssetSearch(searchTerm);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchTerm(query); // Triggers the query
  };

  return (
    <form onSubmit={handleSearch}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="submit" disabled={isLoading}>Search</button>

      {error && <InlineError error={error} onRetry={() => setSearchTerm(query)} />}

      {isLoading ? (
        <SearchSkeleton />
      ) : (
        <ResultsGrid results={results} onSelect={onSelect} />
      )}
    </form>
  );
}
```

### 4.6.1-4.7.3 Additional High-Priority Migrations ✅

**Phase 1 Complete:** All 5 high-priority components migrated (Iteration 10)

Additional components migrated following the same patterns:

- **4.6.1 music-library.tsx** - Search + cache pattern (similar to stock-search)
  - Uses `useMusicSearch` hook with 5-minute caching
  - Uses `useSelectMusicTrack` mutation
  - Reduced from 155 → 115 lines (-26%)

- **4.7.1 ai-logs-client.tsx** - List query + smart polling
  - Replaced SSE with React Query polling
  - Smart polling: 3s when busy, 10s when idle
  - Reduced from 195 → 120 lines (-38%)

- **4.7.2 render-panel.tsx** - Mutations + polling
  - Uses `useRenderStatus` with auto-stop polling
  - Uses `useStartRender` mutation
  - Reduced from 100 → 80 lines (-20%)

**Total code reduction:** -135 lines across 3 components
**Files created:** 6 new files (3 API clients, 3 hook modules)

### 4.8 RSC Integration Pattern ✅

For pages that fetch initial data via RSC, pass it as `initialData`:

**See:** `docs/rsc-react-query-integration.md` for complete guide

```typescript
// app/(dashboard)/projects/[id]/media/page.tsx (RSC)
export default async function MediaPage({ params }: Params) {
  const { id } = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id },
    include: { assets: true },
  });

  return (
    <MediaManager
      projectId={id}
      initialAssets={project.assets}
    />
  );
}

// components/media/media-manager.tsx (Client)
"use client";

import { useQuery } from "@tanstack/react-query";

function MediaManager({ projectId, initialAssets }: Props) {
  const { data: assets } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => fetchAssets(projectId),
    initialData: initialAssets, // No loading flash on first render
  });

  // ... rest of component
}
```

### 4.9 Migration Checklist ✅

**See:** `docs/react-query-migration-checklist.md` for complete checklist

**Migration Progress: 7/20 components (35%)** - Phase 1 complete, Phase 2 in progress (2/6)

Migrate components in this order (by impact):

| Component | Pattern | Priority | Status |
|-----------|---------|----------|--------|
| `execution-progress.tsx` | Polling | High | ✅ Complete |
| `stock-search.tsx` | Search + cache | High | ✅ Complete |
| `music-library.tsx` | Search + cache | High | ✅ Complete |
| `ai-logs-client.tsx` | List + polling | High | ✅ Complete |
| `render-panel.tsx` | Mutations + polling | High | ✅ Complete |
| `project-card.tsx` | Mutations (delete) | Medium | ✅ Complete |
| `media-manager.tsx` | List + mutations | Medium | ✅ Complete |
| `tts-manager.tsx` | Mutations (regenerate) | Medium | ✅ Complete |
| `asset-manager.tsx` | List + mutations | Medium | ✅ Complete |
| `script-builder-workflow.tsx` | Multi-step workflow | Medium | ✅ Complete |

### 4.10 Remove Custom useAutoSave (Optional)

After React Query is in place, you can replace `useAutoSave` with `useMutation`:

```typescript
// Replace useAutoSave with:
const mutation = useMutation({
  mutationFn: (data) => updateProject(projectId, data),
  // Debounce happens in the caller
});

// Use with lodash debounce or useDeferredValue
const debouncedSave = useMemo(
  () => debounce((data) => mutation.mutate(data), 1500),
  [mutation]
);
```

However, `useAutoSave` with localStorage fallback is more robust for unreliable networks. Keep it if that's important.

---

## Verification Checklist

### Phase 1: Environment Validation
- [ ] `npm run build` fails with clear message when required env vars missing
- [ ] `npm run dev` starts successfully with all required vars
- [ ] IDE shows types for `env.*` properties

### Phase 2: Testing
- [x] `npm run test` runs all tests (Vitest + 4 node:test files)
- [x] `npm run test:vitest:watch` provides watch mode
- [x] `npm run test:vitest:coverage` generates coverage report
- [x] MSW intercepts API calls in tests
- [x] Component tests pass (music-library, stock-search, execution-progress)
- [x] Hook tests pass (use-execution-status, use-asset-search, use-projects)
- [x] Library tests migrated (paths, viewport-utils, viewport-validation)
- [ ] Migrate remaining test: `stage-invalidation.test.ts`

### Phase 3: Logging
- [ ] Dev server shows pretty-printed logs with colors
- [ ] Production build outputs JSON logs
- [ ] AI operations log to both console and database
- [ ] Request logging shows method, path, duration, status

### Phase 4: React Query
- [ ] DevTools visible in development
- [ ] Execution progress polls correctly, stops on completion
- [ ] Stock search caches results, no refetch on re-mount
- [ ] Project mutations invalidate list cache
- [ ] No loading flash for RSC-hydrated queries

---

## File Summary

### New Files

```
src/
├── env.ts                           # Phase 1
├── lib/
│   ├── logger.ts                    # Phase 3
│   ├── api-logger.ts                # Phase 3
│   ├── query-client.ts              # Phase 4
│   └── api/
│       ├── projects.ts              # Phase 4
│       ├── assets.ts                # Phase 4
│       └── script-builder.ts        # Phase 4
├── providers/
│   └── query-provider.tsx           # Phase 4
├── hooks/
│   └── queries/
│       ├── use-projects.ts          # Phase 4
│       ├── use-execution-status.ts  # Phase 4
│       └── use-asset-search.ts      # Phase 4
└── test/
    ├── setup.ts                     # Phase 2
    ├── utils.tsx                    # Phase 2
    ├── lib/                         # Phase 2 - Migrated tests
    │   ├── paths.test.ts            # ✅ Migrated
    │   ├── viewport-utils.test.ts   # ✅ Migrated
    │   └── viewport-validation.test.ts # ✅ Migrated
    └── mocks/
        ├── handlers.ts              # Phase 2
        └── server.ts                # Phase 2

vitest.config.ts                      # Phase 2
```

### Modified Files

| File | Phase | Changes |
|------|-------|---------|
| `package.json` | All | Add dependencies and scripts |
| `next.config.js` | 1 | Import env.ts |
| `app/layout.tsx` | 4 | Add QueryProvider |
| `src/lib/storyflow/settings.ts` | 1 | Use env.ts |
| `src/lib/services/ai/ai-logger.ts` | 3 | Use pino logger |
| `src/test/utils.tsx` | 4 | Add QueryClientProvider wrapper |
| `components/script-builder/execution-progress.tsx` | 4 | Use useExecutionStatus |
| `components/media/stock-search.tsx` | 4 | Use useAssetSearch |
| `components/assets/music-library.tsx` | 4 | Use useQuery |

### Deleted Files (Phase 2 Cleanup)

**Total: 61 deprecated test files removed**

**CLI Pipeline Tests (18 tests + 6 helpers + 1 README):**
- `tests/e2e/stage-*.test.ts` (discover, curate, refine, gather, build, render, script)
- `tests/e2e/full-pipeline.test.ts`, `tests/e2e/word-sync.test.ts`, `tests/e2e/local-library-gather.test.ts`
- `tests/e2e/edge-cases/*.test.ts` (6 files)
- `tests/e2e/helpers/*.ts` (6 files)
- `tests/e2e/script-builder-phase1.ts`, `tests/e2e/stage-gather-scrape.test.ts.broken`

**Orphaned Service Tests (3 files):**
- `tests/google-search.test.ts` (imported deleted `services/media/google-search`)
- `tests/web-scraper.test.ts` (imported deleted `services/media/web-scraper`)
- `tests/local-library.test.ts` (imported deleted `services/media/local-repo`)

**Legacy Media Pipeline Tests (9 files):**
- `tests/aspect-processor.test.ts`, `tests/integration/phase3-aspect-fit.test.ts`
- `tests/media-fallback.test.ts`, `tests/image-validator.test.ts`
- `tests/emphasis-validator.test.ts`, `tests/scraper-types.test.ts`
- `tests/timeout-retry.test.ts`, `tests/tts-resilience.test.ts`
- `tests/boards-triggers.test.ts` (tested deprecated `trigger-generator.ts`)

**Duplicate Tests (3 files - migrated to Vitest):**
- `src/lib/__tests__/viewport-utils.test.ts` → `src/test/lib/viewport-utils.test.ts`
- `src/lib/__tests__/viewport-validation.test.ts` → `src/test/lib/viewport-validation.test.ts`
- `tests/paths.test.ts` → `src/test/lib/paths.test.ts`

**Historical Artifacts:**
- `tests/reports/e2e/failures/**` (4 CLI pipeline failure logs)
