export interface BlockEntry {
  name: string;
  role: "hook" | "structure" | "visual" | "retention";
  guidelineSection: string;
  whenToUse: string;
  effect: string;
  props: Record<string, string>;
}

export const BLOCK_CATALOG: BlockEntry[] = [
  {
    name: "ContradictionHook",
    role: "hook",
    guidelineSection: "§1 Hook — Contradiction",
    whenToUse: "Opening reveals that a common belief is wrong or incomplete.",
    effect: "Two phrases in sequence: old belief appears large in red with strikethrough, fades out — new contradicting truth spring-slides in with cyan accent. Maximum dramatic impact in 3–5 seconds.",
    props: {
      setup: "string: The popular belief being set up",
      reveal: "string: The contradiction that punctures it",
      style: '"stark"|"split": visual treatment (default: stark)',
    },
  },
  {
    name: "StatCounter",
    role: "retention",
    guidelineSection: "§4 Retention — Stat Counter",
    whenToUse: "Presents a single key statistic with animated count-up. Best for data-driven moments — conversion rates, costs, time savings, scale figures.",
    effect: "Number counts up from zero to target value with radial glow backdrop in the stat color; flashes white at the final value; label slides up below. Pure data drama — use when you have a real number to land.",
    props: {
      value: 'string: Stat value including unit — e.g. "87%", "$2.4M", "10x"',
      label: "string: Short label beneath the number",
      sublabel: "string?: Optional secondary context (source, time period, etc.)",
      color: "string?: CSS accent color for the number (default: palette.accent #38bdf8)",
    },
  },
];

export function renderCatalogForPrompt(): string {
  const globalNote = `GLOBAL NOTE: Every block accepts an optional "transition" field controlling how it enters during the cross-fade window:
  { kind: "fade" }
  { kind: "slide", direction?: "from-left"|"from-right"|"from-top"|"from-bottom" }
  { kind: "flip",  direction?: "from-left"|"from-right"|"from-top"|"from-bottom" }
  { kind: "wipe",  direction?: "from-left"|"from-right"|"from-top"|"from-bottom"|
                               "from-top-left"|"from-top-right"|"from-bottom-left"|"from-bottom-right" }
Every block after the first MUST include a transition field. Vary kinds — do not repeat "fade" more than once.\n\n`;

  return globalNote + BLOCK_CATALOG.map((b) =>
    `## ${b.name} [${b.role}] — ${b.guidelineSection}\n` +
    `When to use: ${b.whenToUse}\n` +
    `Visual effect: ${b.effect}\n` +
    `Props:\n` +
    Object.entries(b.props).map(([k, v]) => `  ${k}: ${v}`).join("\n"),
  ).join("\n\n");
}
