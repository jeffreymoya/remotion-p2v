# Background Activity Monitor - Manual Testing Guide

**Implementation Status:** ✅ Complete (Iterations 1-3)
**Test Date:** 2026-01-26
**Server:** http://localhost:3000

---

## Pre-Test Setup

1. **Start dev server:**
   ```bash
   npm run web:dev
   ```

2. **Open browser DevTools:**
   - Press F12 or Cmd+Option+I
   - Navigate to Console tab (for error checking)
   - Navigate to Network tab (for request monitoring)

3. **Create or open a test project:**
   - Go to http://localhost:3000
   - Create a new project or open an existing one

---

## Test Cases

### 1. Basic UI Components

#### Test 1.1: Popup Appearance
**Steps:**
1. Navigate to a project's script builder page
2. Click "Save & Continue to Segmentation" to trigger a background task
3. Observe the bottom-right corner of the viewport

**Expected:**
- [ ] Activity ring icon appears in bottom-right corner
- [ ] Icon has animated spinning effect
- [ ] Badge shows "1" for running task count
- [ ] Icon remains visible and animating while task runs

**Actual Result:** _______________

---

#### Test 1.2: Activity Ring Animation
**Steps:**
1. Trigger any background task
2. Observe the activity ring icon

**Expected:**
- [ ] Ring spins continuously (2s linear animation)
- [ ] Uses brand-500 color for active state
- [ ] Smooth CSS animation, no jank

**Actual Result:** _______________

---

#### Test 1.3: Expand/Collapse Toggle
**Steps:**
1. Start a background task
2. Click the activity ring icon
3. Click the ChevronDown button in the panel header
4. Click the activity ring icon again

**Expected:**
- [ ] Click 1: Panel expands with slide-in animation
- [ ] Panel shows task list with running task
- [ ] Click 2: Panel collapses back to minimized icon
- [ ] Click 3: Panel expands again
- [ ] Animations are smooth (opacity + translateY)

**Actual Result:** _______________

---

### 2. Task Tracking & Progress

#### Test 2.1: Script Segmentation (Indeterminate)
**Steps:**
1. Go to Script Builder → Glue phase
2. Click "Save & Continue to Segmentation"
3. Expand the activity popup

**Expected:**
- [ ] Task appears: "Segmenting script" with scissors icon
- [ ] Progress bar shows indeterminate animation (shimmer/pulse)
- [ ] Elapsed time counts up: "1s", "2s", "3s", etc.
- [ ] Status shows "Running" in brand color
- [ ] Segment button is disabled during operation

**Actual Result:** _______________

---

#### Test 2.2: TTS Generation (Determinate Progress)
**Steps:**
1. Complete segmentation
2. Observe TTS task in background popup
3. Watch progress updates

**Expected:**
- [ ] Task appears: "Generating TTS audio" with mic icon
- [ ] Progress bar fills from 0% to 100%
- [ ] Label shows "Segment 1/10", "Segment 2/10", etc.
- [ ] Progress updates in real-time as segments complete
- [ ] Elapsed time counts up continuously

**Actual Result:** _______________

---

#### Test 2.3: Blueprint Generation
**Steps:**
1. Go to Script Builder
2. Enter a topic (e.g., "The history of pizza")
3. Click "Generate Blueprint"
4. Observe the background task

**Expected:**
- [ ] Task appears: "Generating blueprint" with sparkles icon
- [ ] Indeterminate progress (no percentage)
- [ ] Completes after ~10-30 seconds
- [ ] Success toast appears on completion

**Actual Result:** _______________

---

#### Test 2.4: Board Planner Operations
**Steps:**
1. Navigate to Storyboard page
2. Trigger each operation in sequence:
   - Generate Plan
   - Generate Prompts
   - Detect Regions
   - Generate Triggers
   - Build Viewport

**Expected for each:**
- [ ] Task appears with appropriate name and icon:
  - Plan: "Generating board plan" (cog)
  - Prompts: "Generating image prompts" (sparkles)
  - Regions: "Detecting board regions" (cog)
  - Triggers: "Generating camera triggers" (cog)
  - Viewport: "Building viewport animation" (film)
- [ ] Indeterminate progress for all
- [ ] Completion toast for each

**Actual Result:** _______________

---

#### Test 2.5: Video Rendering
**Steps:**
1. Navigate to project render panel
2. Click "Render Draft" or "Production"
3. Observe the background task

**Expected:**
- [ ] Task appears: "Rendering draft video" or "Rendering production video" with film icon
- [ ] Indeterminate progress (server-side processing)
- [ ] Task persists during multi-minute render
- [ ] Completion toast when render finishes

**Actual Result:** _______________

---

### 3. Task Completion Behavior

#### Test 3.1: Successful Completion
**Steps:**
1. Start a quick task (e.g., blueprint generation)
2. Wait for completion
3. Observe the task card

**Expected:**
- [ ] Status changes to "Completed" with green checkmark icon
- [ ] Success toast appears (default variant)
- [ ] Task card auto-dismisses after 5 seconds
- [ ] Fade-out animation on dismiss
- [ ] Popup hides completely when all tasks dismissed

**Actual Result:** _______________

---

#### Test 3.2: Task Failure
**Steps:**
1. Trigger a task that will fail (e.g., segment without saving draft first)
2. Observe error handling

**Expected:**
- [ ] Status changes to "Failed" with red X icon
- [ ] Error message displayed (truncated to ~100 chars)
- [ ] Error toast appears (destructive variant)
- [ ] Task card auto-dismisses after 8 seconds (longer than success)
- [ ] Full error message visible on hover (tooltip)

**Actual Result:** _______________

---

#### Test 3.3: Task Cancellation
**Steps:**
1. Start a long-running task (TTS with many segments)
2. Expand the popup
3. Click the X button on the task card
4. Click "Yes" in the confirmation dialog

**Expected:**
- [ ] Cancel button shows inline confirmation
- [ ] "Cancel this task?" prompt with Yes/No buttons
- [ ] On Yes: Task aborts immediately
- [ ] Status changes to "Cancelled" with amber dash icon
- [ ] NO toast for cancellation (user initiated)
- [ ] Task auto-dismisses after 5 seconds
- [ ] In-flight network request is aborted (check Network tab)

**Actual Result:** _______________

---

### 4. Multiple Concurrent Tasks

#### Test 4.1: Multiple Tasks Display
**Steps:**
1. Start blueprint generation
2. Before it completes, trigger segmentation (if possible)
3. Observe multiple tasks in the popup

**Expected:**
- [ ] Both tasks appear in the list
- [ ] Badge shows correct count (e.g., "2")
- [ ] Each task has independent progress/status
- [ ] Each task has its own elapsed timer
- [ ] Panel scrolls if > 4-5 tasks

**Actual Result:** _______________

---

#### Test 4.2: Duplicate Task Prevention
**Steps:**
1. Start script segmentation
2. Try to click "Save & Continue to Segmentation" again while task is running

**Expected:**
- [ ] Button is disabled (grayed out)
- [ ] No duplicate task is created
- [ ] isTaskRunning("script-segmentation") returns true

**Actual Result:** _______________

---

### 5. Navigation & Persistence

#### Test 5.1: Cross-Page Persistence
**Steps:**
1. Start a long-running task (e.g., TTS generation)
2. Navigate to a different project page (e.g., from Script to Storyboard)
3. Navigate back
4. Observe the popup

**Expected:**
- [ ] Popup remains visible during navigation
- [ ] Task continues running
- [ ] Progress/elapsed time continue updating
- [ ] Task completes normally even after navigation

**Actual Result:** _______________

---

#### Test 5.2: Page Refresh (Edge Case)
**Steps:**
1. Start a background task
2. Refresh the page (F5 or Cmd+R)

**Expected:**
- [ ] Task tracking is lost (in-memory only for v1)
- [ ] Popup disappears after refresh
- [ ] Server-side operation continues (not cancelled)
- [ ] **This is acceptable for v1** (documented in spec)

**Actual Result:** _______________

---

### 6. Accessibility

#### Test 6.1: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate the page
2. Start a background task
3. Tab to the activity icon
4. Press Enter to expand
5. Tab through task controls

**Expected:**
- [ ] Activity icon is keyboard-focusable
- [ ] Enter/Space key expands the popup
- [ ] All interactive elements (cancel, minimize) are focusable
- [ ] Logical tab order (top to bottom)

**Actual Result:** _______________

---

#### Test 6.2: Screen Reader Announcements
**Steps:**
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Start a background task
3. Listen for announcements

**Expected:**
- [ ] Activity icon has descriptive label: "Background activity — N tasks running"
- [ ] Panel has role="region" with label "Background activity monitor"
- [ ] Task status changes are announced via aria-live region
- [ ] Progress bars have aria-valuenow, aria-valuemin, aria-valuemax

**Actual Result:** _______________

---

### 7. Memory Leaks & Cleanup

#### Test 7.1: No Interval Leaks
**Steps:**
1. Open DevTools → Performance Monitor
2. Start several background tasks
3. Let them all complete and auto-dismiss
4. Wait 10 seconds
5. Check for active timers

**Expected:**
- [ ] Elapsed time interval stops when no tasks are running
- [ ] Auto-dismiss timeouts are cleared on unmount
- [ ] No memory growth after tasks complete

**Actual Result:** _______________

---

## Browser Console Checks

During all tests, monitor the browser console for:
- [ ] No React warnings or errors
- [ ] No "Can't perform a React state update on an unmounted component" warnings
- [ ] No network errors (except intentional test failures)
- [ ] No infinite re-render loops

---

## Known Limitations (Documented in Spec)

1. **Page refresh loses task tracking** - In-memory state only (acceptable for v1)
2. **Client-side cancellation only** - Server continues processing (acceptable for v1)
3. **No concurrent task limit** - UI scrolls if needed (acceptable for v1)
4. **No mobile/responsive optimization** - Desktop-first (out of scope for v1)

---

## Test Summary

**Total Test Cases:** 21
**Passed:** ___
**Failed:** ___
**Notes:** _______________

**Tester Signature:** _______________
**Date:** _______________
