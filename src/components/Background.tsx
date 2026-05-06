import React from "react";
import { AbsoluteFill, Img } from "remotion";
import type { BackgroundElement } from "../lib/types";

interface BackgroundProps {
  project: string;
  item: BackgroundElement;
}

export const Background: React.FC<BackgroundProps> = ({ project, item }) => {
  const bgColor = "#1a1a2e";

  if (item.imageUrl) {
    const src = item.imageUrl.startsWith("http")
      ? item.imageUrl
      : `projects/${project}/assets/${item.imageUrl}`;

    return (
      <AbsoluteFill>
        <Img
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
      }}
    />
  );
};
