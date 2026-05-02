/**
 * Shared media service types.
 */

/**
 * TTS provider interface
 */
export interface TTSProvider {
  name: string;
  generateAudio(text: string, options?: TTSOptions): Promise<TTSResult>;
}

/**
 * TTS generation options
 */
export interface TTSOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
}

/**
 * TTS result with timestamps
 */
export interface TTSResult {
  audioBuffer: Buffer;
  format: 'mp3';
  durationMs: number;
  timestamps: WordTimestamp[];
}

/**
 * Word-level timestamp with character-level data
 */
export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  characters?: CharacterTimestamp[];
}

/**
 * Character-level timestamp
 */
export interface CharacterTimestamp {
  char: string;
  startMs: number;
  endMs: number;
}

/**
 * Error thrown when TTS generation fails
 */
export class TTSError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TTSError';
  }
}
