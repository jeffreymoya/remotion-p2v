import React from "react";

export interface BoxProps {
  /** Content rendered inside the slot. */
  readonly children: React.ReactNode;
  /** Layout / paint styles for the box surface (display, padding, background…). */
  readonly style?: React.CSSProperties;
  /** Optional visual role for gate instrumentation. */
  readonly dataVisualRole?: string;
}

/**
 * Slot-fill surface and the canonical root of every composite. A component does
 * NOT own the frame — it renders into the box it is handed. `Box` fills its
 * positioned ancestor (the renderer's slot wrapper, or the full frame when used
 * standalone) and clips its own overflow, so a component can never paint outside
 * its assigned slot and collide with a neighbour.
 *
 * Components lay out their content inside the box with flex/grid/% — never with
 * hardcoded frame-absolute coordinates.
 */
export const Box: React.FC<BoxProps> = ({ children, style, dataVisualRole }) => (
  <div
    data-visual-role={dataVisualRole}
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);
