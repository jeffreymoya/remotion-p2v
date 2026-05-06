import type { CSSProperties } from "react";

import type { GeneratedScenePalette } from "./schema";

const CARD_RADIUS = 8;
const PANEL_BORDER = 2;

interface PrimitiveProps {
  headline: string;
  callouts: string[];
  palette: GeneratedScenePalette;
  slotStyles?: Record<string, CSSProperties>;
}

const panelStyle = (palette: GeneratedScenePalette): CSSProperties => ({
  border: `${PANEL_BORDER}px solid ${palette.accent}`,
  backgroundColor: "rgba(255, 255, 255, 0.08)",
  borderRadius: CARD_RADIUS,
  boxShadow: "0 24px 80px rgba(0, 0, 0, 0.28)",
});

function CalloutList({
  callouts,
  palette,
  slotStyles,
}: {
  callouts: string[];
  palette: GeneratedScenePalette;
  slotStyles?: Record<string, CSSProperties>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 18,
        fontSize: 34,
        color: palette.foreground,
      }}
    >
      {callouts.slice(0, 4).map((callout, index) => {
        const itemStyle = slotStyles?.[`callout-${index}`] ?? {};
        return (
          <div
            key={`${callout}-${index}`}
            style={{
              ...panelStyle(palette),
              padding: "18px 24px",
              ...itemStyle,
            }}
            data-testid={`prompt-video-callout-${index}`}
          >
            {callout}
          </div>
        );
      })}
    </div>
  );
}

export function HookCard({
  headline,
  callouts,
  palette,
  slotStyles,
}: PrimitiveProps) {
  const headlineAnim = slotStyles?.headline ?? {};
  const bodyAnim = slotStyles?.body ?? {};
  return (
    <div
      data-testid="prompt-video-hook-card"
      style={{
        ...panelStyle(palette),
        width: "72%",
        padding: 58,
        textAlign: "center",
        ...bodyAnim,
      }}
    >
      <div
        style={{
          color: palette.accent,
          fontSize: 38,
          fontWeight: 800,
          marginBottom: 22,
          textTransform: "uppercase",
        }}
      >
        {callouts[0] ?? "Watch this"}
      </div>
      <div
        data-testid="prompt-video-headline"
        style={{
          color: palette.foreground,
          fontSize: 86,
          fontWeight: 900,
          lineHeight: 0.95,
          ...headlineAnim,
        }}
      >
        {headline}
      </div>
    </div>
  );
}

export function MechanismDiagram({
  headline,
  callouts,
  palette,
  slotStyles,
}: PrimitiveProps) {
  const items = callouts.slice(0, 4);
  const headlineAnim = slotStyles?.headline ?? {};
  return (
    <div
      data-testid="prompt-video-mechanism-diagram"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(1, items.length)}, 1fr)`,
        gap: 26,
        width: "88%",
        alignItems: "center",
      }}
    >
      {items.map((callout, index) => {
        const itemStyle = slotStyles?.[`callout-${index}`] ?? {};
        return (
          <div
            key={`${callout}-${index}`}
            style={{
              ...panelStyle(palette),
              minHeight: 240,
              padding: 26,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 18,
              ...itemStyle,
            }}
            data-testid={`prompt-video-callout-${index}`}
          >
            <div
              style={{
                color: palette.accent,
                fontSize: 48,
                fontWeight: 900,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                color: palette.foreground,
                fontSize: 34,
                fontWeight: 800,
                lineHeight: 1.08,
              }}
            >
              {callout}
            </div>
          </div>
        );
      })}
      <div
        style={{
          gridColumn: "1 / -1",
          color: palette.foreground,
          fontSize: 54,
          fontWeight: 900,
          textAlign: "center",
          marginTop: 18,
          ...headlineAnim,
        }}
        data-testid="prompt-video-headline"
      >
        {headline}
      </div>
    </div>
  );
}

export function EvidenceComparison({
  headline,
  callouts,
  palette,
  slotStyles,
}: PrimitiveProps) {
  const headlineAnim = slotStyles?.headline ?? {};
  return (
    <div
      data-testid="prompt-video-evidence-comparison"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 28,
        width: "82%",
      }}
    >
      {callouts.slice(0, 2).map((callout, index) => {
        const itemStyle = slotStyles?.[`callout-${index}`] ?? {};
        return (
          <div
            key={`${callout}-${index}`}
            style={{
              ...panelStyle(palette),
              padding: 38,
              minHeight: 360,
              ...itemStyle,
            }}
            data-testid={`prompt-video-callout-${index}`}
          >
            <div
              style={{
                color: palette.muted,
                fontSize: 32,
                fontWeight: 800,
                marginBottom: 28,
                textTransform: "uppercase",
              }}
            >
              {index === 0 ? "Before" : "After"}
            </div>
            <div
              style={{
                color: palette.foreground,
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {callout}
            </div>
          </div>
        );
      })}
      <div
        style={{
          gridColumn: "1 / -1",
          color: palette.accent,
          fontSize: 46,
          fontWeight: 900,
          textAlign: "center",
          ...headlineAnim,
        }}
        data-testid="prompt-video-headline"
      >
        {headline}
      </div>
    </div>
  );
}

export function TradeoffSplit({
  headline,
  callouts,
  palette,
  slotStyles,
}: PrimitiveProps) {
  const headlineAnim = slotStyles?.headline ?? {};
  return (
    <div
      data-testid="prompt-video-tradeoff-split"
      style={{
        width: "86%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
      }}
    >
      <CalloutList
        callouts={callouts.slice(0, 2)}
        palette={palette}
        slotStyles={slotStyles}
      />
      <CalloutList
        callouts={callouts.slice(2, 4)}
        palette={palette}
        slotStyles={slotStyles}
      />
      <div
        style={{
          gridColumn: "1 / -1",
          color: palette.foreground,
          fontSize: 58,
          fontWeight: 900,
          textAlign: "center",
          marginTop: 16,
          ...headlineAnim,
        }}
        data-testid="prompt-video-headline"
      >
        {headline}
      </div>
    </div>
  );
}

export function PayoffCallout({
  headline,
  callouts,
  palette,
  slotStyles,
}: PrimitiveProps) {
  const headlineAnim = slotStyles?.headline ?? {};
  const bodyAnim = slotStyles?.body ?? {};
  return (
    <div
      data-testid="prompt-video-payoff-callout"
      style={{
        width: "78%",
        display: "grid",
        gap: 28,
        ...bodyAnim,
      }}
    >
      <div
        data-testid="prompt-video-headline"
        style={{
          color: palette.foreground,
          fontSize: 82,
          fontWeight: 900,
          lineHeight: 0.98,
          textAlign: "center",
          ...headlineAnim,
        }}
      >
        {headline}
      </div>
      <CalloutList
        callouts={callouts}
        palette={palette}
        slotStyles={slotStyles}
      />
    </div>
  );
}
