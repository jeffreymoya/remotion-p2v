import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  COMPONENT_CATEGORIES,
  type ComponentCategory,
  type ComponentTier,
} from "../../components/docu/common/meta";

export interface CatalogEntry {
  name: string;
  tier: ComponentTier;
  category: ComponentCategory;
  purpose: string;
  whenToUse: string;
  scriptCues: string[];
  requiresData: boolean;
}

export const CAPTION_COMPONENT = "DocumentaryCaption";

const zCatalogComponent = z.object({
  name: z.string().min(1),
  tier: z.enum(["primitive", "composite", "scene"]),
  category: z.enum(COMPONENT_CATEGORIES),
  purpose: z.string().min(1),
  whenToUse: z.string().min(1),
  scriptCues: z.array(z.string()),
});

const zRegistry = z.object({
  components: z.array(z.unknown()),
});

export function loadComponentCatalog(): CatalogEntry[] {
  const registryPath = path.resolve("src/components/docu/registry.json");
  let raw: unknown;

  try {
    raw = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch (err) {
    throw new Error(
      `[component-catalog] unable to read ${registryPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const registry = zRegistry.parse(raw);
  return registry.components.map((component, index) => {
    const record = component as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : `component[${index}]`;
    if (record.category === undefined) {
      throw new Error(`[component-catalog] registry.json missing 'category' for ${name}`);
    }
    const parsed = zCatalogComponent.parse(component);
    return {
      ...parsed,
      scriptCues: [...parsed.scriptCues],
      requiresData: parsed.category === "data",
    };
  });
}

export function selectableComponents(catalog: CatalogEntry[]): CatalogEntry[] {
  return catalog.filter((entry) => entry.name !== CAPTION_COMPONENT);
}

export function categoryOf(catalog: CatalogEntry[], name: string): ComponentCategory | undefined {
  return catalog.find((entry) => entry.name === name)?.category;
}
