# 2026-01-21 — Boards pipeline unblocked with mock AI + prompt UI fixes

## Summary
- Restored missing AI provider entrypoint and added a richer mock provider so boards planning/prompt flows can run locally without external LLMs.
- Fixed import paths and defensive handling in boards prompt service to tolerate zero/one-based segment indices and avoid undefined segment crashes.
- Updated boards wizard prompt handling and display component to guard against empty prompt lists and payload shape differences.

## Details
- Added `src/lib/services/ai/index.ts` with Gemini CLI provider when explicitly requested, plus structured mock responses for plan and prompts paths.
- Adjusted `src/lib/boards/prompts-service.ts` to resolve segments safely and map contexts without null derefs.
- Made `BoardPlannerWizard` consume API `data` payloads; hardened `PromptDisplay` against out-of-range indices.

## Testing
- Manual e2e via Chrome MCP: regenerated board plan and image prompts for project `cmkg683hz0000i06xkvjly687`; prompts rendered and copy-to-clipboard works.

## Next steps
1) Run `npm run lint` to catch any residual typing/formatting issues.
2) If using real AI, install/auth `gemini` CLI and set `BOARDS_AI_PROVIDER=gemini` (or keep mock for offline runs).
3) Add lightweight unit tests around `prompts-service` segment mapping to lock regression.
4) Consider adding UI state for prompt-generation errors to avoid full-page modal when API fails.
