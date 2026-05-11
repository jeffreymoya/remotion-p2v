# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

`remotion-p2v` is a CLI pipeline that converts a structured script into Remotion video compositions. It uses DeepSeek to generate Remotion prompts, plan and download image assets, produce a validated JSON scene script, and render it via a custom component library in Remotion Studio or as a rendered video.

The pipeline is **JSON-driven**: instead of generating raw `.tsx` files, the LLM now generates a structured `*-scene.json` file that maps blocks to a catalog of reusable Remotion components. The root composition reads this JSON at runtime and renders dynamically via `SceneRenderer`.

## Commands

```sh
npm run dev -- 0              # Run full pipeline for segment 0 (images → scene JSON)
npm run dev -- 0 --from=code  # Resume from code phase only
npm run dev -- 0 --only=images # Run only the image-fetch phase
npm run images                # Alias for --only=images on segment 0
npm run code                  # Alias for --only=code on segment 0
npm run recode                # Delete all generated scene JSON and re-run code phase
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

1. **images** – Calls DeepSeek with `buildImageFetchPrompt()` to produce a JSON asset manifest. Downloads each asset via Pixabay/Runware. Saved/updated at `prompts/<slug>-images.json`.
2. **code** – Calls DeepSeek with `buildSceneJsonPrompt()` (attaching the block catalog + resolved asset manifest). Validates the response against `SceneScriptSchema`, writes `prompts/<slug>-scene.json`, and regenerates `src/generated/scene-scripts.ts`.

Each phase can be skipped or isolated with `--from=<phase>` or `--only=<phase>`. Cached artifacts from earlier phases are loaded automatically when a later phase is run in isolation.

### Full End-to-End Data Flow

```
script.txt
  └─> Phase 1: buildImageFetchPrompt(narrative, visualGoal) → prompts/{slug}-images.json + public/images/
  └─> Phase 2: buildSceneJsonPrompt(narrative, visualGoal + assets) → prompts/{slug}-scene.json
               writeSceneScriptsModule() → src/generated/scene-scripts.ts

Runtime (Remotion Studio / render):
  src/generated/scene-scripts.ts
    └─> Root.tsx maps each SceneScript → <Composition component={SceneRenderer}>
    └─> SceneRenderer maps each SceneBlock → block component
    └─> Scene primitive manages frame range + cross-fade
    └─> Block components render with interpolate() / spring() animations
```

## Key Files

| File | Purpose |
|---|---|
| `src/cli.ts` | Entry point — parses args, drives the four-phase pipeline |
| `src/lib/config.ts` | All tunable constants: model name, temperatures, reasoning config, directories |
| `src/lib/deepseek.ts` | Thin fetch wrapper for DeepSeek chat completions (streaming + non-streaming) |
| `src/lib/parse-script.ts` | Parses `script.txt` into `Segment[]` objects (timestamp + narrative) |
| `src/lib/build-image-fetch-prompt.ts` | Builds prompt + response parser for Phase 2; defines `ImageFetchItem` type |
| `src/lib/download-images.ts` | Downloads images via hint URL or DuckDuckGo; validates magic bytes and fake-transparency |
| `src/lib/component-catalog.ts` | Documents all 16 reusable blocks; `renderCatalogForPrompt()` injects docs into the LLM prompt |
| `src/lib/build-scene-json-prompt.ts` | Builds the Phase 2 prompt: loads block catalog + assets, instructs LLM to output strict JSON |
| `src/lib/scene-script-schema.ts` | Zod schemas for `SceneScript` and all 17 `SceneBlock` discriminated union types |
| `src/lib/write-scene-json.ts` | Validates LLM JSON, writes `*-scene.json`, regenerates `src/generated/scene-scripts.ts` |
| `src/components/SceneRenderer.tsx` | Maps `SceneScript` blocks to block components; wraps each in `<Scene>` for frame-range control |
| `src/components/blocks/` | 17 narrative block components (hooks, cards, reveals, media) |
| `src/components/primitives/` | Low-level animation primitives (Scene, Animate, TypewriterText, DrawPath, BeatSync, FadeTransition) |
| `src/components/tokens.ts` | Design system constants: palette, font, easing, duration |
| `src/generated/scene-scripts.ts` | Auto-generated; exports all validated `SceneScript` objects — do not edit by hand |
| `src/Root.tsx` | Remotion root — registers each scene script as a `Composition` using `SceneRenderer` |
| `src/compositions/index.ts` | Legacy barrel — do not edit by hand |

## script.txt Format

The pipeline reads `script.txt` from the project root. Segments are delimited by timestamp lines:

```
**[0:00 - 0:30]** Optional segment title
Narrative text for this segment...

**[0:30 - 1:00]** Next segment
...
```

## Generated Artifacts

| Artifact | Path | Phase |
|---|---|---|
| Image asset manifest | `prompts/{slug}-images.json` | images |
| Scene script JSON | `prompts/{slug}-scene.json` | code |
| Scene scripts module | `src/generated/scene-scripts.ts` | code |

`src/generated/scene-scripts.ts` is regenerated after every code phase run. Do not edit by hand.

## Environment

Requires `DEEPSEEK_API_KEY` in `.env` (loaded via `process.loadEnvFile()`).

A local Python `.venv` with Pillow is used by `download-images.ts` for fake-transparency detection on PNG assets. If `.venv/bin/python` is not found, the check is skipped (no hard failure).

## Skill Family

Use `adhoc-implementer` for planning and implementation work in this project (not `sp-*` or `agile-*`).

---

## Custom Remotion Component Library

The library lives in `src/components/` and is organized into three layers:

```
tokens.ts              ← design system constants
primitives/            ← low-level animation foundations
blocks/                ← narrative/presentation blocks
SceneRenderer.tsx      ← runtime orchestrator
```

### Design Tokens (`src/components/tokens.ts`)

Import from here for consistent styling across all components:

```ts
import { palette, font, easing, duration } from "../tokens";

palette.bg        // "#0a0a0f" — dark background
palette.card      // "#12121a" — card surface
palette.border    // "#1e1e2e"
palette.text      // "#e2e8f0"
palette.muted     // "#64748b"
palette.accent    // "#22d3ee" — cyan highlight
palette.positive  // "#4ade80"
palette.negative  // "#f87171"
palette.warning   // "#fbbf24"

font.display      // "Inter"
font.body         // "Inter"
font.mono         // "JetBrains Mono"

easing.smooth     // cubic-bezier(0.4, 0, 0.2, 1)
easing.spring     // { stiffness: 100, damping: 15 }
easing.snappy     // { stiffness: 300, damping: 20 }

duration.short    // 15 frames
duration.medium   // 30 frames
duration.long     // 45 frames
```

---

### Primitives (`src/components/primitives/`)

#### `Scene` — Frame Range Visibility + Cross-fade

Renders children only within a frame range, with automatic fade-in/out at boundaries.

```tsx
import { Scene } from "../primitives";

<Scene frameRange={[0, 300]} frame={frame} crossFadeFrames={15}>
  {/* rendered content */}
</Scene>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `frameRange` | `[number, number]` | required | Start/end frame (absolute) |
| `frame` | `number` | required | Current frame from `useCurrentFrame()` |
| `crossFadeFrames` | `number` | `15` | Fade duration at entry and exit |

---

#### `Animate` — Entrance Animations

Wraps children with one of four entrance animation styles.

```tsx
import { Animate } from "../primitives";

<Animate frame={frame} startFrame={30} entrance="slideUp" duration={20}>
  <h1>Headline</h1>
</Animate>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `frame` | `number` | required | Current frame |
| `startFrame` | `number` | required | When animation begins |
| `entrance` | `"fadeIn" \| "slideUp" \| "slideLeft" \| "springPop"` | `"fadeIn"` | Animation style |
| `duration` | `number` | `20` | Duration in frames |

Animation styles:
- **fadeIn** — opacity 0 → 1
- **slideUp** — `translateY(60px → 0)` + fade
- **slideLeft** — `translateX(100px → 0)` + fade
- **springPop** — `scale(0 → 1)` with spring physics (`easing.snappy`)

---

#### `FadeTransition` — Two-Element Cross-fade

Fades out the first child while fading in the second.

```tsx
import { FadeTransition } from "../primitives";

<FadeTransition frame={frame} startFrame={120} duration={15}>
  <OldContent />
  <NewContent />
</FadeTransition>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `frame` | `number` | required | Current frame |
| `startFrame` | `number` | required | When transition begins |
| `duration` | `number` | `15` | Overlap duration |
| `children` | `[ReactNode, ReactNode]` | required | Exactly two elements |

---

#### `TypewriterText` — Character-by-Character Reveal

```tsx
import { TypewriterText } from "../primitives";

<TypewriterText
  frame={frame}
  startFrame={0}
  text="Is this the future of work?"
  duration={30}
  fontSize={48}
  showCursor
/>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | required | Text to reveal |
| `duration` | `number` | `30` | Frames to reveal all characters |
| `fontSize` | `number` | `40` | Font size in px |
| `color` | `string` | `palette.text` | Text color |
| `showCursor` | `boolean` | `true` | Blinking cursor (toggles every 15 frames) |

---

#### `DrawPath` — Animated SVG Stroke

Draws an SVG path progressively using stroke-dashoffset.

```tsx
import { DrawPath } from "../primitives";

<svg viewBox="0 0 400 200">
  <DrawPath
    frame={frame}
    startFrame={0}
    d="M 0 100 Q 200 0 400 100"
    stroke={palette.accent}
    strokeWidth={3}
    duration={45}
  />
</svg>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `d` | `string` | required | SVG path data |
| `stroke` | `string` | `palette.accent` | Stroke color |
| `strokeWidth` | `number` | `3` | Stroke width |
| `pathLength` | `number` | `1000` | Dash length unit (arbitrary) |
| `duration` | `number` | `30` | Draw duration in frames |

---

#### `BeatSync` — Rhythmic Oscillation

Applies a sinusoidal scale or translateY pulse to children.

```tsx
import { BeatSync } from "../primitives";

<BeatSync frame={frame} period={30} amplitude={0.05} axis="scale">
  <img src="..." />
</BeatSync>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `period` | `number` | `30` | Frames per oscillation cycle |
| `amplitude` | `number` | `0.05` | Max deviation (fraction for scale, multiplied by 20px for translateY) |
| `axis` | `"scale" \| "translateY"` | `"scale"` | Animation axis |

---

### Blocks (`src/components/blocks/`)

All blocks share the same base props:

```ts
interface BlockProps {
  frameRange: [number, number];  // [startFrame, endFrame] absolute
  frame: number;                  // current frame from useCurrentFrame()
}
```

#### Hook Blocks

Used at the opening of a scene to create immediate engagement:

| Block | Additional Props | Effect |
|---|---|---|
| `ContradictionHook` | `setup: string`, `reveal: string` | Strikethrough old claim → spring-slide new claim |
| `CostOfIgnoranceHook` | `cost: string`, `who?: string` | Alarming headline with decaying shake animation |
| `HiddenMechanismHook` | `headline: string`, `teaser: string` | Staggered headline + teaser reveal |
| `MythVsEvidenceHook` | `myth: string`, `evidence: string` | 50/50 split: ✗ myth (left) → ✓ evidence (right) |

```tsx
<ContradictionHook
  frameRange={[0, 270]}
  frame={frame}
  setup="Quiet Quitting"
  reveal="Quiet Vacationing"
/>
```

#### Structure Blocks

Used to frame context or make promises:

| Block | Additional Props | Effect |
|---|---|---|
| `PromiseCard` | `promise: string`, `bullets?: string[]` | Card slides up with spring; bullets stagger in |
| `ContextCard` | `body: string` | Simple centered body text fade-in |

```tsx
<PromiseCard
  frameRange={[0, 300]}
  frame={frame}
  promise="What you'll learn in 30 seconds"
  bullets={["The trend companies don't track", "Why HR metrics miss it", "What changed in 2024"]}
/>
```

#### Visual Blocks

Used to display data, comparisons, or media:

| Block | Key Props | Effect |
|---|---|---|
| `DiagramScene` | `nodes: {label, x, y}[]`, `edges?: {from, to, label?}[]`, `title?: string`, `annotation?: string` | Staggered node reveals with % positioning |
| `ComparisonSplit` | `leftLabel`, `rightLabel`, `rows: {label, left, right}[]`, `verdict?: string` | Animated 2-column comparison table |
| `BRoll` | `backgroundAsset: string`, `overlayAssets?: OverlayAsset[]`, `caption?: string` | Full-screen image + positioned overlay entrances |
| `Callout` | `phrase: string`, `style?: "fullscreen"\|"overlay"\|"card"`, `backgroundAsset?: string`, `lines?: CalloutLine[]` | Emphasized key phrase (3 layout styles) |

```tsx
<BRoll
  frameRange={[0, 240]}
  frame={frame}
  backgroundAsset="office-bg.jpg"
  overlayAssets={[
    { label: "laptop-sticker.png", x: 60, y: 50, scale: 0.8, entrance: "springPop", entranceFrame: 30 }
  ]}
  caption="The hidden shift in workplace behavior"
/>
```

#### Retention Blocks

Used to maintain viewer attention and layer meaning:

| Block | Key Props | Effect |
|---|---|---|
| `MicroQuestion` | `question: string`, `questions?: string[]`, `style?: "typewriter"\|"fade"` | Sequential questions with typewriter or fade |
| `ContrastReveal` | `setup: string`, `reveal: string` | Muted setup fades out → accent reveal slides in |
| `Reveal` | `headline: string`, `body?: string` | Large headline → supporting body stagger |
| `Reframe` | `oldFrame: string`, `newFrame: string` | Struck-through old → accent new |
| `MiniPayoff` | `rule: string`, `bullets?: string[]` | Bold rule + staggered bullet points |
| `Foreshadow` | `tease: string` | Italic muted teaser text |

```tsx
<ContrastReveal
  frameRange={[0, 240]}
  frame={frame}
  setup="Companies call it productivity"
  reveal="Employees call it survival"
/>
```

#### Deprecated

`CustomScene` — renders a red ⚠ error box. The LLM prompt no longer generates this block. If it appears in a scene JSON, remap it to a typed block.

---

### Adding a New Block

1. Create `src/components/blocks/YourBlock.tsx` with `frameRange` + `frame` props.
2. Add an entry to `BLOCK_CATALOG` in `src/lib/component-catalog.ts` (name, role, whenToUse, props).
3. Add the Zod schema to the `SceneBlock` discriminated union in `src/lib/scene-script-schema.ts`.
4. Add the component to `BLOCK_MAP` in `src/components/SceneRenderer.tsx`.
5. Export from `src/components/blocks/index.ts`.

---

### Scene Script JSON Shape

The LLM generates (and `writeSceneJson` validates) JSON conforming to this shape:

```json
{
  "schemaVersion": 1,
  "title": "Human-readable title",
  "slug": "kebab-case-composition-id",
  "durationInFrames": 900,
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "crossFadeFrames": 15,
  "assets": [
    { "label": "office-bg.jpg", "role": "background", "cutoutPath": null }
  ],
  "scenes": [
    {
      "type": "ContradictionHook",
      "frameRange": [0, 270],
      "setup": "Quiet Quitting",
      "reveal": "Quiet Vacationing"
    }
  ]
}
```

Constraints enforced by schema:
- `fps` must be `30`, `width` must be `1920`, `height` must be `1080`
- `slug` must be kebab-case
- Max 4 visual elements per frame (guideline, not schema-enforced)
- `durationInFrames = (endSeconds - startSeconds) * 30`
