import { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api";
import { z } from "zod";

const BackgroundTransitionTypeSchema = z.union([
  z.literal("fade"),
  z.literal("blur"),
  z.literal("none"),
]);

const TimelineElementSchema = z.object({
  startMs: z.number(),
  endMs: z.number(),
});

const ElementAnimationSchema = TimelineElementSchema.extend({
  type: z.literal("scale"),
  from: z.number(),
  to: z.number(),
});

const BackgroundElementSchema = TimelineElementSchema.extend({
  imageUrl: z.string(),
  enterTransition: BackgroundTransitionTypeSchema.optional(),
  exitTransition: BackgroundTransitionTypeSchema.optional(),
  animations: z.array(ElementAnimationSchema).optional(),
});

const TextElementSchema = TimelineElementSchema.extend({
  text: z.string(),
  position: z.union([
    z.literal("top"),
    z.literal("bottom"),
    z.literal("center"),
  ]),
  animations: z.array(ElementAnimationSchema).optional(),
});

const AudioElementSchema = TimelineElementSchema.extend({
  audioUrl: z.string(),
});

// New schema for video clips (similar to background elements but for video)
const VideoClipElementSchema = TimelineElementSchema.extend({
  videoUrl: z.string(),
  enterTransition: BackgroundTransitionTypeSchema.optional(),
  exitTransition: BackgroundTransitionTypeSchema.optional(),
  animations: z.array(ElementAnimationSchema).optional(),
});

// New schema for background music
const BackgroundMusicElementSchema = TimelineElementSchema.extend({
  musicUrl: z.string(),
  volume: z.number().min(0).max(1).optional(), // 0.0 to 1.0, defaults to 0.2
});

// Aspect ratio enum
const AspectRatioSchema = z.enum(["16:9", "9:16"]);

const TimelineSchema = z.object({
  shortTitle: z.string(),
  elements: z.array(BackgroundElementSchema),
  text: z.array(TextElementSchema),
  audio: z.array(AudioElementSchema),
  // New optional fields for long-form support
  aspectRatio: AspectRatioSchema.optional(), // defaults to "9:16" for backward compatibility
  durationSeconds: z.number().positive().optional(), // calculated from elements if not provided
  videoClips: z.array(VideoClipElementSchema).optional(), // for stock video clips
  backgroundMusic: z.array(BackgroundMusicElementSchema).optional(), // for background music with ducking
});

export type BackgroundTransitionType = z.infer<
  typeof BackgroundTransitionTypeSchema
>;

export type TimelineElement = z.infer<typeof TimelineElementSchema>;
export type ElementAnimation = z.infer<typeof ElementAnimationSchema>;
export type BackgroundElement = z.infer<typeof BackgroundElementSchema>;
export type TextElement = z.infer<typeof TextElementSchema>;
export type AudioElement = z.infer<typeof AudioElementSchema>;
export type VideoClipElement = z.infer<typeof VideoClipElementSchema>;
export type BackgroundMusicElement = z.infer<typeof BackgroundMusicElementSchema>;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;

export {
  BackgroundTransitionTypeSchema,
  TimelineElementSchema,
  ElementAnimationSchema,
  BackgroundElementSchema,
  TextElementSchema,
  AudioElementSchema,
  VideoClipElementSchema,
  BackgroundMusicElementSchema,
  AspectRatioSchema,
  TimelineSchema,
};

export const StoryScript = z.object({
  text: z.string(),
});

export const StoryWithImages = z.object({
  result: z.array(
    z.object({
      text: z.string(),
      imageDescription: z.string(),
    }),
  ),
});

export const VoiceDescriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type VoiceDescriptor = z.infer<typeof VoiceDescriptorSchema>;

export interface StoryMetadataWithDetails {
  shortTitle: string;
  content: ContentItemWithDetails[];
}

export interface ContentItemWithDetails {
  text: string;
  imageDescription: string;
  uid: string;
  audioTimestamps: CharacterAlignmentResponseModel;
}
