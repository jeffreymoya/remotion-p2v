/**
 * AI Provider exports
 */

export { BaseCLIProvider } from './base';
export { CodexCLIProvider, codexProvider } from './codex';
export { ClaudeCodeCLIProvider, claudeCodeProvider } from './claude-code';
export { GeminiCLIProvider, geminiProvider } from './gemini-cli';

export * from '../../lib/types';

import { CodexCLIProvider } from './codex';
import { ClaudeCodeCLIProvider } from './claude-code';
import { GeminiCLIProvider } from './gemini-cli';
import { ConfigManager } from '../../lib/config';
import { AIProvider, AIProviderError } from '../../lib/types';
import { logger } from '../../utils/logger';

/**
 * Factory for creating AI provider instances
 */
export class AIProviderFactory {
  private static instances: Map<string, AIProvider> = new Map();

  /**
   * Get or create an AI provider instance
   */
  static async getProvider(providerName?: string): Promise<AIProvider> {
    // If no provider specified, use default from config
    if (!providerName) {
      const config = await ConfigManager.loadAIConfig();
      providerName = config.defaultProvider;
    }

    // Return cached instance if exists
    if (this.instances.has(providerName)) {
      return this.instances.get(providerName)!;
    }

    // Create new instance based on provider name
    let provider: AIProvider;

    switch (providerName) {
      case 'codex':
        const codexConfig = await ConfigManager.getAIProvider('codex');
        provider = new CodexCLIProvider(codexConfig);
        break;

      case 'claude-code':
        const claudeConfig = await ConfigManager.getAIProvider('claude-code');
        provider = new ClaudeCodeCLIProvider(claudeConfig);
        break;

      case 'gemini-cli':
        const geminiConfig = await ConfigManager.getAIProvider('gemini-cli');
        provider = new GeminiCLIProvider(geminiConfig);
        break;

      default:
        throw new AIProviderError(
          `Unknown AI provider: ${providerName}`,
          providerName
        );
    }

    // Initialize the provider
    await provider.initialize();

    // Cache the instance
    this.instances.set(providerName, provider);

    return provider;
  }

  /**
   * Get AI provider with automatic fallback
   */
  static async getProviderWithFallback(): Promise<AIProvider> {
    const config = await ConfigManager.loadAIConfig();
    const fallbackOrder = config.fallbackOrder || ['gemini-cli', 'codex', 'claude-code'];

    let lastError: Error | undefined;

    for (const providerName of fallbackOrder) {
      try {
        logger.debug(`Attempting to initialize ${providerName}...`);
        const provider = await this.getProvider(providerName);
        logger.info(`Using AI provider: ${providerName}`);
        return provider;
      } catch (error: any) {
        logger.warn(`Failed to initialize ${providerName}: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    throw new AIProviderError(
      `All AI providers failed to initialize. Last error: ${lastError?.message}`,
      'factory',
      lastError
    );
  }

  /**
   * Clear cached provider instances
   */
  static clearCache(): void {
    this.instances.clear();
  }
}
