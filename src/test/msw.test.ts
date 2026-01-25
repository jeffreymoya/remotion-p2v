import { describe, it, expect } from "vitest";

describe("MSW Infrastructure", () => {
  it("should intercept API calls", async () => {
    const response = await fetch("http://localhost:3000/api/projects");
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.projects).toBeDefined();
    expect(data.projects[0].name).toBe("Test Project");
  });

  it("should handle parameterized routes", async () => {
    const response = await fetch("http://localhost:3000/api/projects/123");
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.project.id).toBe("123");
  });
});
