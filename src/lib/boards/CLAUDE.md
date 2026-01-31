# Boards Pipeline

Board pipeline services for the Boards stage: plan → prompts → regions → triggers → viewport.

## Service Files

| File | Purpose |
|------|---------|
| `plan-service.ts` | Board layout planning |
| `prompts-service.ts` | Image prompt generation |
| `regions-service.ts` | Region detection in board images |
| `trigger-service.ts` | Camera trigger point generation |
| `viewport-service.ts` | Viewport/camera path generation |
| `ai-gateway` (`src/lib/services/ai/ai-gateway.ts`) | Shared AI gateway used by boards calls |

## Rules

### AI Calls

Use `aiGenerate()` from `@/src/lib/services/ai/ai-gateway` for all boards AI calls (planning, summaries, region detection). Pass `projectId`, `operation`, the prompt, and a Zod schema when expecting JSON.

### File Paths

Use `@/src/lib/paths` for all board artifact paths:

```typescript
import { getProjectPaths } from "@/src/lib/paths";
const paths = getProjectPaths(projectId);
const boardsDir = paths.boards;
```

### Retry Logic

Use `withRetry` from `@/src/lib/utils/retry` for any operation needing retries. Do NOT add custom retry logic to service files.

### Types

Board types are in `@/src/lib/boards-types.ts` (`BoardPlan`, `BoardRegion`, `ViewportTrigger`, etc.).
