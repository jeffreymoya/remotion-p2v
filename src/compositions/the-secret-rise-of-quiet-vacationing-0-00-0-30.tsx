// @ts-nocheck
import React, { useRef, useEffect, useState } from "react";
import {
  Composition,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
  AbsoluteFill,
} from "remotion";

// ---------- Color helpers ----------
function hexToRgb(hex: string) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function lerpColor(c1: string, c2: string, t: number) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bVal = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex(r, g, bVal);
}

// ---------- Background gradient ----------
const getBackgroundGradient = (frame: number) => {
  const purple = "#2b0c3b";
  const teal = "#1a8c8a";
  const orange = "#ff7e5f";
  const pink = "#feb47b";
  const oceanDeep = "#0a3d62";
  const oceanLight = "#3c6e71";

  if (frame < 120) {
    return `linear-gradient(135deg, ${purple}, ${teal})`;
  } else if (frame < 150) {
    const t = (frame - 120) / 30;
    const c1 = lerpColor(purple, orange, t);
    const c2 = lerpColor(teal, pink, t);
    return `linear-gradient(135deg, ${c1}, ${c2})`;
  } else if (frame < 800) {
    return `linear-gradient(135deg, ${orange}, ${pink})`;
  } else {
    return `linear-gradient(135deg, ${oceanDeep}, ${oceanLight})`;
  }
};

// ---------- Rough hand‑drawn line ----------
const getWavyPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments = 30,
  amplitude = 4,
  phase = 0.7
) => {
  let d = `M ${x1} ${y1}`;
  const dx = x2 - x1;
  const dy = y2 - y1;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    const perpX = -dy;
    const perpY = dx;
    const len = Math.sqrt(perpX * perpX + perpY * perpY);
    const normX = perpX / len;
    const normY = perpY / len;
    const offset = amplitude * Math.sin(t * Math.PI * 5 + phase);
    d += ` L ${x + normX * offset} ${y + normY * offset}`;
  }
  return d;
};

const RoughLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  progress: number;
  strokeWidth?: number;
}> = ({ x1, y1, x2, y2, color, progress, strokeWidth = 6 }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(100);
  const d = getWavyPath(x1, y1, x2, y2);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [d]);

  const dashOffset = pathLength * (1 - progress);

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
      }}
    >
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};

const RoughX: React.FC<{
  width: number;
  height: number;
  color: string;
  progress: number;
}> = ({ width, height, color, progress }) => {
  const w = width;
  const h = height;
  return (
    <div style={{ width, height, position: "relative" }}>
      <RoughLine x1={0} y1={0} x2={w} y2={h} color={color} progress={progress} />
      <RoughLine x1={w} y1={0} x2={0} y2={h} color={color} progress={progress} />
    </div>
  );
};

// ---------- Checkmark ----------
const CheckMark: React.FC<{ progress: number; size?: number; color?: string }> = ({
  progress,
  size = 60,
  color = "#00e676",
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(100);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const dashOffset = pathLength * (1 - progress);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        ref={pathRef}
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
};

// ---------- Speech bubble (No way!) ----------
const SpeechBubble: React.FC<{ text: string; left: number; top: number }> = ({
  text,
  left,
  top,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      background: "white",
      color: "#222",
      padding: "10px 15px",
      borderRadius: 12,
      fontSize: 24,
      fontWeight: "bold",
      boxShadow: "3px 3px 10px rgba(0,0,0,0.3)",
      transform: "rotate(-5deg)",
      whiteSpace: "nowrap",
    }}
  >
    {text}
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: "10px solid transparent",
        borderRight: "10px solid transparent",
        borderTop: "10px solid white",
        position: "absolute",
        bottom: -10,
        left: 20,
      }}
    />
  </div>
);

// ---------- Main composition component ----------
const BeatSyncedMotionCollage = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const beatFrames = 15;

  // Background
  const bgGradient = getBackgroundGradient(frame);

  // ---------- Scene 1 (0-150) ----------
  const scene1Opacity = interpolate(frame, [120, 150], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Desk cutout animation
  const tSlideIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const tShift = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let deskTranslateX = -300 + 300 * tSlideIn + 60 * tShift;
  const deskRotate = 5 * tSlideIn;
  let deskScale = (0.8 + 0.2 * tSlideIn) * (1 - 0.3 * tShift);

  // Shake during cross‑out (30‑40)
  const shakeIntensity = interpolate(frame, [30, 35, 40], [0, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const shakeX = 6 * Math.sin(frame * 1.5) * shakeIntensity;
  const shakeY = 4 * Math.cos(frame * 1.8) * shakeIntensity;
  deskTranslateX += shakeX;

  // Hidden question mark behind desk
  const qmOpacity = interpolate(frame, [75, 90], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // "Quiet Quitting" words
  const quietOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const quittingOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Red X
  const xProgress = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const xOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // "Quiet Vacationing"
  const vacSpring = spring({
    frame: frame - 75,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 120 },
  });
  const vacTranslateX = interpolate(vacSpring, [0, 1], [800, 0]);
  const vacOpacity = interpolate(frame, [75, 90], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // ---------- Scene 2 (150-450) ----------
  // "Imagine this:" typewriter
  const imagineText = "Imagine this:";
  const imagineCharCount = Math.floor(
    interpolate(frame, [150, 180], [0, imagineText.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  // Office cutouts entrance timings
  const laptopT = interpolate(frame, [180, 200], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const laptopTranslateY = 400 * (1 - laptopT);
  const laptopOpacity = laptopT;

  const envSpring = spring({
    frame: frame - 195,
    fps,
    config: { damping: 12, mass: 0.8 },
  });
  const envTranslateX = interpolate(envSpring, [0, 1], [-400, 0]);
  const envOpacity = interpolate(frame, [195, 210], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const autoSpring = spring({
    frame: frame - 210,
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const autoScale = interpolate(autoSpring, [0, 1], [0, 1]);
  const autoOpacity = interpolate(frame, [210, 225], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const clockSpring = spring({
    frame: frame - 210,
    fps,
    config: { damping: 15, mass: 0.9 },
  });
  const clockTranslateX = interpolate(clockSpring, [0, 1], [400, 0]);
  const clockRotate = interpolate(clockSpring, [0, 1], [2000, 0]);
  const clockOpacity = interpolate(frame, [210, 225], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Beat dance offset
  const beatDance = 3 * Math.sin((frame * 2 * Math.PI) / beatFrames);

  // Send / checkmark transition
  const sendScale = spring({
    frame: frame - 270,
    fps,
    config: { damping: 10 },
  });
  const sendProgress = interpolate(frame, [270, 285], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const checkStart = interpolate(frame, [285, 300], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Dissolve transition 300‑330
  const dissolveT = interpolate(frame, [300, 330], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const officeFadeOut = 1 - dissolveT;

  // Beach collage
  const beachScale = interpolate(dissolveT, [0, 1], [0.5, 1]);
  const beachOpacity = dissolveT;
  // Beach breath after 330
  let beachScaleFinal = beachScale;
  if (frame >= 330) {
    beachScaleFinal = 1 + 0.02 * Math.sin((frame * 2 * Math.PI) / beatFrames);
  }
  const waveShadowX = 5 * Math.sin(frame * 0.1);

  // Sunglasses
  const sunSpring = spring({
    frame: frame - 360,
    fps,
    config: { damping: 8, mass: 1, stiffness: 150 },
  });
  const sunTranslateY = interpolate(sunSpring, [0, 1], [-300, 0]);

  // Mini laptop
  const miniLaptopSpring = spring({
    frame: frame - 360,
    fps,
    config: { damping: 10 },
  });
  const miniLaptopScale = interpolate(miniLaptopSpring, [0, 1], [0, 0.15]);
  const greenDotPulse = 1 + 0.3 * Math.sin((frame * 2 * Math.PI) / beatFrames);

  // Scene 2 group opacity (office portion)
  const scene2OfficeOpacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // ---------- Scene 3 (450-600) ----------
  const checklistSlide = spring({
    frame: frame - 450,
    fps,
    config: { damping: 14 },
  });
  const checklistX = interpolate(checklistSlide, [0, 1], [-500, 0]);

  // Type‑on for checklist items
  const item1Text = "PTO Request";
  const item2Text = "Out‑of‑Office";
  const item3Text = "Green dot on Slack";
  const item1Chars = Math.floor(
    interpolate(frame, [455, 470], [0, item1Text.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );
  const item2Chars = Math.floor(
    interpolate(frame, [465, 480], [0, item2Text.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );
  const item3Chars = Math.floor(
    interpolate(frame, [475, 490], [0, item3Text.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  // Cross‑out on first two items
  const xItem1Progress = interpolate(frame, [480, 495], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const xItem2Progress = interpolate(frame, [510, 525], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Denied stamp
  const stampScale = spring({
    frame: frame - 485,
    fps,
    config: { damping: 10, stiffness: 150 },
  });
  const deniedScale = interpolate(stampScale, [0, 1], [0, 1]);

  // No way bubble
  const noWayAppear = interpolate(frame, [510, 520], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Slack panel zoom
  const slackSpring = spring({
    frame: frame - 540,
    fps,
    config: { damping: 12, stiffness: 120 },
  });
  const slackScale = interpolate(slackSpring, [0, 1], [0.5, 1]);
  const slackTranslateX = interpolate(slackSpring, [0, 1], [300, 0]);

  // Green dot pulse (overlay on slack panel)
  const slackDotPulse = 1 + 0.4 * Math.sin((frame * 2 * Math.PI) / beatFrames);

  // Sunglasses slide into panel
  const sunSlideSpring = spring({
    frame: frame - 555,
    fps,
    config: { damping: 10, mass: 0.7 },
  });
  const sunSlideX = interpolate(sunSlideSpring, [0, 1], [-60, 0]);

  // ---------- Scene 4 (600-900) ----------
  // Slack panel shrink to corner
  const slackShrinkT = interpolate(frame, [600, 620], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const slackCornerScale = 1 - 0.8 * slackShrinkT;
  const slackCornerX = 750 * slackShrinkT; // move to bottom right
  const slackCornerY = 450 * slackShrinkT;

  // Question marks
  const qm1Spring = spring({
    frame: frame - 600,
    fps,
    config: { damping: 12 },
  });
  const qm2Spring = spring({
    frame: frame - 615,
    fps,
    config: { damping: 12 },
  });
  const qm3Spring = spring({
    frame: frame - 630,
    fps,
    config: { damping: 12 },
  });
  const qm4Spring = spring({
    frame: frame - 645,
    fps,
    config: { damping: 12 },
  });
  const qm1X = interpolate(qm1Spring, [0, 1], [-200, 0]);
  const qm2X = interpolate(qm2Spring, [0, 1], [200, 0]);
  const qm3Y = interpolate(qm3Spring, [0, 1], [-200, 0]);
  const qm4Y = interpolate(qm4Spring, [0, 1], [200, 0]);
  const qmPulse = 1 + 0.05 * Math.sin((frame * 2 * Math.PI) / beatFrames);
  const qmRotate = 10 * Math.sin(frame * 0.2);

  // Worker silhouette
  const silhOpacity = interpolate(frame, [630, 645], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Worker mosaic grid
  const mosaicImages = [
    staticFile("images/worker_cafe.png"),
    staticFile("images/worker_beach.png"),
    staticFile("images/worker_sofa.png"),
    staticFile("images/worker_cafe.png"),
    staticFile("images/worker_beach.png"),
    staticFile("images/worker_sofa.png"),
  ];

  const mosaicStartFrame = 660;
  const mosaicTiles = mosaicImages.map((src, i) => {
    const delay = i * 15;
    const start = mosaicStartFrame + delay;
    const tileSpring = spring({
      frame: frame - start,
      fps,
      config: { damping: 12, mass: 0.8 },
    });
    const slideY = interpolate(tileSpring, [0, 1], [200, 0]);
    const opacity = interpolate(frame, [start, start + 10], [0, 1], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    });
    const wiggleY =
      frame >= start + 5
        ? 5 * Math.sin(frame * 2 + i * 1.5)
        : 0;
    return {
      src,
      slideY,
      opacity,
      wiggleY,
    };
  });

  // "Why?" text
  const whySpring = spring({
    frame: frame - 720,
    fps,
    config: { damping: 8, stiffness: 150 },
  });
  const whyScale = interpolate(whySpring, [0, 1], [0, 1]);
  const whyRotate = interpolate(whySpring, [0, 1], [-10, 0]);
  const whyFadeOut = interpolate(frame, [750, 760], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Diving board
  const boardSpring = spring({
    frame: frame - 750,
    fps,
    config: { damping: 8, mass: 1, stiffness: 120 },
  });
  const boardY = interpolate(boardSpring, [0, 1], [-400, 0]);

  // Swim trunks person walk
  const personWalkX = interpolate(frame, [750, 780], [-200, 280], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Diver jump
  const jumpProgress = interpolate(frame, [800, 805, 810], [0, 1, 2], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  let diverX = 0;
  let diverY = 0;
  let diverRotate = 0;
  let diverOpacity = 1;
  if (jumpProgress <= 1) {
    diverX = interpolate(jumpProgress, [0, 1], [280, 150]);
    diverY = interpolate(jumpProgress, [0, 1], [0, -120]);
    diverRotate = interpolate(jumpProgress, [0, 1], [0, -20]);
  } else {
    const p = jumpProgress - 1;
    diverX = interpolate(p, [0, 1], [150, -50]);
    diverY = interpolate(p, [0, 1], [-120, 150]);
    diverRotate = interpolate(p, [0, 1], [-20, 30]);
    diverOpacity = interpolate(p, [0, 0.8], [1, 0], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    });
  }

  // Splash
  const splashScale = spring({
    frame: frame - 810,
    fps,
    config: { damping: 5, stiffness: 200 },
  });
  const splashFinalScale = interpolate(splashScale, [0, 1], [0.2, 1.5]);

  // Ripple effect
  const rippleProgress = interpolate(frame, [810, 840], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const rippleSize = rippleProgress * 2800;
  const rippleOpacity = 1 - rippleProgress;

  // "Let's dive in." typewriter
  const diveText = "Let’s dive in.";
  const diveChars = Math.floor(
    interpolate(frame, [800, 830], [0, diveText.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    })
  );

  // Final zoom & fade
  const finalZoom = interpolate(frame, [850, 890], [1, 1.1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const fadeToBlackOpacity = interpolate(frame, [880, 900], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: bgGradient, overflow: "hidden" }}>
      {/* ========== SCENE 1 (0–150) ========== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene1Opacity,
          pointerEvents: "none",
        }}
      >
        {/* Hidden question mark behind desk */}
        <div
          style={{
            position: "absolute",
            left: "18%",
            top: "45%",
            width: 200,
            opacity: qmOpacity,
            filter: "drop-shadow(4px 4px 4px rgba(0,0,0,0.4))",
          }}
        >
          <Img src={staticFile("images/question_mark.png")} style={{ width: "100%" }} />
        </div>

        {/* Desk cutout */}
        <div
          style={{
            position: "absolute",
            left: "18%",
            top: "45%",
            transform: `translate(${deskTranslateX}px, ${shakeY}px) rotate(${deskRotate}deg) scale(${deskScale})`,
            transformOrigin: "center center",
            filter: "drop-shadow(8px 8px 6px rgba(0,0,0,0.4))",
            zIndex: 1,
          }}
        >
          <Img src={staticFile("images/desk_laptop.png")} style={{ width: 400 }} />
        </div>

        {/* "Quiet Quitting" text */}
        <div
          style={{
            position: "absolute",
            left: "32%",
            top: "20%",
            fontSize: 80,
            fontFamily: "'Arial Black', sans-serif",
            fontWeight: 900,
            color: "white",
            textShadow: "3px 3px 10px rgba(0,0,0,0.5)",
            display: "flex",
            gap: 30,
          }}
        >
          <span style={{ opacity: quietOpacity }}>Quiet</span>
          <span style={{ opacity: quittingOpacity }}>Quitting</span>
        </div>

        {/* Red X cross‑out */}
        <div
          style={{
            position: "absolute",
            left: "32%",
            top: "20%",
            width: 460,
            height: 100,
            opacity: xOpacity,
          }}
        >
          <RoughX width={460} height={100} color="#ff2244" progress={xProgress} />
        </div>

        {/* "Quiet Vacationing" */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "32%",
            transform: `translateX(calc(-50% + ${vacTranslateX}px))`,
            opacity: vacOpacity,
            fontSize: 70,
            fontFamily: "'Arial Black', sans-serif",
            fontWeight: 900,
            color: "white",
            textShadow: "3px 3px 10px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          Quiet Vacationing
        </div>
      </div>

      {/* ========== SCENE 2 (150–450) ========== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [150, 160], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          pointerEvents: "none",
        }}
      >
        {/* "Imagine this:" typewriter */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "8%",
            transform: "translateX(-50%)",
            fontSize: 75,
            fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive",
            color: "white",
            textShadow: "3px 3px 8px rgba(0,0,0,0.5)",
          }}
        >
          {imagineText.slice(0, imagineCharCount)}
        </div>

        {/* Office scene group */}
        <div style={{ opacity: scene2OfficeOpacity, pointerEvents: "none" }}>
          {/* Laptop */}
          <div
            style={{
              position: "absolute",
              left: "30%",
              top: "55%",
              transform: `translateY(${laptopTranslateY + beatDance}px)`,
              opacity: laptopOpacity,
              filter: "drop-shadow(6px 6px 5px rgba(0,0,0,0.3))",
            }}
          >
            <Img
              src={staticFile("images/laptop_calendar.png")}
              style={{ width: 350 }}
            />
          </div>

          {/* Envelope */}
          <div
            style={{
              position: "absolute",
              left: "40%",
              top: "35%",
              transform: `translateX(${envTranslateX}px) translateY(${beatDance}px)`,
              opacity: envOpacity,
              filter: "drop-shadow(6px 6px 5px rgba(0,0,0,0.3))",
            }}
          >
            <Img src={staticFile("images/envelope.png")} style={{ width: 130 }} />
          </div>

          {/* Auto‑send schedule */}
          <div
            style={{
              position: "absolute",
              left: "42%",
              top: "50%",
              transform: `scale(${autoScale}) translateY(${beatDance}px)`,
              opacity: autoOpacity,
              filter: "drop-shadow(6px 6px 5px rgba(0,0,0,0.3))",
            }}
          >
            <Img
              src={staticFile("images/auto_send_schedule.png")}
              style={{ width: 160 }}
            />
          </div>

          {/* Clock */}
          <div
            style={{
              position: "absolute",
              left: "65%",
              top: "25%",
              transform: `translateX(${clockTranslateX}px) rotate(${clockRotate}deg) translateY(${beatDance}px)`,
              opacity: clockOpacity,
              filter: "drop-shadow(6px 6px 5px rgba(0,0,0,0.3))",
            }}
          >
            <Img src={staticFile("images/clock.png")} style={{ width: 120 }} />
          </div>

          {/* Send / checkmark transition on laptop screen */}
          <div
            style={{
              position: "absolute",
              left: "39%",
              top: "58%",
              width: 160,
              height: 100,
              opacity: sendProgress,
            }}
          >
            <div
              style={{
                transform: `scale(${1 + sendProgress * 0.2})`,
                transformOrigin: "center",
              }}
            >
              <Img
                src={staticFile("images/auto_send_schedule.png")}
                style={{ width: 160 }}
              />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: "44%",
              top: "60%",
              width: 60,
              height: 60,
              opacity: checkStart,
            }}
          >
            <CheckMark progress={checkStart} />
          </div>

          {/* Dissolve out office elements */}
          {dissolveT > 0 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: "30%",
                  top: "55%",
                  transform: `translate(${-dissolveT * 200}px, ${
                    -dissolveT * 200
                  }px) scale(${1 - dissolveT})`,
                  opacity: officeFadeOut,
                  filter: "drop-shadow(6px 6px 5px rgba(0,0,0,0.3))",
                }}
              >
                <Img
                  src={staticFile("images/laptop_calendar.png")}
                  style={{ width: 350 }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "40%",
                  top: "35%",
                  transform: `translate(${dissolveT * 200}px, ${
                    -dissolveT * 200
                  }px) scale(${1 - dissolveT})`,
                  opacity: officeFadeOut,
                }}
              >
                <Img
                  src={staticFile("images/envelope.png")}
                  style={{ width: 130 }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "65%",
                  top: "25%",
                  transform: `translate(${-dissolveT * 200}px, ${
                    dissolveT * 200
                  }px) scale(${1 - dissolveT})`,
                  opacity: officeFadeOut,
                }}
              >
                <Img src={staticFile("images/clock.png")} style={{ width: 120 }} />
              </div>
            </>
          )}
        </div>

        {/* Beach collage entry */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "55%",
            width: 800,
            transform: `translate(-50%, -50%) scale(${beachScaleFinal}) translateX(${waveShadowX}px)`,
            opacity: beachOpacity,
            filter: "drop-shadow(10px 10px 8px rgba(0,0,0,0.4))",
          }}
        >
          <Img src={staticFile("images/beach_collage.png")} style={{ width: "100%" }} />
        </div>

        {/* Sunglasses drop */}
        <div
          style={{
            position: "absolute",
            left: "70%",
            top: "12%",
            transform: `translateY(${sunTranslateY}px) rotate(-15deg)`,
            filter: "drop-shadow(6px 6px 6px rgba(0,0,0,0.4))",
          }}
        >
          <Img src={staticFile("images/sunglasses.png")} style={{ width: 180 }} />
        </div>

        {/* Mini laptop with green dot */}
        <div
          style={{
            position: "absolute",
            left: "3%",
            bottom: "3%",
            transform: `scale(${miniLaptopScale})`,
            transformOrigin: "bottom left",
            filter: "drop-shadow(6px 6px 6px rgba(0,0,0,0.4))",
          }}
        >
          <Img
            src={staticFile("images/laptop_calendar.png")}
            style={{ width: 350 }}
          />
          {/* Green dot overlay */}
          <div
            style={{
              position: "absolute",
              left: "22%",
              top: "18%",
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#00e676",
              transform: `scale(${greenDotPulse})`,
              boxShadow: "0 0 12px #00e676",
            }}
          />
        </div>
      </div>

      {/* ========== SCENE 3 (450–600) ========== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [450, 460], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          pointerEvents: "none",
        }}
      >
        {/* Checklist with background image and text overlay */}
        <div
          style={{
            position: "absolute",
            left: "10%",
            top: "30%",
            width: 450,
            transform: `translateX(${checklistX}px)`,
            filter: "drop-shadow(8px 8px 8px rgba(0,0,0,0.4))",
          }}
        >
          <Img
            src={staticFile("images/checklist.png")}
            style={{ width: "100%" }}
          />
          {/* Item texts positioned over the lines */}
          <div
            style={{
              position: "absolute",
              left: "20%",
              top: "15%",
              fontFamily: "'Courier New', monospace",
              fontSize: 28,
              fontWeight: "bold",
              color: "#222",
              transform: "translateY(-5px)",
            }}
          >
            {item1Text.slice(0, item1Chars)}
          </div>
          <div
            style={{
              position: "absolute",
              left: "20%",
              top: "40%",
              fontFamily: "'Courier New', monospace",
              fontSize: 28,
              fontWeight: "bold",
              color: "#222",
            }}
          >
            {item2Text.slice(0, item2Chars)}
          </div>
          <div
            style={{
              position: "absolute",
              left: "20%",
              top: "65%",
              fontFamily: "'Courier New', monospace",
              fontSize: 28,
              fontWeight: "bold",
              color:
                frame >= 525 ? "#00e676" : "#222",
              transform: `scale(${frame >= 525 ? 1 + 0.2 * Math.sin((frame * 2 * Math.PI) / beatFrames) : 1})`,
            }}
          >
            {item3Text.slice(0, item3Chars)}
          </div>

          {/* Cross‑outs */}
          {frame >= 480 && (
            <div
              style={{
                position: "absolute",
                left: "18%",
                top: "10%",
                width: 300,
                height: 40,
                opacity: xItem1Progress,
              }}
            >
              <RoughX width={300} height={40} color="#ff2244" progress={xItem1Progress} />
            </div>
          )}
          {frame >= 510 && (
            <div
              style={{
                position: "absolute",
                left: "18%",
                top: "35%",
                width: 300,
                height: 40,
                opacity: xItem2Progress,
              }}
            >
              <RoughX width={300} height={40} color="#ff2244" progress={xItem2Progress} />
            </div>
          )}

          {/* Denied stamp */}
          {frame >= 485 && (
            <div
              style={{
                position: "absolute",
                right: "5%",
                top: "0%",
                width: 100,
                transform: `scale(${deniedScale}) rotate(-10deg)`,
              }}
            >
              <Img
                src={staticFile("images/denied_stamp.png")}
                style={{ width: "100%" }}
              />
            </div>
          )}

          {/* No way bubble */}
          {frame >= 510 && (
            <div style={{ opacity: noWayAppear }}>
              <SpeechBubble text="No way!" left={-40} top={-10} />
            </div>
          )}
        </div>

        {/* Slack panel zoom in */}
        {frame >= 540 && (
          <div
            style={{
              position: "absolute",
              right: "5%",
              top: "25%",
              width: 550,
              transform: `translateX(${slackTranslateX}px) scale(${slackScale})`,
              filter: "drop-shadow(10px 10px 12px rgba(0,0,0,0.5))",
              zIndex: 2,
            }}
          >
            {/* Slack panel image */}
            <NoSpacer>
              <div style={{ position: "relative" }}>
                <Img
                  src={staticFile("images/slack_panel.png")}
                  style={{ width: "100%" }}
                />
                {/* Green dot pulsing overlay */}
                <div
                  style={{
                    position: "absolute",
                    left: "10%",
                    top: "8%",
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "#00e676",
                    boxShadow: "0 0 15px #00e676",
                    transform: `scale(${slackDotPulse})`,
                  }}
                />
                {/* Sunglasses sliding onto avatar */}
                <div
                  style={{
                    position: "absolute",
                    left: "8%",
                    top: "5%",
                    width: 65,
                    transform: `translateX(${sunSlideX}px)`,
                  }}
                >
                  <Img
                    src={staticFile("images/sunglasses.png")}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </NoSpacer>
          </div>
        )}
      </div>

      {/* ========== SCENE 4 (600–900) ========== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${finalZoom})`,
          opacity: interpolate(frame, [600, 610], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          }),
          pointerEvents: "none",
        }}
      >
        {/* Shrinking slack panel to corner */}
        {frame < 620 && (
          <div
            style={{
              position: "absolute",
              right: "5%",
              top: "25%",
              width: 550,
              transform: `translate(${slackCornerX}px, ${slackCornerY}px) scale(${slackCornerScale})`,
              filter: "drop-shadow(10px 10px 12px rgba(0,0,0,0.5))",
            }}
          >
            <Img
              src={staticFile("images/slack_panel.png")}
              style={{ width: "100%" }}
            />
          </div>
        )}

        {/* Question marks */}
        <div
          style={{
            position: "absolute",
            left: "20%",
            top: "30%",
            transform: `translateX(${qm1X}px) rotate(${qmRotate}deg) scale(${qmPulse})`,
            filter: "drop-shadow(4px 4px 4px rgba(0,0,0,0.4))",
          }}
        >
          <Img
            src={staticFile("images/question_mark.png")}
            style={{ width: 80 }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: "70%",
            top: "20%",
            transform: `translateX(${qm2X}px) rotate(${-qmRotate}deg) scale(${qmPulse})`,
            filter: "drop-shadow(4px 4px 4px rgba(0,0,0,0.4))",
          }}
        >
          <Img
            src={staticFile("images/question_mark.png")}
            style={{ width: 80 }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: "40%",
            top: "10%",
            transform: `translateY(${qm3Y}px) rotate(${qmRotate * 0.8}deg) scale(${qmPulse})`,
            filter: "drop-shadow(4px 4px 4px rgba(0,0,0,0.4))",
          }}
        >
          <Img
            src={staticFile("images/question_mark.png")}
            style={{ width: 80 }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: "55%",
            top: "75%",
            transform: `translateY(${qm4Y}px) rotate(${-qmRotate * 0.7}deg) scale(${qmPulse})`,
            filter: "drop-shadow(4px 4px 4px rgba(0,0,0,0.4))",
          }}
        >
          <Img
            src={staticFile("images/question_mark.png")}
            style={{ width: 80 }}
          />
        </div>

        {/* Thoughtful worker silhouette */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "45%",
            transform: "translate(-50%, -50%)",
            opacity: silhOpacity,
          }}
        >
          <Img
            src={staticFile("images/worker_silhouette.png")}
            style={{ width: 250, filter: "drop-shadow(6px 6px 6px rgba(0,0,0,0.5))" }}
          />
        </div>

        {/* Worker mosaic grid */}
        <div
          style={{
            position: "absolute",
            left: "10%",
            top: "20%",
            width: "80%",
            height: "70%",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: 20,
            opacity: interpolate(frame, [660, 680], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
          }}
        >
          {mosaicTiles.map((tile, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                transform: `translateY(${tile.slideY + tile.wiggleY}px)`,
                opacity: tile.opacity,
              }}
            >
              <Img
                src={tile.src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(6px 6px 6px rgba(0,0,0,0.4))",
                }}
              />
            </div>
          ))}
        </div>

        {/* "Why?" text */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${whyScale}) rotate(${whyRotate}deg)`,
            fontSize: 180,
            fontFamily: "'Impact', sans-serif",
            fontWeight: "bold",
            color: "white",
            textShadow: "5px 5px 15px rgba(0,0,0,0.7)",
            opacity: whyFadeOut,
          }}
        >
          Why?
        </div>

        {/* Diving board */}
        <div
          style={{
            position: "absolute",
            left: "55%",
            top: "55%",
            width: 400,
            transform: `translateY(${boardY}px)`,
            filter: "drop-shadow(8px 8px 8px rgba(0,0,0,0.4))",
          }}
        >
          <Img
            src={staticFile("images/diving_board.png")}
            style={{ width: "100%" }}
          />
        </div>

        {/* Swim trunks person walking */}
        <div
          style={{
            position: "absolute",
            left: `${personWalkX}px`,
            top: "45%",
            width: 130,
            filter: "drop-shadow(4px 4px 4px rgba(0,0,0,0.4))",
            zIndex: 2,
          }}
        >
          <Img
            src={staticFile("images/swim_trunks_person.png")}
            style={{ width: "100%" }}
          />
        </div>

        {/* Diver jump */}
        <div
          style={{
            position: "absolute",
            left: `${280 + diverX}px`,
            top: "45%",
            width: 130,
            transform: `translateY(${diverY}px) rotate(${diverRotate}deg)`,
            opacity: diverOpacity,
            filter: "drop-shadow(4px 4px 4px rgba(0,0,0,0.4))",
            zIndex: 3,
          }}
        >
          <Img
            src={staticFile("images/swim_trunks_person.png")}
            style={{ width: "100%" }}
          />
        </div>

        {/* Splash */}
        <div
          style={{
            position: "absolute",
            left: "25%",
            top: "65%",
            width: 300,
            transform: `scale(${splashFinalScale})`,
            filter: "drop-shadow(0 0 20px rgba(255,255,255,0.6))",
            zIndex: 4,
          }}
        >
          <Img src={staticFile("images/splash.png")} style={{ width: "100%" }} />
        </div>

        {/* Ripple effect */}
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: "70%",
            width: rippleSize,
            height: rippleSize,
            border: "6px solid rgba(255,255,255,0.5)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            opacity: rippleOpacity,
            zIndex: 5,
            pointerEvents: "none",
          }}
        />

        {/* "Let's dive in." text */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 70,
            fontFamily: "'Arial Black', sans-serif",
            fontWeight: 900,
            color: "white",
            textShadow: "0 0 20px #00aaff, 0 0 40px #00aaff",
            letterSpacing: 4,
            opacity: interpolate(frame, [800, 810], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
          }}
        >
          {diveText.slice(0, diveChars)}
        </div>
      </div>

      {/* Final fade to black */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "black",
          opacity: fadeToBlackOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// Helper to avoid interfering with AbsoluteFill
const NoSpacer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

export default function BeatSyncedMotionCollageComposition() {
  return (
    <>
      <Composition
        id="beat-synced-motion-collage"
        component={BeatSyncedMotionCollage}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
}