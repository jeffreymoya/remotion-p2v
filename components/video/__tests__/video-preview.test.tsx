import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { VideoPreview } from "../video-preview";
import { Timeline } from "@/src/lib/storyflow/timeline-types";

const playerSpies = {
  play: vi.fn(),
  pause: vi.fn(),
  seekTo: vi.fn(),
};

vi.mock("@remotion/player", () => {
  const React = require("react");
  const { forwardRef, useImperativeHandle, useState } = React;

  const Player = forwardRef<any, any>((props, ref) => {
    const [isPlaying, setPlaying] = useState(false);
    const [frame, setFrame] = useState(0);

    useImperativeHandle(ref, () => ({
      play: () => {
        setPlaying(true);
        playerSpies.play();
      },
      pause: () => {
        setPlaying(false);
        playerSpies.pause();
      },
      seekTo: (value: number) => {
        setFrame(value);
        playerSpies.seekTo(value);
      },
      getCurrentFrame: () => frame,
    }));

    const Comp = props.component;
    return (
      <div
        data-testid="player"
        data-width={props.compositionWidth}
        data-height={props.compositionHeight}
        data-playing={isPlaying}
        data-frame={frame}
      >
        {Comp ? <Comp inputProps={props.inputProps} /> : props.children}
      </div>
    );
  });

  return { Player, PlayerRef: {} };
});

vi.mock("@/remotion/compositions/StoryFlowVideo", () => ({
  StoryFlowVideo: ({ inputProps }: { inputProps: { timeline: Timeline } }) => {
    const hasAssets = inputProps.timeline.backgrounds.length > 0;
    return (
      <div data-testid="storyflow-video">
        <div>{inputProps.timeline.title}</div>
        {hasAssets ? (
          <div>Captions: {inputProps.timeline.text[0]?.text ?? "None"}</div>
        ) : (
          <div>Missing assets</div>
        )}
      </div>
    );
  },
}));

const baseTimeline: Timeline = {
  title: "Demo Timeline",
  aspectRatio: "16:9",
  durationSeconds: 10,
  backgrounds: [{ id: "bg-1", type: "image", src: "/img.jpg", start: 0, end: 10 }],
  text: [{ id: "txt-1", text: "Hello captions", start: 0, end: 5 }],
  audio: [],
};

describe("VideoPreview", () => {
  beforeEach(() => {
    Object.values(playerSpies).forEach((spy) => spy.mockClear());
  });

  it("renders remotion player with correct dimensions and captions", () => {
    renderWithProviders(<VideoPreview projectId="proj-1" timeline={baseTimeline} />);

    const player = screen.getByTestId("player");
    expect(player).toHaveAttribute("data-width", "1920");
    expect(player).toHaveAttribute("data-height", "1080");
    expect(screen.getByText("Demo Timeline")).toBeInTheDocument();
    expect(screen.getByText(/hello captions/i)).toBeInTheDocument();
  });

  it("shows missing asset placeholder when backgrounds are empty", () => {
    renderWithProviders(
      <VideoPreview projectId="proj-1" timeline={{ ...baseTimeline, backgrounds: [] }} />
    );

    expect(screen.getByText(/missing assets/i)).toBeInTheDocument();
  });

  it("controls playback and seeking via toolbar buttons", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VideoPreview projectId="proj-1" timeline={baseTimeline} />);

    const buttons = screen.getAllByRole("button");
    const skipBack = buttons[0];
    const playToggle = buttons[1];

    await user.click(playToggle);
    expect(playerSpies.play).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("player")).toHaveAttribute("data-playing", "true");

    await user.click(playToggle);
    expect(playerSpies.pause).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("player")).toHaveAttribute("data-playing", "false");

    await user.click(skipBack);
    expect(playerSpies.seekTo).toHaveBeenCalledWith(0);
  });
});
