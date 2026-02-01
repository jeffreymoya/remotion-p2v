import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../library/route";

describe("GET /api/music/library", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 410 Gone with deprecation message", async () => {
    const req = new NextRequest("http://localhost:3000/api/music/library");

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body).toEqual({
      tracks: [],
      error: "Online music search has been deprecated; upload your own tracks instead.",
    });
  });

  it("maps unexpected errors through withErrorHandler", async () => {
    const jsonSpy = vi.spyOn(NextResponse, "json").mockImplementationOnce(() => {
      throw new Error("serialize failure");
    });

    const req = new NextRequest("http://localhost:3000/api/music/library");

    const res = await GET(req);
    const body = await res.json();

    expect(jsonSpy).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.error).toBeDefined();
  });
});
