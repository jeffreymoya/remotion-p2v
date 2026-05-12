import { z } from "zod";
import { SceneBlock, type SceneBlockType } from "../components/blocks/_registry";

// Re-export shared primitives so existing consumers don't break
export type { TransitionConfigType } from "./scene-schema-primitives";

// Re-export registry-derived SceneBlock
export { SceneBlock, type SceneBlockType };

// ── Asset ref (used only by SceneScriptSchema, not by block files) ──────
const AssetRef = z.object({
  label: z.string(),
  role: z.enum(["background", "animated_object", "static_overlay", "screen_mockup"]),
  path: z.string().optional(),
  backgroundRemoved: z.boolean().optional(),
  // Deprecated legacy field. Use path plus backgroundRemoved metadata instead.
  cutoutPath: z.string().optional(),
});

// ── Root schema ─────────────────────────────────────────────────────────
export const SceneScriptSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string(),
  slug: z.string(),
  durationInFrames: z.number().int().positive(),
  fps: z.literal(30),
  width: z.literal(1920),
  height: z.literal(1080),
  crossFadeFrames: z.number().int().nonnegative().default(15),
  assets: z.array(AssetRef),
  scenes: z.array(SceneBlock),
  audioFile: z.string().optional(),
});

export type SceneScript = z.infer<typeof SceneScriptSchema>;
export type AssetRefType = z.infer<typeof AssetRef>;
