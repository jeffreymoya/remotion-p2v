# Query Hooks

TanStack Query hooks for all server data operations. Components import from here — never call `fetch()` directly.

## Structure

Each hook file follows this pattern:

```typescript
// 1. Query key factory — enables targeted cache invalidation
export const domainKeys = {
  all: ["domain"] as const,
  detail: (id: string) => ["domain", id] as const,
};

// 2. Query hooks — read operations
export function useDomain() {
  return useQuery({
    queryKey: domainKeys.all,
    queryFn: fetchDomainList,  // from src/lib/api/<domain>.ts
  });
}

// 3. Mutation hooks — write operations with cache invalidation
export function useCreateDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDomain,  // from src/lib/api/<domain>.ts
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: domainKeys.all });
    },
  });
}
```

## Rules

- API client functions live in `src/lib/api/<domain>.ts`, not here. Hooks call those functions.
- Every query needs a key factory for cache management.
- Mutations MUST invalidate related query caches in `onSuccess`.
- Use `enabled` option to prevent queries from running without required params.
- Use `refetchInterval` for polling (see `use-render.ts` and `use-execution-status.ts` for examples).

## Reference Files

- `use-projects.ts` — simplest example (CRUD + cache invalidation)
- `use-boards.ts` — example with project-scoped keys
- `use-execution-status.ts` — example with polling and complex state
- `use-render.ts` — example with conditional polling
