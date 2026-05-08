// @ts-nocheck
import React from 'react';
import {
  Composition,
  useCurrentFrame,
  interpolate,
  spring,
  staticFile,
} from 'remotion';

// Helper for smooth cross‑fade opacities
const getOpacityCustom = (
  frame: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number,
) => {
  if (frame < enterStart) return 0;
  if (frame < enterEnd) {
    return interpolate(frame, [enterStart, enterEnd], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }
  if (frame < exitStart) return 1;
  if (frame < exitEnd) {
    return interpolate(frame, [exitStart, exitEnd], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }
  return 0;
};

// ---- Scene 1: Hook (0–90) ----
const HookScene: React.FC<{ frame: number }> = ({ frame }) => {
  const opacityQuitting = interpolate(
    frame,
    [0, 45, 60],
    [1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacityVacationing = interpolate(
    frame,
    [45, 60],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const umbrellaTranslateX = frame < 45 ? 100 : spring({
    frame: frame - 45,
    from: 100,
    to: 0,
    fps: 30,
    config: { damping: 12, stiffness: 200 },
  });

  const umbrellaScale = frame < 45 ? 0.5 : spring({
    frame: frame - 45,
    from: 0.5,
    to: 1,
    fps: 30,
    config: { damping: 10, stiffness: 150 },
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* "Quiet Quitting" – red, strike‑through */}
      <div
        style={{
          position: 'absolute',
          opacity: opacityQuitting,
          fontSize: 120,
          fontWeight: 'bold',
          color: '#C41E3A',
          textDecoration: 'line-through',
          textDecorationColor: '#C41E3A',
          textDecorationThickness: 4,
        }}
      >
        Quiet Quitting
      </div>

      {/* "Quiet Vacationing" – blue, with umbrella icon */}
      <div
        style={{
          position: 'absolute',
          opacity: opacityVacationing,
          fontSize: 120,
          fontWeight: 'bold',
          color: '#1E90B4',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span>Quiet Vacationing</span>
        <img
          src={staticFile('images/umbrella_icon.png')}
          style={{
            width: 100,
            height: 100,
            marginLeft: 20,
            transform: `translateX(${umbrellaTranslateX}px) scale(${umbrellaScale})`,
          }}
        />
      </div>
    </div>
  );
};

// ---- Scene 2: Diagram (90–210) ----
const DiagramScene: React.FC<{ frame: number }> = ({ frame }) => {
  const screenScale = interpolate(frame, [180, 210], [1, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const screenTranslateXPercent = interpolate(frame, [180, 210], [0, -30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const screenOpacity = interpolate(frame, [195, 210], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const beachBgOpacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Beach background that will stay for scene 3 */}
      <img
        src={staticFile('images/beach_bg.jpg')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: beachBgOpacity,
        }}
      />

      {/* Screen mockup */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${screenScale}) translateX(${screenTranslateXPercent}%)`,
          opacity: screenOpacity,
        }}
      >
        <img
          src={staticFile('images/screen_mockup.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </div>
  );
};

// ---- Scene 3: Concrete (210–420) ----
const ConcreteScene: React.FC<{ frame: number }> = ({ frame }) => {
  const dotOpacity = 0.5 + 0.5 * Math.sin((frame * 2 * Math.PI) / 60);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src={staticFile('images/beach_bg.jpg')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Waves overlay – seamless scroll using background animate */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '40%',
          backgroundImage: `url(${staticFile('images/waves_overlay.png')})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat-x',
          backgroundPositionX: `${-(frame * 2) % 1920}px`,
          opacity: 0.6,
        }}
      />

      <img
        src={staticFile('images/beach_umbrella.png')}
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '60%',
          width: 300,
          height: 300,
        }}
      />
      <img
        src={staticFile('images/beach_chair.png')}
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '20%',
          width: 350,
          height: 250,
        }}
      />
      <img
        src={staticFile('images/person_sunglasses.png')}
        style={{
          position: 'absolute',
          bottom: '14%',
          left: '18%',
          width: 280,
          zIndex: 2,
        }}
      />
      <img
        src={staticFile('images/laptop_open.png')}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: 200,
        }}
      />

      {/* Pulsing green dot on laptop screen */}
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          right: '22%',
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: '#2FA44F',
          opacity: dotOpacity,
          boxShadow: '0 0 8px #2FA44F',
        }}
      />
    </div>
  );
};

// ---- Scene 4: Callout (420–540) ----
const CalloutScene: React.FC<{ frame: number }> = ({ frame }) => {
  const blurAmount = interpolate(
    frame,
    [420, 435, 525, 540],
    [0, 15, 15, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const cardOpacity = interpolate(
    frame,
    [435, 450, 525, 540],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const line1Opacity = interpolate(frame, [450, 465], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line2Opacity = interpolate(frame, [465, 480], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line3Opacity = interpolate(frame, [480, 495], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Blurred beach background */}
      <div style={{ filter: `blur(${blurAmount}px)`, opacity: 0.6 }}>
        <img
          src={staticFile('images/beach_bg.jpg')}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <img
          src={staticFile('images/beach_umbrella.png')}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '60%',
            width: 300,
          }}
        />
        <img
          src={staticFile('images/beach_chair.png')}
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '20%',
            width: 350,
          }}
        />
        <img
          src={staticFile('images/person_sunglasses.png')}
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '18%',
            width: 280,
          }}
        />
        <img
          src={staticFile('images/laptop_open.png')}
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            width: 200,
          }}
        />
      </div>

      {/* Callout card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          padding: 40,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          opacity: cardOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            opacity: line1Opacity,
            display: 'flex',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#C41E3A', fontSize: 36, marginRight: 15 }}>✗</span>
          <span style={{ fontSize: 30, color: '#333' }}>No approved PTO</span>
        </div>

        <div
          style={{
            opacity: line2Opacity,
            display: 'flex',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#C41E3A', fontSize: 36, marginRight: 15 }}>✗</span>
          <span style={{ fontSize: 30, color: '#333' }}>No out‑of‑office message</span>
        </div>

        <div
          style={{
            opacity: line3Opacity,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#2FA44F', fontSize: 36, marginRight: 15 }}>✓</span>
          <span style={{ fontSize: 30, color: '#333' }}>
            Just you, your sunglasses, and a green active dot on Slack
          </span>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#2FA44F',
              marginLeft: 10,
              boxShadow: '0 0 8px #2FA44F',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ---- Scene 5: Retention beat (540–600) ----
const RetentionScene: React.FC<{ frame: number }> = ({ frame }) => {
  const scaleQ =
    frame < 540
      ? 0
      : spring({
          frame: frame - 540,
          from: 0,
          to: 1,
          fps: 30,
          config: { damping: 12, stiffness: 200 },
        });

  const line1 = 'Why do they do this?';
  const line2 = 'Is it a bad thing?';
  const line1Start = 545;
  const line1Duration = 30; // 545–575
  const line2Start = 570;
  const line2Duration = 30; // 570–600

  const getTyped = (text: string, start: number, dur: number) => {
    if (frame < start) return '';
    const chars = Math.min(
      Math.floor(((frame - start) / dur) * text.length),
      text.length,
    );
    return text.substring(0, Math.max(0, chars));
  };

  const typedLine1 = getTyped(line1, line1Start, line1Duration);
  const typedLine2 = getTyped(line2, line2Start, line2Duration);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, #2a3b5c 0%, #0f0f0f 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontSize: 200,
          fontWeight: 'bold',
          color: '#f0f0f0',
          textShadow:
            '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(255,255,255,0.4)',
          transform: `scale(${scaleQ})`,
          marginBottom: 40,
        }}
      >
        ?
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontSize: 40,
          fontFamily: 'sans-serif',
          color: '#fff',
        }}
      >
        <div style={{ marginBottom: 20, minHeight: 50 }}>{typedLine1}</div>
        <div style={{ minHeight: 50 }}>{typedLine2}</div>
      </div>
    </div>
  );
};

// ---- Scene 6: Viewer promise (600–900) ----
const PromiseScene: React.FC<{ frame: number }> = ({ frame }) => {
  const slideUpProgress =
    frame < 600
      ? 0
      : spring({
          frame: frame - 600,
          from: 0,
          to: 1,
          fps: 30,
          config: { damping: 15, stiffness: 100 },
        });
  const translateY = interpolate(slideUpProgress, [0, 1], [200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cardOpacity = interpolate(frame, [585, 600], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headingOpacity = interpolate(frame, [625, 635], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bullet1Opacity = interpolate(frame, [650, 665], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bullet2Opacity = interpolate(frame, [665, 680], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #a0d8ef 0%, #6eb5d6 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 900,
          padding: 50,
          borderRadius: 30,
          backgroundColor: '#fff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          transform: `translateY(${translateY}px)`,
          opacity: cardOpacity,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            opacity: headingOpacity,
            fontSize: 42,
            fontWeight: 'bold',
            color: '#222',
            marginBottom: 30,
          }}
        >
          By the end, you’ll understand:
        </div>
        <div
          style={{
            opacity: bullet1Opacity,
            fontSize: 32,
            color: '#333',
            marginBottom: 20,
          }}
        >
          🔍 Psychological drivers behind quiet vacationing
        </div>
        <div style={{ opacity: bullet2Opacity, fontSize: 32, color: '#333' }}>
          ⚠️ Hidden costs that outweigh a free beach day
        </div>
      </div>
    </div>
  );
};

// ---- Main composition component ----
const QuietVacationingIntro: React.FC = () => {
  const frame = useCurrentFrame();

  // Opacity for each scene with cross‑fade overlap
  const hookOpacity = getOpacityCustom(frame, 0, 15, 75, 90);
  const diagramOpacity = getOpacityCustom(frame, 75, 90, 195, 210);
  const concreteOpacity = getOpacityCustom(frame, 195, 210, 405, 420);
  const calloutOpacity = getOpacityCustom(frame, 405, 420, 525, 540);
  const retentionOpacity = getOpacityCustom(frame, 525, 540, 585, 600);
  const promiseOpacity = getOpacityCustom(frame, 585, 600, 900, 900); // stays visible

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: hookOpacity }}>
        <HookScene frame={frame} />
      </div>
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: diagramOpacity }}>
        <DiagramScene frame={frame} />
      </div>
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: concreteOpacity }}>
        <ConcreteScene frame={frame} />
      </div>
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: calloutOpacity }}>
        <CalloutScene frame={frame} />
      </div>
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: retentionOpacity }}>
        <RetentionScene frame={frame} />
      </div>
      <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: promiseOpacity }}>
        <PromiseScene frame={frame} />
      </div>
    </div>
  );
};

// ---- Default export: self‑registering composition ----
export default function RemotionRoot() {
  return (
    <>
      <Composition
        id="quiet-vacationing-intro"
        component={QuietVacationingIntro}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
}