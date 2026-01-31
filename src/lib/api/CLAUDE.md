# API Client Layer

Thin `fetch` wrappers for each API domain. These are called by TanStack Query hooks in `src/hooks/queries/` — never directly from components.

## Pattern

```typescript
const API_BASE = "/api";

export async function fetchThing(id: string): Promise<Thing> {
  const res = await fetch(`${API_BASE}/things/${id}`);
  if (!res.ok) throw new Error("Failed to fetch thing");
  const data = await res.json();
  return data.thing;
}

export async function createThing(input: CreateThingInput): Promise<Thing> {
  const res = await fetch(`${API_BASE}/things`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create thing");
  const data = await res.json();
  return data.thing;
}
```

## Rules

- Keep functions minimal — just fetch, check `res.ok`, parse, return.
- No retry logic here — TanStack Query handles retries via `QueryClient` config.
- No state management — that belongs in hooks.
- Throw on `!res.ok` so TanStack Query can catch and expose via `error`.
- One file per domain matching the API route structure (e.g., `projects.ts` → `/api/projects`).
- Use `src/lib/storyflow/types.ts` for return types — don't define API-specific types here.
