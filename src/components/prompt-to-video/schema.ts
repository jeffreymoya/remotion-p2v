import { z } from "zod";

const HEX_OR_CSS_COLOR = z.string().min(1);

export const generatedSceneVisualRoleSchema = z.enum([
  "hook-card",
  "mechanism-diagram",
  "evidence-comparison",
  "tradeoff-split",
  "payoff-callout",
]);

export const generatedSceneTransitionSchema = z.enum([
  "fade",
  "wipe",
  "push",
  "none",
]);

export const generatedScenePaletteSchema = z.object({
  background: HEX_OR_CSS_COLOR,
  foreground: HEX_OR_CSS_COLOR,
  accent: HEX_OR_CSS_COLOR,
  muted: HEX_OR_CSS_COLOR,
});

export const generatedSceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  narrationSummary: z.string().min(1),
  visual: z.object({
    role: generatedSceneVisualRoleSchema,
    headline: z.string().min(1),
    callouts: z.array(z.string().min(1)).min(1).max(6),
  }),
  durationFrames: z.number().int().positive(),
  palette: generatedScenePaletteSchema,
  transition: generatedSceneTransitionSchema,
});

export const generatedVideoRunSchema = z
  .object({
    runId: z.string().min(1),
    title: z.string().min(1),
    fps: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    totalDurationFrames: z.number().int().positive(),
    generatedAt: z.string().min(1),
    scenes: z.array(generatedSceneSchema).min(1),
  })
  .superRefine((run, ctx) => {
    const summedFrames = run.scenes.reduce(
      (total, scene) => total + scene.durationFrames,
      0
    );
    if (run.totalDurationFrames !== summedFrames) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalDurationFrames"],
        message: `Expected totalDurationFrames to equal scene sum ${summedFrames}`,
      });
    }
  });

export const animationOpTypeSchema = z.enum([
  "enter",
  "hold",
  "highlight",
  "reveal",
  "retention-beat",
  "exit",
]);

export const animationOpSchema = z.object({
  type: animationOpTypeSchema,
  targetElement: z.string().min(1),
  durationFrames: z.number().int().positive(),
  startFrame: z.number().int().min(0).default(0),
  description: z.string(),
});

export const elementTimelineSchema = z.object({
  element: z.string().min(1),
  ops: z.array(animationOpSchema).min(1),
});

export const sceneAnimationPlanSchema = z.object({
  sceneId: z.string().min(1),
  elements: z.array(elementTimelineSchema).min(1),
  totalFrames: z.number().int().default(0),
});

export const animationPlanSchema = z.object({
  runId: z.string().min(1),
  generatedAt: z.string().min(1),
  scenes: z.array(sceneAnimationPlanSchema).min(1),
});

export const generatedPromptVideoPropsSchema = z.object({
  run: generatedVideoRunSchema.nullable(),
  animationPlan: animationPlanSchema.nullable().optional(),
});

export type GeneratedSceneVisualRole = z.infer<
  typeof generatedSceneVisualRoleSchema
>;
export type GeneratedSceneTransition = z.infer<
  typeof generatedSceneTransitionSchema
>;
export type GeneratedScenePalette = z.infer<typeof generatedScenePaletteSchema>;
export type GeneratedScene = z.infer<typeof generatedSceneSchema>;
export type GeneratedVideoRun = z.infer<typeof generatedVideoRunSchema>;
export type GeneratedPromptVideoProps = z.infer<
  typeof generatedPromptVideoPropsSchema
>;
export type AnimationOpType = z.infer<typeof animationOpTypeSchema>;
export type AnimationOp = z.infer<typeof animationOpSchema>;
export type ElementTimeline = z.infer<typeof elementTimelineSchema>;
export type SceneAnimationPlan = z.infer<typeof sceneAnimationPlanSchema>;
export type AnimationPlan = z.infer<typeof animationPlanSchema>;
