import { z } from "zod";

// ── Shared Zod primitives for scene block schemas ───────────────────────
// Extracted from scene-script-schema.ts so block files can import these
// without creating a circular dependency through _registry.ts.

export const FrameRange = z.tuple([z.number().int(), z.number().int()]);

export const CardinalDirection = z.enum(["from-left", "from-right", "from-top", "from-bottom"]);
export const WipeDirection = z.enum([
  "from-left", "from-right", "from-top", "from-bottom",
  "from-top-left", "from-top-right", "from-bottom-left", "from-bottom-right",
]);

export const TransitionConfig = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("fade") }),
  z.object({ kind: z.literal("slide"), direction: CardinalDirection.optional() }),
  z.object({ kind: z.literal("flip"), direction: CardinalDirection.optional() }),
  z.object({ kind: z.literal("wipe"), direction: WipeDirection.optional() }),
]);

export type TransitionConfigType = z.infer<typeof TransitionConfig>;

export const transitionMixin = { transition: TransitionConfig.optional() };
