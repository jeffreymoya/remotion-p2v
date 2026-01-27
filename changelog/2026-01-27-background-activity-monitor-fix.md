# Background Activity Monitor & JSON Parser Hardening - 2026-01-27

## Summary

Fixed two critical systemic issues:
1. **Activity monitor tasks getting stuck in "Running" state** when mutations fail
2. **Gemini JSON parser failing** on valid-looking output from the CLI

## Root Cause Analysis

### Issue 1: Activity Monitor Stuck Tasks

**Pattern:** Wrapping TanStack Query `.mutate()` calls inside `new Promise((resolve, reject) => {...})` constructors within `runTask` callbacks.

**Why it fails:**
- If the mutation's `onError` callback doesn't fire (component unmount, React timing, etc.), the Promise never rejects
- The `runTask` wrapper never calls `fail()`, leaving the task in "Running" state forever
- User sees spinning indicator indefinitely, buttons remain disabled

**Affected locations:**
- `components/script-builder/script-builder-workflow.tsx` - blueprint generation (~line 106)
- `components/script-builder/script-builder-workflow.tsx` - blueprint regeneration (~line 156)
- `components/script-builder/script-builder-workflow.tsx` - script segmentation (~line 207) - **ALREADY FIXED**
- `components/render/render-panel.tsx` - video rendering (~line 29)

### Issue 2: Gemini JSON Parser Fragility

**Pattern:** Direct `JSON.parse(rawResponse)` at `gemini-wrapper.ts:107` before the robust parser runs.

**Why it fails:**
- Gemini CLI can return JSON with literal newlines inside string values
- May include BOM (byte order mark) or zero-width characters at start
- Token usage metadata may be mixed with JSON output
- The fragile parse throws before `parseGeminiOutput()` can clean it up

**Evidence from logs:**
```
Error: Expected property name or '}' in JSON at position 1 (line 1 column 2)
```

Position 1 = second character, suggesting invisible characters before the `{`.

## Fixes Applied

### 1. Replace Promise+Mutation Anti-Pattern

**Before:**
```typescript
await runTask(config, async ({ signal }) => {
  return new Promise<void>((resolve, reject) => {
    mutation.mutate(data, {
      onSuccess: (result) => resolve(),
      onError: (error) => reject(error)
    });
  });
});
```

**After:**
```typescript
await runTask(config, async ({ signal }) => {
  if (signal.aborted) throw new Error("Cancelled");

  const result = await apiFunction(data);

  if (signal.aborted) throw new Error("Cancelled");

  // Process result...
});
```

**Files modified:**
- `components/script-builder/script-builder-workflow.tsx`
  - `handleGenerateBlueprint()` - now uses direct `await generateBlueprint()`
  - `handleBlueprintRegenerate()` - now uses direct `await regenerateBlueprint()`
  - Removed unused TanStack Query mutation hooks
- `components/render/render-panel.tsx`
  - `handleStartRender()` - now uses direct `await startRender()`
  - Removed `useStartRender()` hook usage

### 2. Use Robust Parser in Gemini Wrapper

**Before:**
```typescript
const result = format === "json" ? JSON.parse(rawResponse) : ...;
```

**After:**
```typescript
import { parseGeminiOutput } from "@/src/lib/storyflow/gemini-parser";

const result = format === "json" ? parseGeminiOutput<T>(rawResponse) : ...;
```

**File modified:** `src/lib/services/ai/gemini-wrapper.ts:107`

### 3. Harden Parser with BOM/Invisible Character Stripping

**Added to `parseGeminiOutput()`:**
```typescript
// Step 0: Strip BOM, zero-width characters, and other invisible prefixes
text = text.replace(/^\uFEFF/, ""); // UTF-8 BOM
text = text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, ""); // zero-width chars
```

**File modified:** `src/lib/storyflow/gemini-parser.ts:108-110`

### 4. Improve Error Logging

Added hex dump of first 20 bytes to help diagnose future parsing issues:

```typescript
const hexPrefix = Array.from(text.substring(0, 20))
  .map((c) => `0x${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
  .join(" ");
console.error("[gemini-parser] First 20 byte codes:", hexPrefix);
```

**File modified:** `src/lib/storyflow/gemini-parser.ts:145-148`

### 5. Defense-in-Depth: Task Timeout

Added 10-minute safety timeout to prevent tasks from hanging forever:

```typescript
const TASK_TIMEOUT_MS = 10 * 60 * 1000;

const timeoutId = setTimeout(() => {
  fail("Task timed out");
  toast({ title: "Task timed out", description: config.name, variant: "error" });
}, TASK_TIMEOUT_MS);

// Clear timeout on success or error...
```

**File modified:** `src/hooks/use-background-task.ts`

## Impact

### Before
- ❌ Activity monitor tasks stuck in "Running" after API failures
- ❌ Segmentation fails with "Expected property name" JSON errors
- ❌ No recovery - user must refresh page
- ❌ Buttons disabled indefinitely

### After
- ✅ Tasks properly transition to "Failed" state on errors
- ✅ JSON parsing handles BOM, zero-width chars, embedded newlines
- ✅ All errors properly caught and displayed
- ✅ 10-minute safety timeout prevents eternal hangs
- ✅ Better error diagnostics with hex dumps

## Testing Recommendations

1. **Activity Monitor:**
   - Start blueprint generation, kill network → verify task fails gracefully
   - Start render, unmount component → verify no stuck tasks
   - Cancel tasks mid-flight → verify proper cleanup

2. **JSON Parsing:**
   - Test with Gemini CLI output containing literal newlines
   - Test with BOM-prefixed responses
   - Verify segmentation works end-to-end

3. **Error Recovery:**
   - Trigger various API failures
   - Verify toast notifications appear
   - Verify buttons re-enable after failure
   - Verify no console errors

## Migration Notes

- Removed direct usage of TanStack Query mutation hooks in background tasks
- All background operations now use direct API function calls via `await`
- `useGenerateBlueprint()`, `useRegenerateBlueprint()`, `useSegmentScript()`, `useStartRender()` hooks no longer used in components with background tasks
- UI loading states now driven by `isTaskRunning()` instead of `mutation.isPending`

## Related Files

### Modified
- `components/script-builder/script-builder-workflow.tsx`
- `components/render/render-panel.tsx`
- `src/lib/services/ai/gemini-wrapper.ts`
- `src/lib/storyflow/gemini-parser.ts`
- `src/hooks/use-background-task.ts`

### Unchanged (for reference)
- `components/ui/background-activity-provider.tsx` - core provider logic
- `src/lib/api/script-builder.ts` - API functions
- `src/lib/api/render.ts` - render API
