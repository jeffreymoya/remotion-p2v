import React from "react";
import { AbsoluteFill } from "remotion";
import { TitleCard } from "./cards/TitleCard";

interface DocuTitleCardProps {
  title: string;
  subtitle: string;
  durationInFrames: number;
}

export const DocuTitleCard: React.FC<DocuTitleCardProps> = ({
  title,
  subtitle,
}) => {
  return (
    <AbsoluteFill style={{ background: "rgba(0,0,0,0.28)" }}>
      <TitleCard
        num="01"
        name="Title Card"
        meta="Episode Opener"
        eyebrow="Documentary Sequence"
        line1={title}
        line2={subtitle || " "}
        metaItems={subtitle ? [subtitle] : []}
        accent="#D97757"
        textColor="#efe9dc"
        secondaryColor="rgba(239,233,220,0.72)"
        mutedColor="#8a847a"
        eyebrowSize={26}
        line2Size={60}
      />
    </AbsoluteFill>
  );
};
