import { NextResponse } from "next/server";
import { deleteAsset } from "@/src/lib/storyflow/assets";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const deleted = await deleteAsset(id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/assets/[id]] delete failed", error);
    return NextResponse.json(
      { error: "Unable to delete asset" },
      { status: 500 }
    );
  }
}
