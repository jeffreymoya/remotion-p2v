import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  prefetchQuery,
  hydrateQuery,
  withInitialData,
  hasInitialData,
} from "@/src/lib/rsc-query-helpers";

describe("RSC Query Helpers", () => {
  describe("prefetchQuery", () => {
    it("fetches and returns data", async () => {
      const mockData = { id: "1", name: "Test" };
      const queryFn = vi.fn().mockResolvedValue(mockData);

      const result = await prefetchQuery(["test"], queryFn);

      expect(result).toEqual(mockData);
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it("throws error on failure", async () => {
      const queryFn = vi.fn().mockRejectedValue(new Error("Fetch failed"));

      await expect(prefetchQuery(["test"], queryFn)).rejects.toThrow("Fetch failed");
    });
  });

  describe("hydrateQuery", () => {
    it("sets query data in client", async () => {
      const queryClient = new QueryClient();
      const mockData = { id: "1", name: "Test" };
      const queryFn = vi.fn().mockResolvedValue(mockData);

      await hydrateQuery(queryClient, ["test"], queryFn);

      const cachedData = queryClient.getQueryData(["test"]);
      expect(cachedData).toEqual(mockData);
    });

    it("handles errors gracefully without throwing", async () => {
      const queryClient = new QueryClient();
      const queryFn = vi.fn().mockRejectedValue(new Error("Fetch failed"));

      // Should not throw
      await expect(hydrateQuery(queryClient, ["test"], queryFn)).resolves.toBeUndefined();

      // Should not set error state in cache
      const cachedData = queryClient.getQueryData(["test"]);
      expect(cachedData).toBeUndefined();
    });
  });

  describe("withInitialData", () => {
    it("wraps data in initialData prop", () => {
      const mockData = { id: "1", name: "Test" };
      const result = withInitialData(mockData);

      expect(result).toEqual({ initialData: mockData });
    });

    it("preserves data type", () => {
      const mockData: string[] = ["a", "b", "c"];
      const result = withInitialData(mockData);

      expect(result.initialData).toEqual(mockData);
      expect(Array.isArray(result.initialData)).toBe(true);
    });
  });

  describe("hasInitialData", () => {
    it("returns true for objects with initialData", () => {
      const props = { initialData: { id: "1" }, other: "value" };

      expect(hasInitialData(props)).toBe(true);
    });

    it("returns false for objects without initialData", () => {
      const props = { other: "value" };

      expect(hasInitialData(props)).toBe(false);
    });

    it("returns false for null", () => {
      expect(hasInitialData(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(hasInitialData(undefined)).toBe(false);
    });

    it("returns false for primitives", () => {
      expect(hasInitialData("string")).toBe(false);
      expect(hasInitialData(123)).toBe(false);
      expect(hasInitialData(true)).toBe(false);
    });
  });
});
