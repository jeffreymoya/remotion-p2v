import type {
  AssetMapping,
  AssetMappings,
  SegmentKeyframe,
  SegmentViewport,
  SegmentViewportEasing,
} from "./types";

const EASINGS: ReadonlyArray<SegmentViewportEasing> = [
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseKeyframe(value: unknown): SegmentKeyframe | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (
    !isFiniteNumber(v.centerX) ||
    !isFiniteNumber(v.centerY) ||
    !isFiniteNumber(v.zoom)
  ) {
    return null;
  }
  return { centerX: v.centerX, centerY: v.centerY, zoom: v.zoom };
}

function parseViewport(value: unknown): SegmentViewport | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const start = parseKeyframe(v.start);
  const end = parseKeyframe(v.end);
  if (!start || !end) return undefined;
  const easing =
    typeof v.easing === "string" &&
    (EASINGS as ReadonlyArray<string>).includes(v.easing)
      ? (v.easing as SegmentViewportEasing)
      : undefined;
  return easing ? { start, end, easing } : { start, end };
}

/**
 * Normalize a single mapping value. Accepts:
 * - legacy string (asset id)
 * - { assetId, viewport? } object
 */
export function normalizeAssetMapping(raw: unknown): AssetMapping | null {
  if (typeof raw === "string") {
    return raw ? { assetId: raw } : null;
  }
  if (raw && typeof raw === "object") {
    const v = raw as Record<string, unknown>;
    if (typeof v.assetId !== "string" || !v.assetId) return null;
    const viewport = parseViewport(v.viewport);
    return viewport ? { assetId: v.assetId, viewport } : { assetId: v.assetId };
  }
  return null;
}

/**
 * Normalize the full mappings record from DB JSON or API input.
 * Tolerates the legacy `Record<number, string>` shape as well as the
 * new `Record<number, AssetMapping>` shape.
 */
export function normalizeAssetMappings(raw: unknown): AssetMappings {
  if (!raw || typeof raw !== "object") return {};
  const out: AssetMappings = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const idx = Number(k);
    if (!Number.isInteger(idx) || idx < 0) continue;
    const mapping = normalizeAssetMapping(v);
    if (mapping) out[idx] = mapping;
  }
  return out;
}
