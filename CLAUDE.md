# CLAUDE.md

This file provides guidance to coding agents working in this repository.

## What This Project Does

`remotion-p2v` currently uses an inspire-style longform video pipeline. Given a topic, the pipeline generates multi-segment narration, synthesizes TTS, plans and downloads stock video clips, applies art direction, combines the segments into an `InspirationScript`, and renders that script through Remotion.

The active runtime is composition-driven through `InspirationComposition`, not the removed legacy scene/block JSON pipeline.

## Commands

```sh
npm run inspire -- "the power of showing up every day"
npm run inspire -- "the power of showing up every day" --from=tts
npm run inspire -- "the power of showing up every day" --from=videos
npm run studio
npm run build -- <composition-id> out.mp4
npm run typecheck
npm run smoke:inspire-segmenter
```

## Active Architecture

The longform pipeline is orchestrated by `scripts/inspire.ts` and `src/lib/inspire/longform-pipeline.ts`.

High-level flow:

1. Generate a longform narration plan for the requested topic.
2. Seed per-segment narration text files.
3. For each segment, run the inspire pipeline phases: `tts`, `videos`, `artdirect`, `compose`.
4. Combine segment outputs into a single top-level `InspirationScript`.
5. Regenerate `src/generated/inspire-scripts.ts`.
6. `src/Root.tsx` registers each generated inspire script as a Remotion composition.

## Key Files

| File | Purpose |
|---|---|
| `scripts/inspire.ts` | CLI entrypoint for the longform inspire pipeline |
| `src/lib/inspire/longform-pipeline.ts` | Orchestrates topic-to-longform generation and segment combination |
| `src/lib/inspire/inspire-pipeline.ts` | Runs per-segment phases: narration cache, TTS, video acquisition, art direction, compose |
| `src/lib/inspire/longform-narration-prompt.ts` | Generates the longform multi-segment narration plan |
| `src/lib/inspire/video-query-prompt.ts` | Produces clip plans from narration/timings |
| `src/lib/inspire/pixabay-video-client.ts` | Searches and downloads stock video clips from Pixabay |
| `src/lib/inspire/pexels-video-client.ts` | Searches and downloads stock video clips from Pexels |
| `src/lib/inspire/art-direction-prompt.ts` | Produces caption and clip direction metadata |
| `src/lib/inspire/write-inspire-script.ts` | Validates script JSON and regenerates `src/generated/inspire-scripts.ts` |
| `src/lib/inspire/inspire-schema.ts` | Zod schema for the active `InspirationScript` format |
| `src/components/InspirationComposition.tsx` | Active Remotion composition renderer |
| `src/components/KineticCaption.tsx` | Active caption renderer |
| `src/generated/inspire-scripts.ts` | Auto-generated composition registry consumed by `Root.tsx` |
| `src/Root.tsx` | Remotion root that registers inspire compositions |

## Generated Artifacts

The current pipeline writes artifacts like these:

| Artifact | Path |
|---|---|
| Longform narration plan | `prompts/inspire/<slug>-longform.json` |
| Segment narration | `prompts/inspire/<slug>-seg-XX-narration.txt` |
| Segment word timings | `prompts/inspire/<slug>-seg-XX-timings.json` |
| Segment clip plan | `prompts/inspire/<slug>-seg-XX-clip-plan.json` |
| Segment art direction | `prompts/inspire/<slug>-seg-XX-artdirection.json` |
| Segment audio | `public/audio/inspire/<slug>-seg-XX.wav` |
| Segment videos | `public/videos/inspire/<slug>-seg-XX/` |
| Final inspire script JSON | `prompts/inspire/<slug>.json` |
| Generated registry module | `src/generated/inspire-scripts.ts` |

## Environment

Depending on phase, the pipeline may require:

- `DEEPSEEK_API_KEY`
- `GOOGLE_CLOUD_API_KEY`
- `PIXABAY_API_KEY`
- `PEXELS_API_KEY`
- `LANGSMITH_API_KEY` — LangSmith API key for trace ingestion
- `LANGSMITH_PROJECT` — LangSmith project name (default: `remotion-p2v`)
- `LANGSMITH_TRACING` — set to `false` to disable tracing (enabled by default)

`sox` must also be available for the longform audio combine/postprocess path.

## Notes

- The repository no longer contains the legacy scene-manifest / scene-block JSON pipeline.
- When updating runtime behavior, prioritize the inspire schema, pipeline, and `InspirationComposition` over removed historical paths.
