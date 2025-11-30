import {
  AbsoluteFill,
  Img,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FPS, IMAGE_HEIGHT, IMAGE_WIDTH } from "../lib/constants";
import { BackgroundElement, Timeline } from "../lib/types";
import { calculateBlur } from "../lib/utils";

const EXTRA_SCALE = 0.2;

// Utility function to convert milliseconds to frames
const msToFrame = (ms: number): number => {
  return Math.floor((ms * FPS) / 1000);
};

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
  timeline?: Timeline;
}> = ({ item, project, timeline }) => {
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

  // Check if this element has a video
  const isVideo = item.videoUrl !== undefined;

  if (isVideo && item.videoUrl) {
    // Build video path - add .mp4 if not present (defensive)
    let videoPath = item.videoUrl;
    if (!videoPath.endsWith('.mp4')) {
      videoPath = `${videoPath}.mp4`;
    }

    const metadata = item.mediaMetadata;

    let videoStyle: React.CSSProperties;
    if (metadata && metadata.mode && metadata.scale !== undefined) {
      // For letterbox, crop dimensions are already in target frame coordinates
      // Only apply imgScale for Ken Burns animation
      // For crop mode, apply both metadata.scale (aspect-fit) and imgScale (animation)
      const totalScale = metadata.mode === 'letterbox' ? imgScale : metadata.scale * imgScale;
      videoStyle = {
        width: metadata.cropWidth * totalScale,
        height: metadata.cropHeight * totalScale,
        position: "absolute",
        top: metadata.cropY * totalScale,
        left: metadata.cropX * totalScale,
        objectFit: metadata.mode === 'crop' ? 'cover' : 'contain',
      };
    } else {
      // Strict mode: log warning if metadata incomplete
      if (metadata && !metadata.scale) {
        console.warn('[Background] Video metadata missing scale factor:', item.videoUrl);
      }
      // Fallback to calculating style
      const videoWidth = metadata?.width || 1920;
      const videoHeight = metadata?.height || 1080;
      videoStyle = calculateMediaStyle(
        videoWidth,
        videoHeight,
        width,
        height,
        imgScale,
      );
    }

    return (
      <AbsoluteFill>
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

    let imageStyle: React.CSSProperties;
    if (metadata && metadata.mode && metadata.scale !== undefined) {
      // For letterbox, crop dimensions are already in target frame coordinates
      // Only apply imgScale for Ken Burns animation
      // For crop mode, apply both metadata.scale (aspect-fit) and imgScale (animation)
      const totalScale = metadata.mode === 'letterbox' ? imgScale : metadata.scale * imgScale;
      imageStyle = {
        width: metadata.cropWidth * totalScale,
        height: metadata.cropHeight * totalScale,
        position: "absolute",
        top: metadata.cropY * totalScale,
        left: metadata.cropX * totalScale,
        objectFit: metadata.mode === 'crop' ? 'cover' : 'contain',
      };
    } else {
      // Strict mode: log warning if metadata incomplete
      if (metadata && !metadata.scale) {
        console.warn('[Background] Image metadata missing scale factor:', item.imageUrl);
      }
      // Fallback to default styling
      imageStyle = {
        width: imgWidth * imgScale,
        height: imgHeight * imgScale,
        position: "absolute",
        top,
        left,
      };
    }

    return (
      <AbsoluteFill>
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
  return <AbsoluteFill />;
};
