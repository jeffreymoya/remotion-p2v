import { PipelineStageId } from "@/src/lib/storyflow/stage-validation";
import { ProjectStatus } from "@/src/lib/storyflow/types";

export interface PipelineStage<
  TInput = void,
  TOutput = void,
  TOptions extends PipelineStageOptions = PipelineStageOptions
> {
  id: PipelineStageId;
  requiredStatus: ProjectStatus;
  allowedStatuses?: ProjectStatus[];
  targetStatus: ProjectStatus;

  /** Validate prerequisites and extract input from project state. */
  prepare(projectId: string): Promise<TInput>;

  /** Execute the stage logic. */
  execute(input: TInput, options?: TOptions): Promise<TOutput>;

  /** Persist artifacts and update project status. */
  commit(projectId: string, output: TOutput, input?: TInput): Promise<void>;
}

export type PipelineStageOptions = {
  onProgress?: (percent: number) => void;
};
