import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { loadFont as loadIBMPlexSans  } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadIBMPlexMono  } from "@remotion/google-fonts/IBMPlexMono";
import { CHART_RAMP_DEFAULT, CHART_TYPOGRAPHY, DEFAULT_DONUT_CHART_STYLE, OVERLAY_TEXT_PALETTE, paletteToTextMode } from "./docu-tokens";
import type { DocuPalette, DonutChartStyle } from "./docu-tokens";
import type { OverlayUnit } from "../../lib/docu/overlays/types";
import { fadeIn, fadeUp, popIn, countUpValue } from "./chart-animations";
import { getEnterPreset } from "../../lib/docu/overlays/overlay-animations";
import type { EnterPresetKey } from "../../lib/docu/overlays/overlay-animations";

loadSourceSerif4();
loadIBMPlexSans();
loadIBMPlexMono();

export interface DonutChartProps {
  points: Array<{ x: string | number; y: number }>;
  label: string;
  unit: OverlayUnit;
  source?: string;
  palette: DocuPalette;
  durationInFrames: number;
  chartStyle?: Partial<DonutChartStyle>;
  enter?: EnterPresetKey;
  enterParams?: Record<string, number>;
}

function fmtValue(v: number, unit: OverlayUnit): string {
  const n = parseFloat(v.toFixed(1));
  if (unit === "$") return "$" + n.toLocaleString("en-US");
  if (unit === "%") return n + "%";
  return n + unit;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  points,
  label,
  unit,
  source,
  palette: paletteName,
  durationInFrames,
  chartStyle,
  enter,
  enterParams,
}) => {
  const frame = useCurrentFrame();
  const ramp = CHART_RAMP_DEFAULT;
  const s = { ...DEFAULT_DONUT_CHART_STYLE, ...chartStyle };
  const textMode = paletteToTextMode(paletteName);
  const c = OVERLAY_TEXT_PALETTE[textMode];

  const totalY = points.reduce((sum, pt) => sum + pt.y, 0);

  const W = s.viewBoxW;
  const H = s.viewBoxH;
  const cx = s.cx;
  const cy = s.cy;
  const rOuter = s.rOuter;
  const rInner = s.rInner;

  let acc = 0;
  const wedges = points.map((pt) => {
    const start = acc / totalY;
    acc += pt.y;
    const end = acc / totalY;
    const a0 = start * Math.PI * 2 - Math.PI / 2;
    const a1 = end * Math.PI * 2 - Math.PI / 2;
    const large = end - start > 0.5 ? 1 : 0;
    const x0o = cx + rOuter * Math.cos(a0);
    const y0o = cy + rOuter * Math.sin(a0);
    const x1o = cx + rOuter * Math.cos(a1);
    const y1o = cy + rOuter * Math.sin(a1);
    const x0i = cx + rInner * Math.cos(a0);
    const y0i = cy + rInner * Math.sin(a0);
    const x1i = cx + rInner * Math.cos(a1);
    const y1i = cy + rInner * Math.sin(a1);
    const path = [
      `M ${x0o} ${y0o}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o}`,
      `L ${x1i} ${y1i}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i}`,
      "Z",
    ].join(" ");
    return { x: pt.x, y: pt.y, path };
  });

  const enterPreset = enter ? getEnterPreset(enter) : null;
  const containerFade: React.CSSProperties = enterPreset && enterPreset.channel === "style"
    ? enterPreset.fn(frame, 0, 0, 10)
    : fadeIn(frame, 0, 0, 10);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: c.bg, backdropFilter: textMode === "dark" ? "blur(6px)" : undefined, opacity: containerFade.opacity }}>
      <svg width={s.renderW} height={s.renderH} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {wedges.map((w, i) => (
          <g key={i} style={popIn(frame, 0, i * 4, 21, cx, cy)}>
            <path d={w.path} fill={ramp[i % 6]} />
          </g>
        ))}

        {/* Center label */}
        <g style={fadeUp(frame, 0, 8, 16)}>
          <text
            x={cx} y={cy + s.centerLabelYOffset}
            textAnchor="middle"
            style={{
              fontFamily: CHART_TYPOGRAPHY.centerLabel.fontFamily,
              fontSize: s.centerLabelFontSize,
              letterSpacing: CHART_TYPOGRAPHY.centerLabel.letterSpacing,
              fill: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            {label}
          </text>
          <text
            x={cx} y={cy + s.centerValueYOffset}
            textAnchor="middle"
            style={{
              fontFamily: CHART_TYPOGRAPHY.centerValue.fontFamily,
              fontSize: s.centerValueFontSize,
              fontWeight: CHART_TYPOGRAPHY.centerValue.fontWeight,
              fill: c.textPrimary,
            }}
          >
            {fmtValue(countUpValue(frame, 0, 6, 33, totalY), unit)}
          </text>
        </g>

        {/* Legend — right of donut */}
        {wedges.map((w, i) => (
          <g key={`legend-${i}`} transform={`translate(${cx + rOuter + s.legendOffset}, ${(H - points.length * s.legendGap) / 2 + i * s.legendGap})`}>
            <g style={fadeUp(frame, 0, i * 3 + 18, 16)}>
              <rect x="0" y="3" width={s.legendSwatchSize} height={s.legendSwatchSize} fill={ramp[i % 6]} rx={s.legendSwatchRx} />
              <text
                x={s.legendLabelXOffset} y={s.legendLabelYBaseline}
                style={{
                  fontFamily: CHART_TYPOGRAPHY.legendLabel.fontFamily,
                  fontSize: s.legendLabelFontSize,
                  fill: c.textInk,
                }}
              >
                {String(w.x)}
              </text>
              <text
                x={s.legendLabelXOffset} y={s.legendValueYBaseline}
                style={{
                  fontFamily: CHART_TYPOGRAPHY.legendValue.fontFamily,
                  fontSize: s.legendValueFontSize,
                  fontWeight: CHART_TYPOGRAPHY.legendValue.fontWeight,
                  fill: ramp[i % 6],
                  letterSpacing: CHART_TYPOGRAPHY.legendValue.letterSpacing,
                }}
              >
                {((w.y / totalY) * 100).toFixed(1)}%
              </text>
            </g>
          </g>
        ))}

        {source ? (
          <text
            x={W - s.sourceXOffset}
            y={H - s.sourceYOffset}
            textAnchor="end"
            style={{
              fontFamily: CHART_TYPOGRAPHY.source.fontFamily,
              fontSize: s.sourceFontSize,
              fill: c.textMuted,
            }}
          >
            Source: {source}
          </text>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
