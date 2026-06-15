import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COLORS } from "./common/tokens";
import { Chrome } from "./common/Chrome";
import { TitleCard, titleCardDefaults } from "./cards/TitleCard";
import { KineticNumber, kineticNumberDefaults } from "./cards/KineticNumber";
import { Chart, chartDefaults } from "./charts/Chart";
import { BreakingNews, breakingNewsDefaults } from "./cards/BreakingNews";

const BEAT = 90;

/**
 * Reference assembly: configures registry components with their defaults and
 * plays them on a timeline. Serves as the canonical example an authoring agent
 * imitates when composing a scene from the registry. Chrome is rendered once
 * per beat at the scene level — components themselves never own the frame
 * chrome; they render into the box they are given.
 */
export const Showcase: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <Sequence durationInFrames={BEAT}>
      <Chrome num={titleCardDefaults.num} name={titleCardDefaults.name} meta={titleCardDefaults.meta} />
      <TitleCard {...titleCardDefaults} />
    </Sequence>
    <Sequence from={BEAT} durationInFrames={BEAT}>
      <Chrome num={kineticNumberDefaults.num} name={kineticNumberDefaults.name} meta={kineticNumberDefaults.meta} />
      <KineticNumber {...kineticNumberDefaults} />
    </Sequence>
    <Sequence from={BEAT * 2} durationInFrames={BEAT}>
      <Chrome num="03" name="Data Chart" meta="Reference" />
      <Chart {...chartDefaults} />
    </Sequence>
    <Sequence from={BEAT * 3} durationInFrames={BEAT}>
      <Chrome num={breakingNewsDefaults.num} name={breakingNewsDefaults.name} meta={breakingNewsDefaults.meta} />
      <BreakingNews {...breakingNewsDefaults} />
    </Sequence>
  </AbsoluteFill>
);

