> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Viewport Panning and Audio Synchronization Analysis

**Date:** 2026-01-08
**Project:** project-1764548027472 (cam_newton.png)
**Status:** Analysis Complete (Refined)

## Executive Summary

The current implementation uses an LLM-based (Gemini) approach for region detection and segment grouping, combined with frame-based keyframe interpolation for viewport animations. The primary issues are:

1. **Region detection accuracy** - LLM may produce regions that don't match audio content precisely
2. **Zoom level calculation** - Current math may not isolate individual collage panels
3. **Audio-viewport sync drift** - No direct coupling between audio playback position and viewport state

This document presents only the **HIGH effectiveness** solutions after critical analysis.

---

## Problem Statement

The `cam_newton.png` image (3392x1248, 6-panel collage) is not panning to the correct region in sync with the audio narration. Symptoms:

- Multiple panels visible simultaneously when one should be focused
- Camera position doesn't match the content being narrated
- Transitions feel disconnected from speech rhythm

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GENERATION PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Script Generation → segments with text                       │
│  2. TTS Generation → audio files + word-level timing             │
│  3. Viewport Analysis (Gemini LLM):                              │
│     - Input: image + script segments                             │
│     - Output: regions + segment→region mapping                   │
│  4. Keyframe Generation:                                         │
│     - Compute zoom, centerX, centerY per region                  │
│     - Map segments to frame ranges                               │
│  5. Timeline Build → merge all into timeline.json                │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                     RUNTIME RENDERING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Background.tsx:                                                  │
│  ├─ calculateViewportState(frame, keyframes, fps)                │
│  │   └─ Interpolates between keyframes using easing              │
│  ├─ viewportToTransform(viewport, imageW, imageH, canvasW, H)    │
│  │   └─ Converts viewport state to CSS transform                 │
│  └─ Renders: transform: translate(x,y) scale(z)                  │
│                                                                   │
│  Subtitle.tsx: Word-by-word timing from TTS                      │
│  Audio: Segment audio files with frame-based sequences           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Role |
|------|------|
| `cli/commands/viewport.ts` | Generates viewport.json using Gemini |
| `config/prompts/viewport.prompt.ts` | LLM prompt for region detection |
| `src/lib/viewport-utils.ts` | Runtime viewport math |
| `src/components/Background.tsx` | Renders viewport animation |
| `public/projects/*/viewport.json` | Generated keyframes |
| `public/projects/*/timeline.json` | Final merged timeline |

---

## Issue Analysis

### Issue 1: LLM Region Detection Accuracy

**Current Behavior:**
Gemini analyzes the image and script to detect regions and map segments. Results vary between runs and may not precisely match the actual collage grid.

**Evidence from viewport.json:**
```json
{
  "id": "region-1",
  "bounds": { "x": 0.25, "y": 0, "width": 0.25, "height": 0.33 }
}
```
These bounds are reasonable but the mapping of "which segment talks about which region" is subjective.

**Root Cause:**
LLM lacks ground truth about which words correspond to which visual panel.

---

### Issue 2: Zoom Level Calculation

**Current Formula (viewport.ts:351-422):**
```typescript
const isSmallRegion = bounds.width <= 0.4 || bounds.height <= 0.4;
const targetCoverage = isSmallRegion ? 0.95 : 0.85;
zoom = 1 / (bounds.height / targetCoverage);  // or width
```

**Current viewport.json zoom values:** 2.27 - 2.88

**Math Verification:**
- Region height = 0.33 → zoom = 1/(0.33/0.95) = 2.88 ✓
- This should show ~35% of image height, isolating one panel

**Potential Issue:**
The cam_newton.png has aspect ratio 2.72:1 (very wide). At zoom 2.88:
- Visible width = 1/2.88 = 34.7% of image
- But image is 2.72x wider than tall
- Actual visible area may span multiple horizontal panels

---

### Issue 3: Audio-Viewport Sync Architecture

**Current Approach:** Frame-based, pre-calculated keyframes

```
Audio timing (TTS) → Segment timing → Frame ranges → Keyframes
```

Keyframes are computed at build time. Runtime just interpolates based on frame number.

**Problem:**
If there's any drift between actual audio playback and frame timing, the viewport won't correct itself. The system assumes perfect frame-audio alignment.

---

## High-Effectiveness Solutions

### Solution 1: Deterministic Grid-Based Region Detection

**Effectiveness: HIGH** (for collage images)

**Approach:**
Instead of LLM detection, define a grid layout for known collage structures.

**Implementation:**
```typescript
interface CollageLayout {
  rows: number;
  cols: number;
  regions: Array<{
    row: number;
    col: number;
    label?: string;
  }>;
}

function generateGridRegions(layout: CollageLayout): DetectedRegion[] {
  const cellWidth = 1 / layout.cols;
  const cellHeight = 1 / layout.rows;

  return layout.regions.map((r, i) => ({
    id: `region-${i + 1}`,
    bounds: {
      x: r.col * cellWidth,
      y: r.row * cellHeight,
      width: cellWidth,
      height: cellHeight,
    },
    salience: 1.0,
  }));
}
```

**Tradeoffs:**

| Pros | Cons |
|------|------|
| Perfectly consistent regions | Requires manual grid specification |
| No API costs | Doesn't work for non-grid images |
| Deterministic output | Can't handle irregular layouts |
| Faster generation | Loses semantic region labeling |

**Critical Assessment:**
- Solves the immediate cam_newton.png problem definitively
- Zero variance between runs
- **Limitation**: Real-world collages may have irregular panel sizes or decorative borders. Consider adding padding/margin parameters.
- **Best for**: Known collage structures where grid spec can be provided upfront

**Recommendation:** Use for collages with known grid structures. Fallback to LLM for organic images.

---

### Solution 2: Word-Level Viewport Triggers

**Effectiveness: HIGH**

**Approach:**
Embed viewport change triggers at specific words in the script, not segment boundaries.

**Data Structure:**
```typescript
interface WordViewportTrigger {
  wordId: string;             // Stable word identifier (not index)
  wordIndex: number;          // Global word index in script (for lookup)
  targetRegion: string;       // Region to pan to
  transitionMs: number;       // Transition duration
}
```

**Implementation:**
```typescript
// In timeline.json
{
  "viewportTriggers": [
    { "wordId": "w-001", "wordIndex": 0, "targetRegion": "region-1", "transitionMs": 0 },
    { "wordId": "w-045", "wordIndex": 45, "targetRegion": "region-2", "transitionMs": 800 },
    { "wordId": "w-102", "wordIndex": 102, "targetRegion": "region-3", "transitionMs": 600 }
  ]
}

// In Background.tsx
const currentWord = getCurrentWordIndex(frame, wordTimings);
const activeTrigger = findActiveTrigger(currentWord, viewportTriggers);
const viewport = calculateViewportForRegion(activeTrigger.targetRegion);
```

**Auto-Generation Strategy:**
```typescript
function generateTriggersFromScript(
  segments: Segment[],
  regions: DetectedRegion[]
): WordViewportTrigger[] {
  const triggers: WordViewportTrigger[] = [];
  let globalWordIndex = 0;

  for (const segment of segments) {
    // Trigger at first word of each segment
    triggers.push({
      wordId: `w-${String(globalWordIndex).padStart(3, '0')}`,
      wordIndex: globalWordIndex,
      targetRegion: segment.regionId,
      transitionMs: segment === segments[0] ? 0 : 800,
    });

    globalWordIndex += segment.wordCount;
  }

  return triggers;
}
```

**Tradeoffs:**

| Pros | Cons |
|------|------|
| Precise sync to spoken words | Requires trigger placement (auto or manual) |
| Natural transition points | More data to manage |
| Flexible timing control | Complex word→frame mapping |
| Works with Remotion model | Needs UI for trigger editing (long-term) |

**Critical Assessment:**
- Most architecturally sound solution for precise sync
- Maintains Remotion compatibility for video export
- **Key improvement**: Use stable `wordId` instead of just index to handle script edits
- **Implementation gap**: Need concrete auto-generation algorithm (provided above)
- Can be auto-generated from segment boundaries, then manually refined if needed

**Recommendation:** Implement auto-generation from segments first, add manual refinement UI later.

---

### Solution 3: Aspect-Aware Zoom Calculation

**Effectiveness: HIGH**

**Problem:**
Current zoom calculation doesn't account for mismatch between image and canvas aspect ratios.

**Current Approach:**
```typescript
zoom = 1 / (bounds.height / targetCoverage);
// e.g., height=0.33, coverage=0.95 → zoom=2.88
```

**Aspect-Aware Solution:**

Account for the mismatch between image and canvas aspect ratios:

```typescript
function calculateZoomAspectAware(
  bounds: Bounds,
  imageAspect: number,   // 2.72 for cam_newton.png
  canvasAspect: number,  // 1.78 for 1920x1080
  targetCoverage: number = 0.9
): number {
  // How the image fits in canvas (letterboxed or pillarboxed)
  const fitMode = imageAspect > canvasAspect ? 'width-constrained' : 'height-constrained';

  if (fitMode === 'width-constrained') {
    // Wide image: width fills canvas, height is letterboxed
    // Zoom based on width to ensure region width fills canvas
    const zoomForWidth = targetCoverage / bounds.width;

    // But also check if height would overflow
    const effectiveHeightRatio = (bounds.height * imageAspect) / canvasAspect;
    const zoomForHeight = targetCoverage / effectiveHeightRatio;

    // Use the smaller zoom to ensure region fits
    return Math.min(zoomForWidth, zoomForHeight);
  } else {
    // Tall image: height fills canvas, width is pillarboxed
    const zoomForHeight = targetCoverage / bounds.height;

    const effectiveWidthRatio = (bounds.width * canvasAspect) / imageAspect;
    const zoomForWidth = targetCoverage / effectiveWidthRatio;

    return Math.min(zoomForWidth, zoomForHeight);
  }
}

// For cam_newton.png (2.72:1) on 1920x1080 (1.78:1) canvas:
// - fitMode = 'width-constrained'
// - bounds = { width: 0.333, height: 0.5 } (one panel of 2x3 grid)
// - zoomForWidth = 0.9 / 0.333 = 2.7
// - effectiveHeightRatio = (0.5 * 2.72) / 1.78 = 0.764
// - zoomForHeight = 0.9 / 0.764 = 1.18
// - Result: zoom = 1.18 (much lower than current 2.88!)
```

**Critical Assessment:**
- The math is correct and addresses a real, measurable problem
- Current zoom of 2.88 is way too high for wide images
- This fix alone may resolve the "multiple panels visible" issue
- **Should be implemented immediately** as it's a concrete math fix

---

## Recommendation Summary

| Priority | Solution | Impact | Effort |
|----------|----------|--------|--------|
| 1 | Aspect-Aware Zoom | Immediate fix for visible area | Low |
| 2 | Grid Override for Collages | Deterministic regions | Low |
| 3 | Word-Level Triggers (auto-gen) | Precise sync | Medium |

### Implementation Order

1. **Fix aspect-aware zoom (immediate):**
   Update `viewport.ts` zoom calculation to use the aspect-aware formula. This is a targeted math fix with high impact.

2. **Add grid detection option:**
   For known collage structures, bypass LLM and use deterministic grid regions. Add a `--grid=2x3` CLI option.

3. **Implement word-level triggers:**
   Auto-generate triggers from segment boundaries. Store in timeline.json. Update Background.tsx to use triggers.

---

## Appendix: cam_newton.png Specific Analysis

### Image Structure
- Dimensions: 3392x1248 (aspect 2.72:1)
- Layout: 2 rows x 3 columns (approximately)
- 6 distinct panels

### Expected Grid Regions
```
| Panel 1 | Panel 2 | Panel 3 |
| Panel 4 | Panel 5 | Panel 6 |
```

Each panel should be approximately:
- Width: 33% (0.333)
- Height: 50% (0.5)

### Current viewport.json Regions
```
region-1: x=0.25, y=0.00, w=0.25, h=0.33  # Offset from grid
region-2: x=0.50, y=0.00, w=0.25, h=0.33
region-3: x=0.00, y=0.33, w=0.25, h=0.33
region-4: x=0.25, y=0.33, w=0.25, h=0.33
region-5: x=0.50, y=0.33, w=0.25, h=0.33
region-6: x=0.25, y=0.66, w=0.25, h=0.34
```

**Issue:** Regions assume 4 columns (width=0.25) but image appears to have 3 columns. This causes misalignment.

### Recommended Fix for cam_newton.png

Override with manual grid:
```json
{
  "gridOverride": {
    "rows": 2,
    "cols": 3,
    "regions": [
      { "row": 0, "col": 0, "id": "region-1" },
      { "row": 0, "col": 1, "id": "region-2" },
      { "row": 0, "col": 2, "id": "region-3" },
      { "row": 1, "col": 0, "id": "region-4" },
      { "row": 1, "col": 1, "id": "region-5" },
      { "row": 1, "col": 2, "id": "region-6" }
    ]
  }
}
```

This would produce:
- Width per panel: 33.3% (0.333)
- Height per panel: 50% (0.5)
- Zoom needed (aspect-aware): ~1.2-1.5 to fill viewport

---

## Related Documentation

- [VIEWPORT_ANIMATION_INVESTIGATION.md](./VIEWPORT_ANIMATION_INVESTIGATION.md) - Original issue investigation
- [viewport-types.ts](../src/lib/viewport-types.ts) - Type definitions and validation
- [viewport-utils.ts](../src/lib/viewport-utils.ts) - Runtime calculation functions
