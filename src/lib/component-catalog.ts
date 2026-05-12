export interface BlockEntry {
  name: string;
  role: "hook" | "structure" | "visual" | "retention";
  guidelineSection: string;
  whenToUse: string;
  effect: string;
  props: Record<string, string>;
}

// Re-export from single source of truth
export { BLOCK_CATALOG } from "../components/blocks/_registry";
import { BLOCK_CATALOG } from "../components/blocks/_registry";
import { MOTION_CATALOG } from "../motion/_registry";

import { SceneBlock } from "./scene-script-schema";

export function assertBlockRegistrySync(blockMapKeys: string[]): void {
  // Reads the discriminated union's options array for runtime schema introspection.
  const options = (SceneBlock as any)._def.options as any[];
  const schemaNames = options
    .map((o: any) => o._def.shape.type._def.values[0] as string)
    .sort();
  const catalogNames = BLOCK_CATALOG.map((b) => b.name).sort();
  const mapNames = [...blockMapKeys].sort();

  const missingFromCatalog = schemaNames.filter((n) => !catalogNames.includes(n));
  const missingFromMap = schemaNames.filter((n) => !mapNames.includes(n));

  if (missingFromCatalog.length > 0) {
    throw new Error(`BLOCK_CATALOG missing entries: ${missingFromCatalog.join(", ")}`);
  }
  if (missingFromMap.length > 0) {
    throw new Error(`BLOCK_MAP missing entries: ${missingFromMap.join(", ")}`);
  }
}

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
  ).join("\n\n") + renderMotionCatalog();
}

function renderMotionCatalog(): string {
  return `\n\n--- MOTION PLAYBOOK ---\n` +
    `For each overlayAsset in a BRoll block, set the "motion" field to the behavior that best matches the object's nature.\n` +
    `If no behavior fits, use "static".\n\n` +
    MOTION_CATALOG.map((m) =>
      `### ${m.name}\n` +
      `When to use: ${m.whenToUse}\n` +
      `Example objects: ${m.exampleObjects.join(", ") || "none"}`
    ).join("\n\n");
}
