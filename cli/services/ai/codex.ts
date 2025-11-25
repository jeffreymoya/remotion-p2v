import { BaseCLIProvider } from './base';
import { AIProviderConfig, CompletionOptions } from '../../lib/types';

/**
 * OpenAI Codex CLI provider
 * Uses the `codex` CLI tool with exec mode for automation
 */
export class CodexCLIProvider extends BaseCLIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      name: 'codex',
      cliCommand: 'codex',
      defaultModel: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 8000,
      ...config,
    });
  }

  /**
   * Build Codex CLI command
   *
   * Codex CLI has native JSON schema support via --output-schema flag
   * For file-based output, we use -o flag to write output to file
   */
  protected buildCommand(
    prompt: string,
    outputPath: string,
    options?: CompletionOptions
  ): string {
    // Escape double quotes in prompt for shell
    const escapedPrompt = prompt.replace(/"/g, '\\"');

    const parts = [
      'codex',
      'exec',
      `"${escapedPrompt}"`,
      `-o "${outputPath}"`, // Write output to file
      '--skip-git-repo-check', // Allow running outside git repos
    ];

    // Add optional flags
    if (options?.model) {
      parts.push(`--model ${options.model}`);
    }

    if (options?.temperature !== undefined) {
      parts.push(`--temperature ${options.temperature}`);
    }

    return parts.join(' ');
  }

  /**
   * Codex-specific structured completion using native --output-schema support
   *
   * Note: This is a more advanced implementation that uses Codex's native schema support
   * The base class implementation using file-based approach is also valid
   */
  async structuredCompleteWithSchema<T>(
    prompt: string,
    schemaPath: string
  ): Promise<T> {
    const outputPath = this.orchestrator.generateTempFilePath('codex-schema-output');

    try {
      // Codex supports native JSON schema via --output-schema flag
      const command = [
        'codex',
        'exec',
        `"${prompt.replace(/"/g, '\\"')}"`,
        `--output-schema ${schemaPath}`,
        `-o "${outputPath}"`,
        '--skip-git-repo-check',
      ].join(' ');

      await require('../../utils/cli-executor').CLIExecutor.execute(command, {
        timeout: 300000,
      });

      // Wait for output file
      await this.orchestrator.waitForFile(outputPath, 30000);

      // Read and return JSON
      const data = await this.orchestrator.readJSON<T>(outputPath);

      // Clean up
      await this.orchestrator.deleteFile(outputPath);

      return data;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Default Codex CLI provider instance
 */
export const codexProvider = new CodexCLIProvider();
