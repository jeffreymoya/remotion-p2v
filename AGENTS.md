# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript Remotion project building Bloomberg-style fast-paced documentary/informational videos for high-RPM YouTube niches. Core runtime code lives in `src/`: `src/Root.tsx` registers Remotion compositions, `src/components/docu/` contains the documentary composition and overlay components, and `src/lib/docu/` contains the TTS, image-download, shot-scheduling, overlay-resolver, and codegen logic. Shared utilities live under `src/lib/shared/`.

Operational scripts live in `scripts/`. Generated pipeline artifacts are written under `prompts/docu/`, `public/audio/docu/`, `public/images/docu/`, and `src/generated/`. Treat `prompts/`, `public/`, `.tmp/`, `.env`, and `credentials.json` as local/generated or sensitive unless intentionally preparing sample assets.

## Build, Test, and Development Commands

- `npm run docu "topic"`: run the full docu pipeline for a topic (TTS + images + codegen).
- `npm run docu:audition`: run TTS audition only (30s voice clips).
- `npm run studio`: open Remotion Studio for previewing generated compositions.
- `npm run build -- <composition-id> out/video.mp4`: render a composition.
- `npm run typecheck`: run TypeScript checks with `tsc --noEmit`.
- `npm run smoke:deepseek`: smoke-test DeepSeek parameter variants.
- `npm run smoke:deepseek-brainstorm`: smoke-test the brainstorm research flow.
- `npm run quotas`: check quota/liveness for all active API integrations.
- `npm run test:pause-injector`: run TTS pause injector unit tests.
- `npm run test:tts-chunking`: run TTS text chunking unit tests.
- `npm run test:docu-article-text`: run article text layout tests.

## Pipeline Overview

The docu pipeline is topic-driven with a niche allowlist gate:

1. Validate the topic against five allowed high-RPM niches.
2. Generate narration segments, sentences, and overlay specs (LLM-driven or hand-authored via `src/lib/docu/topics/`).
3. Run TTS per sentence, producing word-level timings.
4. Schedule B-roll shots (2-4 sec cuts, decoupled from sentence boundaries).
5. Download stock images per shot query.
6. Resolve overlay specs to frame ranges anchored on word timings.
7. Generate `src/generated/docu-scripts.ts` for Remotion composition registration.

## Coding Style & Naming Conventions

Use strict TypeScript, ES modules, React JSX, and the `@/*` alias for `src/*` imports when helpful. Match the existing style: two-space indentation, double quotes, semicolons, explicit return types on exported or non-trivial functions, and `type` imports for type-only symbols. Name files with kebab-case and React components with PascalCase.

## Testing Guidelines

Use `npm run typecheck` plus the relevant smoke/test script for changed behavior. Unit tests live under `tests/` with `*.test.ts` naming. For composition changes, preview with `npm run studio` and render a short output when practical.

## Security & Configuration Tips

Keep API keys and local credentials in `.env` or `credentials.json`; never hardcode secrets in `src/` or commit credential files. The docu pipeline requires `DEEPSEEK_API_KEY`, `GOOGLE_CLOUD_API_KEY`, and `PEXELS_API_KEY`. Research phases also use `EXA_API_KEY` or `SERPER_API_KEY`.
