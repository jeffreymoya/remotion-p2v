import type { WordTiming } from "../audio-wav";
import type { OverlaySpec, DocuOverlay } from "./overlays/registry";
import { getAnchorStrategy } from "./overlays/registry";

// Re-export for backward compat — callers need no import path changes
export type { OverlaySpec };
export { normalizeToken } from "./overlays/anchor-strategies";

/**
 * Resolve overlay frame positions from narration word timings.
 *
 * Each overlay anchors to a phrase spoken by the narrator. The anchoring
 * strategy is determined by the overlay type via the registry, allowing
 * different overlay types to use different matching algorithms.
 *
 * The projection is generic: every spec carries the same anchor fields
 * (anchorPhrase, holdSec, leadSec) which are consumed by the strategy and
 * replaced with startFrame/endFrame. Type-specific fields pass through
 * unchanged.
 */
export function resolveOverlays(
  specs: OverlaySpec[],
  wordTimings: WordTiming[],
  fps: number,
): DocuOverlay[] {
  return specs.map((spec): DocuOverlay => {
    const strategy = getAnchorStrategy(spec.type);
    const { startFrame, endFrame } = strategy({ spec, wordTimings, fps });
    const { anchorPhrase, holdSec, leadSec, ...rest } = spec;
    return { ...rest, startFrame, endFrame } as DocuOverlay;
  });
}
