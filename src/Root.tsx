import { Composition, getStaticFiles } from "remotion";
import { AIVideo, aiVideoSchema } from "./components/AIVideo";
import { FPS, INTRO_DURATION_MS, DIMENSIONS, DEFAULT_ASPECT_RATIO } from "./lib/constants";
import { loadTimelineFromFile } from "./lib/utils";
import videoConfig from "../config/video.config.json";

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
    </>
  );
};
