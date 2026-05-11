import React from "react";
import { Composition, Folder } from "remotion";
import { registerRoot } from "remotion";
import type { SceneScript } from "./lib/scene-script-schema";
import { SceneRenderer } from "./components/SceneRenderer";
import { sceneScripts } from "./generated/scene-scripts";
import { TtsSyncPoc } from "./components/TtsSyncPoc";
import { POC_DURATION_IN_FRAMES } from "./poc-tts-data";

interface SceneRendererProps extends Record<string, unknown> {
  script: SceneScript;
}

const Root: React.FC = () => {
  return (
    <>
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
      <Folder name="POC">
        <Composition
          id="google-tts-sync"
          component={TtsSyncPoc}
          durationInFrames={POC_DURATION_IN_FRAMES}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};

registerRoot(Root);
