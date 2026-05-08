# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript Remotion project that turns prompt/script inputs into video compositions. Core application code lives in `src/`: `src/cli.ts` runs the generation pipeline, `src/lib/` contains prompt, parsing, image, and composition helpers, and `src/Root.tsx` registers Remotion compositions. Generated or hand-maintained compositions live in `src/compositions/`, with `src/compositions/index.ts` as the barrel export.

Operational scripts are in `scripts/`, examples and reference prompts in `examples/`, reusable prompt inputs in `prompts/`, and rendered/downloaded media in `public/images/`. Treat `prompts/`, `public/`, `.tmp/`, `.env`, and `credentials.json` as local/generated or sensitive unless intentionally preparing sample assets.

## Roadmap

Project direction:

- The project is in POC phase and intentionally processes only the first script segment for now, but the intended production direction is to process every script segment.
- The intended architecture is scene-level generation: each segment may contain multiple scenes, and each scene should eventually have its own pipeline for creating a Remotion prompt, downloading/processing images, generating a Remotion composition, and preserving those scene artifacts.
- The final video should be assembled by stitching generated scene compositions/artifacts together rather than relying on one monolithic Remotion prompt/composition for a full segment or whole script.
- A future pipeline addition should introduce TTS and synchronize scene animations/composition timing to the generated narration/audio.

This roadmap was originally captured in the Memory MCP entity `remotion-p2v project direction`, created via `memory.create_entities`. Current MCP storage resolves to `/home/jeffreymoya/.npm/_npx/15b07286cbcc3329/node_modules/@modelcontextprotocol/server-memory/dist/memory.jsonl` because no `MEMORY_FILE_PATH` is configured. Treat that path as an implementation detail of the current `npx` cache; the durable instruction source is this section plus any sidecar docs under `/home/jeffreymoya/dev/_sidecar/remotion-p2v/`.

## Build, Test, and Development Commands

- `npm run dev -- 0`: run the CLI for segment `0` from `script.txt`.
- `npm run images`: run only the image-fetch phase for segment `0`.
- `npm run studio`: open Remotion Studio for previewing compositions.
- `npm run build -- <composition-id> out/video.mp4`: render a composition with Remotion.
- `npm run typecheck`: run TypeScript checks with `tsc --noEmit`.
- `npm run smoke:images`, `npm run smoke:image-parser`, `npm run smoke:cutout`, `npm run smoke:fake-transparency`: run focused smoke checks.
- `npm run cutout:images` or `npm run recut:sticker-smooth-hard`: regenerate processed image cutouts.

## Coding Style & Naming Conventions

Use strict TypeScript, ES modules, React JSX, and the `@/*` alias for `src/*` imports when helpful. Match the existing style: two-space indentation, double quotes, semicolons, explicit return types on exported or non-trivial functions, and `type` imports for type-only symbols. Name files with kebab-case (`build-image-fetch-prompt.ts`) and React components with PascalCase.

## Testing Guidelines

There is no full unit-test suite yet; use `npm run typecheck` plus the relevant smoke script for changed behavior. Add new smoke scripts under `scripts/` using the `*-smoke.ts` naming pattern when testing pipeline behavior without introducing a formal test harness. For composition changes, preview with `npm run studio` and render a short output when practical.

## Commit & Pull Request Guidelines

Git history uses short Conventional Commit-style subjects such as `feat: ...`, `fix: ...`, and `chore: ...`. Keep commits scoped and imperative. Pull requests should describe the affected pipeline phase, include commands run, link related issues or notes, and attach screenshots or rendered clips for visible Remotion changes.

## Security & Configuration Tips

Keep API keys and local credentials in `.env` or `credentials.json`; never hardcode secrets in `src/` or commit credential files. Run `npm audit` before publishing or pushing dependency changes.
