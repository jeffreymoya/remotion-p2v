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

## Current State — `feat/rpm-optimized`

Phase 1 is complete. The rendering layer is built and the pipeline is wired end-to-end for one hardcoded topic ("How the Fed Controls Your Money").

**What's built:**

| File | Purpose |
|---|---|
| `src/components/docu/DocumentaryComposition.tsx` | Main composition — 60-shot B-roll, two-world palette, overlay blur, narration audio |
| `src/components/docu/HeadlineCard.tsx` | Lower-third citation/stat card — Inter 900, Bloomberg orange, slide-in animation |
| `src/components/docu/KineticNumber.tsx` | Count-up metric — orange→yellow gradient, snap easing |
| `src/components/docu/ArticleCard.tsx` | Article citation card — 3D parallax, Rough.js highlights, `ArticleData` driven |
| `src/components/docu/docu-tokens.ts` | Color palette, Bloomberg brand constants, easing curves |
| `src/components/docu/DocumentaryCaption.tsx` | Word-synced captions — built but not rendered; kept for social/accessibility cuts |
| `src/lib/inspire/audio-postprocess.ts` | `commandingVoice()` — broadcast chain (highpass, presence boost, compression) |
| `src/generated/docu-scripts.ts` | Auto-generated script registry (same pattern as `inspire-scripts.ts`) |
| `scripts/docu.ts` | CLI orchestrator: TTS → images → shot schedule → overlay resolve → codegen |
| `src/lib/docu/tts-pipeline.ts` | Per-sentence TTS pipeline with audition support |
| `src/lib/docu/image-pipeline.ts` | Pexels image download pipeline |
| `src/lib/docu/script-codegen.ts` | Auto-generates `src/generated/docu-scripts.ts` from built DocuScripts |
| `src/lib/docu/overlay-resolver.ts` | Anchors overlay specs to word-timing frames |
| `src/lib/docu/article-pipeline.ts` | `ArticleData` type + pipeline; pattern for all data-driven overlays |
| `src/lib/docu/topics/` | Per-topic data modules (sentences, overlays, image queries) |

**Commands:**

```sh
npm run docu                        # full pipeline: TTS + images + codegen
npm run docu:audition               # TTS audition only (Charon / Fenrir / Oberon 30s clips)
npm run studio                      # open Remotion Studio
npm run typecheck
```

---

## Post-Spike Pipeline Plan

### Phase 1 — End-to-end on one topic ✅ DONE
- Reusable `src/lib/docu/` module
- Sequential pipeline: TTS → image download → shot schedule → overlay resolve → codegen
- Auto-generated `docu-scripts.ts`

### Phase 2 — LLM narration + metric generation
Goal: `scripts/docu.ts "any topic in the niche list"` generates the 20-sentence script, overlays, and chart data automatically.

- `src/lib/docu/narration-prompt.ts` — Bloomberg-density prompt: 20 sentences, declarative, fact-first, citation-anchored
- `src/lib/docu/overlay-prompt.ts` — LLM assigns HeadlineCard / KineticNumber / chart content + anchor phrases from narration
- **`src/lib/docu/metric-extraction-prompt.ts`** — NEW: extracts `DataItem[]` from research anchors; numeric data with units, source URLs, and dataset labels. LLM places; research provides numbers. Never allow the narration LLM to fabricate metrics.
- Reuse `src/lib/inspire/research/` as-is for the research phase (Exa/Serper, anchor verifier)
- Shot queries generated from narration sentences (adapted from `src/lib/inspire/image-query-prompt.ts`)

### Phase 3 — Quality gates
Goal: catch bad narration and bad metrics before rendering.

- **Citation-fidelity gate** — carry forward from `src/lib/inspire/proofread/citation-fidelity-gate.ts`; verifies cited claims against research anchors
- **Metric-fidelity gate** — NEW (higher priority than citation gate for finance/legal content): verifies each `DataItem` value against its `source` anchor; rejects metrics that can't be traced to a research result
- **Data-density gate** — minimum N cited facts per minute
- **Niche allowlist gate** — reject topics outside the five allowed niches

### Phase 4 — Cleanup
Goal: delete the inspire pipeline after 3+ validated docu videos.

Delete:
- `src/lib/inspire/` — except `research/`, `pexels-image-client.ts`, `pexels-video-client.ts`, `pixabay-video-client.ts`, `vision-screener.ts`, `sentence-segmenter.ts` (reused)
- `src/components/InspirationComposition.tsx`, `src/components/KineticCaption.tsx`
- `src/components/captions/`
- `scripts/inspire.ts`, `src/lib/inspire/longform-pipeline.ts`, `src/lib/inspire/inspire-pipeline.ts`
- All narration archetypes, prosody/genre/escalation/seed-payoff gates

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
- All chart kinds (`timeseries`, `comparison`, `composition`) use hand-coded raw SVG path construction in `src/components/docu/DocuChart.tsx`.
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
| `DEEPSEEK_API_KEY` | LLM narration + overlay + metric extraction | — |
| `GOOGLE_CLOUD_API_KEY` | TTS (Chirp 3 HD) + Vision API screener | — |
| `PEXELS_API_KEY` | Stock image/video download | — |
| `EXA_API_KEY` | Research phase | — |
| `SERPER_API_KEY` | Research fallback | — |
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
