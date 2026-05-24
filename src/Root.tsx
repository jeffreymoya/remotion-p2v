import React from "react";
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { docuScripts } from "./generated/docu-scripts";
import { DocumentaryComposition } from "./components/docu/DocumentaryComposition";
import { KineticPlayground, kineticPlaygroundSchema } from "./components/docu/KineticPlayground";
import { KineticShowcase } from "./components/docu/KineticShowcase";

const Root: React.FC = () => {
  return (
    <>
      {docuScripts.map((s) => (
        <Composition
          key={`docu-${s.slug}`}
          id={`docu-${s.slug}`}
          component={DocumentaryComposition as any /* Remotion expects Record<string, unknown> but DocuScript has required fields */}
          defaultProps={s}
          durationInFrames={s.durationInFrames}
          fps={s.fps}
          width={s.width}
          height={s.height}
        />
      ))}
      <Composition
        id="kinetic-showcase"
        component={KineticShowcase}
        durationInFrames={1080}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="kinetic-playground"
        component={KineticPlayground}
        schema={kineticPlaygroundSchema}
        defaultProps={{"componentType":"kinetic-number" as const,"demoLabel":"Market Cap","demoValue":4200000000000,"demoUnit":"T" as const,"demoHeadline":"Breaking News","demoSource":"Source: Bloomberg","labelFontSize":50,"labelFontWeight":"300" as const,"labelColor":"#94a3b8","labelMarginBottom":16,"valueFontSize":150,"valueFontWeight":"900" as const,"gradientStart":"#FF6B00","gradientEnd":"#FFC200","positionLeftPct":50,"positionTopPct":40,"headlineFontSize":42,"headlineFontWeight":"900" as const,"headlineColor":"#FF6B00","sourceFontSize":20,"sourceFontWeight":"300" as const,"sourceColor":"#94a3b8","accentBarColor":"#FF6B00","bottomOffset":80,"leftOffset":80}}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(Root);
