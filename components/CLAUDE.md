# Components

## Data Fetching — Use TanStack Query Hooks

ALL server data fetching and mutations MUST use hooks from `@/src/hooks/queries/`. Never use `useState` + `useEffect` + `fetch()` for server data.

```typescript
// CORRECT
import { useProject } from "@/src/hooks/queries/use-projects";
import { useBoards, useCreateBoard } from "@/src/hooks/queries/use-boards";

function MyComponent({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error } = useProject(projectId);
  const { mutate: createBoard, isPending } = useCreateBoard(projectId);
  // ...
}
```

```typescript
// WRONG — never do this
const [project, setProject] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
useEffect(() => {
  setLoading(true);
  fetch(`/api/projects/${id}`).then(res => res.json()).then(setProject).finally(() => setLoading(false));
}, [id]);
```

## Available Hooks

| Hook | File | Provides |
|------|------|----------|
| `useProjects`, `useProject`, `useUpdateProject`, `useDeleteProject` | `use-projects` | Project CRUD |
| `useBoards`, `useCreateBoard`, `useUpdateBoard` | `use-boards` | Board operations |
| `useAssets` + mutations | `use-assets` | Asset management |
| `useRender` | `use-render` | Render status (polls while PROCESSING) |
| `useViewport` mutations | `use-viewport` | Viewport generation |
| `useExecutionStatus` | `use-execution-status` | Script builder polling |
| `useAiLogs` | `use-ai-logs` | AI call logs |
| `useMusicLibrary` | `use-music-library` | Music library |
| `useMappings` | `use-mappings` | Asset mappings |

## Adding a New Query or Mutation

1. Add the fetch function to `src/lib/api/<domain>.ts` (thin `fetch` wrapper, throw on `!res.ok`)
2. Add the hook to `src/hooks/queries/use-<domain>.ts` using `useQuery` or `useMutation`
3. Follow the query key factory pattern:
   ```typescript
   export const myKeys = {
     all: ["my-domain"] as const,
     detail: (id: string) => ["my-domain", id] as const,
   };
   ```
4. Invalidate related caches in `onSuccess` of mutations

## Local State (`useState`) Is Fine For

- UI toggles (modals, dropdowns, expanded/collapsed)
- Form input values before submission
- Transient visual state (animation flags, hover)

These are NOT server data and should NOT use TanStack Query.
