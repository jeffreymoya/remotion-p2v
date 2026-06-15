import type { Unit } from "./types";

/** Trim to a sensible precision: more decimals for small magnitudes. */
const trim = (value: number): string => {
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return parseFloat(value.toFixed(decimals)).toString();
};

/**
 * Format a numeric value with its {@link Unit} suffix. Single source of value
 * formatting shared by the charts and the kinetic stat overlay, replacing the
 * three near-duplicate `formatValue` helpers in the source library.
 *
 * The caller passes the value it wants displayed — no hidden magnitude scaling.
 */
export const formatValue = (value: number, unit: Unit = ""): string => {
  switch (unit) {
    case "$":
      return "$" + Math.round(value).toLocaleString("en-US");
    case "%":
      return trim(value) + "%";
    case "x":
      return trim(value) + "x";
    case "T":
    case "B":
    case "M":
    case "K":
      return trim(value) + unit;
    case "":
    default:
      return value.toLocaleString("en-US");
  }
};
