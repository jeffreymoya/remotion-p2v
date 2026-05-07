// @ts-nocheck
import { Composition } from 'remotion';
import { staticFile } from 'remotion';
import { useCurrentFrame } from 'remotion';
import { useVideoConfig } from 'remotion';
import { interpolate } from 'remotion';
import { spring } from 'remotion';
import { AbsoluteFill } from 'remotion';

const TheHookComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Background
  const bgTranslateX = interpolate(frame, [0, 900], [0, -0.05 * width], {
    extrapolateRight: 'clamp',
  });
  const blurAmount = interpolate(frame, [150, 210], [5, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scene 1 (0–300)
  const scene1Opacity = interpolate(frame, [300, 320], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const laptopScale = interpolate(frame, [0, 300], [0.8, 1.1], {
    extrapolateRight: 'clamp',
  });
  const laptopRotateY = interpolate(frame, [0, 300], [0, 8], {
    extrapolateRight: 'clamp',
  });
  const textOpacity = (() => {
    if (frame >= 60 && frame <= 90) return interpolate(frame, [60, 90], [0, 1]);
    if (frame >= 240 && frame <= 270) return interpolate(frame, [240, 270], [1, 0]);
    return 0;
  })();
  const textTranslateY = interpolate(frame, [60, 90], [20, 0], {
    extrapolateRight: 'clamp',
  });

  // Scene 2 (300–600)
  const scene2Opacity = interpolate(frame, [300, 320], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phoneTranslateX = interpolate(frame, [300, 400], [200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phoneWobble = Math.sin(frame * 15) * 1; // small oscillation
  const palmRotation = Math.sin(frame * 0.05) * 3;

  const showHandA =
    frame >= 300 &&
    frame <= 600 &&
    Math.floor((frame - 300) / 6) % 2 === 0;

  // Notification bubble
  const bubbleScale = spring({
    frame: frame - 350,
    fps,
    config: { damping: 10, stiffness: 200 },
  });
  const bubbleOpacity =
    frame >= 410
      ? interpolate(frame, [410, 425], [1, 0], { extrapolateRight: 'clamp' })
      : 1;

  // Scene 3 (620–900)
  const scene3Opacity = interpolate(frame, [840, 900], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scene3Scale = interpolate(frame, [620, 900], [1.3, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const jigglerTranslateX =
    frame >= 620 ? Math.sin((frame - 620) * (2 * Math.PI) / 30) * 20 : 0;
  const dotPulseScale =
    frame >= 620 ? 1 + (Math.sin(frame * (2 * Math.PI) / 60) + 1) * 0.1 : 1;

  const arrowOpacity = (() => {
    if (frame >= 750 && frame <= 840) {
      if (frame <= 780) return interpolate(frame, [750, 780], [0, 1]);
      if (frame >= 810 && frame <= 840)
        return interpolate(frame, [810, 840], [1, 0]);
      return 1;
    }
    return 0;
  })();

  // Whip‑pan (600–610)
  const isWhipPan = frame >= 600 && frame <= 610;
  const whipPanRotateY = interpolate(
    frame,
    [600, 610],
    [0, 360],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const whipPanBlur = interpolate(
    frame,
    [600, 610],
    [0, 5],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Scene visibility
  const showScene1 = frame < 320;
  const showScene2 = frame >= 300 && frame < 600;
  const showScene3 = frame >= 620;

  // Fade‑to‑black overlay
  const fadeToBlack = interpolate(frame, [840, 900], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width, height, perspective: '1200px', overflow: 'hidden' }}>
      <div
        style={{
          transform: `rotateY(${isWhipPan ? whipPanRotateY : 0}deg)`,
          filter: isWhipPan ? `blur(${whipPanBlur}px)` : 'none',
          position: 'absolute',
          width: '100%',
          height: '100%',
          transformOrigin: 'center center',
        }}
      >
        {/* Always‑on background */}
        <AbsoluteFill style={{ background: '#000' }}>
          <img
            src={staticFile('/images/beach.jpg')}
            style={{
              width: '110%',
              height: '110%',
              transform: `translateX(${bgTranslateX}px)`,
              filter: `blur(${blurAmount}px)`,
            }}
          />
        </AbsoluteFill>

        {/* Scene 1 – Laptop on beach towel */}
        {showScene1 && (
          <AbsoluteFill style={{ opacity: scene1Opacity }}>
            {/* Towel */}
            <img
              src={staticFile('/images/towel.png')}
              style={{
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
              }}
            />
            {/* Laptop group */}
            <div
              style={{
                position: 'absolute',
                bottom: '25%',
                left: '50%',
                transform: `translate(-50%, 0) scale(${laptopScale}) rotateY(${laptopRotateY}deg)`,
                transformOrigin: 'bottom right',
              }}
            >
              <img
                src={staticFile('/images/laptop.png')}
                style={{ width: '400px' }}
              />
              {/* Screen mockup and green dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                }}
              >
                <img
                  src={staticFile('/images/slack-screen.png')}
                  style={{ width: '100%', height: 'auto' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#4CAF50',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px #4CAF50',
                  }}
                />
              </div>
            </div>
            {/* Title text */}
            <div
              style={{
                position: 'absolute',
                top: '15%',
                left: '50%',
                transform: `translate(-50%, ${textTranslateY}px)`,
                opacity: textOpacity,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '80px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontFamily: 'sans-serif',
              }}
            >
              Quiet Vacationing
            </div>
          </AbsoluteFill>
        )}

        {/* Scene 2 – Smartphone under palm tree */}
        {showScene2 && (
          <AbsoluteFill style={{ opacity: scene2Opacity }}>
            {/* Palm tree */}
            <img
              src={staticFile('/images/palm-tree.png')}
              style={{
                position: 'absolute',
                left: '5%',
                top: '0',
                height: '100%',
                transform: `rotate(${palmRotation}deg)`,
                transformOrigin: 'bottom left',
              }}
            />
            {/* Phone & hands group */}
            <div
              style={{
                position: 'absolute',
                right: '20%',
                top: '50%',
                transform: `translate(${phoneTranslateX}px, -50%) rotate(${phoneWobble}deg)`,
              }}
            >
              {/* Phone mockup */}
              <img
                src={staticFile('/images/phone-calendar.png')}
                style={{ width: '300px' }}
              />
              {/* Typing hands */}
              {showHandA ? (
                <img
                  src={staticFile('/images/hand-typing-A.png')}
                  style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    width: '80%',
                    transform: 'translateX(-50%)',
                  }}
                />
              ) : (
                <img
                  src={staticFile('/images/hand-typing-B.png')}
                  style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    width: '80%',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
            </div>
            {/* Notification bubble */}
            {frame >= 350 && frame <= 425 && (
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  right: '15%',
                  transform: `scale(${bubbleScale})`,
                  opacity: bubbleOpacity,
                  background: '#333',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  fontSize: '18px',
                }}
              >
                Emails Scheduled ✅
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* Scene 3 – Mouse jiggler close‑up */}
        {showScene3 && (
          <AbsoluteFill style={{ opacity: scene3Opacity }}>
            {/* Desk background */}
            <img
              src={staticFile('/images/desk.jpg')}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
            {/* Monitor (blurred) with pulsing green dot */}
            <div
              style={{
                position: 'absolute',
                top: '10%',
                right: '10%',
                width: '400px',
                transform: 'rotate(-5deg)',
                filter: 'blur(10px)',
              }}
            >
              <img
                src={staticFile('/images/monitor.png')}
                style={{ width: '100%' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '20%',
                  right: '15%',
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#4CAF50',
                  borderRadius: '50%',
                  transform: `scale(${dotPulseScale})`,
                  boxShadow: '0 0 8px #4CAF50',
                }}
              />
            </div>
            {/* Mouse jiggler */}
            <div
              style={{
                position: 'absolute',
                bottom: '20%',
                left: '50%',
                transform: `translate(-50%, 0) scale(${scene3Scale})`,
              }}
            >
              <div
                style={{
                  width: '200px',
                  height: '80px',
                  background: '#888',
                  borderRadius: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={staticFile('/images/mouse.png')}
                  style={{
                    position: 'absolute',
                    width: '40px',
                    top: '20px',
                    left: '50%',
                    transform: `translate(-50%, 0) translateX(${jigglerTranslateX}px)`,
                  }}
                />
              </div>
            </div>
            {/* Arrow text */}
            {frame >= 750 && frame <= 840 && (
              <div
                style={{
                  position: 'absolute',
                  top: '25%',
                  right: '5%',
                  color: 'white',
                  fontSize: '24px',
                  opacity: arrowOpacity,
                  transform: 'rotate(-10deg)',
                }}
              >
                ← Green active dot
              </div>
            )}
          </AbsoluteFill>
        )}

        {/* Fade‑to‑black overlay */}
        <AbsoluteFill
          style={{
            background: 'black',
            opacity: fadeToBlack,
          }}
        />
      </div>
    </div>
  );
};

export default function RemotionRoot() {
  return (
    <>
      <Composition
        id="TheHook"
        component={TheHookComposition}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
}
