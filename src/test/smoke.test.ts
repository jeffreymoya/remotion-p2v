import { describe, it, expect } from "vitest";

describe("Vitest Infrastructure", () => {
  it("should run basic assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("should support async tests", async () => {
    const result = await Promise.resolve("hello");
    expect(result).toBe("hello");
  });
});
