import React from "react";
import { FRAME } from "../../../lib/layout/grid";

export interface BoxSize {
  /** Pixel width of the slot the component is rendering into. */
  readonly w: number;
  /** Pixel height of the slot the component is rendering into. */
  readonly h: number;
}

const FULL_FRAME: BoxSize = { w: FRAME.width, h: FRAME.height };

/**
 * Pixel size of the slot the current component is rendering into. Provided by
 * the renderer per-slot; defaults to the full frame so a component rendered
 * standalone (Showcase, tests) behaves exactly as it did before slots existed.
 */
export const BoxSizeContext = React.createContext<BoxSize>(FULL_FRAME);

export const useBoxSize = (): BoxSize => React.useContext(BoxSizeContext);

export const BoxSizeProvider: React.FC<{ size: BoxSize; children: React.ReactNode }> = ({
  size,
  children,
}) => <BoxSizeContext.Provider value={size}>{children}</BoxSizeContext.Provider>;

/**
 * Fit a display font to its slot: `fraction` of the box height, clamped to a
 * `[min, max]` px range. Keeps hero text legible at full-frame scale while
 * shrinking it to fit smaller slots instead of overflowing (and being clipped).
 */
export const fitFont = (boxH: number, fraction: number, max: number, min = 16): number =>
  Math.max(min, Math.min(max, Math.round(boxH * fraction)));
