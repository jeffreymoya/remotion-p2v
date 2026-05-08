import React from "react";
import { interpolate, spring } from "remotion";
import { easing } from "../tokens";

type Entrance = "fadeIn" | "slideUp" | "slideLeft" | "springPop";

interface AnimateProps {
  frame: number;
  startFrame: number;
  entrance?: Entrance;
  duration?: number;
  children: React.ReactNode;
}

export const Animate: React.FC<AnimateProps> = ({
  frame,
  startFrame,
  entrance = "fadeIn",
  duration = 20,
  children,
}) => {
  const progress = Math.min(1, Math.max(0, (frame - startFrame) / duration));

  const style: React.CSSProperties = { opacity: 0 };

  switch (entrance) {
    case "fadeIn": {
      style.opacity = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    }
    case "slideUp": {
      const translateY = interpolate(frame, [startFrame, startFrame + duration], [60, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      style.opacity = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      style.transform = `translateY(${translateY}px)`;
      break;
    }
    case "slideLeft": {
      const translateX = interpolate(frame, [startFrame, startFrame + duration], [100, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      style.opacity = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      style.transform = `translateX(${translateX}px)`;
      break;
    }
    case "springPop": {
      const scale = spring({
        frame: Math.max(0, frame - startFrame),
        fps: 30,
        from: 0,
        to: 1,
        config: easing.snappy,
      });
      style.opacity = frame >= startFrame ? 1 : 0;
      style.transform = `scale(${scale})`;
      break;
    }
  }

  return <div style={style}>{children}</div>;
};
