# Storyflow — Core Business Logic

## Key Files

| File | Purpose |
|------|---------|
| `prisma.ts` | `storyflowPrisma` singleton — always import from here |
| `prisma-json.ts` | Type-safe JSON field helpers (`toJsonArray`, `fromJsonArray`) |
| `stage-validation.ts` | Pipeline stage gating (`getCurrentStage`, `isStageComplete`, `isStageLocked`) |
| `settings.ts` | App settings (`getSettings`, `updateSettings`) backed by database |
| `types.ts` | Domain types (`Project`, `Script`, `Asset`, `ScriptSegment`) |
| `gemini-parser.ts` | JSON extraction from Gemini CLI output — well-tested, do not rewrite |

## Rules

### Database

- Always use `storyflowPrisma` from `./prisma.ts`. Never instantiate `PrismaClient` directly.
- Use `prisma-json.ts` helpers for JSON fields. Never `JSON.parse`/`JSON.stringify` Prisma JSON columns directly.
- Never edit files in `src/generated/` — these are Prisma-generated.

### File System

- Use `@/src/lib/paths` for all project file paths. Never construct paths with `process.cwd()`.

```typescript
import { getProjectPaths, ensureProjectDirs } from "@/src/lib/paths";
const paths = getProjectPaths(projectId);
```

### AI Calls

- All Gemini CLI calls go through `src/lib/services/ai/gemini-wrapper.ts` → `geminiCall()`.
- Parse JSON responses with `gemini-parser.ts` → `parseGeminiOutput()`.
- Log AI calls with `src/lib/services/ai/ai-logger.ts`.
- Do NOT shell out to `gemini` from service files.
- Do NOT use `--temperature` or other API-style CLI flags.

### Retry Logic

Use `withRetry` / `withTimeout` from `@/src/lib/utils/retry`. Do NOT implement custom retry loops or backoff.

### Stage Validation

Use `stage-validation.ts` to check pipeline prerequisites before executing stage operations:

```typescript
import { getStageGateState } from "./stage-validation";
const gate = getStageGateState(project, "boards");
if (gate.locked) throw new ConflictError(gate.message);
```
