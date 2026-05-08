export interface BlockEntry {
  name: string;
  role: "hook" | "structure" | "visual" | "retention";
  guidelineSection: string;
  whenToUse: string;
  props: Record<string, string>;
}

export const BLOCK_CATALOG: BlockEntry[] = [
  {
    name: "ContradictionHook",
    role: "hook",
    guidelineSection: "§1 Hook — Contradiction",
    whenToUse: "Opening reveals that a common belief is wrong or incomplete.",
    props: {
      setup: "string: The popular belief being set up",
      reveal: "string: The contradiction that punctures it",
      style: '"stark"|"split": visual treatment (default: stark)',
    },
  },
  {
    name: "CostOfIgnoranceHook",
    role: "hook",
    guidelineSection: "§1 Hook — Cost of Ignorance",
    whenToUse: "Opening emphasizes the price of not knowing something.",
    props: {
      cost: "string: The high-stakes cost statement",
      who: "string?: optional audience qualifier",
    },
  },
  {
    name: "HiddenMechanismHook",
    role: "hook",
    guidelineSection: "§1 Hook — Hidden Mechanism",
    whenToUse: "Opening teases a secret or hidden system the viewer doesn't know about.",
    props: {
      headline: "string: The attention-grabbing headline",
      teaser: "string: One-sentence teaser about what's hidden",
    },
  },
  {
    name: "MythVsEvidenceHook",
    role: "hook",
    guidelineSection: "§1 Hook — Myth vs Evidence",
    whenToUse: "Opening contrasts a widely-held myth with factual evidence.",
    props: {
      myth: "string: The common myth",
      evidence: "string: The factual counter-evidence",
    },
  },
  {
    name: "PromiseCard",
    role: "structure",
    guidelineSection: "§2 Structure — Viewer Promise",
    whenToUse: "Tells the viewer what they'll learn or gain by continuing to watch.",
    props: {
      promise: "string: The promise heading (e.g. 'By the end, you'll know…')",
      bullets: "string[]?: list of specific outcomes",
    },
  },
  {
    name: "ContextCard",
    role: "structure",
    guidelineSection: "§2 Structure — Context",
    whenToUse: "Provides background context or setup for the main content.",
    props: {
      body: "string: The context paragraph",
    },
  },
  {
    name: "DiagramScene",
    role: "visual",
    guidelineSection: "§3 Visual — Diagram",
    whenToUse: "Explains a system, flow, or relationship using nodes and edges.",
    props: {
      title: "string?: diagram title",
      nodes: "Array<{label, x, y}>: positioned node labels (x/y as 0-100%)",
      edges: "Array<{from, to, label?}>?: connections between nodes",
      annotation: "string?: text shown after diagram is revealed",
    },
  },
  {
    name: "ComparisonSplit",
    role: "visual",
    guidelineSection: "§3 Visual — Comparison",
    whenToUse: "Side-by-side comparison of two options, approaches, or states.",
    props: {
      leftLabel: "string: left column header",
      rightLabel: "string: right column header",
      rows: "Array<{label, left, right}>: comparison rows",
      verdict: "string?: concluding statement",
    },
  },
  {
    name: "BRoll",
    role: "visual",
    guidelineSection: "§3 Visual — B-Roll",
    whenToUse: "Full-bleed background image with optional animated overlays.",
    props: {
      backgroundAsset: "string: asset label from assets[] for background",
      overlayAssets: "Array<{label, x, y, scale?, entrance?, entranceFrame}>?: overlay images",
      caption: "string?: text overlay at bottom",
    },
  },
  {
    name: "Callout",
    role: "visual",
    guidelineSection: "§3 Visual — Callout",
    whenToUse: "Emphasizes a single key phrase or presents a list of points.",
    props: {
      phrase: "string: the key phrase or card heading",
      style: '"fullscreen"|"overlay"|"card": visual treatment (default: card)',
      backgroundAsset: "string?: asset label for blurred background",
      lines: "Array<{text, icon?, color?}>?: list items with optional icons",
    },
  },
  {
    name: "MicroQuestion",
    role: "retention",
    guidelineSection: "§4 Retention — Micro Question",
    whenToUse: "Poses a thought-provoking question to maintain viewer curiosity.",
    props: {
      question: "string: the primary question",
      questions: "string[]?: multiple questions shown sequentially",
      style: '"typewriter"|"fade": text reveal style (default: typewriter)',
    },
  },
  {
    name: "ContrastReveal",
    role: "retention",
    guidelineSection: "§4 Retention — Contrast Reveal",
    whenToUse: "Shows a setup statement, then reveals the surprising truth.",
    props: {
      setup: "string: the initial expectation",
      reveal: "string: the surprising truth",
    },
  },
  {
    name: "Reveal",
    role: "retention",
    guidelineSection: "§4 Retention — Reveal",
    whenToUse: "Dramatic reveal of a headline with optional body text.",
    props: {
      headline: "string: the reveal headline",
      body: "string?: supporting detail",
    },
  },
  {
    name: "Reframe",
    role: "retention",
    guidelineSection: "§4 Retention — Reframe",
    whenToUse: "Replaces one perspective with another, showing a shift in thinking.",
    props: {
      oldFrame: "string: the old way of thinking",
      newFrame: "string: the new perspective",
    },
  },
  {
    name: "MiniPayoff",
    role: "retention",
    guidelineSection: "§4 Retention — Mini Payoff",
    whenToUse: "Delivers a concise takeaway or rule with optional supporting bullets.",
    props: {
      rule: "string: the main takeaway",
      bullets: "string[]?: supporting points",
    },
  },
  {
    name: "Foreshadow",
    role: "retention",
    guidelineSection: "§4 Retention — Foreshadow",
    whenToUse: "Teases upcoming content to keep the viewer watching.",
    props: {
      tease: "string: the foreshadowing statement",
    },
  },
];

export function renderCatalogForPrompt(): string {
  return BLOCK_CATALOG.map((b) =>
    `## ${b.name} [${b.role}] — ${b.guidelineSection}\n` +
    `When to use: ${b.whenToUse}\n` +
    `Props:\n` +
    Object.entries(b.props).map(([k, v]) => `  ${k}: ${v}`).join("\n"),
  ).join("\n\n");
}
