import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
} from "remotion";
import { PALETTE_MAP } from "./docu-tokens";
import type { DocuPalette } from "./docu-tokens";
import { DocuTitleCard } from "./DocuTitleCard";
import { DocuSplitCard } from "./DocuSplitCard";
import { DocuContextBar } from "./DocuContextBar";
import { DocuKenBurns } from "./DocuKenBurns";
import { HeadlineCard } from "./HeadlineCard";
import { KineticNumber } from "./KineticNumber";
import { ArticleCard } from "./ArticleCard";

const IMG_DIR = "images/docu/how-the-fed-controls-your-money";

const SEGMENT_FRAMES = 180;

const BGRoll = ({
  imageFile,
  palette,
  blurPx,
}: {
  imageFile: string;
  palette: DocuPalette;
  blurPx?: number;
}) => {
  const colors = PALETTE_MAP[palette];
  const filterChain = `${colors.filter}${blurPx ? ` blur(${blurPx}px)` : ""}`;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <DocuKenBurns durationInFrames={SEGMENT_FRAMES} shotIndex={0}>
        <Img
          src={staticFile(`${IMG_DIR}/${imageFile}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: filterChain,
          }}
        />
      </DocuKenBurns>
      <AbsoluteFill
        style={{ background: colors.tint, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};

export const KineticShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* 0–180: TitleCard */}
      <Sequence from={0} durationInFrames={SEGMENT_FRAMES}>
        <BGRoll imageFile="img-00.jpg" palette="cool-tech" />
        <DocuTitleCard
          title="THE FEDERAL RESERVE"
          subtitle="How 12 People Set Your Interest Rate"
          durationInFrames={SEGMENT_FRAMES}
        />
      </Sequence>

      {/* 180–360: SplitCard */}
      <Sequence from={180} durationInFrames={SEGMENT_FRAMES}>
        <AbsoluteFill style={{ background: "#000" }} />
        <DocuSplitCard
          imagePath={`${IMG_DIR}/img-10.jpg`}
          institution="FEDERAL RESERVE"
          headline="The lender of last resort"
          cite="Bloomberg, 2024"
          palette="cool-tech"
          durationInFrames={SEGMENT_FRAMES}
        />
      </Sequence>

      {/* 360–540: KineticNumber + ContextBar */}
      <Sequence from={360} durationInFrames={SEGMENT_FRAMES}>
        <BGRoll imageFile="img-20.jpg" palette="warm-real" />
        <KineticNumber
          label="FED FUNDS RATE"
          value={5.25}
          unit="%"
          durationFrames={SEGMENT_FRAMES}
          palette="warm-real"
        />
        <DocuContextBar
          cycleItems={[
            "FED FUNDS RATE",
            "SINCE JUL 2023",
            "20-YR HIGH",
          ]}
          durationInFrames={SEGMENT_FRAMES}
        />
      </Sequence>

      {/* 540–720: B-roll Ken Burns only */}
      <Sequence from={540} durationInFrames={SEGMENT_FRAMES}>
        <BGRoll imageFile="img-30.jpg" palette="cool-tech" />
      </Sequence>

      {/* 720–900: HeadlineCard */}
      <Sequence from={720} durationInFrames={SEGMENT_FRAMES}>
        <BGRoll imageFile="img-40.jpg" palette="warm-real" />
        <HeadlineCard
          text="BANKS TIGHTEN LENDING STANDARDS"
          source="WSJ, Q3 2024"
          palette="warm-real"
          durationInFrames={SEGMENT_FRAMES}
        />
      </Sequence>

      {/* 900–1080: ArticleCard */}
      <Sequence from={900} durationInFrames={SEGMENT_FRAMES}>
        <ArticleCard
          article={{
            category: "Markets",
            headline: "Partial government shutdown begins as funding lapses despite Senate deal",
            authors: ["Sarah Mitchell", "James Okafor"],
            date: "February 14, 2026",
            time: "10:30 AM",
            tz: "EST",
            source: "Bloomberg",
          }}
          bgImageFile={`${IMG_DIR}/img-00.jpg`}
          bgBlurPx={24}
          bgOverlayStrength={0.55}
          textMode="dark"
          durationInFrames={SEGMENT_FRAMES}
          enterFrame={0}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
