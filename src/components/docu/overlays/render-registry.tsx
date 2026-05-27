import React from "react";
import type { z } from "zod";
import type { DocuOverlay, OverlayTypeId } from "../../../lib/docu/overlays/registry";
import { headlineCardDef } from "../../../lib/docu/overlays/headline-card";
import { kineticNumberDef } from "../../../lib/docu/overlays/kinetic-number";
import { splitCardDef } from "../../../lib/docu/overlays/split-card";
import { contextBarDef } from "../../../lib/docu/overlays/context-bar";
import { titleCardOverlayDef } from "../../../lib/docu/overlays/title-card-overlay";
import { articleCardDef } from "../../../lib/docu/overlays/article-card";
import { chartDef } from "../../../lib/docu/overlays/chart";
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

type HeadlineOverlay = z.infer<typeof headlineCardDef.schema> & { startFrame: number; endFrame: number };
type KineticOverlay = z.infer<typeof kineticNumberDef.schema> & { startFrame: number; endFrame: number };
type SplitCardOverlay = z.infer<typeof splitCardDef.schema> & { startFrame: number; endFrame: number };
type ContextBarOverlay = z.infer<typeof contextBarDef.schema> & { startFrame: number; endFrame: number };
type TitleCardOverlay = z.infer<typeof titleCardOverlayDef.schema> & { startFrame: number; endFrame: number };
type ArticleCardOverlay = z.infer<typeof articleCardDef.schema> & { startFrame: number; endFrame: number };
type ChartOverlay = z.infer<typeof chartDef.schema> & { startFrame: number; endFrame: number };

type RenderFn = (overlay: DocuOverlay, ctx: OverlayRenderCtx) => React.ReactElement;

function renderHeadline(o: DocuOverlay): o is HeadlineOverlay {
  return o.type === "headline-card" && typeof (o as any).text === "string";
}

function renderKinetic(o: DocuOverlay): o is KineticOverlay {
  return o.type === "kinetic-number" && typeof (o as any).value === "number";
}

function renderSplitCard(o: DocuOverlay): o is SplitCardOverlay {
  return o.type === "split-card" && typeof (o as any).institution === "string";
}

function renderContextBar(o: DocuOverlay): o is ContextBarOverlay {
  return o.type === "context-bar" && Array.isArray((o as any).cycleItems);
}

function renderTitleCard(o: DocuOverlay): o is TitleCardOverlay {
  return o.type === "title-card" && typeof (o as any).text === "string";
}

function renderArticleCard(o: DocuOverlay): o is ArticleCardOverlay {
  return o.type === "article-card" && typeof (o as any).headline === "string";
}

function renderChart(o: DocuOverlay): o is ChartOverlay {
  return o.type === "chart" && Array.isArray((o as any).points);
}

export const RENDER_REGISTRY: Record<OverlayTypeId, RenderFn> = {
  "headline-card": (o, _ctx) => {
    if (!renderHeadline(o)) return <></>;
    const { text, source, palette } = o;
    const dur = o.endFrame - o.startFrame;
    return <HeadlineCard text={text} source={source} palette={palette} durationInFrames={dur} />;
  },
  "kinetic-number": (o, _ctx) => {
    if (!renderKinetic(o)) return <></>;
    const { text, value, unit, palette } = o;
    const dur = o.endFrame - o.startFrame;
    return <KineticNumber label={text} value={value} unit={unit} durationFrames={dur} palette={palette} />;
  },
  "split-card": (o, ctx) => {
    if (!renderSplitCard(o)) return <></>;
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
    if (!renderContextBar(o)) return <></>;
    const { cycleItems } = o;
    const dur = o.endFrame - o.startFrame;
    return <DocuContextBar cycleItems={cycleItems} durationInFrames={dur} />;
  },
  "title-card": (o, _ctx) => {
    if (!renderTitleCard(o)) return <></>;
    const { text, subtitle } = o;
    const dur = o.endFrame - o.startFrame;
    return <DocuTitleCard title={text} subtitle={subtitle ?? ""} durationInFrames={dur} />;
  },
  "article-card": (o, ctx) => {
    if (!renderArticleCard(o)) return <></>;
    const { id, category, headline, authors, date, time, tz, source } = o;
    const dur = o.endFrame - o.startFrame;
    const bgImageFile = ctx.activeShot?.imagePath ?? ctx.allShots[0]?.imagePath ?? "";
    return (
      <ArticleCard
        article={{ category, headline, authors, date, time, tz, source }}
        bgImageFile={bgImageFile}
        durationInFrames={dur}
      />
    );
  },
  "chart": (o, _ctx) => {
    if (!renderChart(o)) return <></>;
    const { chartKind, label, points, unit, source, palette, forecastFromIndex } = o;
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
      />
    );
  },
};
