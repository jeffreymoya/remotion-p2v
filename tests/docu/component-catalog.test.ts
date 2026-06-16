/**
 * Usage:
 *   tsx tests/docu/component-catalog.test.ts
 */
import { strict as assert } from "node:assert";
import { COMPONENT_CATEGORIES } from "../../src/components/docu/common/meta";
import {
  CAPTION_COMPONENT,
  loadComponentCatalog,
  selectableComponents,
} from "../../src/lib/docu/component-catalog";

const catalog = loadComponentCatalog();

assert.equal(catalog.length, 19, "loads 19 registry entries");
assert.equal(catalog.every((entry) => COMPONENT_CATEGORIES.includes(entry.category)), true, "all categories are known");
assert.equal(selectableComponents(catalog).some((entry) => entry.name === CAPTION_COMPONENT), false, "caption is not selectable");
assert.equal(catalog.every((entry) => entry.requiresData === (entry.category === "data")), true, "requiresData follows data category");

console.log("PASS component catalog");
