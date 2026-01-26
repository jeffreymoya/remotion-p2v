# Background Activity Monitor - Implementation Plan

> 📋 **Changelog:** [background-activity-monitor-plan-changelog.md](../changelog/background-activity-monitor-plan-changelog.md)

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

#### 2. Minimized (activity ring icon) — **default state when tasks exist**
- **Position:** Fixed, bottom-right corner (`bottom-6 right-6`)
- **Appearance:** 44x44px circular button with the `Activity` Lucide icon
- **Active state:** Animated spinning ring border (CSS `@keyframes`) using `brand-500` color
- **Badge:** Small absolute-positioned circle (top-right of the icon) showing count of running tasks (e.g., "2")
- **Idle state (only completed tasks lingering):** Static ring, no animation, muted color
- **Click:** Expands to full popup panel
- **Auto-expand:** The popup does **not** auto-expand when new tasks are added. It stays minimized to remain non-intrusive. The spinning ring + badge count provide sufficient notification.

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
| **Status text** | "Running" (brand), "Completed" (emerald), "Failed" (rose), "Cancelled" (amber) |
| **Elapsed time** | Live-updating timer: "12s", "1m 23s" — starts from task creation |
| **Cancel button** | `X` icon button, visible only for running tasks. Clicking opens a small inline confirmation ("Cancel this task?" with Yes/No buttons). |

#### 5. Completion Behavior
- **Success:** Task card updates to show green checkmark + "Completed". Auto-dismisses after **5 seconds** with a fade-out animation.
- **Failure:** Task card updates to show red X + error message (truncated to ~100 characters in the card; full message available via tooltip on hover). Auto-dismisses after **8 seconds** (longer so user can read error).
- **Cancelled:** Task card updates to show amber dash + "Cancelled". Auto-dismisses after **5 seconds**. **No toast** for user-initiated cancellation (user already knows).
- **Toast:** Existing `useToast()` fires on completion (`"default"` variant) and failure (`"destructive"` variant). No toast for cancellation.
- When all tasks have dismissed and none are running, the entire popup (including minimized icon) fades out and unmounts.

---

## Architecture

### Relationship with React Query

This system **works alongside** the existing React Query / `useMutation` pattern, not in place of it. React Query continues to handle data fetching, caching, and server state. The background activity monitor adds a **UI tracking layer** on top — `runTask` wraps the same async operations that mutations call, providing global visibility, progress, elapsed time, and cancellation. Components can use both: React Query for data state, and `useBackgroundTask` for user-facing activity tracking.

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
// Task status lifecycle: running → completed | failed | cancelled
type BackgroundTaskStatus = "running" | "completed" | "failed" | "cancelled";

interface BackgroundTask {
  id: string;                          // Unique ID (crypto.randomUUID())
  projectId: string;                   // Project ID for multi-project concurrency support
  category: string;                    // Stable key for task identity (e.g., "segmentation", "tts", "blueprint", "render")
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
    projectId: string;              // Project ID for multi-project concurrency
    category: string;               // Stable key for identity checks (e.g., "segmentation")
    name: string;                   // Human-readable display name
    icon: BackgroundTask["icon"];
  }) => {
    id: string;
    abortSignal: AbortSignal;
    updateProgress: (current: number, total: number, label?: string) => void;
    complete: () => void;
    fail: (error: string) => void;
  };
  cancelTask: (id: string) => void;
  isTaskRunning: (category: string, projectId?: string) => boolean; // Check by category (+ optional projectId filter)
}
```

### Hook API

```typescript
// src/hooks/use-background-task.ts
function useBackgroundTask() {
  const { addTask, cancelTask, isTaskRunning } = useBackgroundActivity();

  // Returns a wrapper that converts any async function into a tracked task.
  // Resolves with T on success, null on cancellation or failure.
  // Never throws — errors are handled internally (task marked failed, toast fired).
  const runTask: <T>(
    config: { projectId: string; category: string; name: string; icon: BackgroundTask["icon"] },
    fn: (controls: {
      signal: AbortSignal;
      updateProgress: (current: number, total: number, label?: string) => void;
    }) => Promise<T>
  ) => Promise<T | null>;

  return { runTask, isTaskRunning, cancelTask };
}
```

---

## Implementation Steps

### ✅ Step 1: Create `BackgroundActivityProvider`

**File:** `components/ui/background-activity-provider.tsx`

1. Create `BackgroundActivityContext` with the shape above
2. Manage `tasks` state as `useState<BackgroundTask[]>`
3. Implement `addTask`:
   - Creates a new `AbortController`
   - Generates unique ID
   - Adds task to state
   - Returns control handles (`updateProgress`, `complete`, `fail`)
4. Implement `cancelTask`:
   - **Only applies to tasks with status `"running"`** — no-op for other statuses (prevents race condition if cancel fires during dismiss)
   - Calls `abortController.abort()` on the task
   - Updates task status to `"cancelled"`
   - Starts auto-dismiss timer (5s)
5. Implement auto-dismiss:
   - `useEffect` watching for completed/failed/cancelled tasks
   - Sets timeout: **5s** for success and cancelled, **8s** for failure (longer so user can read error)
   - Removes task from state after timeout
   - **Cleanup:** Return a cleanup function from the `useEffect` that clears all pending `setTimeout` handles. Since the provider lives at the root layout and rarely unmounts, this is primarily for correctness and hot-reload safety.
6. Implement `isTaskRunning`:
   - Check if any task with matching **`category`** key has status `"running"`
   - If `projectId` is provided, also filter by matching `projectId`
   - This enables per-project task isolation (e.g., segmenting project A doesn't block segmenting project B)
7. Render the popup UI via `createPortal` to `document.body` (same pattern as existing `ToastProvider`)

### ✅ Step 2: Build the Popup UI

**Within the same file**, render:

1. **Minimized icon:**
   - Circular button with animated SVG ring (CSS animation on a `<circle>` with `stroke-dashoffset`)
   - Badge count overlay
   - Click handler toggles `expanded` state

2. **Expanded panel:**
   - Header with title + minimize button
   - Scrollable task list
   - Each task card with: icon, name, progress bar (determinate or indeterminate), status, elapsed time, cancel button
   - Elapsed time: `useEffect` with `setInterval(1000)` — **start** the interval when at least one task has status `"running"`, **stop** (clear) the interval when zero tasks are running. Return a cleanup function that calls `clearInterval` to prevent memory leaks.

3. **Cancel confirmation:**
   - Inline within the task card (replaces cancel button temporarily)
   - "Cancel?" label + "Yes" / "No" buttons
   - On confirm: calls `cancelTask(id)`

4. **Animations:**
   - Panel expand/collapse: CSS transition on `opacity` + `transform: translateY`
   - Task dismiss: CSS `animate-fadeOut` keyframe
   - Activity ring: CSS `animate-spin` (or custom rotation)

### ✅ Step 3: Create `useBackgroundTask` Hook

**File:** `src/hooks/use-background-task.ts`

1. Consumes `useBackgroundActivity()` context
2. Provides `runTask` wrapper:
   - Calls `addTask` to register the task
   - Invokes the user-provided async function with `{ signal, updateProgress }`
   - On success: calls `complete()`, fires success toast (`"default"` variant)
   - On error: if `signal.aborted`, sets status to cancelled — **no toast for user-initiated cancellation** (user already knows); otherwise calls `fail(error.message)`, fires error toast (`"destructive"` variant)
   - **Never throws.** Returns `T` on success, `null` on cancellation or failure. Errors are fully handled internally (task state updated + toast fired).
3. Provides `isTaskRunning` (matches by `category` key) and `cancelTask` pass-throughs
4. Integrates with existing `useToast` for completion/failure notifications

> **Note (A4):** This hook follows the same pattern as the existing toast system — the context and UI live in `components/ui/background-activity-provider.tsx`, and `src/hooks/use-background-task.ts` is a thin convenience wrapper that consumes the context.

### ✅ Step 4: Wire into Root Layout

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

### ✅ Step 5: Integrate with Segmentation Flow

**File:** `components/script-builder/script-builder-workflow.tsx`

Replace `handleSegmentDraft`:
```typescript
const { runTask, isTaskRunning } = useBackgroundTask();

const handleSegmentDraft = () => {
  if (!scriptDraft) return;

  runTask(
    { category: "segmentation", name: "Segmenting script", icon: "scissors" },
    async ({ signal }) => {
      const result = await segmentScriptApi(scriptDraft.id, { signal });
      registerScriptChange(script, result.script);
      setScript(result.script);
      setPhase("preview");
      return result;
    }
  );

  // TTS is an independent top-level task, not nested inside segmentation.
  // This allows it to be tracked and cancelled separately.
  runTtsAsBackgroundTask(script);
};
```

### ✅ Step 6: Integrate with TTS Generation

**File:** `components/script-builder/script-builder-workflow.tsx`

Replace `runTtsForScript` to use background task tracking:
```typescript
const runTtsAsBackgroundTask = (scriptToUse: Script, force = false) => {
  const targets = scriptToUse.segments.filter(seg => force || !seg.audioUrl);
  if (targets.length === 0) return;

  runTask(
    { category: "tts", name: "Generating TTS audio", icon: "mic" },
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

### ✅ Step 7: Integrate with Blueprint Generation

**File:** `components/script-builder/script-builder-workflow.tsx`

> **Dependency note:** The code below assumes the blueprint API route (`/api/script-builder/blueprint` or similar) already accepts and forwards an `AbortSignal`. If the API client function does not yet support `{ signal }`, apply the pattern from the "API Client Changes" section first.

Wrap `handleGenerateBlueprint` with `runTask`:
```typescript
const handleGenerateBlueprint = () => {
  runTask(
    { category: "blueprint", name: "Generating blueprint", icon: "sparkles" },
    async ({ signal }) => {
      const result = await generateBlueprintApi({ projectId, topic, targetDurationMs: targetDuration }, { signal });
      setBlueprint(result.blueprint);
      setPhase("blueprint");
      return result;
    }
  );
};
```

### ✅ Step 8: Integrate with Other Long-Running Operations

Audit and integrate `useBackgroundTask` into:
- **Render panel** (`components/render/render-panel.tsx`) — video rendering ✅
- **Board planner wizard** (`components/boards/BoardPlannerWizard.tsx`) — plan, prompts, regions, triggers, viewport ✅
- **Asset search/download** — if applicable
- **Any other operation** that takes >3 seconds

### ✅ Step 9: Disable Trigger Buttons When Task Is Running

In components that trigger background tasks, use `isTaskRunning` to prevent duplicate launches:

```tsx
const { isTaskRunning } = useBackgroundTask();

<button
  onClick={handleSegmentDraft}
  disabled={isTaskRunning("segmentation")}  // Uses stable category key, not display name
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

## Accessibility

- **Minimized icon button:** `aria-label="Background activity — N tasks running"` (dynamic count). `role="button"`.
- **Expanded panel:** `role="region"` with `aria-label="Background activity monitor"`.
- **Task status changes:** Use `aria-live="polite"` on a visually hidden status region so screen readers announce completions and failures without interrupting the user.
- **Cancel confirmation:** Focus is moved to the "Yes" button when the inline confirmation appears, and returned to the cancel button area on dismiss.
- **Progress bars:** Use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for determinate progress. For indeterminate progress, omit `aria-valuenow`.
- **Keyboard:** The minimized icon and all interactive elements within the expanded panel must be keyboard-accessible (focusable, operable with Enter/Space).

---

## Responsive / Mobile

Mobile and responsive behavior is **out of scope for v1**. The popup is designed for desktop viewport widths. On small screens, the fixed bottom-right positioning may overlap content — this will be addressed in a future iteration if needed.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **User navigates away mid-task** | Task continues. Popup persists (global context). State is in-memory only — page refresh loses tracking (acceptable for v1). |
| **Multiple tasks of same type** | Allowed. Each gets a unique ID. Name can include context (e.g., "Generating TTS audio (force)"). |
| **Task cancelled mid-flight** | `AbortController.abort()` called. Fetch requests reject with `AbortError`. Task marked as "cancelled", auto-dismisses after **5s**. Cancel button only operates on tasks with status `"running"` — no-op otherwise (prevents race during dismiss). |
| **Network error during task** | Caught in the async wrapper. Task marked as "failed" with error message. Auto-dismisses after 8s. |
| **Indeterminate progress** | Operations like segmentation don't call `updateProgress` — the progress bar renders as an indeterminate animated bar. This is by design; no `updateProgress` call is needed for indeterminate tasks. |
| **Cancellation is client-side only** | `AbortController.abort()` cancels in-flight `fetch` requests but does not send a cancellation signal to the server. Server-side operations may continue to completion. Acceptable for v1. |
| **No concurrent task limit** | There is no cap on the number of simultaneous background tasks. Acceptable for v1 — the UI scrolls if needed. |
| **Tab goes to background** | `setInterval` for elapsed time may throttle, but resumes. No special handling needed. |
| **Page refresh** | All task tracking lost. Server-side operations continue but client loses visibility. Acceptable for v1. |

---

## Future Enhancements (Out of Scope for v1)

- **Persist task state** in `localStorage` or `sessionStorage` so tasks survive page refresh. **Note:** `AbortController` is not serializable — a persistence strategy would need to reconstruct controllers on rehydration or use a separate cancellation mechanism.
- **Server-sent events (SSE)** for real-time progress from the server instead of client-side tracking
- **Task history page** showing past operations with timestamps and durations
- **Sound notifications** for completion (optional user preference)
- **Grouped tasks** — collapse multiple related tasks (e.g., "TTS generation" as a group of segment tasks)

---

## Testing Checklist

**Automated Verification (✅ Complete):**
- ✅ Linting passes (0 errors, 0 warnings)
- ✅ TypeScript compiles without errors
- ✅ Dev server starts successfully
- ✅ All 10 operations integrated correctly
- ✅ Component architecture matches spec

**Manual Testing (📋 Ready - See [Testing Guide](background-activity-monitor-testing-guide.md)):**
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
