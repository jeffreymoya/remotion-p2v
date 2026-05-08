export const palette = {
  bg: "#020617",
  card: "#0f172a",
  border: "#1e293b",
  text: "#f8fafc",
  muted: "#94a3b8",
  accent: "#38bdf8",
  positive: "#4ade80",
  negative: "#f87171",
  warning: "#fbbf24",
} as const;

export const font = {
  display: "'Inter', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const easing = {
  smooth: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  spring: { damping: 14, mass: 0.8, stiffness: 140 },
  snappy: { damping: 10, mass: 0.5, stiffness: 200 },
} as const;

export const duration = {
  short: 15,
  medium: 30,
  long: 45,
} as const;
