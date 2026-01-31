import { useMutation } from "@tanstack/react-query";
import { refineTopic, RefineTopicPayload } from "@/src/lib/api/ai";

const aiKeys = {
  refine: (projectId: string) => ["ai", "refine", projectId] as const,
};

export function useRefineTopic() {
  return useMutation({
    mutationKey: aiKeys.refine("global"),
    mutationFn: (payload: RefineTopicPayload) => refineTopic(payload),
  });
}
