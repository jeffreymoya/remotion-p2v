import { redirect } from "next/navigation";

type Params = { params: { id: string } };

export default async function LegacyTTSRedirect({ params }: Params) {
  const resolvedParams = await params;
  redirect(`/projects/${resolvedParams.id}/script`);
}
