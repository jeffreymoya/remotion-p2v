import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { EasingPreset } from "./easing";

/** Zod schemas mirroring the prop types in `types.ts` for Studio editing. */

export const zEasingPreset = z.enum(EasingPreset);

export const zPosition = z.object({
  inset: z.union([z.number(), z.string()]).optional(),
  top: z.union([z.number(), z.string()]).optional(),
  left: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
});

export const zTextStyle = z.object({
  fontFamily: z.string(),
  fontSize: z.number(),
  fontWeight: z.number(),
  letterSpacing: z.string(),
  lineHeight: z.number(),
  color: zColor(),
  textTransform: z
    .enum(["none", "uppercase", "lowercase", "capitalize"])
    .optional(),
});

export const zLifecycle = z.object({
  delay: z.number(),
  inFrames: z.number(),
  holdFrames: z.number(),
  outFrames: z.number(),
});

export const zSplitTransforms = z.object({
  opacityFrom: z.number(),
  y: z.number(),
  blur: z.number(),
  scale: z.number(),
});

export const zSplit = z.object({
  mode: z.enum(["word", "char"]),
  stagger: z.number(),
  transforms: zSplitTransforms,
  easing: zEasingPreset,
});

export const zTextSegment = z.object({
  text: z.string(),
  emphasis: z.boolean().optional(),
});

export const zChrome = z.object({
  num: z.string(),
  name: z.string(),
  meta: z.string(),
});
