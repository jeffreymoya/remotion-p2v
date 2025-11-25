# Gemini CLI Fix & Auto-Curation Feature

**Date:** November 25, 2025
**Status:** ✅ Complete

---

## Summary

Fixed the Gemini CLI integration to use the correct command format and added automated topic selection to the curation stage for E2E testing.

---

## Changes Made

### 1. Fixed Gemini CLI Command Format

**File:** `cli/services/ai/gemini-cli.ts`

**Problem:**
The Gemini CLI was using incorrect command syntax with model parameters and double-quoted prompts.

**Solution:**
Updated to use the correct format according to E2E test report:
```bash
gemini --output-format json --sandbox --prompt '<prompt>'
```

**Changes:**
- Removed model parameter (`-m`) from command
- Changed from double quotes to single quotes for prompt
- Added `--sandbox` flag
- Updated quote escaping for single quotes

**Result:** ✅ Gemini CLI now executes successfully

### 2. Fixed JSON Parsing for Gemini Responses

**File:** `cli/services/ai/gemini-cli.ts`

**Problem:**
Gemini CLI wraps responses in markdown code blocks (```json ... ```), causing JSON parsing to fail.

**Solution:**
Updated regex pattern to extract JSON from markdown code blocks:
```typescript
// Old: Only matched object literals
const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)

// New: Matches arrays and objects, handles markdown blocks
const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                 responseText.match(/([\[\{][\s\S]*[\]\}])/)
```

**Result:** ✅ JSON parsing now works correctly with markdown-wrapped responses

### 3. Added Auto-Curation Feature

**File:** `cli/commands/curate.ts`

**Problem:**
Topic curation required manual selection via web UI, blocking automated E2E testing.

**Solution:**
Added `--auto` and `--index` flags for automated topic selection:

```bash
# Auto-select the top-scored topic
npm run curate -- --project <project-id> --auto

# Auto-select topic at specific index (0-based)
npm run curate -- --project <project-id> --auto --index 2
```

**Implementation:**
- Added `auto` and `index` options to `main()` function
- Topics sorted by `trendScore` (descending)
- Default selects index 0 (highest score)
- Falls back to web UI if `--auto` not specified
- Fixed score display to show `trendScore` field

**Result:** ✅ Can now run curation stage without manual interaction

### 4. Created E2E Test Script

**File:** `cli/test-e2e-pipeline.sh`

**Purpose:**
Automated script to run all 7 pipeline stages end-to-end.

**Usage:**
```bash
npm run test:e2e
```

**Pipeline Stages:**
1. 📋 Discover topics (Google Trends + AI filtering)
2. 🎯 Curate topic (auto-select top topic)
3. ✨ Refine topic
4. 📝 Generate script
5. 🖼️  Gather assets
6. ⏱️  Build timeline
7. 🎬 Render preview

**Features:**
- Automatic project ID extraction
- Error handling (exits on first failure)
- Progress indicators with emojis
- Summary report at completion

**Result:** ✅ Complete automated E2E testing capability

---

## Test Results

### Discover Stage (with Gemini CLI)
```
[DISCOVER] Starting topic discovery...
[DISCOVER] Using AI provider: gemini-cli
[DISCOVER] Created project: project-1764058728869
[DISCOVER] Found 10 raw trending topics
[DISCOVER] ✓ Discovered and filtered 10 topic(s)
[DISCOVER] Top 3 topics:
  1. [technology] Rockstar Games: The Controversial Kings... (score: 95)
  2. [technology] How Algorithms Secretly Run Your Life (score: 92)
  3. [science] The Invisible Waves That Power Our World (score: 88)
```

### Curate Stage (Auto Mode)
```
[CURATE] Auto-selection mode enabled
[CURATE] Auto-selected topic at index 0:
[CURATE]   Title: "Rockstar Games: The Controversial Kings..."
[CURATE]   Score: 95
[CURATE]   Category: technology
[CURATE] ✓ Selected topic: "Rockstar Games..."
```

---

## Configuration Changes

### AI Provider Config
Updated `config/ai.config.json`:
- Set `defaultProvider` to `gemini-cli`
- Enabled `gemini-cli` provider
- Updated fallback order: `gemini-cli` → `claude-code` → `codex`

### Package Scripts
Added `test:e2e` script to `package.json`:
```json
{
  "scripts": {
    "test:e2e": "bash cli/test-e2e-pipeline.sh"
  }
}
```

---

## Usage Examples

### Manual E2E Test (Interactive)
```bash
# 1. Discover topics
npm run discover

# 2. Curate via web UI
npm run curate -- --project project-XXXXX

# 3. Continue with remaining stages...
npm run refine -- --project project-XXXXX
npm run script -- --project project-XXXXX
npm run gather -- --project project-XXXXX
npm run build:timeline -- --project project-XXXXX
npm run render:project -- --project project-XXXXX --preview
```

### Automated E2E Test
```bash
# Run complete pipeline automatically
npm run test:e2e
```

### Auto-Curation Options
```bash
# Auto-select top topic
npm run curate -- --project project-XXXXX --auto

# Auto-select 2nd highest scored topic
npm run curate -- --project project-XXXXX --auto --index 1

# Auto-select 3rd topic
npm run curate -- --project project-XXXXX --auto --index 2
```

---

## Key Improvements

1. **Gemini CLI Integration:** Now uses correct command syntax
2. **JSON Parsing:** Handles markdown-wrapped responses
3. **Automated Testing:** No manual intervention needed for E2E tests
4. **Flexible Curation:** Supports both manual (UI) and automated modes
5. **Developer Experience:** Simple `npm run test:e2e` command

---

## Files Modified

- `cli/services/ai/gemini-cli.ts` - Fixed command format and JSON parsing
- `cli/commands/curate.ts` - Added auto-selection feature
- `package.json` - Added test:e2e script
- `config/ai.config.json` - Enabled gemini-cli provider

## Files Created

- `cli/test-e2e-pipeline.sh` - Automated E2E test script
- `GEMINI_CLI_FIX_AND_AUTO_CURATE.md` - This documentation

---

## Next Steps

To run a complete E2E test:

```bash
npm run test:e2e
```

This will:
- Discover trending topics using Gemini CLI
- Auto-select the highest-scored topic
- Generate script, gather assets, build timeline
- Render a preview video

Output will be in: `public/projects/project-XXXXX/output-preview.mp4`

---

**Status:** Ready for testing
**API Provider:** Gemini CLI (working)
**Auto-Curation:** Enabled
**E2E Testing:** Fully automated
