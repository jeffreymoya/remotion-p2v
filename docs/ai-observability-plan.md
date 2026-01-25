# AI Observability & State Persistence Plan

> 📋 **Changelog:** [changelog/ai-observability-plan.md-changelog.md](../changelog/ai-observability-plan.md-changelog.md)

## Overview

This plan addresses two interconnected issues:
1. **Workflow state loss** - Script builder resets to "Generate Blueprint" on page refresh
2. **AI call blindness** - No visibility into Gemini prompts, responses, latency, or errors

## Requirements Summary

| Requirement | Decision |
|-------------|----------|
| Primary goal | Debugging + Performance + Cost tracking |
| AI providers | All (Gemini CLI + future providers + TTS) |
| Model tiering | `gemini-3-pro` (complex) / `gemini-3-flash` (basic, default) |
| Retention | Per-project lifetime |
| UI location | Per-project tab (utility section) |
| Storage | SQLite table in storyflow.db |
| Metrics | All (latency, success/failure, tokens, content) |
| Live updates | Server-Sent Events (SSE) |
| Formatting | Syntax highlighting, diffs, markdown, collapsibles |
| Error display | Inline + dedicated errors tab + toast |
| Filters | Basic (date, status, provider) |
| Integration | Wrapper/middleware pattern |
| In-progress | Show pending state immediately |
| Versioning | Full lineage tracking (parent-child relationships) |
| Token counts | Parse from Gemini CLI output |
| Analytics | Stats cards (expandable to dedicated tab later) |
| State recovery | Phase-level, block with error UI if corrupted |

---

## Part 1: State Persistence ✅

### Problem

Current initialization in `script-builder-workflow.tsx`:
```typescript
const [phase, setPhase] = useState<WorkflowPhase>(
  initialScript ? "preview" : "input"  // Only checks final script!
);
```

The page only queries `project.script` - no recovery of intermediate phases.

### Solution

#### 1.1 Extend Prisma Query in Page

**File:** `app/(dashboard)/projects/[id]/script/page.tsx`

Query active workflow state:
```typescript
const project = await storyflowPrisma.project.findUnique({
  where: { id: resolvedParams.id },
  include: {
    script: true,
    blueprints: {
      where: { status: { in: ['GENERATING', 'PENDING_REVIEW', 'APPROVED'] } },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: {
        scriptDrafts: {
          where: { status: { notIn: ['COMPLETED', 'FAILED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    },
  },
});
```

#### 1.2 Phase Determination Logic

Create utility function to determine phase from database state:

```typescript
// src/lib/storyflow/workflow-state.ts

export type WorkflowPhase = 'input' | 'blueprint' | 'execution' | 'glue' | 'preview';

export interface WorkflowState {
  phase: WorkflowPhase;
  blueprint: Blueprint | null;
  scriptDraft: ScriptDraft | null;
  script: Script | null;
  error: string | null;
}

export function determineWorkflowState(project: ProjectWithRelations): WorkflowState {
  // Has final script → preview
  if (project.script) {
    return { phase: 'preview', blueprint: null, scriptDraft: null, script: project.script, error: null };
  }

  const activeBlueprint = project.blueprints?.[0];
  if (!activeBlueprint) {
    return { phase: 'input', blueprint: null, scriptDraft: null, script: null, error: null };
  }

  const activeDraft = activeBlueprint.scriptDrafts?.[0];

  // Blueprint exists but no draft → user was reviewing blueprint
  if (!activeDraft) {
    if (activeBlueprint.status === 'APPROVED') {
      return { phase: 'execution', blueprint: activeBlueprint, scriptDraft: null, script: null, error: null };
    }
    return { phase: 'blueprint', blueprint: activeBlueprint, scriptDraft: null, script: null, error: null };
  }

  // Draft exists → determine phase from draft status
  switch (activeDraft.status) {
    case 'DRAFTING':
      return { phase: 'execution', blueprint: activeBlueprint, scriptDraft: activeDraft, script: null, error: null };
    case 'GLUING':
    case 'POLISHING':
      return { phase: 'glue', blueprint: activeBlueprint, scriptDraft: activeDraft, script: null, error: null };
    case 'COMPLETED':
      // Draft completed but no final script yet - user was in preview/finalization phase
      return { phase: 'preview', blueprint: activeBlueprint, scriptDraft: activeDraft, script: null, error: null };
    case 'FAILED':
      // Draft failed - show error state with option to retry
      return {
        phase: 'execution',
        blueprint: activeBlueprint,
        scriptDraft: activeDraft,
        script: null,
        error: `Script draft failed: ${activeDraft.errorMessage ?? 'Unknown error'}`
      };
    default:
      return { phase: 'input', blueprint: null, scriptDraft: null, script: null, error: null };
  }
}
```

#### 1.3 Update ScriptBuilderWorkflow Props

```typescript
interface ScriptBuilderWorkflowProps {
  projectId: string;
  initialTopic: string | null;
  initialState: WorkflowState;  // New: pre-computed state from server
}
```

#### 1.4 Error UI Component

When state is corrupted (e.g., blueprint exists but can't be parsed):

```typescript
// components/script-builder/workflow-error.tsx
export function WorkflowError({ error, onReset }: { error: string; onReset: () => void }) {
  return (
    <div className="rounded-lg border border-rose-800 bg-rose-950/50 p-6">
      <h3 className="text-lg font-semibold text-rose-200">Workflow State Error</h3>
      <p className="mt-2 text-sm text-rose-300">{error}</p>
      <button onClick={onReset} className="mt-4 rounded bg-rose-600 px-4 py-2 text-sm text-white">
        Reset & Start Fresh
      </button>
    </div>
  );
}
```

### Files Changed

| File | Change |
|------|--------|
| `app/(dashboard)/projects/[id]/script/page.tsx` | Extended query, pass `initialState` |
| `src/lib/storyflow/workflow-state.ts` | New: phase determination logic |
| `components/script-builder/script-builder-workflow.tsx` | Accept `initialState`, remove derived init |
| `components/script-builder/workflow-error.tsx` | New: error UI component |

---

## Part 2: AI Observability System ✅

### 2.1 Database Schema

**File:** `prisma/storyflow.schema.prisma`

```prisma
model AiCallLog {
  id              String      @id @default(cuid())
  projectId       String
  project         Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Call metadata
  provider        String      // 'gemini-cli' | 'google-tts' | future providers
  model           String?     // 'gemini-2.5-pro', 'gemini-2.5-flash', etc.
  operation       String      // 'blueprint-generate' | 'beat-draft' | 'glue-analyze' | 'tts-generate'

  // Lineage tracking
  parentId        String?     // For retry/refinement chains
  parent          AiCallLog?  @relation("CallLineage", fields: [parentId], references: [id], onDelete: SetNull)
  children        AiCallLog[] @relation("CallLineage")

  // Request
  prompt          String      // Full prompt text
  promptTokens    Int?        // Token count if available

  // Response
  response        String?     // Full response text (null if pending/failed)
  responseTokens  Int?        // Token count if available

  // Status & timing
  status          AiCallStatus @default(PENDING)
  startedAt       DateTime    @default(now())
  completedAt     DateTime?
  durationMs      Int?        // Computed: completedAt - startedAt

  // Error handling
  errorMessage    String?
  errorCode       String?     // e.g., 'RATE_LIMIT', 'TIMEOUT', 'PARSE_ERROR'
  retryCount      Int         @default(0)

  // Additional metadata
  metadata        Json?       // Flexible field for provider-specific data

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([projectId])
  @@index([status])
  @@index([operation])
  @@index([startedAt])
}

enum AiCallStatus {
  PENDING     // Call created, waiting for response
  STREAMING   // Response being streamed (future use)
  COMPLETED   // Call finished successfully
  FAILED      // Call errored
  CANCELLED   // Reserved for future cancellation feature (not implemented in Phase 1)
}
```

Update Project model:
```prisma
model Project {
  // ... existing fields
  aiCallLogs    AiCallLog[]
}
```

### 2.2 Logging Service (Wrapper/Middleware)

**File:** `src/lib/services/ai/ai-logger.ts`

```typescript
import { storyflowPrisma } from '@/src/lib/storyflow/prisma';
import { AiCallStatus } from '@prisma/client';

export interface AiCallContext {
  projectId: string;
  provider: 'gemini-cli' | 'google-tts' | string;
  model?: string;
  operation: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface AiCallResult<T> {
  data: T;
  logId: string;
  durationMs: number;
  tokens?: { prompt: number; response: number };
}

class AiLogger {
  private notifyCallbacks: Set<(logId: string) => void> = new Set();

  /**
   * Subscribe to new log entries (for SSE)
   */
  onNewLog(callback: (logId: string) => void): () => void {
    this.notifyCallbacks.add(callback);
    return () => this.notifyCallbacks.delete(callback);
  }

  private notify(logId: string) {
    this.notifyCallbacks.forEach(cb => cb(logId));
  }

  /**
   * Wrap an AI call with automatic logging
   */
  async wrap<T>(
    context: AiCallContext,
    prompt: string,
    executor: () => Promise<{ result: T; rawResponse: string; tokens?: { prompt: number; response: number } }>
  ): Promise<AiCallResult<T>> {
    const startedAt = new Date();

    // Create pending log entry
    const log = await storyflowPrisma.aiCallLog.create({
      data: {
        projectId: context.projectId,
        provider: context.provider,
        model: context.model,
        operation: context.operation,
        parentId: context.parentId,
        prompt,
        promptTokens: this.estimateTokens(prompt),
        status: 'PENDING',
        startedAt,
        metadata: context.metadata ?? {},
      },
    });

    this.notify(log.id);

    try {
      const { result, rawResponse, tokens } = await executor();
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Update with success
      await storyflowPrisma.aiCallLog.update({
        where: { id: log.id },
        data: {
          status: 'COMPLETED',
          response: rawResponse,
          responseTokens: tokens?.response ?? this.estimateTokens(rawResponse),
          promptTokens: tokens?.prompt ?? log.promptTokens,
          completedAt,
          durationMs,
        },
      });

      this.notify(log.id);

      return { data: result, logId: log.id, durationMs, tokens };
    } catch (error) {
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Update with failure
      await storyflowPrisma.aiCallLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: this.categorizeError(error),
          completedAt,
          durationMs,
        },
      });

      this.notify(log.id);
      throw error;
    }
  }

  /**
   * Estimate token count (rough approximation: ~4 chars per token)
   * Note: This is an approximate estimate for cost tracking. Actual token
   * counts vary 3-5 chars/token. When Gemini CLI provides actual usage
   * stats, those values take precedence over this estimate.
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Categorize error for filtering
   */
  private categorizeError(error: unknown): string {
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('rate limit')) return 'RATE_LIMIT';
    if (msg.includes('timeout')) return 'TIMEOUT';
    if (msg.includes('parse') || msg.includes('json')) return 'PARSE_ERROR';
    if (msg.includes('network')) return 'NETWORK_ERROR';
    return 'UNKNOWN';
  }
}

export const aiLogger = new AiLogger();
```

### 2.3 Gemini CLI Wrapper

**File:** `src/lib/services/ai/gemini-wrapper.ts`

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';
import { aiLogger, AiCallContext } from './ai-logger';

const execFileAsync = promisify(execFile);

// Model tiers for cost optimization
export const GEMINI_MODELS = {
  PRO: 'gemini-3-pro',     // Complex reasoning, structured planning
  FLASH: 'gemini-3-flash', // Basic tasks, simple generation
} as const;

type GeminiModel = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS];

interface GeminiOptions {
  model?: GeminiModel;
  outputFormat?: 'json' | 'text' | 'stream-json';
}

interface GeminiResult<T> {
  data: T;
  logId: string;
  durationMs: number;
  tokens?: { prompt: number; response: number };
}

export async function geminiCall<T>(
  context: Omit<AiCallContext, 'provider'>,
  prompt: string,
  options: GeminiOptions = {}
): Promise<GeminiResult<T>> {
  // Default to flash for cost savings, override with pro for complex tasks
  const model = options.model ?? GEMINI_MODELS.FLASH;
  const format = options.outputFormat ?? 'json';

  return aiLogger.wrap<T>(
    { ...context, provider: 'gemini-cli', model },
    prompt,
    async () => {
      // Use args array to avoid shell injection (security best practice)
      const args = [
        '--yolo',
        '--model', model,
        '--output-format', format,
        prompt,
      ];

      const { stdout: rawResponse } = await execFileAsync('gemini', args, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024, // 50MB
        timeout: 300000, // 5 min
      });

      // Parse token usage from Gemini output if available
      const tokens = parseGeminiTokenUsage(rawResponse);

      // Parse the actual result
      const result = format === 'json' ? JSON.parse(rawResponse) : rawResponse;

      return { result, rawResponse, tokens };
    }
  );
}

function parseGeminiTokenUsage(output: string): { prompt: number; response: number } | undefined {
  // Gemini CLI may include usage stats - parse if present
  // This is a placeholder - adjust based on actual CLI output format
  const usageMatch = output.match(/usage[:\s]+(\d+)\s*prompt[,\s]+(\d+)\s*response/i);
  if (usageMatch) {
    return { prompt: parseInt(usageMatch[1]), response: parseInt(usageMatch[2]) };
  }
  return undefined;
}
```

### 2.4 Migration of Existing AI Calls

Current AI call sites need to be updated to use the wrapper:

| File | Function | Operation Name | Model | Notes |
|------|----------|----------------|-------|-------|
| `src/lib/storyflow/script-builder.ts` | `generateBlueprint()` | `blueprint-generate` | `gemini-3-pro` | Complex: structured planning |
| `src/lib/storyflow/script-builder.ts` | `executeBeat()` | `beat-draft` | `gemini-3-flash` | Basic: single beat generation |
| `src/lib/storyflow/ai.ts` | `generalizeTopics()` | `topic-generalize` | `gemini-3-flash` | Basic: simple text processing |
| `src/lib/storyflow/viewport.ts` | `generateViewport()` | `viewport-generate` | `gemini-3-pro` | Complex: camera path planning |
| `app/api/tts/generate/route.ts` | TTS call | `tts-generate` | N/A | Google TTS (provider: 'google-tts') |

### Model Selection Guidelines

| Model | Use For | Cost |
|-------|---------|------|
| `gemini-3-pro` | Complex reasoning, structured planning, multi-step logic | Higher |
| `gemini-3-flash` | Simple text generation, single-step tasks, basic formatting | Lower |

**Complex tasks** (use `gemini-3-pro`):
- Blueprint generation (requires understanding full video structure)
- Viewport/camera path generation (spatial reasoning)
- Script refinement with structural changes

**Basic tasks** (use `gemini-3-flash`):
- Individual beat drafting (single segment)
- Topic generalization (simple text transformation)
- Text formatting and cleanup

> **Note:** `analyzeGlue()` in `glue.ts` is a pure JavaScript function using the `string-similarity` library - it does NOT make AI calls and should not be logged.

**Example migration:**

Before:
```typescript
const result = execSync(`gemini --yolo --model ${model} --output-format json "${prompt}"`);
const blueprint = JSON.parse(result);
```

After (complex task - use PRO):
```typescript
import { geminiCall, GEMINI_MODELS } from '@/src/lib/services/ai/gemini-wrapper';

// Blueprint generation is complex - use PRO model
const { data: blueprint, logId, durationMs } = await geminiCall<Blueprint>(
  { projectId, operation: 'blueprint-generate' },
  prompt,
  { model: GEMINI_MODELS.PRO }
);
```

After (basic task - use FLASH, or omit for default):
```typescript
import { geminiCall, GEMINI_MODELS } from '@/src/lib/services/ai/gemini-wrapper';

// Beat drafting is simpler - use FLASH model (default)
const { data: beat, logId, durationMs } = await geminiCall<Beat>(
  { projectId, operation: 'beat-draft' },
  prompt,
  { model: GEMINI_MODELS.FLASH } // optional, FLASH is default
);
```

### 2.5 SSE Endpoint for Live Updates

**File:** `app/api/projects/[id]/ai-logs/stream/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { aiLogger } from '@/src/lib/services/ai/ai-logger';
import { storyflowPrisma } from '@/src/lib/storyflow/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Subscribe to new logs
      const unsubscribe = aiLogger.onNewLog(async (logId) => {
        const log = await storyflowPrisma.aiCallLog.findUnique({
          where: { id: logId },
        });

        if (log && log.projectId === projectId) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'update', log })}\n\n`)
          );
        }
      });

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 2.6 API Routes

**File:** `app/api/projects/[id]/ai-logs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { storyflowPrisma } from '@/src/lib/storyflow/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const searchParams = request.nextUrl.searchParams;

  // Pagination
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100); // Max 100

  // Basic filters
  const status = searchParams.get('status'); // 'COMPLETED' | 'FAILED' | 'PENDING'
  const provider = searchParams.get('provider'); // 'gemini-cli' | 'google-tts'
  const operation = searchParams.get('operation'); // 'blueprint-generate' | 'beat-draft' | etc.
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = { projectId };

  if (status) where.status = status;
  if (provider) where.provider = provider;
  if (operation) where.operation = operation;
  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) where.startedAt.gte = new Date(startDate);
    if (endDate) where.startedAt.lte = new Date(endDate);
  }

  const [logs, totalCount, stats] = await Promise.all([
    storyflowPrisma.aiCallLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: page * limit,
      take: limit,
    }),
    storyflowPrisma.aiCallLog.count({ where }),
    storyflowPrisma.aiCallLog.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true,
      _avg: { durationMs: true },
    }),
  ]);

  return NextResponse.json({
    logs,
    stats,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: (page + 1) * limit < totalCount,
    },
  });
}
```

### 2.7 UI Components

#### Stats Cards Component

**File:** `components/ai-logs/stats-cards.tsx`

```typescript
interface StatsCardsProps {
  stats: {
    totalCalls: number;
    successRate: number;
    avgLatency: number;
    totalTokens: number;
    pendingCalls: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <StatCard label="Total Calls" value={stats.totalCalls} />
      <StatCard label="Success Rate" value={`${stats.successRate.toFixed(1)}%`} variant={stats.successRate > 90 ? 'success' : 'warning'} />
      <StatCard label="Avg Latency" value={`${(stats.avgLatency / 1000).toFixed(1)}s`} />
      <StatCard label="Total Tokens" value={stats.totalTokens.toLocaleString()} />
      <StatCard label="Pending" value={stats.pendingCalls} variant={stats.pendingCalls > 0 ? 'active' : 'default'} />
    </div>
  );
}
```

#### Log Entry Component (Rich Formatting)

**File:** `components/ai-logs/log-entry.tsx`

Features:
- Collapsible prompt/response sections
- Syntax highlighting for JSON
- Markdown rendering for text responses
- Status badge (pending spinner, success, failed)
- Duration display
- Token counts
- Parent/child lineage links

#### Log List Component

**File:** `components/ai-logs/log-list.tsx`

Features:
- Virtual scrolling for performance
- Filter controls (status, provider, date range)
- Pending entries with spinner
- Click to expand details

#### Errors Tab Component

**File:** `components/ai-logs/errors-tab.tsx`

Filtered view showing only failed calls with:
- Error message
- Error code badge
- Retry count
- Link to retry/view prompt

### 2.8 Project Layout Integration

**File:** `app/(dashboard)/projects/[id]/layout.tsx`

Add AI Logs link beside the existing Overview link (the layout uses inline links, not a `utilityTabs` array):

```typescript
// Inside the layout JSX, add AI Logs link next to Overview
<div className="flex items-center gap-3">
  <h1 className="text-xl font-semibold text-white">{project.name}</h1>
  <Link
    href={`/projects/${project.id}/overview`}
    className="text-xs font-semibold text-brand-200 hover:text-brand-100 underline underline-offset-4"
  >
    Overview
  </Link>
  <Link
    href={`/projects/${project.id}/ai-logs`}
    className="text-xs font-semibold text-brand-200 hover:text-brand-100 underline underline-offset-4"
  >
    AI Logs
  </Link>
</div>
```

**File:** `app/(dashboard)/projects/[id]/ai-logs/page.tsx`

```typescript
import { PageContainer } from '@/components/layout/page-container';
import { AiLogsClient } from '@/components/ai-logs/ai-logs-client';

export default async function AiLogsPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  return (
    <PageContainer>
      <h1 className="text-xl font-semibold text-white mb-6">AI Call Logs</h1>
      <AiLogsClient projectId={resolvedParams.id} />
    </PageContainer>
  );
}
```

**File:** `app/api/projects/[id]/ai-logs/[logId]/route.ts` (Single log endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { storyflowPrisma } from '@/src/lib/storyflow/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; logId: string } }
) {
  const resolvedParams = await params;
  const log = await storyflowPrisma.aiCallLog.findUnique({
    where: { id: resolvedParams.logId },
    include: {
      parent: { select: { id: true, operation: true, status: true } },
      children: { select: { id: true, operation: true, status: true } },
    },
  });

  if (!log || log.projectId !== resolvedParams.id) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }

  return NextResponse.json({ log });
}
```

---

## Part 3: Implementation Phases

### Phase 1: State Persistence (Priority: Critical) ✅
**Estimated scope: Small**

1. Create `workflow-state.ts` utility
2. Update `script/page.tsx` query
3. Update `ScriptBuilderWorkflow` to accept `initialState`
4. Add `WorkflowError` component
5. Test recovery scenarios

### Phase 2: Database & Core Logging (Priority: High) ✅
**Estimated scope: Medium**

1. Add Prisma schema for `AiCallLog`
2. Run migration
3. Create `ai-logger.ts` service
4. Create `gemini-wrapper.ts`
5. Unit tests for logger

### Phase 3: Migrate Existing AI Calls (Priority: High) ✅
**Estimated scope: Medium**

1. Update `script-builder.ts` calls
2. Update `ai.ts` calls
3. Update `viewport.ts` calls
4. Update TTS route
5. Integration tests

### Phase 4: API Routes (Priority: Medium) ✅
**Estimated scope: Small**

1. Create `/api/projects/[id]/ai-logs` GET route
2. Create `/api/projects/[id]/ai-logs/stream` SSE route
3. Test filtering and pagination

### Phase 5: UI Components (Priority: Medium) ✅
**Estimated scope: Large**

1. Create `StatsCards` component ✅
2. Create `LogEntry` with rich formatting ✅
3. Create `LogList` with virtual scrolling ✅
4. Create `ErrorsTab` component ✅
5. Create `AiLogsClient` with SSE subscription ✅
6. Add syntax highlighting (shiki or prism) - Optional enhancement

### Phase 6: Integration & Polish (Priority: Low) ✅
**Estimated scope: Small**

1. Add AI Logs tab to project layout ✅
2. Toast notifications for failures - Optional enhancement
3. Lineage visualization (parent-child links) - Optional enhancement
4. Performance optimization - Optional enhancement

---

## File Structure

```
src/lib/services/ai/
├── ai-logger.ts           # Core logging service
├── gemini-wrapper.ts      # Gemini CLI wrapper (async, uses execFileAsync)
└── index.ts               # Re-exports

src/lib/storyflow/
├── workflow-state.ts      # Phase determination logic (new)
└── ... existing files

app/api/projects/[id]/ai-logs/
├── route.ts               # GET logs with filters + pagination
├── [logId]/route.ts       # GET single log by ID
└── stream/route.ts        # SSE endpoint

app/(dashboard)/projects/[id]/ai-logs/
└── page.tsx               # AI Logs page

components/ai-logs/
├── ai-logs-client.tsx     # Main client component with SSE
├── stats-cards.tsx        # Summary metrics
├── log-list.tsx           # Log list with filters
├── log-entry.tsx          # Individual log entry (rich formatting)
├── errors-tab.tsx         # Filtered errors view
└── filters.tsx            # Filter controls

components/script-builder/
└── workflow-error.tsx     # Error UI for corrupted state
```

---

## ISO 25010 Maintainability Compliance

| Characteristic | How Addressed |
|----------------|---------------|
| **Modularity** | Separate logger service, wrapper pattern, isolated UI components |
| **Reusability** | Generic `aiLogger.wrap()` works with any AI provider |
| **Analysability** | Full lineage tracking, structured error codes, comprehensive metrics |
| **Modifiability** | Adding new providers requires only new wrapper, no core changes |
| **Testability** | Pure functions for phase determination, injectable logger for testing |

---

## Open Items Resolved

| Question | Resolution |
|----------|------------|
| Storage approach | SQLite table (simple, no new deps) |
| Real-time updates | SSE (simpler than WebSocket, single-instance only) |
| Tab location | Link beside "Overview" in project header |
| Token tracking | Parse from Gemini output, fallback to estimate (~4 chars/token) |
| Error handling | Block with error UI requiring user action |
| Lineage | Full parent-child tracking with `onDelete: SetNull` |
| Analytics | Stats cards now, dedicated tab later |
| TTS logging | Same `AiCallLog` table with `provider: 'google-tts'` |
| Log retention | Unlimited per project, cascade delete with project |
| Sync vs async | Use `execFileAsync` with args array (matches codebase, secure) |
| Pagination | Page + limit params, max 100 per request |
| Model selection | Tiered: `gemini-3-pro` (complex), `gemini-3-flash` (basic, default) |

---

## Implementation Notes & Clarifications

### TTS Logging

Google TTS calls are logged in the same `AiCallLog` table with `provider: 'google-tts'`. This allows unified visibility across all AI/external API calls while enabling filtering by provider.

### SSE Single-Instance Requirement

The in-memory callback pattern in `AiLogger.notifyCallbacks` requires single-instance deployment:
- **Serverless/edge:** Callbacks registered on one instance won't fire for events on another
- **Multi-instance:** Log events may be missed

For production deployments requiring multi-instance support, consider:
- **Database polling:** Simple fallback (poll every 2-3 seconds)
- **External pub/sub:** Redis or similar (adds complexity)

The current design optimizes for development and single-instance production.

### Log Retention Policy

Logs are retained indefinitely per project and automatically cascade-deleted when the project is deleted. There is no time-based or count-based auto-cleanup.

For projects with heavy AI usage, logs may accumulate significantly. Future enhancement could add:
- Configurable retention (e.g., last 1000 logs)
- Time-based cleanup (e.g., logs older than 30 days)
- Manual purge API

### Token Estimation

The `estimateTokens()` function uses a rough approximation (~4 characters per token):

```typescript
Math.ceil(text.length / 4)
```

This is an estimate suitable for cost tracking ballparks. Actual token counts vary (3-5 chars/token) depending on content. When Gemini CLI provides actual usage stats, those values take precedence.

### Cost Optimization via Model Tiering

The wrapper uses a tiered model approach to balance cost and quality:

| Model | Cost | Use Cases |
|-------|------|-----------|
| `gemini-3-pro` | Higher | Blueprint generation, viewport planning, complex reasoning |
| `gemini-3-flash` | Lower | Beat drafting, topic generalization, simple text tasks |

**Default is `gemini-3-flash`** to optimize for cost. Explicitly specify `GEMINI_MODELS.PRO` only for tasks requiring complex reasoning.

```typescript
// Cost-conscious: use default (FLASH)
await geminiCall({ projectId, operation: 'beat-draft' }, prompt);

// Complex task: explicitly use PRO
await geminiCall({ projectId, operation: 'blueprint-generate' }, prompt, { model: GEMINI_MODELS.PRO });
```

### Security Notes

- The Gemini wrapper uses `execFileAsync` with an args array to avoid shell injection vulnerabilities
- Never use string interpolation with user-provided content in shell commands
- Prompts are passed directly as array arguments, not embedded in a shell command string

---

## Next Steps

1. Build Phase 5 UI (stats cards, log list, errors tab, SSE client) and wire to new API routes
2. Integrate AI Logs link into project layout (Phase 6 polish)
3. Add analytics/lineage polish after UI surfaces basic stream/list views
