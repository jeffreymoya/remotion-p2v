export type SelectionTier =
  | "fresh"
  | "fresh-loop"
  | "cooldown"
  | "cooldown-loop"
  | "last-resort";

export interface VideoDownloadResult {
  ok: boolean;
  path?: string;
  sourceUrl?: string;
  videoId?: number;
  tier?: SelectionTier;
  loop: boolean;
  error?: string;
}

export interface VideoSearchOptions {
  excludeIds?: Set<number>;
  cooldownIds?: Set<number>;
  lruSortedIds?: number[];
}
