# Background Activity Monitor - Implementation Plan

## Problem

Long-running operations (segmentation, TTS generation, blueprint generation, rendering) block the UI with no feedback beyond a disabled button and a pending network request. Users have no visibility into what's happening, can't navigate away, and see no progress indication for operations that may take 30+ seconds.

## Solution

A **persistent, non-intrusive background activity popup** that:
- Floats in the bottom-right corner of the viewport
- Persists across page navigations (global React context + portal)
- Shows all running background tasks with progress, status, and elapsed time
- Collapses to a small **activity ring icon** with a task count badge
- Auto-hides completely when no tasks exist (running or recently completed)
- Supports **task cancellation** via `AbortController` with a confirmation dialog
- Fires a **toast notification** when tasks complete or fail

---

## Design Specification

### Visual States

#### 1. Hidden (no tasks)
- Nothing rendered. The popup and icon are completely absent from the DOM.

#### 2. Minimized (activity ring icon)
- **Position:** Fixed, bottom-right corner (`bottom-6 right-6`)
- **Appearance:** 44x44px circular button with the `Activity` Lucide icon
- **Active state:** Animated spinning ring border (CSS `@keyframes`) using `brand-500` color
- **Badge:** Small absolute-positioned circle (top-right of the icon) showing count of running tasks (e.g., "2")
- **Idle state (only completed tasks lingering):** Static ring, no animation, muted color
- **Click:** Expands to full popup panel

#### 3. Expanded (popup panel)
- **Position:** Fixed, bottom-right corner, anchored above the minimized icon position
- **Size:** `w-80` (320px), max-height `max-h-96` with overflow scroll
- **Style:** Matches existing app design — `bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl shadow-lg shadow-black/40`
- **Header:** "Background Activity" title + minimize button (ChevronDown icon)
- **Task list:** Vertically stacked task cards

#### 4. Task Card (within expanded panel)
Each task renders as a card with:

| Element | Details |
|---------|---------|
| **Icon** | Operation-specific Lucide icon (e.g., `Scissors` for segmentation, `Mic` for TTS, `Sparkles` for blueprint, `Film` for render) |
| **Name** | Human-readable label (e.g., "Segmenting script...", "Generating TTS audio 3/10") |
| **Progress bar** | Determinate (percentage) when the operation reports progress (e.g., TTS: completed/total). Indeterminate animated bar for operations without granular progress (e.g., segmentation). |
| **Status text** | "Running", "Completed", "Failed" with color coding (brand/emerald/rose) |
| **Elapsed time** | Live-updating timer: "12s", "1m 23s" — starts from task creation |
| **Cancel button** | `X` icon button, visible only for running tasks. Clicking opens a small inline confirmation ("Cancel this task?" with Yes/No buttons). |

#### 5. Completion Behavior
- **Success:** Task card updates to show green checkmark + "Completed". Auto-dismisses after **5 seconds** with a fade-out animation.
- **Failure:** Task card updates to show red X + error message. Auto-dismisses after **8 seconds** (longer so user can read error).
- **Toast:** Existing `useToast()` fires on completion/failure with appropriate variant.
- When all tasks have dismissed and none are running, the entire popup (including minimized icon) fades out and unmounts.

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `components/ui/background-activity-provider.tsx` | Context provider + popup UI component |
| `src/hooks/use-background-task.ts` | Hook that wraps any async operation as a tracked background task |

### Modified Files

| File | Change |
|------|--------|
| `app/layout.tsx` | Wrap children with `<BackgroundActivityProvider>` |
| `components/script-builder/script-builder-workflow.tsx` | Use `useBackgroundTask` for segmentation + TTS |
| `components/script-builder/glue-phase.tsx` | Disable button when segmentation task is active |
| `components/script-builder/blueprint-review.tsx` | Use `useBackgroundTask` for blueprint generation |
| `components/editors/simple-viewport-editor.tsx` | Use `useBackgroundTask` for viewport build (if long-running) |
| Other components with long-running ops | Integrate `useBackgroundTask` as needed |

### Data Model

```typescript
// Task status lifecycle: pending → running → completed | failed | cancelled
type BackgroundTaskStatus = "running" | "completed" | "failed" | "cancelled";

interface BackgroundTask {
  id: string;                          // Unique ID (crypto.randomUUID())
  name: string;                        // Display name: "Segmenting script"
  icon: "scissors" | "mic" | "sparkles" | "film" | "cog"; // Lucide icon key
  status: BackgroundTaskStatus;
  progress: {
    current: number;                   // 0 for indeterminate
    total: number;                     // 0 for indeterminate
    label?: string;                    // Optional: "3/10 segments"
  } | null;                            // null = indeterminate
  startedAt: number;                   // Date.now()
  completedAt: number | null;
  error: string | null;
  abortController: AbortController;    // For cancellation
}
```

### Context API

```typescript
interface BackgroundActivityContextValue {
  tasks: BackgroundTask[];
  addTask: (config: {
    name: string;
    icon: BackgroundTask["icon"];
  }) => {
    id: string;
    abortSignal: AbortSignal;
    updateProgress: (current: number, total: number, label?: string) => void;
    complete: () => void;
    fail: (error: string) => void;
  };
  cancelTask: (id: string) => void;
  isTaskRunning: (name: string) => boolean;
}
```

### Hook API

```typescript
// src/hooks/use-background-task.ts
function useBackgroundTask() {
  const { addTask, cancelTask, isTaskRunning } = useBackgroundActivity();

  // Returns a wrapper that converts any async function into a tracked task
  const runTask: <T>(
    config: { name: string; icon: BackgroundTask["icon"] },
    fn: (controls: {
      signal: AbortSignal;
      updateProgress: (current: number, total: number, label?: string) => void;
    }) => Promise<T>
  ) => Promise<T | null>;
  // Returns null if cancelled, throws if failed

  return { runTask, isTaskRunning, cancelTask };
}
```

---

## Implementation Steps

### Step 1: Create `BackgroundActivityProvider`

**File:** `components/ui/background-activity-provider.tsx`

1. Create `BackgroundActivityContext` with the shape above
2. Manage `tasks` state as `useState<BackgroundTask[]>`
3. Implement `addTask`:
   - Creates a new `AbortController`
   - Generates unique ID
   - Adds task to state
   - Returns control handles (`updateProgress`, `complete`, `fail`)
4. Implement `cancelTask`:
   - Calls `abortController.abort()` on the task
   - Updates task status to `"cancelled"`
   - Starts auto-dismiss timer
5. Implement auto-dismiss:
   - `useEffect` watching for completed/failed/cancelled tasks
   - Sets timeout (5s success, 8s failure/cancelled)
   - Removes task from state after timeout
6. Implement `isTaskRunning`:
   - Check if any task with matching name has status `"running"`
7. Render the popup UI via `createPortal` to `document.body` (same pattern as existing `ToastProvider`)

### Step 2: Build the Popup UI

**Within the same file**, render:

1. **Minimized icon:**
   - Circular button with animated SVG ring (CSS animation on a `<circle>` with `stroke-dashoffset`)
   - Badge count overlay
   - Click handler toggles `expanded` state

2. **Expanded panel:**
   - Header with title + minimize button
   - Scrollable task list
   - Each task card with: icon, name, progress bar (determinate or indeterminate), status, elapsed time, cancel button
   - Elapsed time: `useEffect` with `setInterval` updating every second while any task is running

3. **Cancel confirmation:**
   - Inline within the task card (replaces cancel button temporarily)
   - "Cancel?" label + "Yes" / "No" buttons
   - On confirm: calls `cancelTask(id)`

4. **Animations:**
   - Panel expand/collapse: CSS transition on `opacity` + `transform: translateY`
   - Task dismiss: CSS `animate-fadeOut` keyframe
   - Activity ring: CSS `animate-spin` (or custom rotation)

### Step 3: Create `useBackgroundTask` Hook

**File:** `src/hooks/use-background-task.ts`

1. Consumes `useBackgroundActivity()` context
2. Provides `runTask` wrapper:
   - Calls `addTask` to register the task
   - Invokes the user-provided async function with `{ signal, updateProgress }`
   - On success: calls `complete()`, fires success toast
   - On error: if `signal.aborted`, sets status to cancelled; otherwise calls `fail(error.message)`, fires error toast
   - Returns the result or null if cancelled
3. Provides `isTaskRunning` and `cancelTask` pass-throughs
4. Integrates with existing `useToast` for completion/failure notifications

### Step 4: Wire into Root Layout

**File:** `app/layout.tsx`

```tsx
<QueryProvider>
  <ToastProvider>
    <BackgroundActivityProvider>
      {children}
    </BackgroundActivityProvider>
  </ToastProvider>
</QueryProvider>
```

The provider must be inside `ToastProvider` so it can use `useToast()` for completion notifications.

### Step 5: Integrate with Segmentation Flow

**File:** `components/script-builder/script-builder-workflow.tsx`

Replace `handleSegmentDraft`:
```typescript
const { runTask, isTaskRunning } = useBackgroundTask();

const handleSegmentDraft = () => {
  if (!scriptDraft) return;

  runTask(
    { name: "Segmenting script", icon: "scissors" },
    async ({ signal }) => {
      const result = await segmentScriptApi(scriptDraft.id, { signal });
      registerScriptChange(script, result.script);
      setScript(result.script);
      setPhase("preview");
      // Kick off TTS as a separate background task
      runTtsAsBackgroundTask(result.script);
      return result;
    }
  );
};
```

### Step 6: Integrate with TTS Generation

**File:** `components/script-builder/script-builder-workflow.tsx`

Replace `runTtsForScript` to use background task tracking:
```typescript
const runTtsAsBackgroundTask = (scriptToUse: Script, force = false) => {
  const targets = scriptToUse.segments.filter(seg => force || !seg.audioUrl);
  if (targets.length === 0) return;

  runTask(
    { name: "Generating TTS audio", icon: "mic" },
    async ({ signal, updateProgress }) => {
      for (let i = 0; i < targets.length; i++) {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        updateProgress(i, targets.length, `${i}/${targets.length} segments`);

        const res = await fetch("/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, segmentIndex: targets[i].index, force }),
          signal,
        });
        // ... handle response, update script state
      }
      updateProgress(targets.length, targets.length, `${targets.length}/${targets.length} segments`);
    }
  );
};
```

### Step 7: Integrate with Blueprint Generation

**File:** `components/script-builder/script-builder-workflow.tsx`

Wrap `handleGenerateBlueprint` with `runTask`:
```typescript
const handleGenerateBlueprint = () => {
  runTask(
    { name: "Generating blueprint", icon: "sparkles" },
    async ({ signal }) => {
      const result = await generateBlueprintApi({ projectId, topic, targetDurationMs: targetDuration }, { signal });
      setBlueprint(result.blueprint);
      setPhase("blueprint");
      return result;
    }
  );
};
```

### Step 8: Integrate with Other Long-Running Operations

Audit and integrate `useBackgroundTask` into:
- **Render panel** (`components/editors/render-panel.tsx` or similar) — video rendering
- **Viewport build** — if it involves long API calls
- **Asset search/download** — if applicable
- **Any other operation** that takes >3 seconds

### Step 9: Disable Trigger Buttons When Task Is Running

In components that trigger background tasks, use `isTaskRunning` to prevent duplicate launches:

```tsx
const { isTaskRunning } = useBackgroundTask();

<button
  onClick={handleSegmentDraft}
  disabled={isTaskRunning("Segmenting script")}
>
  Save & Continue to Segmentation
</button>
```

---

## API Client Changes

The existing API client functions in `src/lib/api/script-builder.ts` need to accept an optional `AbortSignal` parameter so that background tasks can be cancelled:

```typescript
// Before
export async function segmentScript(draftId: string) { ... }

// After
export async function segmentScript(draftId: string, options?: { signal?: AbortSignal }) {
  const res = await fetch("/api/script-builder/segment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draftId }),
    signal: options?.signal,
  });
  // ...
}
```

Apply this pattern to all API functions that will be wrapped by background tasks.

---

## Styling Details

All styles use the existing design system (Tailwind + slate palette + brand colors).

### Activity Ring Icon (Minimized)
```css
/* Animated ring when tasks are running */
@keyframes activity-ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.activity-ring-active {
  animation: activity-ring-spin 2s linear infinite;
}
```

The ring is an SVG `<circle>` with `stroke-dasharray` creating a partial arc, rotated by the animation. The icon itself (`Activity` from Lucide) sits centered inside.

### Expanded Panel
```
┌─────────────────────────────┐
│ Background Activity     [_] │  ← header + minimize btn
├─────────────────────────────┤
│ ✂ Segmenting script...      │
│ ████████░░░░ 67%     1m 12s │
│                        [✕]  │
├─────────────────────────────┤
│ 🎤 Generating TTS audio     │
│ ░░░░░░░░░░░░ 3/10    0m 45s│
│                        [✕]  │
├─────────────────────────────┤
│ ✓ Blueprint generated       │  ← fading out
│ Completed              0m 8s│
└─────────────────────────────┘
```

### Z-Index
- Popup panel: `z-[60]` (above the existing toast at `z-50`)
- Minimized icon: `z-[60]`

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **User navigates away mid-task** | Task continues. Popup persists (global context). State is in-memory only — page refresh loses tracking (acceptable for v1). |
| **Multiple tasks of same type** | Allowed. Each gets a unique ID. Name can include context (e.g., "Generating TTS audio (force)"). |
| **Task cancelled mid-flight** | `AbortController.abort()` called. Fetch requests reject with `AbortError`. Task marked as "cancelled", auto-dismisses after 5s. |
| **Network error during task** | Caught in the async wrapper. Task marked as "failed" with error message. Auto-dismisses after 8s. |
| **Tab goes to background** | `setInterval` for elapsed time may throttle, but resumes. No special handling needed. |
| **Page refresh** | All task tracking lost. Server-side operations continue but client loses visibility. Acceptable for v1. |

---

## Future Enhancements (Out of Scope for v1)

- **Persist task state** in `localStorage` or `sessionStorage` so tasks survive page refresh
- **Server-sent events (SSE)** for real-time progress from the server instead of client-side tracking
- **Task history page** showing past operations with timestamps and durations
- **Sound notifications** for completion (optional user preference)
- **Grouped tasks** — collapse multiple related tasks (e.g., "TTS generation" as a group of segment tasks)

---

## Testing Checklist

- [ ] Popup appears when a background task starts
- [ ] Activity ring animates while tasks are running
- [ ] Badge shows correct count of running tasks
- [ ] Expand/collapse toggle works
- [ ] Progress bar updates for TTS (determinate) and segmentation (indeterminate)
- [ ] Elapsed time counts up correctly
- [ ] Cancel button shows confirmation, then aborts the request
- [ ] Cancelled tasks show "Cancelled" status and auto-dismiss
- [ ] Completed tasks show success status, fire toast, and auto-dismiss after 5s
- [ ] Failed tasks show error message, fire toast, and auto-dismiss after 8s
- [ ] Popup persists when navigating between project pages
- [ ] Popup fully hides when all tasks have dismissed
- [ ] Multiple concurrent tasks display correctly
- [ ] Duplicate task prevention works (button disabled while task running)
- [ ] No memory leaks from unmounted intervals/timeouts
