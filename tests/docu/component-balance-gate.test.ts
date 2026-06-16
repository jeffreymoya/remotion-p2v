/**
 * Usage:
 *   tsx tests/docu/component-balance-gate.test.ts
 */
import { strict as assert } from "node:assert";
import {
  DEFAULT_BALANCE_CONFIG,
  gateComponentBalance,
  hasBalanceViolations,
} from "../../src/lib/docu/component-balance-gate";
import type { CatalogEntry } from "../../src/lib/docu/component-catalog";
import { loadComponentCatalog } from "../../src/lib/docu/component-catalog";
import type { ScenePlan } from "../../src/lib/pipeline/schemas";

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`PASS ${name}`);
}

function layer(component: string, layerRole: "primary" | "supporting" = "primary") {
  return {
    component,
    layerRole,
    props: {},
    anchors: [{ target: "enter", at: { kind: "sceneStart" as const } }],
  };
}

function plan(components: string[], supporting: string[] = []): ScenePlan {
  return {
    scenes: components.map((component, index) => ({
      id: `scene-${index}`,
      role: "evidence",
      focalOwner: "evidence",
      background: { assetRef: "" },
      layers: [layer(component), ...(supporting[index] ? [layer(supporting[index], "supporting")] : [])],
      emphasisWordRefs: [],
      evidenceRefs: [],
    })),
  };
}

const catalog = loadComponentCatalog();

test("below-floor fails", () => {
  const result = gateComponentBalance(plan(["TitleCard", "TitleCard", "TitleCard", "TitleCard", "TitleCard"]), catalog, { hasDataItems: true });
  assert.equal(result.belowFloor, true);
  assert.equal(hasBalanceViolations(result), true);
});

test("over-concentration one component fails", () => {
  const result = gateComponentBalance(plan(["TitleCard", "TitleCard", "TitleCard", "SplitCard", "PullQuote"]), catalog, { hasDataItems: true });
  assert.equal(result.overConcentratedComponents.some((entry) => entry.name === "TitleCard"), true);
  assert.equal(hasBalanceViolations(result), true);
});

test("balanced plan passes", () => {
  const result = gateComponentBalance(
    plan(["TitleCard", "SplitCard", "PullQuote", "ArticleCard", "EvidenceStamp"]),
    catalog,
    { hasDataItems: true },
  );
  assert.equal(result.belowFloor, false);
  assert.equal(result.overConcentratedComponents.length, 0);
  assert.equal(result.overConcentratedCategories.length, 0);
  assert.equal(hasBalanceViolations(result), false);
});

test("few-scenes floor clamps to primaryCount", () => {
  const result = gateComponentBalance(plan(["TitleCard", "SplitCard"]), catalog, { hasDataItems: true });
  assert.equal(result.floorTarget, 2);
});

test("data family is ineligible when no data items exist", () => {
  const result = gateComponentBalance(plan(["TitleCard", "SplitCard", "PullQuote", "ArticleCard"]), catalog, { hasDataItems: false });
  assert.equal(result.uncoveredEligibleFamilies.includes("data"), false);
});

test("component cap skipped when selectable catalog has two or fewer components", () => {
  const tinyCatalog: CatalogEntry[] = [
    { name: "A", tier: "composite", category: "title", purpose: "A", whenToUse: "A", scriptCues: [], requiresData: false },
    { name: "B", tier: "composite", category: "quote", purpose: "B", whenToUse: "B", scriptCues: [], requiresData: false },
  ];
  const result = gateComponentBalance(
    plan(["A", "A", "A"]),
    tinyCatalog,
    { hasDataItems: true },
    { ...DEFAULT_BALANCE_CONFIG, minDistinctFamilies: 1 },
  );
  assert.equal(result.overConcentratedComponents.length, 0);
});

console.log(`\n${passed} tests passed.`);
