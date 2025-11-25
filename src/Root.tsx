import { Composition, getStaticFiles } from "remotion";
import { AIVideo, aiVideoSchema } from "./components/AIVideo";
import { FPS, INTRO_DURATION, DIMENSIONS, DEFAULT_ASPECT_RATIO } from "./lib/constants";
import { loadTimelineFromFile } from "./lib/utils";

export const RemotionRoot: React.FC = () => {
  const staticFiles = getStaticFiles();

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
          fps={FPS}
          // Dimensions will be calculated dynamically based on timeline's aspect ratio
          width={DIMENSIONS[DEFAULT_ASPECT_RATIO].width}
          height={DIMENSIONS[DEFAULT_ASPECT_RATIO].height}
          schema={aiVideoSchema}
          defaultProps={{
            timeline: null,
          }}
          calculateMetadata={async ({ props }) => {
            // Use new path structure: projects/{projectId}/timeline.json
            const timelinePath = `projects/${projectId}/timeline.json`;
            const { lengthFrames, timeline } = await loadTimelineFromFile(timelinePath);

            // Get dimensions based on timeline's aspect ratio (normalized with default)
            const aspectRatio = timeline.aspectRatio || DEFAULT_ASPECT_RATIO;
            const dimensions = DIMENSIONS[aspectRatio];

            return {
              durationInFrames: lengthFrames + INTRO_DURATION,
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
