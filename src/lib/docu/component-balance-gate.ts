import type { ComponentCategory } from "../../components/docu/common/meta";
import type { ScenePlan } from "../pipeline/schemas";
import {
  categoryOf,
  selectableComponents,
  type CatalogEntry,
} from "./component-catalog";

export interface BalanceConfig {
  minDistinctFamilies: number;
  maxComponentShare: number;
  maxCategoryShare: number;
}

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = {
  minDistinctFamilies: 5,
  maxComponentShare: 0.40,
  maxCategoryShare: 0.55,
};

export interface EvidenceAvailability {
  hasDataItems: boolean;
}

export interface BalanceViolations {
  primaryCount: number;
  distinctFamilies: number;
  floorTarget: number;
  belowFloor: boolean;
  overConcentratedComponents: Array<{ name: string; share: number }>;
  overConcentratedCategories: Array<{ category: ComponentCategory; share: number }>;
  uncoveredEligibleFamilies: ComponentCategory[];
}

function increment<K extends string>(map: Map<K, number>, key: K): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function eligibleSelectable(catalog: CatalogEntry[], evidence: EvidenceAvailability): CatalogEntry[] {
  return selectableComponents(catalog).filter((entry) => evidence.hasDataItems || !entry.requiresData);
}

export function gateComponentBalance(
  plan: ScenePlan,
  catalog: CatalogEntry[],
  evidence: EvidenceAvailability,
  config: BalanceConfig = DEFAULT_BALANCE_CONFIG,
): BalanceViolations {
  const primaryCount = plan.scenes.length;
  const componentCounts = new Map<string, number>();
  const categoryCounts = new Map<ComponentCategory, number>();
  const placedFamilies = new Set<ComponentCategory>();

  for (const scene of plan.scenes) {
    for (const layer of scene.layers) {
      const category = categoryOf(catalog, layer.component);
      if (category) placedFamilies.add(category);
    }

    const primary = scene.layers.find((layer) => layer.layerRole === "primary");
    if (!primary) continue;
    increment(componentCounts, primary.component);
    const category = categoryOf(catalog, primary.component);
    if (category) increment(categoryCounts, category);
  }

  const eligible = eligibleSelectable(catalog, evidence);
  const eligibleFamilies = Array.from(new Set(eligible.map((entry) => entry.category)));
  const floorTarget = Math.min(config.minDistinctFamilies, eligibleFamilies.length, primaryCount);
  const distinctFamilies = placedFamilies.size;

  const overConcentratedComponents = selectableComponents(catalog).length <= 2 || primaryCount === 0
    ? []
    : Array.from(componentCounts.entries())
        .map(([name, count]) => ({ name, share: count / primaryCount }))
        .filter((entry) => entry.share > config.maxComponentShare);

  const overConcentratedCategories = eligibleFamilies.length <= 2 || primaryCount === 0
    ? []
    : Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, share: count / primaryCount }))
        .filter((entry) => entry.share > config.maxCategoryShare);

  return {
    primaryCount,
    distinctFamilies,
    floorTarget,
    belowFloor: distinctFamilies < floorTarget,
    overConcentratedComponents,
    overConcentratedCategories,
    uncoveredEligibleFamilies: eligibleFamilies.filter((family) => !placedFamilies.has(family)),
  };
}

export function hasBalanceViolations(v: BalanceViolations): boolean {
  return v.belowFloor || v.overConcentratedComponents.length > 0 || v.overConcentratedCategories.length > 0;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatBalanceFeedback(
  v: BalanceViolations,
  config: BalanceConfig = DEFAULT_BALANCE_CONFIG,
): string {
  const lines: string[] = [];
  if (v.belowFloor) {
    const families = v.uncoveredEligibleFamilies.length > 0
      ? v.uncoveredEligibleFamilies.join(", ")
      : "any underused eligible family";
    lines.push(`- Only ${v.distinctFamilies} distinct families used (need >= ${v.floorTarget}). Add components from: ${families}.`);
  }
  for (const entry of v.overConcentratedComponents) {
    lines.push(`- "${entry.name}" is ${pct(entry.share)} of scenes (max ${pct(config.maxComponentShare)}). Replace some uses with a different component.`);
  }
  for (const entry of v.overConcentratedCategories) {
    lines.push(`- Category "${entry.category}" is ${pct(entry.share)} of scenes (max ${pct(config.maxCategoryShare)}). Replace some primaries with another family.`);
  }
  return lines.join("\n");
}
