# E2E Test Report - Major Issues Found

**Test Date:** November 25, 2025
**Test Status:** ❌ BLOCKED - Critical issues prevent pipeline execution
**Tester:** Claude Code AI Agent

---

## Executive Summary

The E2E test of the refactored pipeline was **blocked** due to critical issues with AI provider integration. While all infrastructure components (path helpers, configs, CLI commands) were successfully implemented in Phases 1-6, the actual pipeline cannot complete due to AI provider failures.

---

## Critical Issues

### Issue #1: Gemini API Failure (CRITICAL)

**Severity:** 🔴 Critical
**Component:** `cli/services/ai/gemini-cli.ts`
**Status:** Blocking

**Description:**
The Gemini CLI returns a 404 "Model Not Found" error when attempting to make API calls, despite having cached credentials.

**Error Details:**
```
Error when talking to Gemini API
{
  "error": {
    "code": 404,
    "message": "Requested entity was not found.",
    "status": "NOT_FOUND"
  }
}
```

**Evidence:**
- Gemini CLI version: 0.17.1
- Command test: `gemini "hello" -m gemini-1.5-flash`
- Error log: `/tmp/gemini-client-error-Turn.run-sendMessageStream-*.json`

**Root Cause:**
The Gemini API key in `.env` is empty, and the cached credentials in the Gemini CLI are either invalid or pointing to a non-existent project/model.

**Impact:**
- Cannot use Gemini as the AI provider (configured as default in refactoring plan)
- Blocks all AI-dependent pipeline stages (discover, refine, script)

**Workaround:**
- Switch to alternative AI provider (claude-code or codex)
- Requires valid API credentials

---

### Issue #2: Codex CLI Non-Headless Behavior (CRITICAL)

**Severity:** 🔴 Critical
**Component:** `cli/services/ai/codex.ts`
**Status:** Blocking

**Description:**
The Codex CLI (`codex exec`) outputs conversational responses instead of structured JSON when used in file-based mode, making it unsuitable for headless automation.

**Error Details:**
```
Failed to parse JSON: Unexpected token 'F', "File with "... is not valid JSON
```

**Actual Output:**
```
File with the ranked topic plan lives at `/tmp/remotion-p2v-ai/codex/codex-structured-*.json`.
Let me know if you want tweaks to any concepts or different scoring criteria.
```

**Root Cause:**
The `codex exec` command with `-o` flag writes conversational assistant responses to the output file rather than the requested structured data. Codex is designed for interactive collaboration, not headless JSON generation.

**Impact:**
- Cannot use Codex as a fallback provider for structured completions
- `CodexCLIProvider.structuredComplete()` fails to parse responses

**Workaround:**
- Use claude-code provider instead
- Requires updating `ai.config.json` fallbackOrder

---

### Issue #3: Claude Code Timeout on Complex Prompts (HIGH)

**Severity:** 🟡 High
**Component:** `cli/services/ai/claude-code.ts`
**Status:** Workaround Available

**Description:**
Claude Code CLI times out (300 seconds) when processing complex structured completions, even when successfully generating responses.

**Error Details:**
```
Command timed out after 300000ms
```

**Evidence:**
- Started: 03:29:26
- Timeout: 03:34:26 (exactly 5 minutes)
- Partial output was written to temp file (2.2K) but process killed before completion

**Root Cause:**
The timeout of 300 seconds (5 minutes) is too short for Claude Code to:
1. Process large prompts with strict JSON formatting requirements
2. Validate outputs against implicit schema constraints
3. Handle edge cases (e.g., no matching topics in Google Trends data)

**Impact:**
- Stage 1 (discover) fails even with valid provider
- Unpredictable failures on prompts requiring extensive analysis

**Workaround:**
- Increase timeout in `CLIExecutor` to 600 seconds (10 minutes)
- Simplify prompts to reduce processing time
- Add retry logic with exponential backoff

---

### Issue #4: Claude Code Response Format Mismatch (MEDIUM)

**Severity:** 🟠 Medium
**Component:** `cli/services/ai/claude-code.ts` (lines 63-77, 133-148)
**Status:** Fixed during testing

**Description:**
The ClaudeCodeCLIProvider was looking for a `response` field in the JSON wrapper, but the actual CLI output uses a `result` field.

**Expected Format:**
```json
{
  "response": "..."
}
```

**Actual Format:**
```json
{
  "type": "result",
  "result": "...",
  "is_error": false,
  "total_cost_usd": 0.037,
  ...
}
```

**Root Cause:**
Implementation was based on outdated/incorrect Claude CLI documentation or assumptions.

**Impact:**
- All structuredComplete() calls failed with "response is undefined"
- Prevented any AI provider from working correctly

**Fix Applied:**
Updated `/home/jeffreymoya/dev/remotion-p2v/cli/services/ai/claude-code.ts` to:
- Check for both `result` and `response` fields
- Handle `is_error` flag
- Gracefully fallback to empty string if neither field exists

---

### Issue #5: Missing API Keys in .env (MEDIUM)

**Severity:** 🟠 Medium
**Component:** `.env` configuration
**Status:** Documented

**Description:**
The `.env` file is missing required API keys for AI providers, despite user claiming they were added.

**Missing Keys:**
```
GEMINI_API_KEY=           # Empty
OPENAI_API_KEY=           # Empty
ANTHROPIC_API_KEY=        # Empty
ELEVENLABS_API_KEY=       # Empty
```

**Present Keys:**
```
GOOGLE_TTS_API_KEY=       # ✅ Set
PEXELS_API_KEY=           # ✅ Set
UNSPLASH_ACCESS_KEY=      # ✅ Set
PIXABAY_API_KEY=          # ✅ Set
```

**Root Cause:**
Some CLI tools (codex, gemini, claude) use separate credential storage via `<tool> login` commands rather than environment variables, which may have led to confusion.

**Impact:**
- Cannot use HTTP-based AI providers (if fallback to SDKs were implemented)
- Limits testing to CLI-based providers only

**Recommendation:**
Update `.env.example` documentation to clarify which providers use CLI auth vs environment variables.

---

### Issue #6: AI Prompt Design - No Fallback for Empty Results (MEDIUM)

**Severity:** 🟠 Medium
**Component:** `cli/commands/discover.ts` (lines 76-92)
**Status:** Design flaw

**Description:**
The AI filtering prompt in Stage 1 (discover) doesn't handle cases where all trending topics fail to meet criteria. Claude returned a conversational explanation instead of JSON.

**Claude's Response:**
```
"I notice they are all news, sports, and celebrity-related items...
After applying your filters, there are **zero topics** that meet your criteria..."
```

**Expected Behavior:**
Even when no topics match, the AI should return valid JSON:
```json
{
  "topics": [],
  "reasoning": "All trending topics were filtered out due to..."
}
```

**Root Cause:**
Prompt doesn't explicitly instruct AI to return empty arrays when no results match, leaving it to respond conversationally.

**Impact:**
- JSON parsing fails
- Pipeline cannot recover from "no matching topics" scenario
- Requires manual intervention to retry with different trends

**Fix Needed:**
Update prompt in `discover.ts` to include:
```
If no topics meet the criteria, return:
{
  "topics": [],
  "fallbackSuggestions": ["topic1", "topic2", ...]
}
```

---

## Test Environment

**System:**
- OS: Linux 6.17.4
- Node: v22.15.0
- Working Directory: `/home/jeffreymoya/dev/remotion-p2v`

**CLI Tools Available:**
- ✅ `gemini` (v0.17.1) - Has credentials but API fails
- ✅ `codex` (v0.63.0) - Works but outputs conversational text
- ✅ `claude` (v2.0.53) - Works but times out on complex prompts

**Configuration:**
- Default AI Provider: `claude-code` (changed from `gemini-cli` during testing)
- Fallback Order: `claude-code` → `codex` → `gemini-cli`
- Timeout: 300 seconds (5 minutes)

---

## Pipeline Stages Tested

| Stage | Command | Status | Notes |
|-------|---------|--------|-------|
| 1. Discovery | `npm run discover` | ❌ FAILED | Timeout + empty results issue |
| 2. Curation | `npm run curate` | ⏸️ NOT TESTED | Blocked by Stage 1 |
| 3. Refinement | `npm run refine` | ⏸️ NOT TESTED | Blocked by Stage 1 |
| 4. Script | `npm run script` | ⏸️ NOT TESTED | Blocked by Stage 1 |
| 5. Asset Gathering | `npm run gather` | ⏸️ NOT TESTED | Blocked by Stage 1 |
| 6. Timeline Assembly | `npm run build:timeline` | ⏸️ NOT TESTED | Blocked by Stage 1 |
| 7. Rendering | `npm run render:project` | ⏸️ NOT TESTED | Blocked by Stage 1 |

---

## Successful Components

Despite the blocking issues, the following components were verified to be working:

✅ **Path Helpers** (`src/lib/paths.ts`)
- Successfully creates project directories
- Legacy shim working
- Generates correct file paths

✅ **Configuration Loading** (`cli/lib/config.ts`)
- All config files load without errors
- Zod validation passes
- Environment variable substitution works

✅ **CLI Command Structure**
- All 7 stage commands execute
- Proper error handling and logging
- Dependency validation (checks for previous stage outputs)

✅ **Google Trends Integration**
- Successfully fetches 10 trending topics from RSS
- No API errors or rate limiting

✅ **Stock Media API Keys**
- Pexels, Unsplash, Pixabay credentials present
- Ready for Stage 5 (gather) when reached

---

## Recommendations

### Immediate Actions (Required for E2E completion)

1. **Fix Gemini API Credentials** (Priority 1)
   - Run `gemini login` or configure proper Google Cloud project
   - Add valid `GEMINI_API_KEY` to `.env` if using SDK fallback
   - Verify model access (gemini-1.5-flash availability)

2. **Increase Claude Timeout** (Priority 1)
   ```typescript
   // cli/utils/cli-executor.ts
   const DEFAULT_TIMEOUT = 600000; // 10 minutes instead of 5
   ```

3. **Fix Empty Results Prompt** (Priority 2)
   - Update `cli/commands/discover.ts` prompt to handle zero matches
   - Add fallback topic suggestions when filters are too strict

4. **Remove Codex as Fallback** (Priority 2)
   - Update `config/ai.config.json`:
   ```json
   {
     "fallbackOrder": ["claude-code", "gemini-cli"],
     "providers": {
       "codex": { "enabled": false }
     }
   }
   ```

### Long-term Improvements

1. **Implement AI Provider Abstraction Layer**
   - Add detection for conversational vs structured responses
   - Auto-extract JSON from markdown code blocks
   - Retry with simplified prompts on timeout

2. **Add Graceful Degradation**
   - Use cached/fallback topic lists when trends filtering fails
   - Allow manual topic injection via CLI args
   - Skip AI filtering with `--no-ai-filter` flag

3. **Improve Error Messages**
   - Distinguish between "no API key", "invalid key", and "API error"
   - Provide actionable fix suggestions in error output
   - Log full context for debugging (model, tokens, cost)

4. **Add Health Checks**
   - Pre-flight validation before running pipeline
   - Test each AI provider with simple "hello world" call
   - Report available/unavailable providers upfront

---

## Conclusion

The refactoring implementation (Phases 1-6) is **structurally sound** - all new infrastructure components work correctly. However, the pipeline **cannot complete E2E testing** due to external dependencies (AI provider API access) and integration issues (CLI tool behavior).

**Root Cause:** AI provider integration layer (`cli/services/ai/`) was designed for idealized CLI behavior that doesn't match real-world tool implementations.

**Critical Path to Unblock:**
1. Fix Gemini credentials OR
2. Increase Claude timeout to 10 minutes AND fix empty results prompt

**Estimated Time to Fix:** 2-4 hours (assuming API credentials can be obtained)

---

## Test Artifacts

**Log Files:**
- `/tmp/gemini-client-error-*.json` - Gemini API errors
- `/tmp/remotion-p2v-ai/codex/` - Codex conversational outputs
- `/tmp/remotion-p2v-ai/claude-code/` - Claude partial outputs

**Generated Projects:**
- `public/projects/project-1764040900148/` - First discover attempt (Gemini)
- `public/projects/project-1764041022125/` - Second discover attempt (Codex)
- `public/projects/project-1764041364809/` - Third discover attempt (Claude, timeout)

**Modified Files During Testing:**
- `config/ai.config.json` - Changed default provider and fallback order
- `cli/services/ai/claude-code.ts` - Fixed response field parsing

---

**Report Generated:** 2025-11-25T03:35:00Z
**Total Test Duration:** ~40 minutes
**Next Steps:** Address Priority 1 recommendations and re-test
