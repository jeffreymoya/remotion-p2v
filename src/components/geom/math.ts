// src/components/geom/math.ts

/** A 2D point in SVG user space. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** Clamp `v` into the inclusive range `[min, max]`. */
export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

/** Linear interpolation from `a` to `b` at fraction `t` (0..1). */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Euclidean distance between two points. */
export const distance = (a: Vec2, b: Vec2): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

/** Degrees → radians. */
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

/** Radians → degrees. */
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/**
 * Point at `angleDeg` on a circle of radius `r` centred at (`cx`, `cy`).
 * 0° points along +x; angle increases clockwise in SVG's y-down space.
 */
export const polarToCartesian = (
  angleDeg: number,
  r: number,
  cx = 0,
  cy = 0,
): Vec2 => {
  const a = degToRad(angleDeg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

/** Rotate `p` by `angleDeg` around `origin`. */
export const rotatePoint = (p: Vec2, angleDeg: number, origin: Vec2 = { x: 0, y: 0 }): Vec2 => {
  const a = degToRad(angleDeg);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: origin.y + dx * Math.sin(a) + dy * Math.cos(a),
  };
};

/** Vertices of a regular `sides`-gon of radius `r`, optionally rotated. */
export const regularPolygon = (
  sides: number,
  r: number,
  cx = 0,
  cy = 0,
  rotationDeg = 0,
): readonly Vec2[] => {
  const out: Vec2[] = [];
  for (let i = 0; i < sides; i++) {
    out.push(polarToCartesian(rotationDeg + (360 / sides) * i, r, cx, cy));
  }
  return out;
};

/** Vertices of a `points`-pointed star alternating `outerR`/`innerR`. */
export const star = (
  points: number,
  outerR: number,
  innerR: number,
  cx = 0,
  cy = 0,
  rotationDeg = 0,
): readonly Vec2[] => {
  const out: Vec2[] = [];
  const step = 360 / (points * 2);
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    out.push(polarToCartesian(rotationDeg + step * i, r, cx, cy));
  }
  return out;
};

/** Format points as an SVG `points` attribute string. */
export const pointsToAttr = (pts: readonly Vec2[]): string =>
  pts.map((p) => `${p.x},${p.y}`).join(" ");
