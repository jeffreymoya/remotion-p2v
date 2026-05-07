export interface Segment {
  title: string;
  startSeconds: number;
  endSeconds: number;
  narrative: string;
  visual: string;
  audio: string;
}

function parseTimestamp(raw: string): { start: number; end: number } {
  const cleaned = raw.trim().replace(/[\[\]]/g, "");
  const parts = cleaned.split("-");
  if (parts.length !== 2) {
    throw new Error(`Invalid timestamp format: "${raw}"`);
  }
  const parsePart = (p: string): number => {
    p = p.trim();
    if (p.includes(":")) {
      const [m, s] = p.split(":");
      return parseInt(m, 10) * 60 + parseInt(s, 10);
    }
    return parseInt(p, 10);
  };
  return { start: parsePart(parts[0]), end: parsePart(parts[1]) };
}

function extractTitle(line: string): string {
  const match = line.match(/^#+\s+\*{0,2}(.+?)\*{0,2}\s*$/);
  if (!match) {
    throw new Error(`Cannot extract title from line: "${line}"`);
  }
  return match[1].trim();
}

export function parseScript(raw: string): Segment[] {
  const lines = raw.split("\n");
  const segments: Segment[] = [];

  let overallTitle = "Untitled";
  let currentStart = 0;
  let currentEnd = 0;
  let collecting = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (collecting) {
        segments[segments.length - 1].narrative += "\n";
      }
      continue;
    }

    const titleMatch = line.match(/^#+\s+\*{0,2}(.+?)\*{0,2}\s*$/);
    if (titleMatch && titleMatch[0].startsWith("#") && !line.startsWith("**")) {
      overallTitle = extractTitle(line);
      continue;
    }

    const tsMatch = line.match(/^\*{0,2}\[(\d+:\d{2})\s*-\s*(\d+:\d{2})\]\*{0,2}/);
    if (tsMatch) {
      const { start, end } = parseTimestamp(`[${tsMatch[1]}-${tsMatch[2]}]`);
      currentStart = start;
      currentEnd = end;

      const afterTs = line.substring(tsMatch[0].length).trim();

      const segmentTitle = afterTs || `${overallTitle} (${tsMatch[1]}-${tsMatch[2]})`;

      segments.push({
        title: segmentTitle,
        startSeconds: start,
        endSeconds: end,
        narrative: "",
        visual: "",
        audio: "",
      });

      collecting = true;
      continue;
    }

    if (collecting && segments.length > 0) {
      const last = segments[segments.length - 1];
      last.narrative += (last.narrative ? " " : "") + line;
    }
  }

  if (segments.length === 0) {
    throw new Error("No segments found. Expected format: **[M:SS - M:SS] on its own line followed by narrative text.");
  }

  for (const seg of segments) {
    seg.narrative = seg.narrative.trim();
  }

  return segments;
}
