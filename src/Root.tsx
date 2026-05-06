import { Composition, getStaticFiles, staticFile } from "remotion";
import { AIVideo, aiVideoSchema } from "./components/AIVideo";
import { GeneratedPromptVideo } from "./components/prompt-to-video/GeneratedPromptVideo";
import {
  animationPlanSchema,
  generatedPromptVideoPropsSchema,
  generatedVideoRunSchema,
} from "./components/prompt-to-video/schema";
import { FPS, INTRO_DURATION_MS, DIMENSIONS, DEFAULT_ASPECT_RATIO } from "./lib/constants";
import { loadTimelineFromFile } from "./lib/utils";
import videoConfig from "../config/video.config.json";

async function loadGeneratedRun(staticPath: string) {
  const response = await fetch(staticFile(staticPath));
  if (!response.ok) {
    throw new Error(`Failed to load generated composition: ${staticPath}`);
  }
  return generatedVideoRunSchema.parse(await response.json());
}

async function loadAnimationPlan(staticPath: string) {
  const response = await fetch(staticFile(staticPath));
  if (!response.ok) {
    return null;
  }
  return animationPlanSchema.safeParse(await response.json()).data ?? null;
}

export const RemotionRoot: React.FC = () => {
  const staticFiles = getStaticFiles();

  const defaultAspectRatio = (videoConfig.defaultAspectRatio || DEFAULT_ASPECT_RATIO) as keyof typeof DIMENSIONS;
  const compositionFps = videoConfig.aspectRatios?.[defaultAspectRatio]?.fps ?? FPS;
  const introDurationFrames = Math.round((INTRO_DURATION_MS / 1000) * compositionFps);

  // Extract project IDs from public/projects/{projectId}/timeline.json
  const timelines = staticFiles
    .filter((file) => file.name.endsWith("timeline.json"))
    .filter((file) => file.name.startsWith("projects/"))
    .map((file) => {
      // Extract project ID from "projects/{projectId}/timeline.json"
      const parts = file.name.split("/");
      return parts[1]; // Get the projectId
    });
  const generatedRuns = staticFiles
    .filter((file) => file.name.endsWith("/composition.json"))
    .filter((file) => file.name.startsWith("generated/prompt-to-video/"))
    .map((file) => {
      const parts = file.name.split("/");
      return {
        runId: parts[2],
        staticPath: file.name,
      };
    });

  return (
    <>
      {timelines.map((projectId) => (
        <Composition
          id={projectId}
          component={AIVideo}
          fps={compositionFps}
          // Dimensions will be calculated dynamically based on timeline's aspect ratio
          width={DIMENSIONS[defaultAspectRatio].width}
          height={DIMENSIONS[defaultAspectRatio].height}
          schema={aiVideoSchema}
          defaultProps={{
            timeline: null,
          }}
          calculateMetadata={async ({ props }) => {
            // Use new path structure: projects/{projectId}/timeline.json
            const timelinePath = `projects/${projectId}/timeline.json`;
            const { lengthFrames, timeline } = await loadTimelineFromFile(timelinePath, compositionFps);

            // Get dimensions based on timeline's aspect ratio (normalized with default)
            const aspectRatio = timeline.aspectRatio || DEFAULT_ASPECT_RATIO;
            const dimensions = DIMENSIONS[aspectRatio];

            return {
              durationInFrames: lengthFrames + introDurationFrames,
              width: dimensions.width,
              height: dimensions.height,
              props: {
                ...props,
                timeline,
              },
            };
          }}
        />
      ))}
      {generatedRuns.map(({ runId, staticPath }) => (
        <Composition
          key={runId}
          id={`prompt-to-video-${runId}`}
          component={GeneratedPromptVideo}
          fps={compositionFps}
          width={DIMENSIONS[defaultAspectRatio].width}
          height={DIMENSIONS[defaultAspectRatio].height}
          schema={generatedPromptVideoPropsSchema}
          defaultProps={{
            run: null,
            animationPlan: null,
          }}
          calculateMetadata={async ({ props }) => {
            const run = await loadGeneratedRun(staticPath);
            const planDir = staticPath.replace(/\/composition\.json$/, "");
            const planPath = `${planDir}/animation-plan.json`;
            const animationPlan = await loadAnimationPlan(planPath);

            let durationFrames = run.totalDurationFrames;
            if (animationPlan) {
              durationFrames = animationPlan.scenes.reduce(
                (sum, s) => sum + s.totalFrames,
                0
              );
            }

            return {
              durationInFrames: durationFrames,
              fps: run.fps,
              width: run.width,
              height: run.height,
              props: {
                ...props,
                run,
                animationPlan,
              },
            };
          }}
        />
      ))}
    </>
  );
};
