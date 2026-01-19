export type MusicTrack = {
  id: string;
  title: string;
  duration?: number | null;
  previewUrl: string;
  downloadUrl: string;
  tags?: string;
  author?: string;
  source: "pixabay";
};
