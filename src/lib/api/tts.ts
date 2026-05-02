const API_BASE = "/api";

export interface TTSGenerateRequest {
  projectId: string;
  segmentIndex: number;
  force?: boolean;
}

export interface TTSGenerateResponse {
  segment: {
    index: number;
    text: string;
    audioUrl: string;
    actualDuration: number;
    timestamps: Array<{ word: string; startMs: number; endMs: number }>;
  };
}

export async function generateTTS(request: TTSGenerateRequest): Promise<TTSGenerateResponse> {
  const res = await fetch(`${API_BASE}/tts/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "TTS generation failed");
  }

  return res.json();
}

// Batch TTS generation is handled directly in the script-builder workflow.
