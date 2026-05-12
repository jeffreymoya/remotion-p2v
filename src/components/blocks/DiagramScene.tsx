import React from "react";
import { z } from "zod";
import { interpolate } from "remotion";
import { palette, font } from "../tokens";
import { DrawPath } from "../primitives";
import { FrameRange, transitionMixin } from "../../lib/scene-schema-primitives";
import type { BlockEntry } from "../../lib/component-catalog";

export const schema = z.object({
  type: z.literal("DiagramScene"),
  frameRange: FrameRange,
  title: z.string().optional(),
  nodes: z.array(z.object({ label: z.string(), x: z.number(), y: z.number() })),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() })).optional(),
  annotation: z.string().optional(),
  ...transitionMixin,
});

export const catalogEntry: BlockEntry = {
  name: "DiagramScene",
  role: "visual",
  guidelineSection: "§3 Visual — Diagram",
  whenToUse: "Shows relationships, flows, or structures between labeled concepts. Minimum 3 meaningful nodes.",
  effect: "Title fades in; nodes reveal staggered (one every 10 frames). Edge paths draw progressively if provided. Annotation fades in at the end.",
  props: {
    title: "string?: Optional diagram title",
    nodes: "{label: string, x: number, y: number}[]: Node list; x/y are percentage positions (0–100)",
    edges: "{from: string, to: string, label?: string}[]?: Connections between node labels",
    annotation: "string?: Summary text shown at the end",
  },
};

interface DiagramNode {
  label: string;
  x: number;
  y: number;
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

interface DiagramSceneProps {
  frameRange: [number, number];
  frame: number;
  title?: string;
  nodes: DiagramNode[];
  edges?: DiagramEdge[];
  annotation?: string;
}

export const DiagramScene: React.FC<DiagramSceneProps> = ({
  frameRange,
  frame,
  title,
  nodes,
  edges,
  annotation,
}) => {
  const localFrame = frame;
  const duration = frameRange[1] - frameRange[0];

  const titleOpacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: palette.bg,
        position: "relative",
        padding: 80,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            fontFamily: font.display,
            color: palette.text,
            marginBottom: 40,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          {title}
        </div>
      )}
      <div style={{ flex: 1, position: "relative" }}>
        {nodes.map((node, i) => {
          const nodeDelay = 15 + i * 10;
          const nodeOpacity = interpolate(localFrame, [nodeDelay, nodeDelay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={node.label}
              style={{
                position: "absolute",
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
                padding: "12px 24px",
                borderRadius: 12,
                backgroundColor: palette.card,
                border: `1px solid ${palette.accent}`,
                fontSize: 24,
                fontFamily: font.body,
                color: palette.text,
                opacity: nodeOpacity,
                whiteSpace: "nowrap",
              }}
            >
              {node.label}
            </div>
          );
        })}
      </div>
      {annotation && (
        <div
          style={{
            fontSize: 28,
            fontFamily: font.body,
            color: palette.muted,
            textAlign: "center",
            marginTop: 20,
            opacity: interpolate(localFrame, [duration - 30, duration - 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {annotation}
        </div>
      )}
    </div>
  );
};

export { DiagramScene as Component };
