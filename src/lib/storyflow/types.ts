export type AspectRatio = "16:9" | "9:16";

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
export type RenderQuality = "DRAFT" | "MEDIUM" | "HIGH" | "PRODUCTION";
export type RenderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Project {
  id: string;
  name: string;
  topic: string | null;
  status: ProjectStatus;
  aspectRatio: AspectRatio;
  createdAt: Date;
  updatedAt: Date;
  script?: Script | null;
  assets?: Asset[];
  settings?: ProjectSettings | null;
  viewport?: Viewport | null;
  boards?: Board[];
  assetMappings?: Record<number, string> | null;
  renders?: Render[];
}

export interface AISettings {
  provider: "gemini-cli" | "claude-code";
  model: string;
  temperature: number;
}

export interface TTSSettings {
  voice: string;
  speakingRate: number;
  pitch: number;
}

export interface RenderSettings {
  defaultQuality: "draft" | "medium" | "high" | "production";
  defaultAspectRatio: AspectRatio;
}

export interface ProjectSettings {
  id: string;
  projectId: string;
  voice: string;
  speakingRate: number;
  pitch: number;
  musicTrackId?: string | null;
  musicVolume?: number;
}

export interface ScriptSegment {
  index: number;
  text: string;
  wordCount?: number;
  estimatedDuration?: number;
  audioUrl?: string;
  actualDuration?: number;
  timestamps?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
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

export interface ViewportKeyframe {
  frameStart: number;
  frameEnd: number;
  viewport: { centerX: number; centerY: number; zoom: number };
  easing: EasingType;
  transitionDurationMs: number;
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

export interface BoardRegion {
  id: string;
  position: { row: number; col: number };
  assetId: string;
  bounds: { x: number; y: number; width: number; height: number };
  animation?: Record<string, unknown>;
}

export interface Board {
  id: string;
  projectId: string;
  index: number;
  layout: { columns: number; rows: number };
  regions: BoardRegion[];
  triggers?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export script builder types
export * from "./script-builder-types";
