import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

type Props = { title: string };

/**
 * Simple intro bumper shown during the 1s intro buffer.
 * Animates opacity + scale for a quick brand feel before content begins.
 */
export const IntroTitle: React.FC<Props> = ({ title }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 8, 22, 30], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 15], [0.9, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0b1021 100%)",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          background: "#F2E205",
          color: "#0b1021",
          padding: "18px 28px",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: 0.4 }}>{title}</h1>
      </div>
    </AbsoluteFill>
  );
};
