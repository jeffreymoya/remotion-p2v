// src/components/docu/common/charter.ts
//
// Single source of truth for WHY this component library exists and the
// non-negotiable rules for extending it. This constant is the one place the
// motivation is written; it is then carried into the artifacts that LLMs
// actually load so neither audience has to "remember to read the docs":
//   - embedded into registry.json as `$charter` (read by any agent that loads
//     the registry to discover or extend components), drift-enforced by
//     `npm run registry:check`;
//   - injected into the runtime scene-planner system prompt (so the planning
//     LLM knows the engine guarantees placement and to pick by meaning).
// Editing the charter and rebuilding the registry is the deterministic way to
// change the library's stated motivation everywhere at once.

export interface LibraryCharter {
  /** Why the library exists, in one breath. */
  readonly mission: string;
  /** The mental model an author must hold (placeless blocks + deterministic engine). */
  readonly mentalModel: readonly string[];
  /** Hard, gate-enforced rules for creating or updating a composite. */
  readonly authoringRules: readonly string[];
  /** The deterministic commands that enforce the rules above. */
  readonly enforcedBy: readonly string[];
  /** Guidance for the runtime LLM that PICKS components per scene. */
  readonly plannerBrief: readonly string[];
}

export const LIBRARY_CHARTER: LibraryCharter = {
  mission:
    "This component library turns dense documentary narration into clear, credible, hard-to-stop-watching scenes. Components are evidence-driven visual building blocks and the renderer is a deterministic layout engine, so an LLM can compose scenes from meaning alone while the engine guarantees they never collide.",
  mentalModel: [
    "A component is a placeless block, like an element dropped onto a canvas: it has NO inherent position or size. Placement is assigned per-instance by the engine, not by the component.",
    "Two separated axes: STYLING (fonts, colours, scale) lives in the component and is fully overridable; PLACEMENT (slot, box, z-order) lives in the composition and is assigned deterministically.",
    "The renderer hands every layer a named, non-overlapping slot box from a 12x6 grid and clips it. Non-overlapping slots + clipped boxes + components that stay inside their box make text-on-text collisions impossible by construction.",
    "Chrome (the frame outline + label rail) is rendered ONCE per scene by the renderer, never by a component.",
  ],
  authoringRules: [
    "Root every composite in <Box> from common/Box; it fills the slot and clips overflow. AbsoluteFill is forbidden in composites.",
    "Size from the box, not the frame: read useBoxSize() and fitFont(); use percentage offsets and flex. Forbidden: viewport units (100vw/vh), position:fixed, and useVideoConfig().width/height for layout.",
    "Every rendered visual value must be overridable via a Zod-schema'd prop. No magic numbers — pull from common/tokens or from props.",
    "Frame-driven motion only (useCurrentFrame/interpolate/spring). CSS transitions/animations do not render in Remotion.",
    "A composite must not import or render Chrome; num/name/meta stay in the schema as scene-chrome metadata the pipeline lifts to the scene.",
    "Register every composite in REGISTRY_SOURCES and rebuild registry.json. An unregistered *Schema or a stale registry.json is a hard build failure.",
  ],
  enforcedBy: [
    "npm run components:verify — the single deterministic gate: rebuilds the registry, checks it for drift, enforces the box-relative contract, and runs the layout/collision tests.",
    "npm run scaffold -- <Name> [category] [dir] — generates a contract-compliant starting point.",
    "npm run registry:check and npm run contract:check are also wired into npm run lint.",
  ],
  plannerBrief: [
    "Pick components by MEANING and available evidence: match the narration and the component scriptCues, not a layout.",
    "Never specify or worry about position, size, or overlap. The engine assigns every layer a non-overlapping slot deterministically; your job is semantic fit and variety.",
    "Vary the visual grammar across scenes (focalOwner and component family) to avoid template fatigue.",
  ],
} as const;
