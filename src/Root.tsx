import React from "react";
import { Composition, Folder } from "remotion";
import { registerRoot } from "remotion";
import type { SceneScript } from "./lib/scene-script-schema";
import { SceneRenderer } from "./components/SceneRenderer";
import compositions from "./compositions";
import { sceneScripts } from "./generated/scene-scripts";

interface SceneRendererProps extends Record<string, unknown> {
  script: SceneScript;
}

const legacyEntries = Object.entries(compositions) as Array<[string, React.ComponentType]>;

const Root: React.FC = () => {
  return (
    <>
      {legacyEntries.length > 0 ? (
        <Folder name="Generated-Legacy">
          {legacyEntries.map(([name, Component]) => (
            <Component key={name} />
          ))}
        </Folder>
      ) : null}
      <Folder name="Generated">
        {sceneScripts.map((s) => (
          <Composition
            key={s.slug}
            id={s.slug}
            component={SceneRenderer as React.FC<SceneRendererProps>}
            defaultProps={{ script: s }}
            durationInFrames={s.durationInFrames}
            fps={s.fps}
            width={s.width}
            height={s.height}
          />
        ))}
      </Folder>
    </>
  );
};

registerRoot(Root);
