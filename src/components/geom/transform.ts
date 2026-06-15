// src/components/geom/transform.ts

/** `translate(x y)` SVG transform. */
export const translate = (x: number, y: number): string => `translate(${x} ${y})`;

/** `rotate(deg)` or `rotate(deg cx cy)` SVG transform. */
export const rotate = (deg: number, cx?: number, cy?: number): string =>
  cx === undefined || cy === undefined ? `rotate(${deg})` : `rotate(${deg} ${cx} ${cy})`;

/** `scale(sx sy)` SVG transform; `sy` defaults to `sx` (uniform). */
export const scale = (sx: number, sy: number = sx): string => `scale(${sx} ${sy})`;

/** Join transform fragments, dropping empty strings. */
export const compose = (...parts: readonly string[]): string =>
  parts.filter((p) => p.length > 0).join(" ");
