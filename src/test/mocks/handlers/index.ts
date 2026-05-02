import { aiHandlers } from "./ai";
import { aiLogHandlers } from "./ai-logs";
import { assetsHandlers } from "./assets";
import { boardsHandlers } from "./boards";
import { musicHandlers } from "./music";
import { projectHandlers } from "./projects";
import { renderHandlers } from "./render";
import { scriptBuilderHandlers } from "./script-builder";
import { settingsHandlers } from "./settings";
import { ttsHandlers } from "./tts";

export const handlers = [
  ...projectHandlers,
  ...scriptBuilderHandlers,
  ...boardsHandlers,
  ...assetsHandlers,
  ...ttsHandlers,
  ...aiHandlers,
  ...aiLogHandlers,
  ...renderHandlers,
  ...settingsHandlers,
  ...musicHandlers,
];
