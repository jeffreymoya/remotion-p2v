# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript Remotion project centered on the inspire longform pipeline. Core runtime code lives in `src/`: `src/Root.tsx` registers Remotion compositions, `src/components/` contains the active video composition and caption components, and `src/lib/inspire/` contains the narration, TTS, video-planning, download, art-direction, and longform orchestration logic.

Operational scripts live in `scripts/`. Generated pipeline artifacts are written under `prompts/inspire/`, `public/audio/inspire/`, `public/videos/inspire/`, and `src/generated/`. Treat `prompts/`, `public/`, `.tmp/`, `.env`, and `credentials.json` as local/generated or sensitive unless intentionally preparing sample assets.

## Build, Test, and Development Commands

- `npm run inspire -- "topic"`: run the longform inspire pipeline for a topic.
- `npm run inspire -- "topic" --from=tts`: resume from a later inspire phase.
- `npm run studio`: open Remotion Studio for previewing generated compositions.
- `npm run build -- <composition-id> out/video.mp4`: render a composition.
- `npm run typecheck`: run TypeScript checks with `tsc --noEmit`.
- `npm run smoke:inspire-segmenter`: run the sentence segmentation smoke test.

## Pipeline Overview

The active pipeline is topic-driven, not `script.txt`-driven:

1. Generate a longform narration plan split into segments.
2. For each segment, generate TTS audio and word timings.
3. Produce a clip plan, download stock video clips, and generate art direction.
4. Write segment JSON artifacts and a combined longform `InspirationScript`.
5. Regenerate `src/generated/inspire-scripts.ts` so `src/Root.tsx` can register the composition.

## Coding Style & Naming Conventions

Use strict TypeScript, ES modules, React JSX, and the `@/*` alias for `src/*` imports when helpful. Match the existing style: two-space indentation, double quotes, semicolons, explicit return types on exported or non-trivial functions, and `type` imports for type-only symbols. Name files with kebab-case and React components with PascalCase.

## Testing Guidelines

There is no full unit-test suite yet; use `npm run typecheck` plus the relevant smoke script for changed behavior. Add new smoke scripts under `scripts/` using the `*-smoke.ts` naming pattern when testing pipeline behavior without introducing a formal test harness. For composition changes, preview with `npm run studio` and render a short output when practical.

## Security & Configuration Tips

Keep API keys and local credentials in `.env` or `credentials.json`; never hardcode secrets in `src/` or commit credential files. The current pipeline may require `DEEPSEEK_API_KEY`, `GOOGLE_CLOUD_API_KEY`, `PIXABAY_API_KEY`, and `PEXELS_API_KEY` depending on which inspire phases you run.
