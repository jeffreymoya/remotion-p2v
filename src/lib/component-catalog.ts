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
    name: "CostOfIgnoranceHook",
    role: "hook",
    guidelineSection: "§1 Hook — Cost of Ignorance",
    whenToUse: "Opening emphasizes the price of not knowing something.",
    effect: "Alarming cost statement appears in large red text with a decaying shake animation — creates immediate urgency and FOMO. Best for statistics or consequences.",
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
    effect: "Two-part stagger: headline fades in bold, then teaser slides up beneath it in muted text. Builds intrigue for 'here's what's actually happening' narratives.",
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
    effect: "50/50 split screen: left side shows myth with red ✗, right side shows evidence with green ✓. Both sides reveal with staggered entrance. Best for direct fact-vs-fiction moments.",
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
    effect: "Card slides up with spring physics; bullet points stagger in one by one with slide-up entrances. Clean, trustworthy look. Use immediately after the hook.",
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
    effect: "Centered body text fades in on dark background. Simple and clean. Use for one- or two-sentence context that doesn't need decoration.",
    props: {
      body: "string: The context paragraph",
    },
  },
  {
    name: "DiagramScene",
    role: "visual",
    guidelineSection: "§3 Visual — Diagram",
    whenToUse: "Explains a system, flow, or relationship using nodes and edges.",
    effect: "Nodes appear one by one on a dark background using % positioning; connecting edges draw in after nodes; optional annotation fades in last. Must have at least 3 meaningful nodes for visual impact — do not use with a single node.",
    props: {
      title: "string?: diagram title",
      nodes: "Array<{label, x, y}>: positioned node labels (x/y as 0-100%) — minimum 3 nodes",
      edges: "Array<{from, to, label?}>?: connections between nodes",
      annotation: "string?: text shown after diagram is revealed",
    },
  },
  {
    name: "ComparisonSplit",
    role: "visual",
    guidelineSection: "§3 Visual — Comparison",
    whenToUse: "Side-by-side comparison of two options, approaches, or states.",
    effect: "Two column headers appear (red left, green right), then rows stagger in one by one with opacity. Verdict fades in last in accent color. Visually satisfying for 3–5 row comparisons.",
    props: {
      leftLabel: "string: left column header",
      rightLabel: "string: right column header",
      rows: "Array<{label, left, right}>: comparison rows — include 2–5 rows",
      verdict: "string?: concluding statement",
    },
  },
  {
    name: "BRoll",
    role: "visual",
    guidelineSection: "§3 Visual — B-Roll",
    whenToUse: "Quick cutaway to a physical scene, product, or location. Use for 30–90 frames max.",
    effect: "Full-bleed image fills the frame; overlay images enter with springPop, slideUp, or slideLeft animations. CRITICAL: Never use BRoll as a persistent backdrop for text blocks — it makes text illegible. BRoll is a standalone visual beat, not a container.",
    props: {
      backgroundAsset: "string: asset label from assets[] for background",
      overlayAssets: "Array<{label, x, y, scale?, entrance?, entranceFrame}>?: overlay images — use springPop or slideUp for lively entrance, not just fadeIn",
      caption: "string?: text overlay at bottom",
    },
  },
  {
    name: "Callout",
    role: "visual",
    guidelineSection: "§3 Visual — Callout",
    whenToUse: "Emphasizes a single bold statement. Keep under 90 frames — this is a punch, not a lecture.",
    effect: "Three modes: 'fullscreen' = huge text with scale-pulse on dark bg (maximum impact); 'overlay' = text over blurred image; 'card' = white card with staggered line reveals. Never use an empty phrase — every Callout needs substantive text.",
    props: {
      phrase: "string: the key phrase or card heading — must be non-empty",
      style: '"fullscreen"|"overlay"|"card": visual treatment (default: card)',
      backgroundAsset: "string?: asset label for blurred background (overlay only)",
      lines: "Array<{text, icon?, color?}>?: list items with optional icons and colors",
    },
  },
  {
    name: "MicroQuestion",
    role: "retention",
    guidelineSection: "§4 Retention — Micro Question",
    whenToUse: "Poses a thought-provoking question to maintain viewer curiosity.",
    effect: "Question text on a radial-gradient dark background: typewriter mode reveals character by character with blinking cursor; fade mode stacks multiple questions with staggered opacity. Creates a 'wait, I want to know the answer' loop.",
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
    effect: "Muted gray setup text appears, holds, then fades out — accent-colored reveal text slides in from the right with color transition from gray to cyan. The visual 'but actually…' punch. Needs at least 120 frames to breathe.",
    props: {
      setup: "string: the initial expectation",
      reveal: "string: the surprising truth",
    },
  },
  {
    name: "Reveal",
    role: "retention",
    guidelineSection: "§4 Retention — Reveal",
    whenToUse: "Dramatic reveal of a headline with optional supporting detail.",
    effect: "Large headline fades in centered, then body text fades in below with 25-frame delay. Use for 'the answer is…' or 'here's what this means' moments.",
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
    effect: "Old frame appears in muted text with strikethrough, then accent-colored new frame slides in. Visual perspective shift — use after an explanation or stat to drive the point home.",
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
    effect: "Bold rule text fades in large and centered; bullet points stagger in below one by one. Feels like a summary card or 'write this down' moment. Good for scene closings.",
    props: {
      rule: "string: the main takeaway",
      bullets: "string[]?: supporting points — 2–4 bullets for best visual rhythm",
    },
  },
  {
    name: "Foreshadow",
    role: "retention",
    guidelineSection: "§4 Retention — Foreshadow",
    whenToUse: "Teases upcoming content to keep the viewer watching.",
    effect: "Italic muted teaser text fades in centered on dark background. Use at the very end of a scene to bridge to the next topic. Low visual weight — lean and purposeful.",
    props: {
      tease: "string: the foreshadowing statement",
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
