import { describe, it, expect } from "vitest";

import {
  normalizeAssetMapping,
  normalizeAssetMappings,
} from "../asset-mappings";

describe("normalizeAssetMapping", () => {
  it("converts legacy string to { assetId }", () => {
    expect(normalizeAssetMapping("asset-1")).toEqual({ assetId: "asset-1" });
  });

  it("passes through { assetId } unchanged", () => {
    expect(normalizeAssetMapping({ assetId: "asset-2" })).toEqual({
      assetId: "asset-2",
    });
  });

  it("preserves a valid viewport with start + end keyframes", () => {
    const mapping = normalizeAssetMapping({
      assetId: "asset-3",
      viewport: {
        start: { centerX: 0.2, centerY: 0.3, zoom: 1 },
        end: { centerX: 0.7, centerY: 0.8, zoom: 1.5 },
        easing: "easeOut",
      },
    });
    expect(mapping).toEqual({
      assetId: "asset-3",
      viewport: {
        start: { centerX: 0.2, centerY: 0.3, zoom: 1 },
        end: { centerX: 0.7, centerY: 0.8, zoom: 1.5 },
        easing: "easeOut",
      },
    });
  });

  it("drops viewport when start or end is malformed", () => {
    const mapping = normalizeAssetMapping({
      assetId: "asset-4",
      viewport: {
        start: { centerX: 0.2, centerY: 0.3 }, // missing zoom
        end: { centerX: 0.5, centerY: 0.5, zoom: 1 },
      },
    });
    expect(mapping).toEqual({ assetId: "asset-4" });
  });

  it("drops invalid easing", () => {
    const mapping = normalizeAssetMapping({
      assetId: "asset-5",
      viewport: {
        start: { centerX: 0, centerY: 0, zoom: 1 },
        end: { centerX: 1, centerY: 1, zoom: 2 },
        easing: "bogus",
      },
    });
    expect(mapping?.viewport?.easing).toBeUndefined();
  });

  it("rejects empty or invalid input", () => {
    expect(normalizeAssetMapping("")).toBeNull();
    expect(normalizeAssetMapping(null)).toBeNull();
    expect(normalizeAssetMapping({})).toBeNull();
    expect(normalizeAssetMapping({ assetId: "" })).toBeNull();
    expect(normalizeAssetMapping({ assetId: 42 })).toBeNull();
  });
});

describe("normalizeAssetMappings", () => {
  it("normalizes a mixed legacy + new record", () => {
    const out = normalizeAssetMappings({
      "0": "asset-a",
      "1": {
        assetId: "asset-b",
        viewport: {
          start: { centerX: 0, centerY: 0, zoom: 1 },
          end: { centerX: 1, centerY: 1, zoom: 2 },
        },
      },
    });
    expect(out).toEqual({
      0: { assetId: "asset-a" },
      1: {
        assetId: "asset-b",
        viewport: {
          start: { centerX: 0, centerY: 0, zoom: 1 },
          end: { centerX: 1, centerY: 1, zoom: 2 },
        },
      },
    });
  });

  it("skips entries with non-integer keys or bad values", () => {
    const out = normalizeAssetMappings({
      "0": "asset-a",
      foo: "asset-b",
      "-1": "asset-c",
      "2": null,
      "3": { assetId: "asset-d" },
    });
    expect(out).toEqual({
      0: { assetId: "asset-a" },
      3: { assetId: "asset-d" },
    });
  });

  it("returns {} for null/undefined/non-object input", () => {
    expect(normalizeAssetMappings(null)).toEqual({});
    expect(normalizeAssetMappings(undefined)).toEqual({});
    expect(normalizeAssetMappings("nope")).toEqual({});
  });
});
