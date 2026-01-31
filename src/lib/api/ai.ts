import { RefinementResponse } from "@/app/api/ai/refine/route";

export interface RefineTopicPayload {
  projectId: string;
  title: string;
  description?: string;
  targetAudience?: string;
  minDuration?: number;
  maxDuration?: number;
}

function parseError(response: Response, fallback: string) {
  return response
    .json()
    .then((data) => {
      if (typeof data?.error === "string") return data.error;
      if (data?.error?.title?.[0]) return data.error.title[0];
      return fallback;
    })
    .catch(() => fallback);
}

export async function refineTopic(payload: RefineTopicPayload): Promise<RefinementResponse> {
  const res = await fetch("/api/ai/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await parseError(res, "Failed to refine topic");
    throw new Error(message);
  }

  return res.json();
}
