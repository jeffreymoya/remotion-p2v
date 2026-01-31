# API Routes

## Required Pattern

Every route handler MUST use `withErrorHandler` and validation helpers from `@/app/api/lib`.

```typescript
import { withErrorHandler, parseBody, parseQuery, NotFoundError } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const bodySchema = z.object({ /* ... */ });

export const POST = withErrorHandler(async (req, ctx) => {
  const data = await parseBody(req, bodySchema);
  const { id } = await ctx!.params!;

  const project = await storyflowPrisma.project.findByIdOrThrow(id);

  // business logic — throw errors, never return NextResponse error objects
  const result = await doWork(data);
  return NextResponse.json(result);
}, "domain/route-name");
```

## Rules

- NEVER write manual `try/catch` in route handlers — `withErrorHandler` does this.
- NEVER call `req.json()` + `schema.safeParse()` manually — use `parseBody(req, schema)`.
- NEVER return `NextResponse.json({ error: ... }, { status: 4xx })` — throw the appropriate error class instead.
- NEVER use `console.error` for error logging in routes — the error handler logs automatically.
- Use `parseQuery(req, schema)` for GET routes with query parameters.

## Error Classes

All from `@/app/api/lib`:

| Class | Status | When to use |
|-------|--------|-------------|
| `ValidationError(msg, details?)` | 400 | Bad input (prefer `parseBody` which throws this automatically) |
| `NotFoundError(resource, id?)` | 404 | Resource doesn't exist |
| `ConflictError(msg)` | 409 | State prevents operation (e.g., wrong project status) |
| `UnauthorizedError(msg?)` | 401 | Auth required |
| `ForbiddenError(msg?)` | 403 | Insufficient permissions |
| `ServiceUnavailableError(service, details?)` | 503 | External service down |

## File Paths in Routes

Use `@/src/lib/paths` — never `path.join(process.cwd(), ...)`:

```typescript
import { getProjectPaths } from "@/src/lib/paths";
const paths = getProjectPaths(projectId);
// paths.boards, paths.assetsImages, paths.assetsAudio, etc.
```
