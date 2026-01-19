/**
 * Google Cloud Text-to-Speech service with character-level timing
 */

import { v1beta1 } from '@google-cloud/text-to-speech';
import type { google } from '@google-cloud/text-to-speech/build/protos/protos';
import { TTSProvider, TTSOptions, TTSResult, WordTimestamp, CharacterTimestamp, TTSError } from '../../lib/media-types';
import { logger } from '../../utils/logger';

export class GoogleTTSProvider implements TTSProvider {
  name = 'google-tts';
  private client: v1beta1.TextToSpeechClient;
  private config: Record<string, unknown>;

  constructor(apiKey?: string, config?: Record<string, unknown>) {
    // Initialize v1beta1 client for timepoint support
    this.client = new v1beta1.TextToSpeechClient(
      apiKey ? { apiKey } : undefined
    );
    this.config = config ?? {};
  }

  /**
   * Generate audio with character-level timing
   */
  async generateAudio(text: string, options?: TTSOptions): Promise<TTSResult> {
    try {
      // Get voice from options, or from config
      const defaultVoice = this.config?.defaultVoice || {
        languageCode: 'en-US',
        name: 'en-US-Chirp3-HD-Algieba',
        ssmlGender: 'MALE'
      };

      const voiceName = options?.voice ?? defaultVoice.name;
      const languageCode = defaultVoice.languageCode || 'en-US';

      // Get audio config from config or use defaults
      const audioConfigDefaults = this.config?.audioConfig || {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0
      };

      // Add SSML marks for word-level timing
      const ssmlText = this.addSSMLMarks(text);

      logger.debug(`Generating TTS audio with Google Cloud TTS (voice: ${voiceName})`);

      const request: google.cloud.texttospeech.v1beta1.ISynthesizeSpeechRequest = {
        input: { ssml: ssmlText },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: options?.speed ?? audioConfigDefaults.speakingRate ?? 1.0,
          pitch: options?.pitch ?? audioConfigDefaults.pitch ?? 0.0,
          volumeGainDb: audioConfigDefaults.volumeGainDb ?? 0.0,
        },
        // v1beta1 uses enableTimePointing, not enableTimePointData
        enableTimePointing: [1], // 1 = SSML_MARK
      };

      const [response] = await this.client.synthesizeSpeech(request);

      if (!response.audioContent) {
        throw new Error('No audio content in Google TTS response');
      }

      const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

      // Debug: log what Google actually returned
      logger.debug(`[TTS Response] Timepoints in response: ${response.timepoints?.length || 0}`);
      if (response.timepoints && response.timepoints.length > 0) {
        logger.debug(`[TTS Response] First timepoint: ${JSON.stringify(response.timepoints[0])}`);
      } else {
        logger.warn(`[TTS Response] No timepoints returned by Google API - check voice SSML support`);
      }

      // Parse word-level timestamps from SSML marks
      const wordTimestamps = this.parseWordTimestamps(text, response.timepoints || []);

      // Convert word-level to character-level
      const characterTimestamps = this.convertToCharacterLevel(wordTimestamps);

      const durationMs = characterTimestamps.length > 0
        ? Math.max(...characterTimestamps.map(w => w.endMs))
        : 0;

      logger.info(`Generated TTS audio: ${durationMs}ms, ${characterTimestamps.length} words`);

      return {
        audioBuffer,
        format: 'mp3',
        durationMs,
        timestamps: characterTimestamps,
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Google TTS generation failed:', error);
      throw new TTSError(
        `Google TTS failed: ${err.message}`,
        'google-tts',
        error
      );
    }
  }

  /**
   * Add SSML marks before each word for timing
   */
  private addSSMLMarks(text: string): string {
    const words = text.split(/\s+/);
    const markedWords = words.map((word, i) => `<mark name="word${i}"/>${word}`);
    return `<speak>${markedWords.join(' ')}</speak>`;
  }

  /**
   * Parse word timestamps from SSML mark timepoints
   */
  private parseWordTimestamps(text: string, timepoints: Array<Record<string, unknown>>): WordTimestamp[] {
    const words = text.split(/\s+/);
    const timestamps: WordTimestamp[] = [];

    // Diagnostic: log timepoint coverage
    logger.debug(`[TTS Timing] Words: ${words.length}, Timepoints returned: ${timepoints.length}`);
    if (timepoints.length < words.length) {
      logger.warn(`[TTS Timing] Missing timepoints: expected ${words.length}, got ${timepoints.length} (${((timepoints.length / words.length) * 100).toFixed(1)}% coverage)`);
    }

    for (let i = 0; i < timepoints.length; i++) {
      const timepoint = timepoints[i];
      const nextTimepoint = timepoints[i + 1];

      const startMs = (timepoint.timeSeconds || 0) * 1000;
      const endMs = nextTimepoint ? nextTimepoint.timeSeconds * 1000 : startMs + 500; // Estimate end time

      if (i < words.length) {
        timestamps.push({
          word: words[i] || '',
          startMs,
          endMs,
        });
      }
    }

    // If we have more words than timepoints, estimate timing for remaining words
    if (words.length > timepoints.length) {
      const avgDuration = timestamps.length > 0
        ? (timestamps[timestamps.length - 1].endMs - timestamps[0].startMs) / timestamps.length
        : 500;

      let lastEndMs = timestamps.length > 0 ? timestamps[timestamps.length - 1].endMs : 0;

      for (let i = timepoints.length; i < words.length; i++) {
        timestamps.push({
          word: words[i],
          startMs: lastEndMs,
          endMs: lastEndMs + avgDuration,
        });
        lastEndMs += avgDuration;
      }
    }

    return timestamps;
  }

  /**
   * Convert word-level timestamps to character-level
   */
  private convertToCharacterLevel(wordTimestamps: WordTimestamp[]): WordTimestamp[] {
    return wordTimestamps.map(word => {
      const chars = word.word.split('');
      const charDuration = (word.endMs - word.startMs) / chars.length;

      const characters: CharacterTimestamp[] = chars.map((char, i) => ({
        char,
        startMs: word.startMs + (i * charDuration),
        endMs: word.startMs + ((i + 1) * charDuration),
      }));

      return {
        ...word,
        characters,
      };
    });
  }

  /**
   * Test if Google TTS is available
   */
  async test(): Promise<boolean> {
    try {
      const result = await this.generateAudio('Test');
      return result.audioBuffer.length > 0;
    } catch (error) {
      logger.error('Google TTS test failed:', error);
      return false;
    }
  }
}
