import React from "react";
import { Audio, staticFile, useCurrentFrame } from "remotion";
import { POC_SENTENCES, POC_DURATION_IN_FRAMES } from "../poc-tts-data";
import { palette, font } from "./tokens";

export const TtsSyncPoc: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const sentenceIdx = POC_SENTENCES.reduce(
    (found, s, i) => (t >= s.startSeconds ? i : found),
    -1,
  );

  const sentence = sentenceIdx >= 0 ? POC_SENTENCES[sentenceIdx] : null;

  // How many words have started being spoken in the current sentence
  const revealedCount = sentence
    ? sentence.words.filter((w) => t >= w.startSeconds).length
    : 0;

  const revealedWords = sentence?.words.slice(0, revealedCount) ?? [];

  const progress = POC_DURATION_IN_FRAMES > 1 ? frame / POC_DURATION_IN_FRAMES : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: palette.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.body,
        padding: "0 160px",
        boxSizing: "border-box",
      }}
    >
      <Audio src={staticFile("audio/google-tts-poc.wav")} />

      <div style={{ fontSize: 64, lineHeight: 1.6, textAlign: "center" }}>
        {revealedWords.map((w, i) => (
          <span
            key={i}
            style={{
              color: i === revealedCount - 1 ? palette.accent : palette.text,
              fontWeight: i === revealedCount - 1 ? 700 : 400,
              marginRight: 18,
            }}
          >
            {w.word}
          </span>
        ))}
      </div>

      {/* progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 6, background: palette.border }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: palette.accent }} />
      </div>

      {/* time counter */}
      <div style={{ position: "absolute", bottom: 20, right: 40, fontSize: 20, color: palette.muted, fontFamily: font.mono }}>
        {t.toFixed(2)}s / frame {frame}
      </div>
    </div>
  );
};
