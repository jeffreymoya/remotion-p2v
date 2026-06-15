import React from "react";
import { ContextBar } from "./overlays/ContextBar";

interface DocuContextBarProps {
  cycleItems: string[];
  durationInFrames: number;
}

export const DocuContextBar: React.FC<DocuContextBarProps> = ({
  cycleItems,
  durationInFrames,
}) => {
  const itemDurationFrames =
    cycleItems.length > 0 ? Math.max(45, Math.floor(durationInFrames / cycleItems.length)) : 90;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64 }}>
      <ContextBar
        cycleItems={cycleItems}
        accent="#D97757"
        background="rgba(17,17,17,0.87)"
        textColor="#efe9dc"
        itemDurationFrames={itemDurationFrames}
        height={64}
      />
    </div>
  );
};
