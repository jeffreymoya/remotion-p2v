"use client";

import { Player, PlayerRef } from "@remotion/player";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SkipBack } from "lucide-react";
import Link from "next/link";

import { StoryFlowVideo } from "@/remotion/compositions/StoryFlowVideo";
import { Timeline } from "@/src/lib/storyflow/timeline-types";
import { Button } from "@/components/ui/button";

type Props = { projectId: string; timeline: Timeline };

const FPS = 30;

export function VideoPreview({ projectId, timeline }: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const durationInFrames = useMemo(
    () => Math.ceil(timeline.durationSeconds * FPS) + FPS, // +1s intro buffer
    [timeline.durationSeconds]
  );

  const width = timeline.aspectRatio === "9:16" ? 1080 : 1920;
  const height = timeline.aspectRatio === "9:16" ? 1920 : 1080;

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
    setIsPlaying((p) => !p);
  }, [isPlaying]);

  const seekBySeconds = (deltaSeconds: number) => {
    const currentFrame = playerRef.current?.getCurrentFrame?.() ?? 0;
    const nextFrame = Math.max(0, Math.min(durationInFrames - 1, currentFrame + deltaSeconds * FPS));
    playerRef.current?.seekTo(nextFrame);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!playerRef.current || !target) return;

      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isTyping) return;

      switch (event.key) {
        case " ":
        case "k": {
          event.preventDefault();
          togglePlay();
          break;
        }
        case "ArrowLeft":
        case "j": {
          event.preventDefault();
          seekBySeconds(-1);
          break;
        }
        case "ArrowRight":
        case "l": {
          event.preventDefault();
          seekBySeconds(1);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [durationInFrames, togglePlay]);

  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-xl border border-slate-800 bg-black">
        <Player
          ref={playerRef}
          component={StoryFlowVideo}
          inputProps={{ timeline }}
          durationInFrames={durationInFrames}
          compositionWidth={width}
          compositionHeight={height}
          fps={FPS}
          style={{ width: "100%", height: "100%" }}
          controls
          clickToPlay
          doubleClickToFullscreen
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => playerRef.current?.seekTo(0)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
        <Button asChild>
          <Link href={`/projects/${projectId}/render`}>Render Video</Link>
        </Button>
      </div>
    </div>
  );
}
