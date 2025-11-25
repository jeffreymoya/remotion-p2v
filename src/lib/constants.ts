export const FPS = 30;
export const INTRO_DURATION = 1 * FPS;

// Legacy dimensions (9:16 vertical)
export const IMAGE_WIDTH = 1024;
export const IMAGE_HEIGHT = 1792;

// Composition dimensions by aspect ratio
export const DIMENSIONS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
} as const;

// Default aspect ratio (YouTube horizontal - 16:9)
export const DEFAULT_ASPECT_RATIO = "16:9" as const;
