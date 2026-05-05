import type { AppSettings } from "./settings";
import type { Milliseconds, Seconds } from "@/src/lib/types/units";

export type AspectRatio = "16:9" | "9:16";
export type VisualFormat =
  | "corkboard"
  | "whiteboard"
  | "editorial"
  | "dataviz"
  | "minimalist";
export type StyleTheme =
  | "noir-detective"
  | "academic-research-wall"
  | "vintage-scrapbook"
  | "modern-digital-pinboard"
  | "crime-procedural-tv";

export type ProjectStatus =
  | "DRAFT"
  | "SCRIPT_READY"
  | "ASSETS_READY"
  | "VIEWPORT_READY"
  | "BOARDS_READY"
  | "RENDER_READY"
  | "RENDERING"
  | "COMPLETED"
  | "ERROR";

export type AssetType = "IMAGE" | "VIDEO" | "AUDIO" | "MUSIC";
export type UpscaleStatus = "none" | "queued" | "done" | "skipped" | "failed";
export type RenderQuality = "DRAFT" | "MEDIUM" | "HIGH" | "PRODUCTION";
export type RenderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Project {
  id: string;
  name: string;
  topic: string | null;
  status: ProjectStatus;
  aspectRatio: AspectRatio;
  visualFormat: VisualFormat;
  styleTheme: StyleTheme;
  wizardProgress?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  script?: Script | null;
  assets?: Asset[];
  settings?: ProjectSettings | null;
  viewport?: Viewport | null;
  boards?: Board[];
  assetMappings?: AssetMappings | Record<number, string> | null;
  renders?: Render[];
}

export type ProjectSettings = {
  id: string;
  projectId: string;
  musicTrackId?: string | null;
  musicVolume?: number;
} & Partial<AppSettings["ai"]> &
  Partial<AppSettings["tts"]> &
  Partial<AppSettings["render"]>;

export interface ScriptSegment {
  index: number;
  text: string;
  wordCount?: number;
  estimatedDuration?: Seconds;
  audioUrl?: string;
  actualDuration?: Seconds;
  timestamps?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  startMs: Milliseconds;
  endMs: Milliseconds;
}

export interface Script {
  id: string;
  projectId: string;
  title: string;
  segments: ScriptSegment[];
  timestamps?: WordTimestamp[];
  createdAt: Date;
  updatedAt: Date;
}

export type AssetMetadata = {
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  format?: string | null;
  codec?: string | null;
  bitrate?: number | null;
};

export interface Asset {
  id: string;
  projectId: string;
  type: AssetType;
  filename: string;
  path: string;
  metadata?: AssetMetadata | null;
  upscaled?: boolean;
  upscaledPath?: string | null;
  upscaleStatus?: UpscaleStatus;
  createdAt: Date;
}

export interface Render {
  id: string;
  projectId: string;
  quality: RenderQuality;
  status: RenderStatus;
  progress: number;
  outputPath?: string | null;
  error?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface SegmentKeyframe {
  centerX: number;
  centerY: number;
  zoom: number;
}

export type SegmentViewportEasing =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut";

export interface SegmentViewport {
  start: SegmentKeyframe;
  end: SegmentKeyframe;
  easing?: SegmentViewportEasing;
}

export interface AssetMapping {
  assetId: string;
  viewport?: SegmentViewport;
}

export type AssetMappings = Record<number, AssetMapping>;

export interface DetectedRegion {
  id: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  salience: number;
}

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "slowDramatic"
  | "fastAction";

export type ViewportTriggerType =
  | "segment_start"
  | "topic_shift"
  | "emphasis"
  | "manual";

export interface ViewportKeyframe {
  frameStart: number;
  frameEnd: number;
  viewport: { centerX: number; centerY: number; zoom: number };
  easing: EasingType;
  transitionDurationMs: Milliseconds;
}

export interface ViewportTrigger {
  triggerId: string;
  wordId: string;
  globalWordIndex: number;
  segmentIndex: number;
  localWordIndex: number;
  word: string;
  wordStartMs: Milliseconds;
  targetRegionId: string;
  targetBoardId: string;
  transitionMs: Milliseconds;
  triggerType: ViewportTriggerType;
}

export interface Viewport {
  id: string;
  projectId: string;
  imageAssetId?: string | null;
  keyframes: ViewportKeyframe[];
  regions?: DetectedRegion[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardRegion {
  id: string;
  elementId: string;
  gridPosition: GridPosition;
  bounds: RegionBounds;
  label: string;
  salience: number;
}

export interface BoardPlan {
  version: "1.0";
  scriptPath: string;
  totalSegments: number;
  totalDurationMs: number;
  boards: BoardSegmentMapping[];
  generatedAt: string;
}

export interface BoardRegionsOutput {
  version: "1.0";
  boardId: string;
  assetId: string;
  assetPath?: string;
  imageMetadata: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  regions: BoardRegion[];
  generatedAt: string;
}

export interface GridPosition {
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
}

export type BoardElementType =
  | "photo"
  | "note"
  | "clipping"
  | "string"
  | "map"
  | "document"
  | "diagram"
  | "headline";

export interface BoardElement {
  id: string;
  type: BoardElementType;
  gridPosition: GridPosition;
  description: string;
  label?: string;
  connectionTo?: string[];
}

export interface SegmentContext {
  segmentIndex: number;
  text: string;
  focusElementId: string;
}

export interface BoardSegmentMapping {
  boardId: string;
  segmentIndices: number[];
  totalDurationMs: number;
  topicSummary: string;
}

export interface BoardPrompt {
  boardId: string;
  gridLayout: {
    rows: number;
    cols: number;
  };
  styleGuide: string;
  elements: BoardElement[];
  segmentContexts: SegmentContext[];
  fullPromptText: string;
}

export interface BoardPromptsOutput {
  version: "1.0";
  prompts: BoardPrompt[];
  generatedAt: string;
}

export interface Board {
  id: string;
  projectId: string;
  index: number;
  layout: { columns: number; rows: number };
  regions: BoardRegion[];
  triggers?: Record<string, unknown> | null;
  assetId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export script builder types
export * from "./script-builder-types";
