/**
 * Background music service
 * Searches Pixabay Music API and local music library
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { MusicTrack, MusicMood } from '../../lib/media-types';
import { PixabayService } from '../media/pixabay';
import { logger } from '../../utils/logger';

export class MusicService {
  private pixabayService?: PixabayService;
  private localMusicDir?: string;

  constructor(pixabayApiKey?: string, localMusicDir?: string) {
    if (pixabayApiKey) {
      this.pixabayService = new PixabayService(pixabayApiKey);
    }
    this.localMusicDir = localMusicDir;

    if (!this.pixabayService && !this.localMusicDir) {
      logger.warn('No music sources configured. Either provide Pixabay API key or local music directory.');
    }
  }

  /**
   * Search for music by mood and optional duration
   */
  async searchMusic(mood: MusicMood, duration?: number): Promise<MusicTrack[]> {
    logger.info(`Searching for music: mood=${mood}, duration=${duration}s`);

    const tracks: MusicTrack[] = [];

    // Search Pixabay Music API
    if (this.pixabayService) {
      try {
        const pixabayTracks = await this.pixabayService.searchMusic(mood, duration);
        tracks.push(...pixabayTracks);
        logger.debug(`Found ${pixabayTracks.length} tracks from Pixabay`);
      } catch (error: any) {
        logger.warn(`Pixabay music search failed: ${error.message}`);
      }
    }

    // Search local music library
    if (this.localMusicDir) {
      try {
        const localTracks = await this.searchLocalMusic(mood, duration);
        tracks.push(...localTracks);
        logger.debug(`Found ${localTracks.length} tracks from local library`);
      } catch (error: any) {
        logger.warn(`Local music search failed: ${error.message}`);
      }
    }

    logger.info(`Total music tracks found: ${tracks.length}`);
    return tracks;
  }

  /**
   * Search local music library
   */
  private async searchLocalMusic(mood: MusicMood, duration?: number): Promise<MusicTrack[]> {
    if (!this.localMusicDir) return [];

    const musicDir = path.resolve(this.localMusicDir);

    if (!await fs.pathExists(musicDir)) {
      logger.warn(`Local music directory does not exist: ${musicDir}`);
      return [];
    }

    // Look for music files in subdirectories organized by mood
    const moodDir = path.join(musicDir, mood);
    const tracks: MusicTrack[] = [];

    if (await fs.pathExists(moodDir)) {
      const files = await fs.readdir(moodDir);

      for (const file of files) {
        if (this.isAudioFile(file)) {
          const filePath = path.join(moodDir, file);
          const stats = await fs.stat(filePath);

          // Estimate duration based on file size (rough approximation)
          // Average MP3 bitrate ~128 kbps = 16 KB/s
          const estimatedDuration = stats.size / (16 * 1024);

          // If duration specified, filter by it (±30 seconds tolerance)
          if (!duration || Math.abs(estimatedDuration - duration) <= 30) {
            tracks.push({
              id: file,
              url: filePath,
              source: 'local',
              title: path.basename(file, path.extname(file)),
              duration: estimatedDuration,
              mood,
            });
          }
        }
      }
    }

    return tracks;
  }

  /**
   * Get best music track for given mood and duration
   */
  async getBestTrack(mood: MusicMood, targetDuration: number): Promise<MusicTrack | null> {
    const tracks = await this.searchMusic(mood, targetDuration);

    if (tracks.length === 0) {
      logger.warn(`No music tracks found for mood: ${mood}`);
      return null;
    }

    // Sort by duration closeness to target
    tracks.sort((a, b) => {
      const aDiff = Math.abs(a.duration - targetDuration);
      const bDiff = Math.abs(b.duration - targetDuration);
      return aDiff - bDiff;
    });

    return tracks[0];
  }

  /**
   * Get default background music for video duration
   */
  async getDefaultMusic(videoDurationSeconds: number): Promise<MusicTrack | null> {
    // Choose mood based on video length
    // Longer videos typically benefit from calmer, more sustained music
    const mood: MusicMood = videoDurationSeconds > 600 ? 'calm' : 'inspiring';

    return this.getBestTrack(mood, videoDurationSeconds);
  }

  /**
   * Check if file is an audio file
   */
  private isAudioFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext);
  }

  /**
   * List all available moods in local library
   */
  async listLocalMoods(): Promise<string[]> {
    if (!this.localMusicDir) return [];

    const musicDir = path.resolve(this.localMusicDir);

    if (!await fs.pathExists(musicDir)) {
      return [];
    }

    const entries = await fs.readdir(musicDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  }
}
