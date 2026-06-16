import React from "react";
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { docuCompositionPlans } from "./generated/docu-composition-plans";
import { DocumentaryRenderer as S2vDocumentaryRenderer } from "./components/docu/DocumentaryRenderer";

const Root: React.FC = () => {
  return (
    <>
      {docuCompositionPlans.map(({ slug, plan }) => (
        <Composition
          key={`docu-${slug}`}
          id={`docu-${slug}`}
          component={S2vDocumentaryRenderer as any /* Remotion expects Record<string, unknown> but CompositionPlan has required fields */}
          defaultProps={plan}
          durationInFrames={plan.durationInFrames}
          fps={plan.fps}
          width={plan.width}
          height={plan.height}
        />
      ))}
    </>
  );
};

registerRoot(Root);
