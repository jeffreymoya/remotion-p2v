# CLAUDE.md

## Direction

`remotion-p2v` is building **Bloomberg-style fast-paced documentary/informational videos** targeting high-RPM YouTube niches. The inspirational long-form pipeline is being replaced.

**Why:** Inspirational content yields $1–4 CPM. The target niches (Personal Finance, SaaS, Entrepreneurship, Legal/Real Estate, Digital Marketing) yield $15–50+ CPM because advertisers pay a premium to reach audiences making high-value financial decisions. Reference: `~/dev/_sidecar/remotion-p2v/docs/top-earning-niches-youtube.md`.

**Visual reference:** Bloomberg Originals style — fast cuts (2–4 sec shots), kinetic number/headline overlays, two-world color grading, commanding dry narration voice, no word-synced captions. Reference: `~/dev/_sidecar/remotion-p2v/docs/bloomberg-style-video-editing.md`.

**Topic constraint:** Only produce videos on the five high-RPM niches above. Reject off-niche topics.

---

## Current State — Spike (`feat/rpm-optimized`)

The spike proves the rendering approach before building the automation pipeline. One hardcoded topic ("How the Fed Controls Your Money") runs through the full composition.

**What's built:**

| File | Purpose |
|---|---|
| `src/components/docu/DocumentaryComposition.tsx` | Main composition — 60-shot B-roll, two-world palette, overlay blur, narration audio |
| `src/components/docu/HeadlineCard.tsx` | Lower-third citation/stat card — Inter 900, Bloomberg orange, slide-in animation |
| `src/components/docu/KineticNumber.tsx` | Count-up metric — orange→yellow gradient, snap easing |
| `src/components/docu/docu-tokens.ts` | Color palette, Bloomberg brand constants, easing curves |
| `src/components/docu/DocumentaryCaption.tsx` | Word-synced captions — built but not rendered; kept for future social/accessibility cuts |
| `src/lib/inspire/audio-postprocess.ts` | `commandingVoice()` added — broadcast chain (presence boost, compression, dry) |
| `src/generated/docu-scripts.ts` | Hardcoded spike registry; replaced by auto-generated output post-spike |
| `scripts/docu.ts` | CLI orchestrator: runs TTS, images, shot scheduling, codegen for a topic |
| `src/lib/docu/tts-pipeline.ts` | Per-sentence TTS pipeline with audition support |
| `src/lib/docu/image-pipeline.ts` | Pexels image download pipeline |
| `src/lib/docu/script-codegen.ts` | Auto-generates `src/generated/docu-scripts.ts` from built DocuScripts |
| `src/lib/docu/topics/` | Per-topic data modules (sentences, overlays, image queries) |

**Spike validation criteria (what "done" means):**
- [ ] 60 stock images downloaded, composition renders 3-minute video without blank frames
- [ ] Real TTS audio (not stubs) plays in sync with shot timing
- [ ] HeadlineCard and KineticNumber overlays appear at correct moments with blur behind them
- [ ] Two-world color palette (cool-tech / warm-real) switches are visually distinct on hard cuts
- [ ] Voice sounds commanding and clear at `speakingRate: 1.0`
- [ ] No captions rendered; kinetic overlays carry all on-screen text

**Commands:**

```sh
npm run docu                        # full pipeline: TTS + images + codegen
npm run docu:audition               # TTS audition only (Charon / Fenrir / Oberon 30s clips)
npm run studio                      # open Remotion Studio — select docu-how-the-fed-controls-your-money
npm run typecheck
```

---

## Post-Spike Pipeline Plan

After the spike validates the rendering layer, build the automated end-to-end pipeline in this order:

### Phase 1 — End-to-end on one topic (no LLM narration yet) ✅ DONE
Goal: run `scripts/docu.ts how-the-fed-controls-your-money` and get a rendered MP4 without touching the hardcoded JSON.

- ✅ Moved TTS + image download logic from one-off scripts into a reusable `src/lib/docu/` module
- ✅ Wired phases sequentially: TTS → image download → shot schedule → overlay resolve → codegen
- ✅ `docu-scripts.ts` is auto-generated (same pattern as `inspire-scripts.ts`)
- Validate: rendered video is indistinguishable from the hand-authored spike

### Phase 2 — LLM narration generation
Goal: `scripts/docu.ts "any topic in the niche list"` generates the 20-sentence script automatically.

- New `src/lib/docu/narration-prompt.ts` — Bloomberg-density prompt: 20 sentences, declarative, fact-first, citation-anchored
- New `src/lib/docu/overlay-prompt.ts` — LLM assigns HeadlineCard/KineticNumber content + frame timing from the narration
- Reuse `src/lib/inspire/research/` as-is for the research phase (Exa/Serper, anchor verifier)
- Shot queries generated from narration sentences (adapted from `src/lib/inspire/image-query-prompt.ts`)

### Phase 3 — Quality gates
Goal: catch bad narration before rendering.

- **Citation-fidelity gate** — carry forward from `src/lib/inspire/proofread/citation-fidelity-gate.ts`; verifies cited claims against research anchors (most critical for finance/legal)
- **Data-density gate** — new; minimum N cited facts per minute
- **Niche allowlist gate** — new; reject topics outside the five allowed niches

### Phase 4 — Cleanup
Goal: delete the inspire pipeline once the docu pipeline produces 3+ validated videos across different niche topics.

Delete:
- `src/lib/inspire/` — except `research/`, `pexels-image-client.ts`, `pexels-video-client.ts`, `pixabay-video-client.ts`, `vision-screener.ts`, `sentence-segmenter.ts` (these are reused)
- `src/components/InspirationComposition.tsx`, `src/components/KineticCaption.tsx`
- `src/components/captions/`
- `scripts/inspire.ts`, `src/lib/inspire/longform-pipeline.ts`, `src/lib/inspire/inspire-pipeline.ts`
- All narration archetypes, prosody/genre/escalation/seed-payoff gates

---

## `DocuScript` Data Contract

```typescript
interface DocuScript {
  slug: string;
  topic: string;
  audioPath?: string;             // public/audio/docu/<slug>.wav
  backgroundMusicPath?: string;
  wordTimings: WordTiming[];      // from TTS
  sentences: DocuSentence[];      // 20 Bloomberg-density sentences
  clips: DocuClip[];              // groups ~60 shots
  overlays: DocuOverlay[];        // HeadlineCard + KineticNumber placements
  durationInFrames: number;       // derived from real TTS duration × 30
  fps: 30; width: 1920; height: 1080;
}
```

Shots and sentences are **decoupled**: B-roll cuts every 2–4 sec independently of sentence boundaries. Sentences average 6–9 sec and span multiple shots.

---

## Visual System

**Two-world color palette (per-shot, not per-clip):**
- `cool-tech` — desaturated, high-contrast, teal-shifted. Use for: data, markets, algorithms, institutions
- `warm-real` — amber warmth, natural saturation. Use for: human impact, housing, people, consequences

**Overlay blur:** when any HeadlineCard or KineticNumber is active, the media layer blurs to 10px (6-frame ease-in/out). Captions and overlays render unblurred on top.

**No word-synced captions.** `DocumentaryCaption.tsx` is wired but not rendered.

---

## Audio

- Voice: `DOCU_TTS_VOICE` env var (default `en-US-Chirp3-HD-Charon`) — audition Charon / Fenrir / Oberon before committing
- Speaking rate: `1.0` (Bloomberg pace — not slowed)
- Post-process: `commandingVoice()` in `src/lib/inspire/audio-postprocess.ts` — highpass 80Hz, 3kHz presence boost, broadcast compression, no reverb
- Background music: volume `0.08` (narration now present; down from 0.12 in spike)

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
| `DEEPSEEK_API_KEY` | LLM narration + overlay generation | — |
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
# macOS
brew install tesseract

# Ubuntu / Debian / Linux Mint
sudo apt-get install -y tesseract-ocr

# Verify
tesseract --version
```

The pipeline uses `tesseract <image> stdout --oem 1 --psm 3 tsv` (LSTM engine, automatic page segmentation).

---

## Inspire Pipeline (maintenance-only, pending deletion)

`src/lib/inspire/`, `src/components/InspirationComposition.tsx`, `scripts/inspire.ts`. Do not add features. When building the docu pipeline, reuse shared utilities directly rather than duplicating: `pexels-image-client.ts`, `pexels-video-client.ts`, `pixabay-video-client.ts`, `vision-screener.ts`, `sentence-segmenter.ts`, `research/`, `audio-postprocess.ts`.
