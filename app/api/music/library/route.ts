import { NextResponse } from "next/server";
// Pixabay music search has been deprecated and disabled.
export async function GET() {
  return NextResponse.json(
    {
      tracks: [],
      error: "Online music search has been deprecated; upload your own tracks instead.",
    },
    { status: 410 }
  );
}
