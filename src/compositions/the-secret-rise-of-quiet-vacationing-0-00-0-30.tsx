// @ts-nocheck
import { Composition, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile, AbsoluteFill, Img } from 'remotion';
import React from 'react';

// ------------------------------------------------------------------
// Typewriter with mild shake – "Quiet Quitting" reveal
// ------------------------------------------------------------------
const TypewriterShake: React.FC<{ text: string; startFrame: number; shake?: boolean }> = ({
  text,
  startFrame,
  shake = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: shake
          ? `translateX(${Math.sin(frame * 0.5) * 3 * Math.min(1, (frame - startFrame) / 15)}px)`
          : undefined,
      }}
    >
      {text.split('').map((char, i) => {
        const charFrame = frame - startFrame - i * 1.5;
        const opacity = spring({
          frame: Math.max(0, charFrame),
          fps,
          config: { damping: 200 },
          from: 0,
          to: 1,
        });
        return (
          <span key={i} style={{ opacity, display: 'inline-block', whiteSpace: 'pre-wrap' }}>
            {char}
          </span>
        );
      })}
    </span>
  );
};

// ------------------------------------------------------------------
// Chromatic aberration layer for glitch feel
// ------------------------------------------------------------------
const ChromaticText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ color: 'red', position: 'absolute', left: 2, top: 0 }}>{text}</span>
      <span style={{ color: 'cyan', position: 'absolute', left: -2, top: 0 }}>{text}</span>
      <span style={{ color: 'white' }}>{text}</span>
    </div>
  );
};

// ------------------------------------------------------------------
// Stamp component: red circle with diagonal line and text
// ------------------------------------------------------------------
const Stamp: React.FC<{ scale: number }> = ({ scale }) => {
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        width: 160,
        height: 160,
      }}
    >
      <div
        style={{
          border: '8px solid red',
          borderRadius: '50%',
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '140%',
            height: 6,
            backgroundColor: 'red',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
          }}
        />
        <span
          style={{
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 'bold',
            color: 'red',
            fontSize: 36,
            position: 'relative',
            zIndex: 1,
          }}
        >
          NO PTO
        </span>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Underwater light ray (diagonal semi-transparent polygons)
// ------------------------------------------------------------------
const LightRay: React.FC<{ top: number; left: number; angle: number; width: number; opacity: number }> = ({
  top,
  left,
  angle,
  width,
  opacity,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height: 200,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
        transform: `rotate(${angle}deg)`,
        opacity,
        clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
      }}
    />
  );
};

// ------------------------------------------------------------------
// Bubble generation & animation
// ------------------------------------------------------------------
const Bubbles: React.FC = () => {
  const frame = useCurrentFrame();
  const bubbles = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 25; i++) {
      arr.push({
        x: Math.random() * 1920,
        delay: Math.random() * 60,
        speed: 0.5 + Math.random() * 1.5,
        radius: 5 + Math.random() * 15,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {bubbles.map((b, i) => {
        const y = 1080 - ((frame + b.delay) * b.speed) % 1200;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top: y,
              width: b.radius * 2,
              height: b.radius * 2,
              borderRadius: '50%',
              backgroundColor: 'white',
              opacity: 0.4,
            }}
          />
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------
// Wave wipe clip-path generator
// ------------------------------------------------------------------
const getWaveClip = (frame: number): string => {
  const { width, height } = { width: 1920, height: 1080 };
  const progress = interpolate(frame, [630, 700], [0, 1], { extrapolateRight: 'clamp' });
  const amplitude = 40;
  const frequency = 3;
  const phase = frame * 0.05;
  const xPos = progress * width; // wave edge position

  // Build polygon that shows everything to the left of the wave edge
  const points: string[] = [];
  points.push(`0,0`); // top-left
  // wave edge from top to bottom (x varying around xPos)
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * height;
    const offset = amplitude * Math.sin((y * frequency) / 100 + phase);
    const x = xPos + offset;
    points.push(`${x},${y}`);
  }
  // bottom-left
  points.push(`0,${height}`);
  return `polygon(${points.join(',')})`;
};

// ------------------------------------------------------------------
// Main scene component
// ------------------------------------------------------------------
const QuietVacationingIntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // --- Background fade from black ---
  const bgOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // --- "Quiet Quitting" section ---
  const quietQuittingTyped = frame >= 10 && frame < 100;

  // strike-through line (frames 60-70 draw, then 70-100 fades)
  const strikeProgress = interpolate(frame, [60, 70], [0, 1], { extrapolateRight: 'clamp' });
  const strikeOpacity = interpolate(frame, [70, 100], [1, 0], { extrapolateLeft: 'clamp' });

  // fade out the word
  const quitOpacity = interpolate(frame, [80, 100], [1, 0], { extrapolateLeft: 'clamp' });

  // "Quiet Vacationing" spring entrance
  const vacationSpring = spring({
    frame: frame - 100,
    fps,
    config: { mass: 1, stiffness: 180, damping: 12 },
  });
  const vacationScale = vacationSpring;
  const vacationRotateY = interpolate(vacationSpring, [0, 1], [10, 0]);
  const vacationVisible = frame > 100;

  // move label to corner after 150
  const labelScale = interpolate(frame, [150, 160], [1, 0.2], { extrapolateRight: 'clamp' });
  const labelX = interpolate(frame, [150, 160], [0, -width / 2 + 100], { extrapolateRight: 'clamp' });
  const labelY = interpolate(frame, [150, 160], [0, -height / 2 + 80], { extrapolateRight: 'clamp' });

  // --- Laptop slide in ---
  const laptopSlide = spring({
    frame: frame - 150,
    fps,
    config: { damping: 200 },
    from: 0,
    to: 1,
  });
  const laptopX = interpolate(laptopSlide, [0, 1], [width + 400, 600]);
  const laptopScale = 0.8;

  // Green dot pulse (cycle every 10 frames)
  const dotPulse = 1 + 0.1 * Math.sin((frame * Math.PI) / 5);

  // --- Emails on laptop ---
  const emailData = [
    { startFrame: 180, x: 100, y: -20 },
    { startFrame: 200, x: 200, y: -50 },
    { startFrame: 220, x: 300, y: -70 },
  ];

  // --- Beach morph mask ---
  const morphStart = 300;
  const morphEnd = 320;
  const morphProgress = interpolate(frame, [morphStart, morphEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // green dot position on screen (relative to laptop screen area)
  const dotScreenX = 120; // approximate within laptop screen
  const dotScreenY = 100;
  // circle radius expands from 0 to large enough to cover screen (use diagonal of screen)
  const maxRadius = Math.sqrt((486) ** 2 + (280) ** 2); // laptop screen approx 486x280
  const maskRadius = interpolate(morphProgress, [0, 1], [5, maxRadius * 1.5]);

  // Laptop after morph: shrink and move
  const laptopShrink = spring({
    frame: frame - 320,
    fps,
    config: { damping: 100 },
  });
  const laptopShrinkScale = interpolate(laptopShrink, [0, 1], [0.8, 0.3]);
  const laptopShrinkX = interpolate(laptopShrink, [0, 1], [600, 200]);

  // Beach fade in behind laptop after morph
  const beachOpacity = interpolate(frame, [300, 330], [0, 1], { extrapolateLeft: 'clamp' });

  // --- Sunglasses fly-in ---
  const glassesSpring = spring({
    frame: frame - 330,
    fps,
    config: { mass: 1, stiffness: 150, damping: 12 },
  });
  const glassesY = interpolate(glassesSpring, [0, 1], [height, 700]);
  const glassesRotate = interpolate(glassesSpring, [0, 1], [15, 0]);
  const glassesScale = glassesSpring;

  // --- NO PTO stamp ---
  const stampSpring = spring({
    frame: frame - 380,
    fps,
    config: { mass: 0.5, stiffness: 400, damping: 8 },
  });
  const stampScale = stampSpring;

  // --- "No out-of-office message" ---
  const noOoMx = spring({ frame: frame - 420, fps, from: -300, to: 0, config: { damping: 200 } });

  // --- Question mark ---
  const qmOpacity = interpolate(frame, [450, 480], [0, 1], { extrapolateRight: 'clamp' });
  const qmScale = 1 + 0.05 * Math.sin(frame * 0.2) * Math.min(1, (frame - 450) / 30);
  const qmPulse = Math.min(1, (frame - 450) / 30);

  // "Why?" and "Is it bad?"
  const whyX = spring({ frame: frame - 500, fps, from: -200, to: 0, config: { damping: 200 } });
  const badX = spring({ frame: frame - 500, fps, from: 200, to: 0, config: { damping: 200 } });
  const textFade = interpolate(frame, [550, 600], [1, 0], { extrapolateLeft: 'clamp' });

  // --- Particles explosion (question mark) ---
  const explosionStart = 550;
  const particles = React.useMemo(
    () =>
      Array.from({ length: 20 }).map(() => ({
        angle: Math.random() * 2 * Math.PI,
        distance: 200 + Math.random() * 300,
      })),
    []
  );

  // --- "Let's dive in" typing ---
  const diveStart = 600;
  const diveTyped = frame >= diveStart && frame < 630;

  // Arrow bob
  const arrowBob = Math.sin(frame * 0.3) * 5;

  // --- Wave wipe transition ---
  const inWipe = frame >= 630 && frame <= 750;
  const postWipe = frame > 750;

  // --- Underwater elements ---
  const diveTextFade = interpolate(frame, [800, 830], [0, 1], { extrapolateLeft: 'clamp' });
  const diveTextFadeOut = interpolate(frame, [850, 870], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
      {/* Full backgrounds */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0a0b2e, #1b2a4a)',
          opacity: bgOpacity,
        }}
      />

      {/* Beach background (for later fade in) */}
      <Img
        src={staticFile('beach.jpg')}
        style={{
          position: 'absolute',
          inset: 0,
          objectFit: 'cover',
          opacity: frame >= 300 ? beachOpacity : 0,
        }}
      />

      {/* --- "Quiet Quitting" text (frames 10-100) --- */}
      {quietQuittingTyped && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 120,
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 5px 20px rgba(0,0,0,0.5)',
            opacity: quitOpacity,
          }}
        >
          <TypewriterShake text="Quiet Quitting" startFrame={10} shake={frame < 60} />
          {/* strike-through line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              height: 6,
              backgroundColor: 'red',
              width: `${strikeProgress * 100}%`,
              opacity: strikeOpacity,
              borderRadius: 3,
            }}
          />
        </div>
      )}

      {/* "Quiet Vacationing" text (frames 100-150) */}
      {vacationVisible && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${labelScale * vacationScale}) rotateY(${vacationRotateY}deg)`,
            transformOrigin: 'center center',
            fontSize: 110,
            fontWeight: 'bold',
            background: 'linear-gradient(to right, cyan, yellow)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 15px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <ChromaticText text="Quiet Vacationing" />
        </div>
      )}

      {/* Persistent label in top-left corner after frame 150 */}
      {frame > 150 && (
        <div
          style={{
            position: 'absolute',
            top: labelY,
            left: labelX,
            transform: `scale(${labelScale})`,
            fontSize: 22,
            fontWeight: 'bold',
            background: 'linear-gradient(to right, cyan, yellow)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap',
            zIndex: 100,
          }}
        >
          Quiet Vacationing
        </div>
      )}

      {/* Laptop and screen area */}
      {frame >= 150 && (
        <div
          style={{
            position: 'absolute',
            left: frame < 320 ? laptopX : laptopShrinkX,
            top: 200,
            transform: `scale(${frame < 320 ? laptopScale : laptopShrinkScale})`,
            transformOrigin: 'top left',
            filter: 'drop-shadow(20px 30px 30px rgba(0,0,0,0.6))',
            zIndex: 5,
          }}
        >
          <Img
            src={staticFile('laptop-slack.png')}
            style={{
              width: 600,
              height: 400,
              objectFit: 'contain',
              // Apply circular mask to screen area for beach reveal
              maskImage:
                frame >= morphStart && frame < morphEnd
                  ? `radial-gradient(circle at ${dotScreenX}px ${dotScreenY}px, transparent ${maskRadius}px, black ${maskRadius}px)`
                  : 'none',
              WebkitMaskImage:
                frame >= morphStart && frame < morphEnd
                  ? `radial-gradient(circle at ${dotScreenX}px ${dotScreenY}px, transparent ${maskRadius}px, black ${maskRadius}px)`
                  : 'none',
            }}
          />
          {/* Green dot pulse – placed on avatar area (approximate coordinates) */}
          <div
            style={{
              position: 'absolute',
              top: 100,
              left: 120,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#2ecc71',
              transform: `scale(${dotPulse})`,
              boxShadow: '0 0 8px #2ecc71',
            }}
          />

          {/* Email icons (frames 180-280) */}
          {emailData.map((email, idx) => {
            if (frame < email.startFrame) return null;
            const emailSpring = spring({
              frame: frame - email.startFrame,
              fps,
              config: { damping: 12 },
            });
            const emailScale = emailSpring;
            const emailY = interpolate(emailSpring, [0, 1], [0, -80]) + email.y;
            const emailOpacity = interpolate(frame, [email.startFrame + 30, email.startFrame + 50], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  top: 60 + email.y,
                  left: 180 + email.x,
                  transform: `scale(${emailScale}) translateY(${emailY}px)`,
                  opacity: emailOpacity,
                  display: 'flex',
                  alignItems: 'center',
                  filter: 'drop-shadow(0 5px 5px rgba(0,0,0,0.3))',
                }}
              >
                <Img
                  src={staticFile('email-icon.png')}
                  style={{ width: 30, height: 30, marginRight: 4 }}
                />
                <Img
                  src={staticFile('clock-icon.png')}
                  style={{ width: 16, height: 16, position: 'absolute', bottom: -4, right: -4 }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Sunglasses */}
      {frame >= 330 && (
        <div
          style={{
            position: 'absolute',
            bottom: glassesY,
            left: '50%',
            transform: `translateX(-50%) rotate(${glassesRotate}deg) scale(${glassesScale})`,
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))',
            zIndex: 15,
          }}
        >
          <Img src={staticFile('sunglasses.png')} style={{ width: 300, height: 150 }} />
          {/* Slack green dot pinned to temple */}
          {frame > 390 && (
            <div
              style={{
                position: 'absolute',
                top: 30,
                right: 30,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#2ecc71',
                transform: `scale(${dotPulse})`,
              }}
            />
          )}
        </div>
      )}

      {/* NO PTO Stamp */}
      {frame >= 380 && (
        <div
          style={{
            position: 'absolute',
            top: 150,
            right: 200,
            zIndex: 20,
          }}
        >
          <Stamp scale={stampScale} />
        </div>
      )}

      {/* "No out-of-office message" */}
      {frame >= 420 && (
        <div
          style={{
            position: 'absolute',
            top: 400,
            left: noOoMx,
            fontSize: 36,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'italic',
            color: 'red',
            zIndex: 20,
            transform: `translateX(${noOoMx}px)`,
          }}
        >
          No out‑of‑office message
        </div>
      )}

      {/* Question mark (hand-drawn style via SVG) */}
      {frame >= 450 && frame < 600 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${qmScale})`,
            opacity: qmOpacity,
            zIndex: 25,
          }}
        >
          <svg width="200" height="300" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 10 C80 10 90 30 90 55 C90 80 70 80 50 90 C30 100 30 120 30 120"
              stroke="white"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <circle cx="50" cy="135" r="8" fill="white" />
          </svg>
        </div>
      )}

      {/* Explosion particles */}
      {frame >= explosionStart && frame < 600 &&
        particles.map((p, i) => {
          const particleSpring = spring({
            frame: frame - explosionStart - i * 1,
            fps,
            config: { damping: 15 },
          });
          const distance = p.distance * particleSpring;
          const x = width / 2 + Math.cos(p.angle) * distance;
          const y = height / 2 + Math.sin(p.angle) * distance;
          const opacity = interpolate(particleSpring, [0.5, 1], [1, 0], { extrapolateLeft: 'clamp' });
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'white',
                left: x,
                top: y,
                opacity,
              }}
            />
          );
        })}

      {/* "Why?" and "Is it bad?" */}
      {frame >= 500 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: 300,
              transform: `rotate(-10deg) translateX(${whyX - 200}px)`,
              opacity: textFade,
              fontSize: 80,
              fontWeight: 'bold',
              fontFamily: '"Comic Sans MS", cursive',
              color: 'white',
              textShadow: '3px 3px 0 black',
              zIndex: 25,
            }}
          >
            Why?
          </div>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 1200,
              transform: `rotate(10deg) translateX(${badX + 200}px)`,
              opacity: textFade,
              fontSize: 80,
              fontWeight: 'bold',
              fontFamily: '"Comic Sans MS", cursive',
              color: 'white',
              textShadow: '3px 3px 0 black',
              zIndex: 25,
            }}
          >
            Is it bad?
          </div>
        </>
      )}

      {/* "Let's dive in" */}
      {frame >= diveStart && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 100,
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0 30px black',
            zIndex: 30,
            whiteSpace: 'nowrap',
          }}
        >
          <TypewriterShake text="Let's dive in" startFrame={diveStart} />
          {/* Arrow bob */}
          {frame > 615 && (
            <div
              style={{
                marginTop: 20,
                textAlign: 'center',
                fontSize: 80,
                transform: `translateY(${arrowBob}px)`,
              }}
            >
              ▼
            </div>
          )}
        </div>
      )}

      {/* Wave wipe transition – clip new underwater scene */}
      {(inWipe || postWipe) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, #0a2a40, #082d52)',
            zIndex: 35,
            clipPath: inWipe ? getWaveClip(frame) : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        >
          {/* Underwater content */}
          {postWipe && (
            <>
              <Bubbles />
              <LightRay top={100} left={200} angle={-20} width={300} opacity={0.15} />
              <LightRay top={300} left={800} angle={-30} width={500} opacity={0.1} />
              <LightRay top={500} left={400} angle={-10} width={400} opacity={0.2} />
              <LightRay top={700} left={1200} angle={-25} width={250} opacity={0.15} />
            </>
          )}
        </div>
      )}

      {/* Ghostly text under water */}
      {frame >= 800 && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 40,
            color: 'rgba(255,255,255,0.3)',
            fontStyle: 'italic',
            zIndex: 40,
            opacity: diveTextFade * diveTextFadeOut,
          }}
        >
          Diving into the trend…
        </div>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------
// Root composition registration
// ------------------------------------------------------------------
export default function RemotionRoot() {
  return (
    <Composition
      id="quiet-vacationing-intro"
      component={QuietVacationingIntroScene}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}