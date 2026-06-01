// Description source exporter (Step 3 / YPP Backlog 4).
//
// Generates a clean "Sources & attribution" block for the YouTube description
// from the per-video provenance the publish manifest (Deliverable C) already
// aggregated. The manifest is the single source of provenance truth — it has
// already resolved *used* research anchors, excluded cached/placeholder stock
// sources, and recorded gated third-party clips. This module is a pure
// formatter over that data; it performs no IO. The CLI wrapper
// (`scripts/docu-export-description.ts`) reads the manifest and writes the text.
//
// "Avoids overlong descriptions by summarizing and linking" (Backlog 4
// acceptance): research links are de-duplicated and capped with an overflow
// note; stock media is summarized as a count + provider link rather than one
// line per image; clips are listed individually because each one is a distinct
// rights attribution.

// ── Types ─────────────────────────────────────────────────────────────────

export interface DescriptionInput {
  /** Research anchor sources actually used on screen (manifest `sources`). */
  sources: Array<{ url: string; title?: string }>;
  /** Gated third-party clips (manifest `thirdPartyFootage`). */
  thirdPartyFootage: Array<{ sourceUrl: string; channel: string; title: string }>;
  /** Stock media summary (manifest `stockAssets`). */
  stockAssets?: { provider: string; count: number } | null;
  /** Background music (manifest `music`); only a path is known. */
  music?: { path: string } | null;
  /** Synthesized narration voice (manifest `voice`). */
  voice?: { name: string } | null;
  /** Cap on individually listed research links (default `DEFAULT_MAX_RESEARCH_LINKS`). */
  maxResearchLinks?: number;
}

export interface DescriptionGroups {
  research: Array<{ url: string; title: string }>;
  /** Number of de-duplicated research sources beyond `maxResearchLinks`. */
  researchOverflow: number;
  footage: Array<{ url: string; channel: string; title: string }>;
  stock: { provider: string; count: number } | null;
  music: { name: string } | null;
  voice: { name: string } | null;
}

export interface DescriptionExport {
  groups: DescriptionGroups;
  /** Plain-text block ready to paste into the YouTube description. */
  text: string;
}

export const DEFAULT_MAX_RESEARCH_LINKS = 12;

const PROVIDER_LINKS: Record<string, string> = {
  pexels: "https://www.pexels.com",
};

// ── Helpers ───────────────────────────────────────────────────────────────

function hasText(v: string | undefined | null): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Last path segment, query/hash stripped — used to name the music track. */
function basename(p: string): string {
  const seg = p.split(/[\\/]/).pop() ?? p;
  return seg.split(/[?#]/)[0] ?? seg;
}

function titleCase(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

/** De-duplicate by URL, preserving first-seen order and its title. */
function dedupeByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (!hasText(it.url) || seen.has(it.url)) continue;
    seen.add(it.url);
    out.push(it);
  }
  return out;
}

// ── Builder ───────────────────────────────────────────────────────────────

/**
 * Group + summarize the provenance into the structured shape the formatter
 * renders. Pure: no IO. Tolerates missing/empty sections — an absent group is
 * simply omitted from the output rather than rendered as "none".
 */
export function buildDescriptionGroups(inp: DescriptionInput): DescriptionGroups {
  const max = inp.maxResearchLinks ?? DEFAULT_MAX_RESEARCH_LINKS;

  const allResearch = dedupeByUrl(
    (inp.sources ?? [])
      .filter((s) => hasText(s.url))
      .map((s) => ({ url: s.url, title: hasText(s.title) ? s.title!.trim() : "" })),
  );
  const research = allResearch.slice(0, max);
  const researchOverflow = Math.max(0, allResearch.length - research.length);

  const footage = dedupeByUrl(
    (inp.thirdPartyFootage ?? [])
      .filter((c) => hasText(c.sourceUrl))
      .map((c) => ({ url: c.sourceUrl, channel: c.channel ?? "", title: c.title ?? "" })),
  );

  const stock =
    inp.stockAssets && inp.stockAssets.count > 0
      ? { provider: inp.stockAssets.provider, count: inp.stockAssets.count }
      : null;

  const music = inp.music && hasText(inp.music.path) ? { name: basename(inp.music.path) } : null;
  const voice = inp.voice && hasText(inp.voice.name) ? { name: inp.voice.name } : null;

  return { research, researchOverflow, footage, stock, music, voice };
}

// ── Formatter ─────────────────────────────────────────────────────────────

function researchLine(s: { url: string; title: string }): string {
  return hasText(s.title) ? `• ${s.title} — ${s.url}` : `• ${s.url}`;
}

function footageLine(c: { url: string; channel: string; title: string }): string {
  const label = hasText(c.title) ? `${c.channel} — "${c.title}"` : c.channel;
  return `• ${label} (${c.url})`;
}

function stockLine(stock: { provider: string; count: number }): string {
  const label = titleCase(stock.provider);
  const link = PROVIDER_LINKS[stock.provider.toLowerCase()];
  const noun = stock.count === 1 ? "image" : "images";
  return `• ${stock.count} stock ${noun} via ${label}${link ? ` — ${link}` : ""}`;
}

/**
 * Render the grouped provenance to the plain-text block. Empty groups are
 * omitted; if every group is empty the block is a single explanatory line so
 * the exporter never emits a stray header with nothing under it.
 */
export function formatDescriptionText(g: DescriptionGroups): string {
  const sections: string[] = [];

  if (g.research.length > 0) {
    const lines = g.research.map(researchLine);
    if (g.researchOverflow > 0) {
      lines.push(`…and ${g.researchOverflow} more source${g.researchOverflow === 1 ? "" : "s"} cited in the video.`);
    }
    sections.push(["Research & data:", ...lines].join("\n"));
  }

  if (g.footage.length > 0) {
    sections.push(["Footage (third-party):", ...g.footage.map(footageLine)].join("\n"));
  }

  if (g.stock) {
    sections.push(["Stock media:", stockLine(g.stock)].join("\n"));
  }

  if (g.music) {
    sections.push(["Music:", `• ${g.music.name}`].join("\n"));
  }

  if (g.voice) {
    sections.push(`Narration: synthesized voice (${g.voice.name}).`);
  }

  const body =
    sections.length > 0
      ? sections.join("\n\n")
      : "No external sources to attribute for this video.";

  return ["SOURCES & ATTRIBUTION", "", body].join("\n");
}

/** Convenience: group + format in one call. */
export function buildDescriptionSources(inp: DescriptionInput): DescriptionExport {
  const groups = buildDescriptionGroups(inp);
  return { groups, text: formatDescriptionText(groups) };
}
