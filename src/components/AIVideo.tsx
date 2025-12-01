import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { z } from "zod";
import { Audio } from "@remotion/media";
import { TimelineSchema } from "../lib/types";
import { INTRO_DURATION_MS } from "../lib/constants";
import { loadFont } from "@remotion/google-fonts/BreeSerif";
import { Background } from "./Background";
import Subtitle from "./Subtitle";
import { calculateFrameTiming } from "../lib/utils";

export const aiVideoSchema = z.object({
  timeline: TimelineSchema.nullable(),
});

const { fontFamily } = loadFont();

export const AIVideo: React.FC<z.infer<typeof aiVideoSchema>> = ({
  timeline,
}) => {
  if (!timeline) {
    throw new Error("Expected timeline to be fetched");
  }

  const { id, fps } = useVideoConfig();
  const introDurationFrames = Math.round((INTRO_DURATION_MS / 1000) * fps);

  const resolveTiming = (
    startMs: number,
    endMs: number,
    startFrame?: number,
    endFrame?: number,
    options: { includeIntro?: boolean; addIntroOffset?: boolean } = {},
  ) => {
    if (typeof startFrame === "number" && typeof endFrame === "number") {
      const baseStart = startFrame + (options.addIntroOffset ? introDurationFrames : 0);
      const baseDuration = endFrame - startFrame;
      const duration = baseDuration + (options.includeIntro ? introDurationFrames : 0);

      return {
        from: Math.round(baseStart),
        durationInFrames: Math.round(duration),
      };
    }

    const { startFrame: computedStart, duration } = calculateFrameTiming(
      startMs,
      endMs,
      fps,
      options,
    );

    return {
      from: Math.round(computedStart),
      durationInFrames: Math.round(duration),
    };
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <Sequence durationInFrames={introDurationFrames}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            display: "flex",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 120,
              lineHeight: "122px",
              width: "87%",
              color: "black",
              fontFamily,
              textTransform: "uppercase",
              backgroundColor: "yellow",
              paddingTop: 20,
              paddingBottom: 20,
              border: "10px solid black",
            }}
          >
            {timeline.shortTitle}
          </div>
        </AbsoluteFill>
      </Sequence>

      {timeline.elements.map((element, index) => {
        const { from, durationInFrames } = resolveTiming(
          element.startMs,
          element.endMs,
          element.startFrame,
          element.endFrame,
          { includeIntro: index === 0 },
        );

        return (
          <Sequence
            key={`element-${index}`}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={Math.round(3 * fps)}
          >
            <Background project={id} item={element} />
          </Sequence>
        );
      })}

      {timeline.text.map((element, index) => {
        const { from, durationInFrames } = resolveTiming(
          element.startMs,
          element.endMs,
          element.startFrame,
          element.endFrame,
          {},
        );

        return (
          <Sequence
            key={`element-${index}`}
            from={from}
            durationInFrames={durationInFrames}
          >
            <Subtitle key={index} textElement={element} />
          </Sequence>
        );
      })}

      {timeline.audio.map((element, index) => {
        const { from, durationInFrames } = resolveTiming(
          element.startMs,
          element.endMs,
          element.startFrame,
          element.endFrame,
          {},
        );

        return (
          <Sequence
            key={`element-${index}`}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={Math.round(3 * fps)}
          >
            <Audio src={staticFile(`projects/${id}/assets/audio/${element.audioUrl}.mp3`)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
