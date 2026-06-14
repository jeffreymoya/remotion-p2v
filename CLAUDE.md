# CLAUDE.md

## Direction

`remotion-p2v` is building **Bloomberg-style fast-paced documentary/informational videos** targeting high-RPM YouTube niches. The inspirational long-form pipeline is being replaced.

**Why:** Inspirational content yields $1–4 CPM. The target niches (Personal Finance, SaaS, Entrepreneurship, Legal/Real Estate, Digital Marketing) yield $15–50+ CPM because advertisers pay a premium to reach audiences making high-value financial decisions. Reference: `~/dev/_sidecar/remotion-p2v/docs/top-earning-niches-youtube.md`.

**Visual reference:** Bloomberg Originals style — fast cuts (2–4 sec shots), kinetic number/headline overlays, two-world color grading, commanding dry narration voice, no word-synced captions. Reference: `~/dev/_sidecar/remotion-p2v/docs/bloomberg-style-video-editing.md`.

**Topic constraint:** Only produce videos on the five high-RPM niches above. Reject off-niche topics.

---

## North Star: Data-Driven Rendering

Every visual element that appears on screen must be traceable to a research artifact — not generated from narration text alone. This applies equally to citations, excerpts, and **metrics**.

The rendering pipeline is structured around three overlay types, all following the same data-contract pattern:

| Overlay | Data type | Source |
|---|---|---|
| `headline-card` | Citation excerpt + source attribution | Research anchor (claim) |
| `kinetic-number` | Single scalar + unit | Research anchor (fact) |
| `chart` | `DataItem` — time-series / comparison / composition | Research anchor (numeric dataset) |

Each type carries a `source` field traceable back to a research anchor. **The citation-fidelity gate must cover metrics, not just prose claims.** Wrong numbers in finance/legal content are a credibility and legal risk — they are higher priority than wrong adjectives.

The LLM's role is placement and framing, not data fabrication. The research pipeline extracts the numbers; the LLM decides which sentence to anchor them to and how to label them.

---

## North Star: Viewer-Value Priority

Every on-screen fact earns its place by what it changes for the viewer. Among admissible (verified or needs-review) anchors, selection priority is:

1. **Personal impact** — numbers or events that directly touch the viewer's money, rate, bill, risk, or outcome
2. **Actionable opportunity** — knowledge the viewer can act on: what to watch, when to move, what to demand
3. **Foundational understanding** — mechanics and context that make the above legible

Historical or background facts are admissible only in direct service of a present-tense stake. They do not count toward data-density requirements on their own.

**Fidelity decides admissibility. Viewer-value decides priority among the admissible.** These axes are not in conflict — one is a gate, the other is a ranking. "Maximize viewer interest" is never license to promote a dramatic but poorly-sourced anchor over a verified one.

This principle applies at every pipeline stage that selects, filters, or assigns anchors: corpus query design, brainstorm generation, verifier acceptance, and spine anchor assignment. If an anchor cannot be connected to a present-tense viewer stake, it should not be assigned to a segment even if technically verified.

---

## Current State — `feat/rpm-optimized`

The full 9-phase LLM-driven pipeline is implemented end-to-end. The rendering layer is built, quality gates are active, and the pipeline accepts any topic in the five allowed niches.

**Pipeline (9 phases):** `variety → plan → narration → overlays → youtube → tts → images → codegen → publish-manifest`

All phases defined as data in `src/lib/docu/pipeline.ts`; `--from`/`--only`/`--clean` CLI flags derive from the phase graph. The LLM executor (`topic-generator.ts`) owns `plan`/`narration`/`overlays`/`youtube`; the IO pipeline owns `tts`/`images`/`codegen`/`publish-manifest`.

**Default LLM provider:** Grok (via `src/lib/llm-provider.ts`). DeepSeek is also registered; switch with `LLM_DEFAULT_PROVIDER` in `config.ts`.

**What's built:**

| File | Purpose |
|---|---|
| `src/components/docu/DocumentaryComposition.tsx` | Main composition — 60-shot B-roll, two-world palette, overlay blur, narration audio |
| `src/components/docu/overlays/` | Overlay render registry + per-type renderers (HeadlineCard, KineticNumber, DocuChart, CitationChyron, etc.) |
| `src/components/docu/docu-tokens.ts` | Color palette, OVERLAY_TEXT_PALETTE, chart color ramps, HaTTab LUT, typography tokens |
| `src/components/docu/DocumentaryCaption.tsx` | Word-synced captions — built but not rendered; kept for social/accessibility cuts |
| `src/components/docu/RadialChart.tsx` | Radial progress gauge — chart render style dispatched via DocuChart |
| `src/lib/docu/pipeline.ts` | 9-phase PIPELINE descriptor (single source of truth for CLI flag validation, clean cascade) |
| `src/lib/docu/topic-generator.ts` | LLM executor: research → segmented narration + overlays → 4 inline gates |
| `src/lib/docu/variety-controller.ts` | Arc-axis variety assignment (per-topic structure + pacing rotation) |
| `src/lib/docu/youtube-pipeline.ts` | YouTube interview clip extraction (yt-dlp) with attribution gate |
| `src/lib/docu/publish-manifest.ts` | Final-phase provenance + readiness aggregation; feeds upload/SEO metadata |
| `src/lib/docu/story-structure-gate.ts` | Story arc validation (spine segments, variety constraint, structural coverage) |
| `src/lib/docu/infotainment-voice-gate.ts` | Voice/persona audit (Bloomberg-dry, fact-first, avoidance of hype/inspirational tone) |
| `src/lib/docu/narration-fidelity-gate.ts` | Citation-fidelity gate: verifies every narration sentence against verified research anchors |
| `src/lib/docu/metric-extraction-prompt.ts` | Extracts `DataItem[]` from anchors with citation-fidelity and metric-fidelity verification |
| `src/lib/shared/numeric-normalize.ts` | Deterministic metric-fidelity core: normalizes and compares numeric values in anchor text |
| `src/lib/docu/tts-pipeline.ts` | Per-sentence TTS pipeline with audition support |
| `src/lib/docu/image-pipeline.ts` | Pexels image download pipeline |
| `src/lib/docu/script-codegen.ts` | Auto-generates `src/generated/docu-scripts.ts` from built DocuScripts |
| `src/lib/docu/overlay-resolver.ts` | Anchors overlay specs to word-timing frames |
| `src/lib/docu/overlays/` (lib) | Overlay types, schemas, chart/data populator, animation presets |
| `src/lib/inspire/audio-postprocess.ts` | `commandingVoice()` — broadcast chain (highpass, presence boost, compression) |
| `src/generated/docu-scripts.ts` | Auto-generated script registry |
| `scripts/docu.ts` | CLI orchestrator — dispatches the 9-phase pipeline |
| `scripts/docu-channel-audit.ts` | Channel-level variety audit (quota rotation health check) |

**Commands:**

```sh
npm run docu "<topic>"                                     # full 9-phase pipeline
npm run docu "<topic>" --only overlays                     # stop after overlays phase
npm run docu "<topic>" --from tts                          # resume from TTS
npm run docu "<topic>" --clean                              # clean artifacts then run
npm run docu "<topic>" --allow-youtube-clips                # enable YouTube clip extraction
npm run docu "<topic>" --publish                            # run through publish-manifest
npm run docu "<topic>" --variety <arc>                      # pin variety arc (or "off" for baseline)
npm run docu:audition                                       # TTS audition only (Charon / Fenrir / Oberon 30s clips)
npm run docu:channel-audit                                  # channel-level variety health check
npm run docu:export-description                             # export YouTube descriptions
npm run docu:ai-disclosure                                  # generate AI disclosure text
npm run docu:metadata-gate                                  # validate metadata against platform policies
npm run studio                                              # open Remotion Studio
npm run typecheck
```

---

## Pipeline Execution

### 9-Phase Pipeline ✅ IMPLEMENTED

All 9 phases are defined as data in `src/lib/docu/pipeline.ts` and orchestrated by `scripts/docu.ts`:

| Phase | Group | Description |
|---|---|---|
| `variety` | LLM | Arc-axis variety assignment (per-topic structure + pacing rotation) |
| `plan` | LLM | Research + corpus query + topic data generation |
| `narration` | LLM | Segmented narration generation (Bloomberg-density, citation-anchored) |
| `overlays` | LLM | Overlay spec generation (HeadlineCard, KineticNumber, chart, citation) |
| `youtube` | LLM | YouTube interview clip extraction (yt-dlp) with attribution gate |
| `tts` | IO | Per-sentence TTS synthesis + word timings |
| `images` | IO | Pexels stock image download |
| `codegen` | IO | Auto-generate `src/generated/docu-scripts.ts` |
| `publish-manifest` | IO | Provenance + readiness aggregation; feeds upload/SEO metadata |

### Quality Gates ✅ IMPLEMENTED

- **Citation-fidelity gate** — verifies every narration sentence against verified research anchors (`narration-fidelity-gate.ts`)
- **Metric-fidelity gate** — verifies each `DataItem` value against its `source` anchor; rejects untraceable metrics (`metric-extraction-prompt.ts` + `numeric-normalize.ts`)
- **Story-structure gate** — validates spine segments, variety constraint, structural coverage (`story-structure-gate.ts`)
- **Infotainment-voice gate** — audits voice/persona (Bloomberg-dry, fact-first, no hype) (`infotainment-voice-gate.ts`)
- **Niche allowlist gate** — rejects topics outside the five allowed niches (token-based matching in `scripts/docu.ts`)

### Pending

- **Data-density gate** — minimum N cited facts per minute (not yet implemented)
- **LLM-based semantic niche gate** — upgrade allowlist from token matching to LLM classification
- **Inspire pipeline cleanup** — delete legacy inspire pipeline after 3+ validated docu videos

---

## `DocuScript` Data Contract

```typescript
// ── DataItem (extracted from research anchors) ───────────────────────────

type DataItem =
  | { id: string; kind: "scalar"; value: number; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "timeseries"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "comparison"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "composition"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string };

// ── OverlaySpec (what the LLM pipeline emits) ────────────────────────────

type OverlaySpec = z.infer<typeof OverlaySpecSchema>;  // discriminated union on `.type`

interface DocuOverlay extends Omit<OverlaySpec, "anchorPhrase" | "holdSec" | "leadSec"> {
  startFrame: number;
  endFrame: number;
}

// ── DocuScript (the composition's input) ─────────────────────────────────

interface DocuScript {
  slug: string;
  topic: string;
  audioPath?: string;             // public/audio/docu/<slug>.wav
  backgroundMusicPath?: string;
  wordTimings: WordTiming[];      // from TTS
  sentences: DocuSentence[];      // ~20 Bloomberg-density sentences
  clips: DocuClip[];              // groups ~60 shots
  overlays: DocuOverlay[];        // HeadlineCard + KineticNumber + chart placements
  segments?: DocuSegmentMeta[];   // only for multi-segment long-form
  durationInFrames: number;       // derived from real TTS duration × 30
  fps: 30; width: 1920; height: 1080;
}
```

Shots and sentences are **decoupled**: B-roll cuts every 2–4 sec independently of sentence boundaries. Sentences average 6–9 sec and span multiple shots.

**Chart rendering approach:**
- Six render styles (`timeseries`, `comparison`, `composition`, `horizontal-bar`, `area`, `radial`) dispatch through `CHART_REGISTRY` in `src/components/docu/DocuChart.tsx`, all hand-coded raw SVG. Render style is decoupled from data shape via `CHART_KIND_CONSUMES` (`overlays/chart.ts`): each style consumes one of the three chartable `DataItemKind`s (`timeseries`/`comparison`/`composition`), so every renderable chart traces to a research anchor and is metric-fidelity-gated.
- `ResponsiveContainer` is forbidden in Remotion (ResizeObserver is flaky in headless Chrome).
- Neither `roughjs` nor Recharts is currently used for charts. Future sketch-style reveals would need `@remotion/paths` (already a dep) for animated `stroke-dashoffset`. `roughjs` (already a dep) could be layered on for rough-style line art but is not wired today.

---

## Visual System

**Two-world color palette (per-shot, not per-clip):**
- `cool-tech` — desaturated, high-contrast, teal-shifted. Use for: data, markets, algorithms, institutions
- `warm-real` — amber warmth, natural saturation. Use for: human impact, housing, people, consequences

**Overlay blur:** when any overlay is active, the media layer blurs to 10px (6-frame ease-in/out). Overlays render unblurred on top.

**No word-synced captions.** `DocumentaryCaption.tsx` is wired but not rendered.

---

## Audio

- Voice: `DOCU_TTS_VOICE` env var (default `en-US-Chirp3-HD-Charon`) — audition Charon / Fenrir / Oberon before committing
- Speaking rate: `1.0` (Bloomberg pace — not slowed)
- Post-process: `commandingVoice()` in `src/lib/inspire/audio-postprocess.ts` — highpass 80Hz, 3kHz presence boost, broadcast compression, no reverb
- Background music: volume `0.08`

---

## Generated Artifacts

| Artifact | Path |
|---|---|
| Script JSON | `prompts/docu/<slug>.json` |
| Word timings | `prompts/docu/<slug>-timings.json` |
| Image manifest | `prompts/docu/<slug>-images.json` |
| Narration audio | `public/audio/docu/<slug>.wav` |
| Stock images | `public/images/docu/<slug>/img-NN.jpg` |
| Script registry | `src/generated/docu-scripts.ts` |

---

## Environment

| Variable | Required for | Default |
|---|---|---|
| `GROK_API_KEY` | LLM narration + overlay + metric extraction (default provider) | — |
| `DEEPSEEK_API_KEY` | LLM (alternative provider) | — |
| `GOOGLE_CLOUD_API_KEY` | TTS (Chirp 3 HD) + Vision API screener | — |
| `PEXELS_API_KEY` | Stock image/video download | — |
| `EXA_API_KEY` | Research phase | — |
| `SERPER_API_KEY` | Research fallback | — |
| `YOUTUBE_API_KEY` | YouTube clip extraction (yt-dlp) | — |
| `DOCU_TTS_VOICE` | Documentary voice | `en-US-Chirp3-HD-Charon` |
| `PIXABAY_API_KEY` | Stock video (legacy inspire; kept for shared clients) | — |
| `LANGSMITH_API_KEY` | Trace ingestion | — |
| `LANGSMITH_PROJECT` | — | `remotion-p2v` |
| `LANGSMITH_TRACING` | — | `true` |

`sox` must be available for audio post-processing.

`tesseract` (≥4.0) must be available for OCR-based headline bounding-box extraction from T2I article images:

```bash
# Ubuntu / Debian / Linux Mint
sudo apt-get install -y tesseract-ocr
# Verify
tesseract --version
```

The pipeline uses `tesseract <image> stdout --oem 1 --psm 3 tsv` (LSTM engine, automatic page segmentation).

---

## Inspire Pipeline (maintenance-only, pending deletion)

`src/lib/inspire/`, `src/components/InspirationComposition.tsx`, `scripts/inspire.ts`. Do not add features. When building the docu pipeline, reuse shared utilities directly: `pexels-image-client.ts`, `pexels-video-client.ts`, `pixabay-video-client.ts`, `vision-screener.ts`, `sentence-segmenter.ts`, `research/`, `audio-postprocess.ts`.
