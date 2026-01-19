import { AbsoluteFill, Audio, Img, Sequence, Video, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Timeline } from "@/src/lib/storyflow/timeline-types";
import { useViewportTransform } from "../hooks/useViewportTransform";
import { fontSizeMap, defaultSubtitleStyle } from "@/src/lib/storyflow/timeline-types";
import { IntroTitle } from "../components/IntroTitle";
import { musicVolumeAtFrame } from "../lib/music-ducking";

type Props = { timeline: Timeline };

export const StoryFlowVideo: React.FC<Props> = ({ timeline }) => {
  const { fps } = useVideoConfig();
  const introFrames = fps; // 1s intro buffer

  return (
    <AbsoluteFill style={{ background: "black" }}>
      {/* Intro bumper */}
      <Sequence durationInFrames={introFrames}>
        <IntroTitle title={timeline.title} />
      </Sequence>

      {/* Backgrounds */}
      {timeline.backgrounds.map((bg, idx) => (
        <Sequence
          key={`bg-${idx}`}
          from={bg.startFrame + introFrames}
          durationInFrames={bg.endFrame - bg.startFrame}
        >
          <BackgroundLayer element={bg} fps={fps} />
        </Sequence>
      ))}

      {/* Text */}
      {timeline.text.map((text, idx) => (
        <Sequence
          key={`text-${idx}`}
          from={text.startFrame + introFrames}
          durationInFrames={text.endFrame - text.startFrame + (text.holdFrames || 0)}
        >
          <SubtitleLayer element={text} />
        </Sequence>
      ))}

      {/* Audio */}
      {timeline.audio.map((audio, idx) => (
        <Sequence key={`audio-${idx}`} from={audio.startFrame + introFrames}>
          <Audio src={audio.audioUrl} />
        </Sequence>
      ))}

      {/* Music */}
      {timeline.music && (
        <Sequence from={introFrames}>
          <Audio
            src={timeline.music.url}
            volume={(frame) => musicVolumeAtFrame(frame, timeline.music!, timeline.audio, introFrames)}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

type BackgroundProps = { element: Timeline["backgrounds"][number]; fps: number };

function BackgroundLayer({ element, fps }: BackgroundProps) {
  const frame = useCurrentFrame();
  const blur = computeBlur(frame, element, fps);
  const transform = useViewportTransform(frame, element.viewportAnimation, fps, {
    width: element.mediaMetadata?.width,
    height: element.mediaMetadata?.height,
  });

  const commonStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: element.mediaMetadata?.mode || "cover",
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    transform: transform ? `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})` : undefined,
    transformOrigin: "center center",
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {element.imageUrl ? (
        <Img src={element.imageUrl} style={commonStyle} />
      ) : element.videoUrl ? (
        <Video src={element.videoUrl} style={commonStyle} />
      ) : null}
    </AbsoluteFill>
  );
}

function computeBlur(frame: number, element: Timeline["backgrounds"][number], fps: number) {
  const fadeDuration = Math.floor(fps / 3);
  const maxBlur = 25;
  const localFrame = frame - element.startFrame;
  const duration = element.endFrame - element.startFrame;

  if (element.enterTransition === "blur" && localFrame < fadeDuration) {
    return interpolate(localFrame, [0, fadeDuration], [maxBlur, 0]);
  }

  if (element.exitTransition === "blur" && localFrame > duration - fadeDuration) {
    return interpolate(localFrame, [duration - fadeDuration, duration], [0, maxBlur]);
  }

  return 0;
}

function SubtitleLayer({ element }: { element: Timeline["text"][number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const styleConfig = defaultSubtitleStyle;
  const size = fontSizeMap[styleConfig.fontSize];

  const visibleWords = element.words.filter((word) => frame >= Math.floor((word.startMs / 1000) * fps) - element.startFrame);

  const positionClass =
    styleConfig.position === "top"
      ? { top: styleConfig.paddingTop }
      : styleConfig.position === "bottom"
      ? { bottom: styleConfig.paddingBottom }
      : { top: "50%", transform: "translateY(-50%)" };

  return (
    <AbsoluteFill style={{ ...positionClass, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
        {visibleWords.map((word, idx) => {
          const startFrame = Math.floor((word.startMs / 1000) * fps) - element.startFrame;
          const animProgress = Math.max(0, Math.min(1, (frame - startFrame) / fps));
          const scale = interpolate(animProgress, [0, 1], [0.8, 1]);
          const opacity = interpolate(animProgress, [0, 1], [0, 1]);
          const translateY = interpolate(animProgress, [0, 1], [10, 0]);
          const emphasis = word.emphasis?.level || "none";
          const fontSize = emphasis === "high" ? size.emphasis : size.base;
          const fontWeight = emphasis === "high" ? 800 : 500;

          return (
            <span
              key={idx}
              style={{
                position: "relative",
                fontSize,
                fontWeight,
                color: styleConfig.textColor,
                textShadow: `0 0 ${styleConfig.outlineWidth}px ${styleConfig.outlineColor}`,
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
              }}
            >
              {emphasis !== "none" && (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: styleConfig.highlightColor,
                    zIndex: -1,
                    transform: "scaleX(1)",
                    transformOrigin: "left",
                  }}
                />
              )}
              {word.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
