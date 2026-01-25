# RSC + React Query Integration Guide

**Phase:** 4.8 - Server Component Integration
**Last Updated:** 2026-01-25

## Overview

This guide explains how to integrate React Server Components (RSC) with React Query to eliminate loading flashes and improve perceived performance.

## The Problem

Without RSC integration:
- Client components start with `isLoading = true`
- Users see loading spinners even when data could be pre-fetched
- Slower perceived performance despite having server-side data access

With RSC integration:
- Server pre-fetches data during SSR
- Client receives initial data immediately
- No loading flash on first render
- Subsequent updates use React Query's cache

---

## Pattern 1: Simple Initial Data (Recommended)

**Best for:** Single data fetches per page

### Server Component (RSC)

```typescript
// app/(dashboard)/projects/[id]/media/page.tsx
import { fetchAssets } from "@/src/lib/api/assets";

export default async function MediaPage({ params }: Params) {
  const { id } = await params;

  // Fetch data on the server
  const assets = await fetchAssets(id);

  return (
    <MediaManager
      projectId={id}
      initialAssets={assets} // Pass as prop
    />
  );
}
```

### Client Component

```typescript
// components/media/media-manager.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/src/lib/api/assets";

type Props = {
  projectId: string;
  initialAssets: Asset[];
};

export function MediaManager({ projectId, initialAssets }: Props) {
  const { data: assets } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => fetchAssets(projectId),
    initialData: initialAssets, // Use server data
  });

  // Component renders immediately with assets
  return <AssetGallery assets={assets} />;
}
```

**Benefits:**
- ✅ No loading flash
- ✅ Simple to implement
- ✅ Type-safe
- ✅ Works with existing code

---

## Pattern 2: Using Helper Utilities

**Best for:** Consistent patterns across multiple pages

```typescript
// app/(dashboard)/projects/[id]/media/page.tsx
import { withInitialData } from "@/src/lib/rsc-query-helpers";

export default async function MediaPage({ params }: Params) {
  const { id } = await params;
  const assets = await fetchAssets(id);

  return (
    <MediaManager
      projectId={id}
      {...withInitialData(assets)}
    />
  );
}

// components/media/media-manager.tsx
"use client";

import { WithInitialData } from "@/src/lib/rsc-query-helpers";

type Props = {
  projectId: string;
} & WithInitialData<Asset[]>;

export function MediaManager({ projectId, initialData }: Props) {
  const { data: assets } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => fetchAssets(projectId),
    initialData,
  });

  return <AssetGallery assets={assets} />;
}
```

---

## Pattern 3: Dehydrated State (Advanced)

**Best for:** Multiple queries on same page

```typescript
// app/(dashboard)/projects/[id]/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { fetchProject, fetchAssets, fetchScript } from "@/src/lib/api/projects";

export default async function ProjectPage({ params }: Params) {
  const { id } = await params;

  // Create server-side query client
  const queryClient = new QueryClient();

  // Prefetch multiple queries
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["project", id],
      queryFn: () => fetchProject(id),
    }),
    queryClient.prefetchQuery({
      queryKey: ["assets", id],
      queryFn: () => fetchAssets(id),
    }),
    queryClient.prefetchQuery({
      queryKey: ["script", id],
      queryFn: () => fetchScript(id),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectDetail projectId={id} />
    </HydrationBoundary>
  );
}

// components/project-detail.tsx
"use client";

export function ProjectDetail({ projectId }: { projectId: string }) {
  // All three queries have data immediately
  const { data: project } = useProject(projectId);
  const { data: assets } = useAssets(projectId);
  const { data: script } = useScript(projectId);

  return (
    <div>
      <h1>{project.name}</h1>
      <AssetGallery assets={assets} />
      <ScriptEditor script={script} />
    </div>
  );
}
```

**Benefits:**
- ✅ Prefetch multiple queries in parallel
- ✅ No loading flash for any query
- ✅ Clean component code
- ❌ More complex setup

---

## When to Use Each Pattern

| Pattern | Use Case | Complexity | Performance |
|---------|----------|------------|-------------|
| **Simple Initial Data** | Single query per page | Low | Good |
| **Helper Utilities** | Consistent patterns | Low | Good |
| **Dehydrated State** | Multiple queries per page | Medium | Excellent |

---

## Best Practices

### 1. Error Handling

Always handle errors in RSC:

```typescript
// app/(dashboard)/projects/[id]/page.tsx
export default async function ProjectPage({ params }: Params) {
  const { id } = await params;

  try {
    const project = await fetchProject(id);
    return <ProjectDetail initialData={project} />;
  } catch (error) {
    // RSC error boundary will catch this
    throw error;
  }
}
```

### 2. Optional Initial Data

Make initial data optional for flexibility:

```typescript
type Props = {
  projectId: string;
  initialAssets?: Asset[];
};

export function MediaManager({ projectId, initialAssets }: Props) {
  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => fetchAssets(projectId),
    initialData: initialAssets, // May be undefined
  });

  if (isLoading) return <LoadingSpinner />;
  return <AssetGallery assets={assets} />;
}
```

### 3. Stale Time Configuration

Set appropriate stale time when using initial data:

```typescript
const { data: assets } = useQuery({
  queryKey: ["assets", projectId],
  queryFn: () => fetchAssets(projectId),
  initialData: initialAssets,
  staleTime: 60 * 1000, // Consider data fresh for 1 minute
});
```

### 4. Type Safety

Use generics for type-safe helpers:

```typescript
export function withInitialData<T>(data: T): WithInitialData<T> {
  return { initialData: data };
}

// Usage is fully typed
const props = withInitialData<Asset[]>(assets);
//    ^? { initialData: Asset[] }
```

---

## Migration Example

### Before (Client-side only)

```typescript
// app/(dashboard)/projects/[id]/media/page.tsx
export default function MediaPage({ params }: Params) {
  return <MediaManager projectId={params.id} />;
}

// components/media/media-manager.tsx
"use client";

export function MediaManager({ projectId }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets(projectId).then((data) => {
      setAssets(data);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) return <LoadingSpinner />; // Flash on every mount
  return <AssetGallery assets={assets} />;
}
```

### After (RSC + React Query)

```typescript
// app/(dashboard)/projects/[id]/media/page.tsx
export default async function MediaPage({ params }: Params) {
  const { id } = await params;
  const assets = await fetchAssets(id);

  return <MediaManager projectId={id} initialAssets={assets} />;
}

// components/media/media-manager.tsx
"use client";

export function MediaManager({ projectId, initialAssets }: Props) {
  const { data: assets } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => fetchAssets(projectId),
    initialData: initialAssets,
  });

  return <AssetGallery assets={assets} />; // No loading flash
}
```

**Improvements:**
- ✅ No loading spinner flash
- ✅ Faster perceived performance
- ✅ Cleaner component code
- ✅ Automatic caching and refetching
- ✅ Better error handling

---

## Testing RSC Integration

```typescript
// components/__tests__/media-manager.test.tsx
import { renderWithProviders } from "@/src/test/utils";
import { MediaManager } from "../media-manager";

describe("MediaManager with initial data", () => {
  it("renders immediately with initial assets", () => {
    const mockAssets = [
      { id: "1", url: "asset1.jpg", type: "IMAGE" },
      { id: "2", url: "asset2.jpg", type: "IMAGE" },
    ];

    const { getByText } = renderWithProviders(
      <MediaManager projectId="123" initialAssets={mockAssets} />
    );

    // No loading state, renders immediately
    expect(getByText("2 assets")).toBeInTheDocument();
  });

  it("refetches on mutation", async () => {
    // Test that mutations trigger refetch
  });
});
```

---

## Common Pitfalls

### ❌ Don't: Use initialData without staleTime

```typescript
// Data will refetch immediately even though we have fresh data
const { data } = useQuery({
  queryKey: ["assets", id],
  queryFn: () => fetchAssets(id),
  initialData: assets,
  // Missing staleTime - will refetch right away!
});
```

### ✅ Do: Set appropriate staleTime

```typescript
const { data } = useQuery({
  queryKey: ["assets", id],
  queryFn: () => fetchAssets(id),
  initialData: assets,
  staleTime: 60 * 1000, // Fresh for 1 minute
});
```

### ❌ Don't: Forget error handling in RSC

```typescript
// RSC without error handling
export default async function Page({ params }: Params) {
  const data = await fetchData(params.id); // Can throw
  return <Component data={data} />;
}
```

### ✅ Do: Handle errors appropriately

```typescript
export default async function Page({ params }: Params) {
  const { id } = await params;

  try {
    const data = await fetchData(id);
    return <Component initialData={data} />;
  } catch (error) {
    // Let RSC error boundary handle it
    throw error;
  }
}
```

---

## Resources

- [React Query SSR Guide](https://tanstack.com/query/latest/docs/react/guides/ssr)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Hydration Boundary API](https://tanstack.com/query/latest/docs/react/reference/HydrationBoundary)

---

## Summary

The RSC + React Query integration pattern:
1. ✅ Eliminates loading flashes
2. ✅ Improves perceived performance
3. ✅ Maintains React Query benefits (caching, refetching)
4. ✅ Simple to implement
5. ✅ Type-safe

Use it for all pages where initial data can be fetched server-side.
