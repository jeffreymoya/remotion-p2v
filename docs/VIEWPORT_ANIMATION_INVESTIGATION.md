> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Viewport Animation Investigation

**Date:** 2025-12-29
**Status:** In Progress
**Project:** project-1764548027472

## Problem Statement

The viewport panning/zoom animation for collage images is not working as expected. When displaying a collage image (like `cam_newton.png`), the viewport shows multiple sections of the collage simultaneously instead of zooming into and displaying ONE section at a time based on the audio narration.

## Root Cause Analysis

### 1. Viewport Animation IS Working (Confirmed)

The viewport animation system itself is functioning correctly:
- `viewportAnimation.enabled: true` is being detected
- Keyframes are being loaded (5 keyframes)
- Transform calculations are being applied correctly
- Transitions between keyframes work (verified at frame 2205 transition)

Debug output confirmed:
```
[Background Debug] viewportAnimation enabled: true
[Background Debug] keyframes count: 5
[Viewport Debug] frame=0, viewport= { centerX: 0.3, centerY: 0.4, zoom: 1.8 }
[Viewport Debug] frame=2220, viewport= { centerX: 0.3176, centerY: 0.3936, zoom: 1.808 }  // transitioning
[Viewport Debug] frame=2280, viewport= { centerX: 0.52, centerY: 0.32, zoom: 1.9 }  // arrived at keyframe 2
```

### 2. The Real Issue: Zoom Levels Are Too Low

The zoom values (1.7-1.9) only show about **55-60% of the image** at once. For a collage with 4-6 distinct panels, this results in 2-3 panels being visible simultaneously.

**Math breakdown:**
- Image: 2752x1536 (aspect ratio ~1.79)
- Canvas: 1920x1080 (aspect ratio ~1.78)
- At zoom=1.8: visible portion = 1/1.8 = **55.6%** of the image

### 3. Why Zoom Is Low: Region Detection Issues

The Gemini LLM is detecting regions that are too large:
- `region-1`: width=0.35, height=0.55 (35% x 55% of image)
- `region-2`: width=0.40, height=0.40 (40% x 40% of image)

For collage panels, these regions are too large. Each individual panel should be ~0.25-0.5 width AND height.

### 4. Zoom Calculation Logic

The `calculateZoomForRegion` function in `cli/commands/viewport.ts:350-418`:
- Uses `targetCoverage = 0.85` (region fills 85% of viewport)
- For region height=0.55: `zoom = 1 / (0.55 / 0.85) = 1.55`
- Clamped and adjusted, results in zoom ~1.7-1.9

This is mathematically correct for the detected regions, but the **regions themselves are too large**.

## Key Files Involved

| File | Purpose |
|------|---------|
| `src/components/Background.tsx` | Renders viewport animation using CSS transforms |
| `src/lib/viewport-utils.ts` | `calculateViewportState()` and `viewportToTransform()` functions |
| `cli/commands/viewport.ts` | Generates viewport.json using Gemini analysis |
| `config/prompts/viewport.prompt.ts` | LLM prompt for region detection |
| `public/projects/*/viewport.json` | Generated viewport keyframes |
| `public/projects/*/timeline.json` | Final timeline with embedded keyframes |

## Changes Made

### 1. Updated LLM Prompt (`config/prompts/viewport.prompt.ts`)

Added explicit instructions for collage handling:

```typescript
IMPORTANT - COLLAGE IMAGE HANDLING:
- If the image is a COLLAGE (multiple distinct panels/sections arranged in a grid), treat EACH PANEL as a separate region
- For collages: bounds should TIGHTLY fit each individual panel - do NOT create regions that span multiple panels
- Each panel should be roughly 0.25-0.5 in width AND 0.25-0.5 in height (NOT larger)
- The camera will ZOOM INTO each region, so regions must be small enough to show ONE section at a time

REGION DETECTION RULES:
...
- CRITICAL: Keep regions SMALL (max 0.5 width, max 0.5 height) so camera can zoom in effectively
```

### 2. Updated Zoom Calculation (`cli/commands/viewport.ts`)

Made zoom more aggressive for small regions (typical of collage panels):

```typescript
function calculateZoomForRegion(...) {
  // For small regions (typical of collage panels), use higher coverage to zoom in more
  const isSmallRegion = bounds.width <= 0.4 || bounds.height <= 0.4;
  // Target: region fills 85-95% of viewport (higher = more zoom = shows less of image)
  const targetCoverage = isSmallRegion ? 0.95 : 0.85;
  ...
}
```

## Remaining Work

1. **Regenerate viewport.json** - Run `npm run viewport -- --project project-1764548027472` to regenerate with updated prompt
2. **Rebuild timeline.json** - Run `npm run build:timeline -- --project project-1764548027472` to incorporate new keyframes
3. **Test rendering** - Render frames to verify single-section display
4. **Validate region bounds** - Ensure Gemini returns smaller, tighter regions for collage panels

## Expected Results After Fix

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Zoom levels | 1.7-1.9 | 2.5-3.5 |
| Visible image | 55-60% | 30-40% |
| Panels visible | 2-3 at once | 1 at a time |
| Region width | 0.35-0.45 | 0.25-0.35 |
| Region height | 0.40-0.55 | 0.30-0.50 |

## Technical Notes

### Viewport Transform Pipeline

1. **Gemini Analysis** (`viewport.ts`): Image + script → regions + segment groups
2. **Keyframe Generation** (`viewport.ts`): Regions → viewport keyframes with zoom
3. **Timeline Build** (`build.ts`): Merges viewport.json into timeline.json
4. **Runtime Rendering** (`Background.tsx`):
   - `calculateViewportState()` → interpolates between keyframes
   - `viewportToTransform()` → converts viewport to CSS transform
   - Applied as `transform: translate(x,y) scale(z)`

### Key Formulas

```typescript
// Base scale to fit image to canvas (zoom=1)
baseScale = Math.max(canvasW / imageW, canvasH / imageH)

// Actual CSS scale
scale = baseScale * viewport.zoom

// Visible portion of image
visibleWidth = canvasW / scale
visibleHeight = canvasH / scale

// For zoom=1.8, baseScale=0.703:
// scale = 1.265
// visible = 55% of image
```

## Validation Commands

```bash
# Regenerate viewport analysis
npm run viewport -- --project project-1764548027472

# Rebuild timeline with new keyframes
npm run build:timeline -- --project project-1764548027472

# Render test frames around transitions
npx remotion render project-1764548027472 --frames=0-90 --output=/tmp/test.mp4

# Check viewport.json regions
cat public/projects/project-1764548027472/viewport.json | jq '.detectedRegions[] | {id, bounds}'
```
