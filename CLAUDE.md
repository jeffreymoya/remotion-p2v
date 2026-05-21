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
| `src/lib/inspire/narration-archetypes.ts` | Topic-adaptive archetype registry (`essayist-with-sources`, `storytelling-arc`, `analytical-argument`, `personal-meditation`) with per-chapter-role guidance |
| `src/lib/inspire/video-query-prompt.ts` | Produces clip plans from narration/timings |
| `src/lib/inspire/image-query-prompt.ts` | Produces still-image search queries for Pexels (fallback when video unavailable) |
| `src/lib/inspire/pixabay-video-client.ts` | Searches and downloads stock video clips from Pixabay |
| `src/lib/inspire/pexels-video-client.ts` | Searches and downloads stock video clips from Pexels |
| `src/lib/inspire/pexels-image-client.ts` | Searches and downloads landscape still images from Pexels |
| `src/lib/inspire/vision-screener.ts` | Google Vision API batch screener — rejects CGI/rendered/sci-fi thumbnails before download |
| `src/lib/inspire/tts-pause-injector.ts` | Converts narration paragraph breaks and em-dashes into text-level pause signals for Google Chirp 3 HD |
| `src/lib/inspire/art-direction-prompt.ts` | Produces caption and clip direction metadata |
| `src/lib/inspire/write-inspire-script.ts` | Validates script JSON and regenerates `src/generated/inspire-scripts.ts` |
| `src/lib/inspire/inspire-schema.ts` | Zod schema for the active `InspirationScript` format |
| `src/lib/inspire/sentence-segmenter.ts` | Segments narration text into sentence timings aligned to word timings |
| `src/lib/inspire/gates/deterministic/` | Deterministic quality gates (genre tells, prosody marks, specificity, sermon ratio, paradigm-challenge opener, abstract pivot closer, staccato runs, etc.) |
| `src/lib/inspire/proofread/` | Cross-chapter proofread gates (seed payoff, through line, escalation, opener diversity, citation fidelity, internal consistency) |
| `src/lib/inspire/refine/` | Chapter revision: revise-chapter prompt + text metrics |
| `src/lib/inspire/research/` | Research pipeline: Exa/Serper search, anchor verifier, corpus builder, topical queries |
| `src/components/InspirationComposition.tsx` | Active Remotion composition renderer |
| `src/components/KineticCaption.tsx` | Active caption renderer |
| `src/components/captions/chunk-display-group.ts` | Splits long caption display groups into ≤10-word chunks with punctuation-snapped boundaries |
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
| Segment still images | `public/images/inspire/<slug>-seg-XX/` |
| Final inspire script JSON | `prompts/inspire/<slug>.json` |
| Generated registry module | `src/generated/inspire-scripts.ts` |

## Environment

Depending on phase, the pipeline may require:

- `DEEPSEEK_API_KEY`
- `GOOGLE_CLOUD_API_KEY` — Google TTS (Chirp 3 HD) and Google Vision API
- `PIXABAY_API_KEY`
- `PEXELS_API_KEY` — video and still-image search
- `ELEVENLABS_API_KEY` — optional alternative TTS provider (set `TTS_PROVIDER=elevenlabs`)
- `ELEVENLABS_MODEL_ID` — override ElevenLabs model (default: `eleven_multilingual_v2`)
- `EXA_API_KEY` — Exa research provider (used in research phase)
- `SERPER_API_KEY` — Serper/Google search fallback for research
- `LANGSMITH_API_KEY` — LangSmith API key for trace ingestion
- `LANGSMITH_PROJECT` — LangSmith project name (default: `remotion-p2v`)
- `LANGSMITH_TRACING` — set to `false` to disable tracing (enabled by default)

`sox` must also be available for the longform audio combine/postprocess path.

## Quality Gates

The pipeline applies two layers of gates on generated narration:

**Deterministic per-chapter gates** (`src/lib/inspire/gates/deterministic/`):
- `genre-tells-gate` — aggregates paradigm-challenge opener, abstract-pivot closer, contrastive-reveal, literalness-assertion, meta-narration, staccato-runs, sermon-ratio
- `prosody-marks-gate` — checks for missing or over-used pause/stress markers
- `specificity-gate` — flags under-anchored abstractions
- `simplicity-gate` — detects oversimplified cause-and-effect claims

**Cross-chapter proofread gates** (`src/lib/inspire/proofread/`):
- `seed-payoff-gate` — verifies chapter-1 seeds resolve before the final chapter
- `through-line-gate` — checks narrative coherence across all chapters
- `escalation-gate` — validates emotional intensity arc
- `opener-diversity-gate` — prevents repetitive opener patterns
- `citation-fidelity-gate` — checks cited claims against research anchors
- `internal-consistency-gate` — detects contradictions across chapters

## TTS Providers

Set `TTS_PROVIDER` env var to switch providers:
- `google` (default) — Google Chirp 3 HD; pause signals injected via `tts-pause-injector.ts`
- `elevenlabs` — ElevenLabs multilingual v2; requires `ELEVENLABS_API_KEY`

## Narration Archetypes

The planner selects one archetype per topic (stored on `LongformPlan`). The four archetypes in `narration-archetypes.ts` are:
- `essayist-with-sources` — misconception → source-backed reframe (default)
- `storytelling-arc` — character journey with scene-first openers
- `analytical-argument` — problem → cause → mechanism → solution
- `personal-meditation` — quiet observational register for grief/meaning/loss

Per-chapter-role guidance (`open`, `build`, `complicate`, `turn`, `land`) is injected into chapter draft prompts at generation time.

## Notes

- The repository no longer contains the legacy scene-manifest / scene-block JSON pipeline.
- When updating runtime behavior, prioritize the inspire schema, pipeline, and `InspirationComposition` over removed historical paths.
- Vision screening (Google Vision API) runs before video download to reject CGI/sci-fi/rendered thumbnails.
- Still images (Pexels) serve as fallback when no suitable video clip is found for a slot.
