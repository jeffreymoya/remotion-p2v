import React from "react";

interface BeatSyncProps {
  frame: number;
  period?: number;
  amplitude?: number;
  axis?: "scale" | "translateY";
  children: React.ReactNode;
}

export const BeatSync: React.FC<BeatSyncProps> = ({
  frame,
  period = 30,
  amplitude = 0.05,
  axis = "scale",
  children,
}) => {
  const oscillation = Math.sin((frame * 2 * Math.PI) / period);

  const transform =
    axis === "scale"
      ? `scale(${1 + oscillation * amplitude})`
      : `translateY(${oscillation * amplitude * 20}px)`;

  return <div style={{ transform }}>{children}</div>;
};
