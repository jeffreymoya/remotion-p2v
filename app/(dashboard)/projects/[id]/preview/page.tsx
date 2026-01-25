import { redirect } from "next/navigation";

type Params = { params: { id: string } };

export default async function LegacyPreviewRedirect({ params }: Params) {
  const resolvedParams = await params;
  redirect(`/projects/${resolvedParams.id}/render`);
}
