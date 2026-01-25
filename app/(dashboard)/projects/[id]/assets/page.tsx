import { redirect } from "next/navigation";

type Params = { params: { id: string } };

export default async function LegacyAssetsRedirect({ params }: Params) {
  const resolvedParams = await params;
  redirect(`/projects/${resolvedParams.id}/media`);
}
