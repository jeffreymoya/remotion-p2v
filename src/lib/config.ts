import * as fs from 'fs/promises';
import { z } from 'zod';
import { AIProviderConfig } from './types';
import { getConfigPath } from '@/src/lib/paths';

/**
 * Zod schema for AI configuration
 */
const AIConfigSchema = z.object({
  defaultProvider: z.string(),
  language: z.string().default('en'),
  providers: z.record(
    z.object({
      name: z.string(),
      cliCommand: z.string(),
      defaultModel: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
      enabled: z.boolean().default(true),
    })
  ),
  fallbackOrder: z.array(z.string()).optional(),
});

export type AIConfig = z.infer<typeof AIConfigSchema>;

/**
 * Zod schema for TTS configuration
 */
const TTSConfigSchema = z.object({
  defaultProvider: z.string(),
  providers: z.record(z.any()),
  fallbackOrder: z.array(z.string()).optional(),
  timeoutMs: z.number().optional(),
  retryConfig: z.object({
    maxRetries: z.number().default(3),
    retryDelayMs: z.number().default(1000),
    backoffMultiplier: z.number().default(2),
  }).optional(),
  caching: z.object({
    enabled: z.boolean().default(true),
    ttlSeconds: z.number().default(2592000),
  }).optional(),
});

export type TTSConfig = z.infer<typeof TTSConfigSchema>;

/**
 * Zod schema for Music configuration
 */
const MusicConfigSchema = z.object({
  enabled: z.boolean().default(false),
  defaultSource: z.string().optional(),
  sources: z.record(z.any()).optional(),
  selection: z.object({
    defaultGenre: z.string().optional(),
    moodMatching: z.object({
      enabled: z.boolean().default(true),
      aiProvider: z.string().optional(),
    }).optional(),
    durationMatching: z.object({
      enabled: z.boolean().default(true),
      allowLooping: z.boolean().default(true),
      fadeInMs: z.number().default(2000),
      fadeOutMs: z.number().default(3000),
    }).optional(),
  }).optional(),
  audio: z.object({
    volumeDucking: z.object({
      enabled: z.boolean().default(true),
      duckVolumePercent: z.number().default(20),
      fadeMs: z.number().default(500),
    }).optional(),
    normalization: z.object({
      enabled: z.boolean().default(true),
      targetLufs: z.number().default(-16),
    }).optional(),
    defaultVolume: z.number().default(0.3),
  }).optional(),
  download: z.object({
    maxConcurrent: z.number().default(3),
    timeoutMs: z.number().default(60000),
    retryAttempts: z.number().default(3),
    retryDelayMs: z.number().default(1000),
  }).optional(),
  caching: z.object({
    enabled: z.boolean().default(true),
    ttlSeconds: z.number().default(604800),
  }).optional(),
});

export type MusicConfig = z.infer<typeof MusicConfigSchema>;

/**
 * Zod schema for Video configuration
 */
const VideoConfigSchema = z.object({
  defaultAspectRatio: z.string().default('16:9'),
  aspectRatios: z.record(z.object({
    width: z.number(),
    height: z.number(),
    name: z.string(),
    description: z.string(),
    fps: z.number().default(30),
  })),
  duration: z.object({
    targetSeconds: z.number().default(720),
    minSeconds: z.number().default(600),
    maxSeconds: z.number().default(900),
  }).optional(),
  rendering: z.object({
    defaultQuality: z.string().default('draft'),
    qualities: z.record(z.any()).optional(),
    concurrency: z.number().default(4),
    timeoutMinutes: z.number().default(60),
  }).optional(),
  intro: z.object({
    enabled: z.boolean().default(true),
    durationMs: z.number().default(1000),
    titleAnimation: z.string().optional(),
    backgroundColor: z.string().optional(),
  }).optional(),
  transitions: z.object({
    defaultEnter: z.string().default('fade'),
    defaultExit: z.string().default('fade'),
    durationMs: z.number().default(500),
    available: z.array(z.string()).optional(),
  }).optional(),
  text: z.any().optional(),
  animations: z.any().optional(),
  validation: z.object({
    checkAssetExists: z.boolean().default(true),
    checkAudioSync: z.boolean().default(true),
    checkTimelineGaps: z.boolean().default(true),
    maxGapMs: z.number().default(100),
  }).optional(),
});

export type VideoConfig = z.infer<typeof VideoConfigSchema>;

/**
 * Configuration manager for loading and validating config files
 */
export class ConfigManager {
  private static configCache: Map<string, unknown> = new Map();

  /**
   * Load and validate a configuration file
   */
  static async load<T extends z.ZodTypeAny>(
    configName: string,
    schema?: T
  ): Promise<z.output<T>> {
    // Check cache first
    if (this.configCache.has(configName)) {
      return this.configCache.get(configName) as z.output<T>;
    }

    // Determine config file path
    const configPath = getConfigPath(configName);

    try {
      // Read config file
      const content = await fs.readFile(configPath, 'utf-8');

      // Parse JSON
      const data = JSON.parse(content);

      // Replace environment variables
      const processed = this.replaceEnvVars(data);

      // Validate with schema if provided
      let validated: T;
      if (schema) {
        validated = schema.parse(processed);
      } else {
        validated = processed as T;
      }

      // Cache the result
      this.configCache.set(configName, validated);

      return validated;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        throw new Error(
          `Configuration file not found: ${configPath}\nPlease create it based on the example in the refactoring plan.`
        );
      }

      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
        throw new Error(`Configuration validation failed for ${configName}:\n${errors}`);
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load configuration ${configName}: ${message}`);
    }
  }

  /**
   * Load AI configuration
   */
  static async loadAIConfig(): Promise<AIConfig> {
    return this.load('ai.config', AIConfigSchema);
  }

  /**
   * Save configuration to file
   */
  static async save(configName: string, data: unknown): Promise<void> {
    const configPath = getConfigPath(configName);

    try {
      // Write atomically with temp file
      const tempPath = `${configPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');

      // Rename atomically
      await fs.rename(tempPath, configPath);

      // Update cache
      this.configCache.set(configName, data);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to save configuration ${configName}: ${err.message}`);
    }
  }

  /**
   * Clear configuration cache
   */
  static clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Replace environment variable placeholders in config
   */
  private static replaceEnvVars(obj: unknown): unknown {
    if (typeof obj === 'string') {
      // Replace ${VAR_NAME} with process.env.VAR_NAME
      return obj.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        const value = process.env[varName];
        if (value === undefined) {
          throw new Error(`Environment variable ${varName} is not defined`);
        }
        return value;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceEnvVars(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceEnvVars(value);
      }
      return result;
    }

    return obj;
  }

  /**
   * Get AI provider configuration by name
   */
  static async getAIProvider(providerName: string): Promise<AIProviderConfig> {
    const config = await this.loadAIConfig();

    const providerConfig = config.providers[providerName];
    if (!providerConfig) {
      throw new Error(`AI provider '${providerName}' not found in configuration`);
    }

    if (!providerConfig.enabled) {
      throw new Error(`AI provider '${providerName}' is disabled in configuration`);
    }

    return providerConfig as AIProviderConfig;
  }

  /**
   * Get default AI provider configuration
   */
  static async getDefaultAIProvider(): Promise<AIProviderConfig> {
    const config = await this.loadAIConfig();
    return this.getAIProvider(config.defaultProvider);
  }

  /**
   * Get fallback AI providers in order
   */
  static async getFallbackProviders(): Promise<string[]> {
    const config = await this.loadAIConfig();
    return config.fallbackOrder || ['gemini-cli', 'codex', 'claude-code'];
  }

  /**
   * Load TTS configuration
   */
  static async loadTTSConfig(): Promise<TTSConfig> {
    return this.load('tts.config', TTSConfigSchema);
  }

  /**
   * Load Music configuration
   */
  static async loadMusicConfig(): Promise<MusicConfig> {
    return this.load('music.config', MusicConfigSchema);
  }

  /**
   * Load Video configuration
   */
  static async loadVideoConfig(): Promise<VideoConfig> {
    return this.load('video.config', VideoConfigSchema);
  }
}
