import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";

// Pixabay music search has been deprecated and disabled.
export const GET = withErrorHandler(
  async () =>
    NextResponse.json(
      {
        tracks: [],
        error: "Online music search has been deprecated; upload your own tracks instead.",
      },
      { status: 410 }
    ),
  "music/library"
);
