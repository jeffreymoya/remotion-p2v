import React from "react";
import type { DocuOverlay, OverlayTypeId } from "../../../lib/docu/overlays/registry";
import { HeadlineCard } from "../HeadlineCard";
import { KineticNumber } from "../KineticNumber";
import { DocuSplitCard } from "../DocuSplitCard";
import { DocuContextBar } from "../DocuContextBar";
import { DocuTitleCard } from "../DocuTitleCard";
import { ArticleCard } from "../ArticleCard";
import { DocuChart } from "../DocuChart";
import type { DocuPalette } from "../docu-tokens";
import type { DocuShot } from "../DocumentaryComposition";

export interface OverlayRenderCtx {
  durationInFrames: number;
  activeShot: DocuShot | undefined;
  allShots: DocuShot[];
  palette: DocuPalette;
}

type HeadlineOverlay = Extract<DocuOverlay, { type: "headline-card" }>;
type KineticOverlay = Extract<DocuOverlay, { type: "kinetic-number" }>;
type SplitCardOverlay = Extract<DocuOverlay, { type: "split-card" }>;
type ContextBarOverlay = Extract<DocuOverlay, { type: "context-bar" }>;
type TitleCardOverlay = Extract<DocuOverlay, { type: "title-card" }>;
type ArticleCardOverlay = Extract<DocuOverlay, { type: "article-card" }>;
type ChartOverlay = Extract<DocuOverlay, { type: "chart" }>;

type RenderFn = (overlay: DocuOverlay, ctx: OverlayRenderCtx) => React.ReactElement;

function renderHeadline(o: DocuOverlay): o is HeadlineOverlay {
  return o.type === "headline-card" && typeof o.text === "string";
}

function renderKinetic(o: DocuOverlay): o is KineticOverlay {
  return o.type === "kinetic-number" && typeof o.value === "number";
}

function renderSplitCard(o: DocuOverlay): o is SplitCardOverlay {
  return o.type === "split-card" && typeof o.institution === "string";
}

function renderContextBar(o: DocuOverlay): o is ContextBarOverlay {
  return o.type === "context-bar" && Array.isArray(o.cycleItems);
}

function renderTitleCard(o: DocuOverlay): o is TitleCardOverlay {
  return o.type === "title-card" && typeof o.text === "string";
}

function renderArticleCard(o: DocuOverlay): o is ArticleCardOverlay {
  return o.type === "article-card" && typeof o.headline === "string";
}

function renderChart(o: DocuOverlay): o is ChartOverlay {
  return o.type === "chart" && Array.isArray(o.points);
}

export const RENDER_REGISTRY: Record<OverlayTypeId, RenderFn> = {
  "headline-card": (o, _ctx) => {
    if (!renderHeadline(o)) { console.warn("[render-registry] Skipping malformed headline-card overlay"); return <></>; }
    const { text, source, palette, enter, enterParams, exit, exitParams } = o;
    const dur = o.endFrame - o.startFrame;
    return <HeadlineCard text={text} source={source} palette={palette} durationInFrames={dur} enter={enter} enterParams={enterParams} exit={exit} exitParams={exitParams} />;
  },
  "kinetic-number": (o, _ctx) => {
    if (!renderKinetic(o)) { console.warn("[render-registry] Skipping malformed kinetic-number overlay"); return <></>; }
    const { text, value, unit, palette, enter, enterParams } = o;
    const dur = o.endFrame - o.startFrame;
    return <KineticNumber label={text} value={value} unit={unit} durationFrames={dur} palette={palette} enter={enter} enterParams={enterParams} />;
  },
  "split-card": (o, ctx) => {
    if (!renderSplitCard(o)) { console.warn("[render-registry] Skipping malformed split-card overlay"); return <></>; }
    const { institution, headline, cite, palette } = o;
    const dur = o.endFrame - o.startFrame;
    const imagePath = ctx.activeShot?.imagePath ?? ctx.allShots[0]?.imagePath ?? "";
    return (
      <DocuSplitCard
        institution={institution}
        headline={headline}
        cite={cite}
        imagePath={imagePath}
        palette={palette}
        durationInFrames={dur}
      />
    );
  },
  "context-bar": (o, _ctx) => {
    if (!renderContextBar(o)) { console.warn("[render-registry] Skipping malformed context-bar overlay"); return <></>; }
    const { cycleItems } = o;
    const dur = o.endFrame - o.startFrame;
    return <DocuContextBar cycleItems={cycleItems} durationInFrames={dur} />;
  },
  "title-card": (o, _ctx) => {
    if (!renderTitleCard(o)) { console.warn("[render-registry] Skipping malformed title-card overlay"); return <></>; }
    const { text, subtitle } = o;
    const dur = o.endFrame - o.startFrame;
    return <DocuTitleCard title={text} subtitle={subtitle ?? ""} durationInFrames={dur} />;
  },
  "article-card": (o, ctx) => {
    if (!renderArticleCard(o)) { console.warn("[render-registry] Skipping malformed article-card overlay"); return <></>; }
    const { id, category, headline, authors, date, time, tz, source, enter, enterParams } = o;
    const dur = o.endFrame - o.startFrame;
    const bgImageFile = ctx.activeShot?.imagePath ?? ctx.allShots[0]?.imagePath ?? "";
    return (
      <ArticleCard
        article={{ category, headline, authors, date, time, tz, source }}
        bgImageFile={bgImageFile}
        durationInFrames={dur}
        enter={enter}
        enterParams={enterParams}
      />
    );
  },
  "chart": (o, _ctx) => {
    if (!renderChart(o)) { console.warn("[render-registry] Skipping malformed chart overlay"); return <></>; }
    const { chartKind, label, points, unit, source, palette, forecastFromIndex, enter, enterParams } = o;
    const dur = o.endFrame - o.startFrame;
    return (
      <DocuChart
        chartKind={chartKind}
        label={label}
        points={points}
        unit={unit}
        source={source}
        palette={palette}
        durationInFrames={dur}
        forecastFromIndex={forecastFromIndex as number | undefined}
        enter={enter}
        enterParams={enterParams}
      />
    );
  },
};
