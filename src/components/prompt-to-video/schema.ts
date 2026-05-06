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

export const generatedPromptVideoPropsSchema = z.object({
  run: generatedVideoRunSchema.nullable(),
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
