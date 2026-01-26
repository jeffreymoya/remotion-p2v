import { NextResponse } from "next/server";
// Stock asset providers (Pexels/Unsplash/Pixabay) are deprecated and the endpoint is disabled.
export const GET = async () =>
  NextResponse.json(
    { error: "Remote stock image search has been deprecated; use local uploads instead." },
    { status: 410 }
  );
