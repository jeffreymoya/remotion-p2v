# React Query Migration Checklist

**Last Updated:** 2026-01-25
**Phase:** 4.9 - Migration Planning

## Status Overview

- ✅ **Complete:** 5 components (25%)
- 🔄 **In Progress:** 0 components
- ⏳ **Pending:** 15 components (75%)
- **Total:** 20 components identified

---

## High Priority (User-Facing, High Traffic)

These components directly impact UX and should be migrated first:

| Component | Location | Pattern | Status | Notes |
|-----------|----------|---------|--------|-------|
| **execution-progress.tsx** | `components/script-builder/` | Polling query | ✅ Complete | Uses `useExecutionStatus`, auto-polling |
| **stock-search.tsx** | `components/media/` | Search + cache | ✅ Complete | Uses `useAssetSearch`, 5min cache |
| **music-library.tsx** | `components/assets/` | Search + cache | ✅ Complete | Uses `useMusicSearch`, 5min cache |
| **ai-logs-client.tsx** | `components/ai-logs/` | List query + polling | ✅ Complete | Uses `useAiLogs`, smart polling (3s/10s) |
| **render-panel.tsx** | `components/render/` | Mutations + polling | ✅ Complete | Uses `useRenderStatus` + `useStartRender` |

---

## Medium Priority (Workflow Components)

Core workflow components that would benefit from caching:

| Component | Location | Pattern | Status | Notes |
|-----------|----------|---------|--------|-------|
| **media-manager.tsx** | `components/media/` | List + mutations | ⏳ Pending | Asset CRUD operations |
| **project-card.tsx** | `components/projects/` | Delete mutation | ⏳ Pending | Simple mutation case |
| **tts-manager.tsx** | `components/tts/` | List + mutations | ⏳ Pending | TTS voice selection |
| **asset-manager.tsx** | `components/assets/` | List + mutations | ⏳ Pending | Asset uploads |
| **script-builder-workflow.tsx** | `components/script-builder/` | Multi-step queries | ⏳ Pending | Complex state machine |
| **boards-workflow.tsx** | `components/boards/` | Multi-step queries | ⏳ Pending | Board generation pipeline |

---

## Low Priority (Editor Components)

Specialized editors that may have custom state needs:

| Component | Location | Pattern | Status | Notes |
|-----------|----------|---------|--------|-------|
| **simple-boards-editor.tsx** | `components/editors/boards/` | Load + save | ⏳ Pending | Editor state management |
| **simple-viewport-editor.tsx** | `components/editors/viewport/` | Load + save | ⏳ Pending | JSON editor |
| **simple-asset-mapper.tsx** | `components/editors/asset-mapper/` | Load + save | ⏳ Pending | Asset mapping |

---

## Utility Components

Supporting components with API interactions:

| Component | Location | Pattern | Status | Notes |
|-----------|----------|---------|--------|-------|
| **history-panel.tsx** | `components/script-builder/` | List query | ⏳ Pending | Script version history |
| **blueprint-review.tsx** | `components/script-builder/` | Display query | ⏳ Pending | Read-only blueprint view |
| **glue-phase.tsx** | `components/script-builder/` | Mutation | ⏳ Pending | Script gluing operation |
| **beat-regeneration.tsx** | `components/script-builder/` | Mutation | ⏳ Pending | Regenerate individual beats |
| **BoardPlannerWizard.tsx** | `components/boards/` | Multi-step mutation | ⏳ Pending | Board planning wizard |
| **ImageUploader.tsx** | `components/boards/` | Upload mutation | ⏳ Pending | Image upload component |
| **music-settings.tsx** | `components/assets/` | Settings mutation | ⏳ Pending | Music configuration |
| **topic-refinement.tsx** | `components/projects/` | Mutation | ⏳ Pending | Topic refinement flow |

---

## Migration Patterns

### Pattern 1: Simple List Query
**Example:** `music-library.tsx`, `asset-manager.tsx`
```typescript
const { data: items, isLoading, error } = useQuery({
  queryKey: ["items", projectId],
  queryFn: () => fetchItems(projectId),
});
```

### Pattern 2: Search with Cache
**Example:** `music-library.tsx` (similar to `stock-search.tsx`)
```typescript
const { data: results } = useAssetSearch(searchQuery, enabled);
```

### Pattern 3: Polling Query
**Example:** `render-panel.tsx`, `ai-logs-client.tsx`
```typescript
const { data: status } = useQuery({
  queryKey: ["status", id],
  queryFn: () => fetchStatus(id),
  refetchInterval: (query) => {
    const data = query.state.data;
    return data?.status === "COMPLETED" ? false : 3000;
  },
});
```

### Pattern 4: Simple Mutation
**Example:** `project-card.tsx` (delete), `beat-regeneration.tsx`
```typescript
const deleteMutation = useMutation({
  mutationFn: deleteItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  },
});
```

### Pattern 5: Upload Mutation
**Example:** `ImageUploader.tsx`, `asset-manager.tsx`
```typescript
const uploadMutation = useMutation({
  mutationFn: (file: File) => uploadFile(projectId, file),
  onSuccess: (data) => {
    queryClient.setQueryData(["assets", projectId], (old) => [...old, data]);
  },
});
```

### Pattern 6: Multi-Step Workflow
**Example:** `boards-workflow.tsx`, `script-builder-workflow.tsx`
```typescript
// Use multiple queries + mutations with cache dependencies
const { data: step1 } = useQuery({ ... });
const { data: step2 } = useQuery({
  enabled: !!step1?.completed,
  ...
});
const mutation = useMutation({ ... });
```

---

## RSC Integration (Phase 4.8)

For pages using React Server Components, pass initial data:

```typescript
// app/(dashboard)/projects/[id]/media/page.tsx (RSC)
export default async function MediaPage({ params }: Params) {
  const { id } = await params;
  const assets = await fetchAssets(id);

  return <MediaManager projectId={id} initialAssets={assets} />;
}

// components/media/media-manager.tsx (Client)
"use client";

function MediaManager({ projectId, initialAssets }: Props) {
  const { data: assets } = useQuery({
    queryKey: ["assets", projectId],
    queryFn: () => fetchAssets(projectId),
    initialData: initialAssets, // No loading flash
  });

  // ... rest of component
}
```

---

## Migration Strategy

### Phase 1: High-Impact Components ✅ Complete
1. ✅ execution-progress.tsx
2. ✅ stock-search.tsx
3. ✅ music-library.tsx
4. ✅ ai-logs-client.tsx
5. ✅ render-panel.tsx

### Phase 2: Workflow Components (Week 2)
1. media-manager.tsx
2. project-card.tsx
3. tts-manager.tsx
4. asset-manager.tsx
5. script-builder-workflow.tsx

### Phase 3: Remaining Components (Week 3)
- All editor components
- Utility components
- Boards workflow

---

## Testing Requirements

Each migrated component should have:
- ✅ Unit tests for hooks (query + mutation)
- ✅ Component tests using `renderWithProviders`
- ✅ MSW mocks for API endpoints
- ✅ Error state coverage
- ✅ Loading state coverage

---

## Benefits Tracking

As components are migrated, we gain:
- 🚀 **Performance:** Automatic caching, deduplication, background refetching
- 🔄 **UX:** Loading/error states, optimistic updates, retry logic
- 🧪 **Testing:** Easier to test with MSW + query client mocks
- 📦 **Code Quality:** Less boilerplate, consistent patterns
- 🐛 **Debugging:** React Query DevTools visibility

---

## Notes

- Components marked ✅ have been fully migrated and tested
- Components marked 🔄 are currently being worked on
- Components marked ⏳ are queued for migration
- Priority is based on user impact and usage frequency
- Migration order may change based on business priorities
