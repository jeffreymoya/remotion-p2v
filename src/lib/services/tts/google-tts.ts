export class GoogleTTSProvider {
  constructor(_apiKey: string | undefined) {}

  async generateAudio(_text: string): Promise<{ audioBuffer: Buffer }> {
    throw new Error(
      "Google TTS is not available in this pivot. Run prompt-optimizer with --no-synthesize."
    );
  }
}
