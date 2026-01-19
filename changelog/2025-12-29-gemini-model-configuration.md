> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Changelog - 2025-12-29

## Gemini Model Configuration & Viewport Animation Improvements

### Added

- **Environment variable configuration for Gemini CLI parameters**
  - `GEMINI_MODEL` - Configure Gemini model (default: `gemini-2.5-pro`)
  - `GEMINI_TEMPERATURE` - Configure temperature (default: `0.7`)
  - `GEMINI_MAX_TOKENS` - Configure max tokens (default: `8000`)
  - Added to `.env.example` with documentation

### Changed

- **Default Gemini model upgraded from `gemini-2.5-flash-lite` to `gemini-2.5-pro`**
  - Significantly improved viewport region detection for collage images
  - Better grid structure recognition (4x3 collage correctly identified)
  - More accurate region sizing (0.25 x 0.33 vs previous 0.35-0.50 x 0.40-0.55)
  - Higher zoom levels (2.27-2.88 vs previous 1.7-1.9)
  - Eliminates IoU overlap validation errors

- **Refactored `cli/services/ai/gemini-cli.ts`**
  - Added `GEMINI_CONFIG` object to centralize environment variable reading
  - Added helper methods: `getModel()`, `getTemperature()`, `getMaxTokens()`
  - Replaced all 12 hardcoded `gemini-2.5-flash-lite` references with configurable values
  - Model, temperature, and max tokens now configurable per-instance via constructor config

### Fixed

- **Viewport animation region detection for collage images**
  - Previously: Regions were too large (0.35-0.50 width, 0.40-0.55 height), causing multiple panels to be visible simultaneously
  - Now: Regions properly sized to individual panels (0.25 width, 0.33 height for 4x3 grid)
  - Previously: Regions overlapped (31% IoU), failing validation
  - Now: Regions are properly aligned to grid with no overlap

### Performance Impact

#### Viewport Analysis Quality (Collage Images)

| Metric | Before (flash-lite) | After (pro) | Impact |
|--------|---------------------|-------------|---------|
| Region width | 0.35-0.50 | **0.25** | ✅ Perfect grid alignment |
| Region height | 0.40-0.55 | **0.33** | ✅ Perfect grid alignment |
| Zoom levels | 1.7-1.9 | **2.27-2.88** | ✅ +37% more zoom |
| Visible image area | 55-60% | **35-44%** | ✅ Shows 1 panel vs 2-3 |
| Validation errors | IoU overlap 31% | **None** | ✅ Passes validation |

#### Cost Considerations

- `gemini-2.5-pro` is more expensive than `gemini-2.5-flash-lite` per API call
- However, the improved accuracy reduces retry failures and validation errors
- Net result: Fewer failed attempts = comparable or lower total cost
- Quality improvement justifies the cost for production use

### Migration Guide

#### For existing projects:

1. **Update your `.env` or `.env.local` file:**
   ```bash
   # Optional: Customize Gemini model and parameters
   GEMINI_MODEL=gemini-2.5-pro
   GEMINI_TEMPERATURE=0.7
   GEMINI_MAX_TOKENS=8000
   ```

2. **Regenerate viewport analysis for collage projects:**
   ```bash
   npm run viewport -- --project <project-id>
   npm run build:timeline -- --project <project-id>
   npx remotion render <project-id> --output=public/projects/<project-id>/preview.mp4
   ```

3. **To revert to previous model:**
   ```bash
   GEMINI_MODEL=gemini-2.5-flash-lite
   ```

### Technical Details

#### Files Modified

1. **`cli/services/ai/gemini-cli.ts`**
   - Added `GEMINI_CONFIG` constant reading from environment variables
   - Added `getModel()`, `getTemperature()`, `getMaxTokens()` helper methods
   - Updated `buildCommand()` to use configurable model
   - Updated all logging calls to use configurable parameters (12 locations)

2. **`.env.example`**
   - Added `GEMINI_MODEL`, `GEMINI_TEMPERATURE`, `GEMINI_MAX_TOKENS` with defaults
   - Added inline documentation for each variable

#### Example Output Comparison

**Before (`gemini-2.5-flash-lite`):**
```json
{
  "id": "region-3",
  "bounds": { "x": 0.15, "y": 0.45, "width": 0.5, "height": 0.35 },
  "salience": 0.9
}
```

**After (`gemini-2.5-pro`):**
```json
{
  "id": "region-3",
  "bounds": { "x": 0, "y": 0.33, "width": 0.25, "height": 0.33 },
  "label": "Superman Celebration 'Unapologetic Individuality'",
  "salience": 1
}
```

### Related Issues

- Resolves viewport animation showing multiple collage panels simultaneously
- Fixes IoU overlap validation failures in viewport analysis
- Improves region detection accuracy for grid-based collage images

### Testing

Tested on project `project-1764548027472` (Cam Newton collage - 4x3 grid):
- ✅ Viewport analysis generates 6 regions correctly aligned to grid
- ✅ No IoU overlap validation errors
- ✅ Zoom levels produce single-panel views (2.27-2.88)
- ✅ Timeline.json contains viewport animation with 6 keyframes
- ✅ Rendered preview shows proper pan-scan animation across individual panels
