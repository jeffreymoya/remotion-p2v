# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

`remotion-p2v` is a CLI pipeline that converts a structured script into Remotion video compositions. It uses DeepSeek to generate Remotion prompts, plan and download image assets, and produce `.tsx` composition files that can be previewed in Remotion Studio or rendered to video.

## Commands

```sh
npm run dev -- 0              # Run full pipeline for segment 0 (prompt → images → code)
npm run dev -- 0 --from=code  # Resume from code phase only
npm run dev -- 0 --only=images # Run only the image-fetch phase
npm run images                # Alias for --only=images on segment 0
npm run code                  # Alias for --only=code on segment 0
npm run recode                # Delete all generated compositions and re-run code phase
npm run studio                # Open Remotion Studio to preview compositions
npm run build -- <id> out.mp4 # Render a composition
npm run typecheck             # Run tsc --noEmit
```

Smoke tests (no DeepSeek calls, safe to run any time):
```sh
npm run smoke:images          # Test image download flow
npm run smoke:image-parser    # Test JSON parser for image plan responses
npm run smoke:cutout          # Test cutout pipeline
npm run smoke:fake-transparency # Test fake-transparency detection
```

Image cutout scripts:
```sh
npm run cutout:images                   # Run cutout on public/images/
npm run recut:sticker-smooth-hard       # Cutout with white outline, smooth alpha, hard edges
```

## Pipeline Architecture

The CLI (`src/cli.ts`) processes one script segment at a time and runs three sequential phases:

1. **prompt** – Calls DeepSeek with `buildPrompt()` + exemplars to produce a natural-language Remotion composition description. Saved to `prompts/<slug>.txt`.
2. **images** – Calls DeepSeek with `buildImageFetchPrompt()` to produce a JSON asset manifest. Downloads each asset via DuckDuckGo image search (with a hint URL when available). Saved/updated at `prompts/<slug>-images.json`.
3. **code** – Calls DeepSeek with `buildCompositionPrompt()` (attaching the resolved asset manifest). Writes the generated `.tsx` to `src/compositions/` and regenerates the barrel export `src/compositions/index.ts`.

Each phase can be skipped or isolated with `--from=<phase>` or `--only=<phase>`. Cached artifacts from earlier phases are loaded automatically when a later phase is run in isolation.

## Key Files

| File | Purpose |
|---|---|
| `src/cli.ts` | Entry point — parses args, drives the three-phase pipeline |
| `src/lib/config.ts` | All tunable constants: model name, temperatures, reasoning config, directories |
| `src/lib/deepseek.ts` | Thin fetch wrapper for DeepSeek chat completions (streaming + non-streaming) |
| `src/lib/parse-script.ts` | Parses `script.txt` into `Segment[]` objects (timestamp + narrative) |
| `src/lib/build-prompt.ts` | Builds the system/user prompt for Phase 1 (Remotion prompt generation) |
| `src/lib/build-image-fetch-prompt.ts` | Builds prompt + response parser for Phase 2; defines `ImageFetchItem` type |
| `src/lib/download-images.ts` | Downloads images via hint URL or DuckDuckGo; validates magic bytes and fake-transparency |
| `src/lib/build-composition-prompt.ts` | Builds prompt for Phase 3 (code generation), injects asset manifest |
| `src/lib/write-composition.ts` | Validates, strips markdown fences, writes `.tsx`, regenerates barrel export |
| `src/Root.tsx` | Remotion root — registers all compositions from barrel into a `Generated` folder |
| `src/compositions/index.ts` | Auto-generated barrel; do not edit by hand |

## script.txt Format

The pipeline reads `script.txt` from the project root. Segments are delimited by timestamp lines:

```
**[0:00 - 0:30]** Optional segment title
Narrative text for this segment...

**[0:30 - 1:00]** Next segment
...
```

## Generated Compositions

All generated `.tsx` files are written with `// @ts-nocheck` at the top (the generator may produce non-type-safe code). The barrel export (`src/compositions/index.ts`) is regenerated after every code phase run.

## Environment

Requires `DEEPSEEK_API_KEY` in `.env` (loaded via `process.loadEnvFile()`).

A local Python `.venv` with Pillow is used by `download-images.ts` for fake-transparency detection on PNG assets. If `.venv/bin/python` is not found, the check is skipped (no hard failure).

## Skill Family

Use `adhoc-implementer` for planning and implementation work in this project (not `sp-*` or `agile-*`).
