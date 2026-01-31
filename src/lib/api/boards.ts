import {
  BoardPlan,
  BoardPromptsOutput,
  BoardRegionsOutput,
  BoardTriggersOutput,
} from "@/src/lib/boards-types";
import { Board, BoardRegion } from "@/src/lib/storyflow/types";
export type { Board, BoardRegion };
import { ViewportAnimation } from "@/src/lib/types";

async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = await res.json();
      message = body?.error || body?.message || message;
    } catch {
      // swallow parse errors; fallback to default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function fetchBoards(projectId: string): Promise<Board[]> {
  const data = await parseJsonResponse<{ boards?: Board[] }>(
    await fetch(`/api/projects/${projectId}/boards`)
  );
  return data.boards ?? [];
}

export async function createBoard(
  projectId: string,
  layout: { columns: number; rows: number }
): Promise<Board> {
  const data = await parseJsonResponse<{ board: Board }>(
    await fetch(`/api/projects/${projectId}/boards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout }),
    })
  );

  return data.board;
}

export async function updateBoard(
  projectId: string,
  boardId: string,
  updates: {
    layout: { columns: number; rows: number };
    regions: BoardRegion[];
  }
): Promise<Board> {
  const data = await parseJsonResponse<{ board: Board }>(
    await fetch(`/api/projects/${projectId}/boards/${boardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
  );

  return data.board;
}

export interface PlanBoardsInput {
  scriptSegments?: Array<{
    index: number;
    text: string;
    estimatedDuration?: number;
    wordCount?: number;
  }>;
  options?: {
    maxBoardDuration?: number;
    gridLayout?: { rows: number; cols: number };
    minSegmentsPerBoard?: number;
    maxSegmentsPerBoard?: number;
  };
}

export async function planBoards(
  projectId: string,
  payload: PlanBoardsInput,
  signal?: AbortSignal
): Promise<{ plan: BoardPlan; boards: BoardPlan["boards"] }> {
  const data = await parseJsonResponse<{ plan: BoardPlan; boards: BoardPlan["boards"] }>(
    await fetch(`/api/projects/${projectId}/boards/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    })
  );

  return data;
}

export interface GeneratePromptsInput {
  boards: BoardPlan["boards"];
  segments: Array<{
    id: string;
    order: number;
    text: string;
    estimatedDurationMs: number;
    speakingNotes?: string;
  }>;
  gridLayout?: { rows: number; cols: number };
}

export async function generateBoardPrompts(
  projectId: string,
  payload: GeneratePromptsInput,
  signal?: AbortSignal
): Promise<BoardPromptsOutput> {
  const data = await parseJsonResponse<{ data?: BoardPromptsOutput } & BoardPromptsOutput>(
    await fetch(`/api/projects/${projectId}/boards/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    })
  );

  return (data as { data?: BoardPromptsOutput }).data ?? (data as BoardPromptsOutput);
}

export interface DetectRegionsInput {
  boardId: string;
  imagePath: string;
  elements: Array<{
    id: string;
    type: string;
    gridPosition: { row: number; col: number; rowSpan?: number; colSpan?: number };
    description: string;
    label?: string;
    connectionTo?: string[];
  }>;
  gridLayout: { rows: number; cols: number };
}

export async function detectBoardRegions(
  projectId: string,
  payload: DetectRegionsInput,
  signal?: AbortSignal
): Promise<BoardRegionsOutput & { warnings?: string[] }> {
  return parseJsonResponse<BoardRegionsOutput & { warnings?: string[] }>(
    await fetch(`/api/projects/${projectId}/boards/regions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    })
  );
}

export interface GenerateTriggersInput {
  options?: {
    triggerAtSegmentStart?: boolean;
    triggerAtTopicShift?: boolean;
    minWordsBetweenTriggers?: number;
    transitionMs?: {
      segmentStart?: number;
      topicShift?: number;
      emphasis?: number;
    };
  };
}

export async function generateBoardTriggers(
  projectId: string,
  payload: GenerateTriggersInput = {},
  signal?: AbortSignal
): Promise<BoardTriggersOutput> {
  return parseJsonResponse<BoardTriggersOutput>(
    await fetch(`/api/projects/${projectId}/boards/triggers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    })
  );
}

export interface BuildViewportInput {
  fps?: number;
}

export async function buildViewport(
  projectId: string,
  payload: BuildViewportInput,
  signal?: AbortSignal
): Promise<{
  viewportJson: ViewportAnimation;
  outputPath: string;
  stats?: { boards: number; triggers: number; keyframes: number };
}> {
  return parseJsonResponse(
    await fetch(`/api/projects/${projectId}/boards/viewport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    })
  );
}

export async function uploadBoardImage(
  projectId: string,
  params: { file: File; boardId: string },
  signal?: AbortSignal
): Promise<{ imagePath: string; metadata: { width: number; height: number; aspectRatio: number } }> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("boardId", params.boardId);

  return parseJsonResponse(
    await fetch(`/api/projects/${projectId}/boards/upload-image`, {
      method: "POST",
      body: formData,
      signal,
    })
  );
}
