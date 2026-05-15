import React from "react";
import { Composition } from "remotion";
import { registerRoot } from "remotion";
import { inspireScripts } from "./generated/inspire-scripts";
import { InspirationComposition } from "./components/InspirationComposition";

const Root: React.FC = () => {
  return (
    <>
      {inspireScripts.map((s) => (
        <Composition
          key={s.slug}
          id={s.slug}
          component={InspirationComposition}
          defaultProps={s}
          durationInFrames={s.durationInFrames}
          fps={s.fps}
          width={s.width}
          height={s.height}
        />
      ))}
    </>
  );
};

registerRoot(Root);
