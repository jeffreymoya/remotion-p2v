// src/components/geom/motion.ts
import { useCurrentFrame, useVideoConfig } from "remotion";
import { type Vec2 } from "./math";

/**
 * Gait/oscillation phase (radians) at `frame` for a cycle running at
 * `cadenceHz` cycles per second. Pure — safe to unit test.
 */
export const phaseAt = (
  frame: number,
  fps: number,
  cadenceHz: number,
  phaseOffset = 0,
): number => (frame / fps) * cadenceHz * Math.PI * 2 + phaseOffset;

/** Sine displacement of magnitude `amplitude` for a given `phase`. */
export const oscillate = (phase: number, amplitude = 1): number =>
  amplitude * Math.sin(phase);

/** Point on an orbit of `radius` at angular `phase` (radians) around (cx, cy). */
export const orbitPoint = (phase: number, radius: number, cx = 0, cy = 0): Vec2 => ({
  x: cx + radius * Math.cos(phase),
  y: cy + radius * Math.sin(phase),
});

/** Frame-driven phase hook. Generalises `race/useGait`. */
export const usePhase = (cadenceHz: number, phaseOffset = 0): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return phaseAt(frame, fps, cadenceHz, phaseOffset);
};

/** Frame-driven sine oscillation hook. */
export const useOscillation = (cadenceHz: number, amplitude = 1, phaseOffset = 0): number =>
  oscillate(usePhase(cadenceHz, phaseOffset), amplitude);

/** Frame-driven orbit hook returning a moving point. */
export const useOrbit = (
  cadenceHz: number,
  radius: number,
  cx = 0,
  cy = 0,
  phaseOffset = 0,
): Vec2 => orbitPoint(usePhase(cadenceHz, phaseOffset), radius, cx, cy);
