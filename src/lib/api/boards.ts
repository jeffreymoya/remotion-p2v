export interface Board {
  id: string;
  index: number;
  layout: {
    columns: number;
    rows: number;
  };
  regions: BoardRegion[];
}

export interface BoardRegion {
  id: string;
  position: {
    row: number;
    col: number;
  };
  assetId: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  animation?: unknown;
}

export async function fetchBoards(projectId: string): Promise<Board[]> {
  const res = await fetch(`/api/projects/${projectId}/boards`);
  if (!res.ok) throw new Error("Failed to fetch boards");
  const data = await res.json();
  return data.boards ?? [];
}

export async function createBoard(
  projectId: string,
  layout: { columns: number; rows: number }
): Promise<Board> {
  const res = await fetch(`/api/projects/${projectId}/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ layout }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to create board");
  }
  const data = await res.json();
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
  const res = await fetch(`/api/projects/${projectId}/boards/${boardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || "Failed to update board");
  }
  const data = await res.json();
  return data.board;
}
