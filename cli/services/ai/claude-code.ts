import { BaseCLIProvider } from './base';
import { AIProviderConfig, CompletionOptions } from '../../lib/types';

/**
 * Claude Code CLI provider
 * Uses the `claude` CLI tool with -p/--print flag for headless mode
 */
export class ClaudeCodeCLIProvider extends BaseCLIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      name: 'claude-code',
      cliCommand: 'claude',
      defaultModel: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4000,
      ...config,
    });
  }

  /**
   * Build Claude Code CLI command
   *
   * Claude Code CLI uses -p/--print for headless mode
   * --output-format json returns structured output wrapper
   * For file-based approach, we instruct AI to write to file in prompt
   */
  protected buildCommand(
    prompt: string,
    outputPath: string,
    options?: CompletionOptions
  ): string {
    // Escape single quotes in prompt for shell (using double quotes)
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');

    const parts = [
      'claude',
      '-p', // Print/headless mode
      `"${escapedPrompt}"`,
      '--output-format json', // Get JSON output wrapper
    ];

    // Claude Code doesn't have direct temperature/model overrides in CLI
    // These would need to be configured in Claude settings

    // Redirect JSON output to file using shell redirection
    return `${parts.join(' ')} > "${outputPath}"`;
  }

  /**
   * Override complete to handle Claude Code's JSON wrapper format
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const outputPath = this.orchestrator.generateTempFilePath('claude-output');

    try {
      const command = this.buildCommand(prompt, outputPath, options);

      await require('../../utils/cli-executor').CLIExecutor.execute(command, {
        timeout: 300000,
      });

      // Read the JSON wrapper
      const wrapper = await this.orchestrator.readJSON<{
        result?: string;
        response?: string;
        is_error?: boolean;
        error?: string;
      }>(outputPath);

      // Clean up
      await this.orchestrator.deleteFile(outputPath);

      if (wrapper.is_error || wrapper.error) {
        throw new Error(`Claude Code error: ${wrapper.error || 'Unknown error'}`);
      }

      return wrapper.result || wrapper.response || '';
    } catch (error) {
      throw error;
    }
  }

  /**
   * Build prompt for file-based structured output
   * Claude Code doesn't have native schema support, so we rely on prompt instructions
   */
  protected buildFileBasedPrompt(
    prompt: string,
    outputPath: string,
    schema?: import('zod').ZodSchema<any>
  ): string {
    // For Claude, we need to be very explicit about JSON format
    const schemaInstruction = schema
      ? '\n\nThe JSON must be valid and match the expected structure.'
      : '';

    return `${prompt}${schemaInstruction}

CRITICAL INSTRUCTIONS:
1. Your response MUST be ONLY valid JSON - no explanations, no markdown, no code blocks
2. Write the JSON directly as your response
3. Ensure proper JSON formatting with correct brackets, commas, and quotes
4. Do not wrap the JSON in any markdown code blocks
5. Ensure all strings are properly escaped

Example of correct format:
{"key": "value", "nested": {"field": "data"}}`;
  }

  /**
   * Override structuredComplete to handle Claude's JSON wrapper
   */
  async structuredComplete<T>(
    prompt: string,
    schema: import('zod').ZodSchema<T>,
    retryCount: number = 0
  ): Promise<T> {
    const maxRetries = 2;
    const outputPath = this.orchestrator.generateTempFilePath('claude-structured');

    try {
      // Build prompt with explicit JSON instructions
      const fileBasedPrompt = this.buildFileBasedPrompt(prompt, outputPath, schema);

      // Build and execute command
      const command = this.buildCommand(fileBasedPrompt, outputPath);

      await require('../../utils/cli-executor').CLIExecutor.execute(command, {
        timeout: 300000,
      });

      // Read the JSON wrapper
      const wrapper = await this.orchestrator.readJSON<{
        result?: string;
        response?: string;
        is_error?: boolean;
        error?: string;
      }>(outputPath);

      if (wrapper.is_error || wrapper.error) {
        throw new Error(`Claude Code error: ${wrapper.error || 'Unknown error'}`);
      }

      // Parse the response as JSON
      let data: any;
      try {
        // Try to extract JSON from the response text
        const responseText = wrapper.result || wrapper.response || '';

        // Remove markdown code blocks if present
        const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                         responseText.match(/(\{[\s\S]*\})/);

        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        data = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON from Claude response: ${parseError}`);
      }

      // Validate with schema
      try {
        const validated = schema.parse(data);

        // Clean up on success
        await this.orchestrator.deleteFile(outputPath);

        return validated;
      } catch (error) {
        if (error instanceof require('zod').ZodError) {
          // Validation failed, retry with error feedback
          if (retryCount < maxRetries) {
            const errorMsg = require('../../lib/types').formatZodErrors(error);
            const retryPrompt = `${prompt}

PREVIOUS ATTEMPT FAILED VALIDATION:
${errorMsg}

Please correct these issues and provide valid JSON matching the structure.`;

            return this.structuredComplete(retryPrompt, schema, retryCount + 1);
          }

          throw new require('../../lib/types').ValidationError(
            `Validation failed after ${maxRetries} retries`,
            error
          );
        }

        throw error;
      }
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Default Claude Code CLI provider instance
 */
export const claudeCodeProvider = new ClaudeCodeCLIProvider();
