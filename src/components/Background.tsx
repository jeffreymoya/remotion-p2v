import {
  AbsoluteFill,
  Img,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties } from "react";
import { FPS, IMAGE_HEIGHT, IMAGE_WIDTH } from "../lib/constants";
import { BackgroundElement } from "../lib/types";
import { calculateBlur } from "../lib/utils";

const EXTRA_SCALE = 0.2;

// Calculate crop/letterbox styles for video or image
const calculateMediaStyle = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  scale: number = 1,
): React.CSSProperties => {
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;
  const maxAspectDelta = 0.3; // From stock-assets.config.json

  const aspectDelta = Math.abs(sourceAspect - targetAspect) / targetAspect;

  if (aspectDelta <= maxAspectDelta) {
    // Crop mode: fill the entire canvas
    let displayWidth: number;
    let displayHeight: number;

    if (sourceAspect > targetAspect) {
      // Source is wider - fit to height and crop width
      displayHeight = targetHeight * scale;
      displayWidth = displayHeight * sourceAspect;
    } else {
      // Source is taller - fit to width and crop height
      displayWidth = targetWidth * scale;
      displayHeight = displayWidth / sourceAspect;
    }

    const left = (targetWidth - displayWidth) / 2;
    const top = (targetHeight - displayHeight) / 2;

    return {
      width: displayWidth,
      height: displayHeight,
      position: "absolute",
      top,
      left,
      objectFit: "cover",
    };
  } else {
    // Letterbox mode: fit entire media within canvas
    let displayWidth: number;
    let displayHeight: number;

    if (sourceAspect > targetAspect) {
      // Source is wider - fit to width
      displayWidth = targetWidth;
      displayHeight = targetWidth / sourceAspect;
    } else {
      // Source is taller - fit to height
      displayHeight = targetHeight;
      displayWidth = targetHeight * sourceAspect;
    }

    const left = (targetWidth - displayWidth) / 2;
    const top = (targetHeight - displayHeight) / 2;

    return {
      width: displayWidth,
      height: displayHeight,
      position: "absolute",
      top,
      left,
      objectFit: "contain",
    };
  }
};

export const Background: React.FC<{
  item: BackgroundElement;
  project: string;
}> = ({ item, project }) => {
  const frame = useCurrentFrame();
  const localMs = (frame / FPS) * 1000;
  const { width, height } = useVideoConfig();

  const imageRatio = IMAGE_HEIGHT / IMAGE_WIDTH;

  const imgWidth = height;
  const imgHeight = imgWidth * imageRatio;
  let animScale = 1 + EXTRA_SCALE;

  const currentScaleAnim = item.animations?.find(
    (anim) =>
      anim.type === "scale" && anim.startMs <= localMs && anim.endMs >= localMs,
  );

  if (currentScaleAnim) {
    const progress =
      (localMs - currentScaleAnim.startMs) /
      (currentScaleAnim.endMs - currentScaleAnim.startMs);
    animScale =
      EXTRA_SCALE +
      progress * (currentScaleAnim.to - currentScaleAnim.from) +
      currentScaleAnim.from;
  }

  const imgScale = animScale;
  const top = -(imgHeight * imgScale - height) / 2;
  const left = -(imgWidth * imgScale - width) / 2;

  const blur = calculateBlur({ item, localMs });
  const maxBlur = 25;

  const currentBlur = maxBlur * blur;

  const containerStyle: CSSProperties = {
    overflow: "hidden",
    backgroundColor: "black",
  };

  // Check if this element has a video
  const isVideo = item.videoUrl !== undefined;

  if (isVideo && item.videoUrl) {
    // Build video path - add .mp4 if not present (defensive)
    let videoPath = item.videoUrl;
    if (!videoPath.endsWith('.mp4')) {
      videoPath = `${videoPath}.mp4`;
    }

    const metadata = item.mediaMetadata;

    const buildStyleFromMetadata = (data: typeof metadata) => {
      if (!data?.width || !data?.height) {
        return null;
      }

      const baseScale = (data.scale ?? 1) as number;
      const totalScale = baseScale * imgScale;

      const mediaWidth = data.width * totalScale;
      const mediaHeight = data.height * totalScale;

      const cropX = data.cropX ?? 0;
      const cropY = data.cropY ?? 0;

      const isCropMode = data.mode === 'crop';

      const left = isCropMode
        ? -cropX * totalScale
        : (width - mediaWidth) / 2;
      const top = isCropMode
        ? -cropY * totalScale
        : (height - mediaHeight) / 2;

      return {
        width: mediaWidth,
        height: mediaHeight,
        position: "absolute" as const,
        top,
        left,
        objectFit: "cover" as const,
      } satisfies CSSProperties;
    };

    const videoStyle =
      buildStyleFromMetadata(metadata) ||
      calculateMediaStyle(
        metadata?.width || 1920,
        metadata?.height || 1080,
        width,
        height,
        imgScale,
      );

    return (
      <AbsoluteFill style={containerStyle}>
        <Video
          src={staticFile(`projects/${project}/assets/videos/${videoPath}`)}
          muted
          loop
          style={{
            ...videoStyle,
            filter: `blur(${currentBlur}px)`,
            WebkitFilter: `blur(${currentBlur}px)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // Render image
  if (item.imageUrl) {
    const metadata = item.mediaMetadata;

    const buildStyleFromMetadata = (data: typeof metadata) => {
      if (!data?.width || !data?.height) {
        return null;
      }

      const baseScale = (data.scale ?? 1) as number;
      const totalScale = baseScale * imgScale;

      const mediaWidth = data.width * totalScale;
      const mediaHeight = data.height * totalScale;

      const cropX = data.cropX ?? 0;
      const cropY = data.cropY ?? 0;

      const isCropMode = data.mode === 'crop';

      const left = isCropMode
        ? -cropX * totalScale
        : (width - mediaWidth) / 2;
      const top = isCropMode
        ? -cropY * totalScale
        : (height - mediaHeight) / 2;

      return {
        width: mediaWidth,
        height: mediaHeight,
        position: "absolute" as const,
        top,
        left,
        objectFit: "cover" as const,
      } satisfies CSSProperties;
    };

    const imageStyle =
      buildStyleFromMetadata(metadata) || {
        width: imgWidth * imgScale,
        height: imgHeight * imgScale,
        position: "absolute",
        top,
        left,
      };

    return (
      <AbsoluteFill style={containerStyle}>
        <Img
          src={staticFile(`projects/${project}/assets/images/${item.imageUrl}`)}
          style={{
            ...imageStyle,
            filter: `blur(${currentBlur}px)`,
            WebkitFilter: `blur(${currentBlur}px)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  // Fallback: empty fill
  return <AbsoluteFill style={containerStyle} />;
};
