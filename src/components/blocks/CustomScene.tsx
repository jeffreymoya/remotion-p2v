import React from "react";
import { palette, font } from "../tokens";

interface CustomSceneProps {
  frameRange: [number, number];
  frame: number;
  description: string;
  config: Record<string, unknown>;
}

/**
 * Deprecated escape-hatch block. Renders a visible warning so that
 * mis-typed scenes are immediately obvious during preview.
 * The LLM prompt no longer offers this block; if it still appears,
 * the scene JSON must be remapped to a typed block.
 */
export const CustomScene: React.FC<CustomSceneProps> = ({
  description,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2a0000",
        padding: 80,
        border: "4px solid #ff4444",
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          fontFamily: font.display,
          color: "#ff4444",
          marginBottom: 24,
        }}
      >
        ⚠ UNMAPPED SCENE
      </div>
      <div
        style={{
          fontSize: 28,
          fontFamily: font.body,
          color: palette.muted,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        {description}
      </div>
    </div>
  );
};
