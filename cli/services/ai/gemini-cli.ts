import { BaseCLIProvider } from './base';
import { AIProviderConfig, CompletionOptions } from '../../lib/types';

/**
 * Gemini CLI provider
 * Uses the `gemini` CLI tool for headless automation
 *
 * Note: Gemini CLI uses its own internal model configuration.
 * The command does not accept model parameters - it relies on
 * models configured in the Gemini CLI settings (e.g., gemini-2.5-flash-lite).
 */
export class GeminiCLIProvider extends BaseCLIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({
      name: 'gemini-cli',
      cliCommand: 'gemini',
      // Note: defaultModel removed - Gemini CLI uses its own configured models
      temperature: 0.7,
      maxTokens: 8000,
      ...config,
    });
  }

  /**
   * Build Gemini CLI command
   *
   * Correct format: gemini --yolo --model gemini-2.5-flash-lite --output-format json '<prompt>'
   */
  protected buildCommand(
    prompt: string,
    outputPath: string,
    options?: CompletionOptions
  ): string {
    // Escape single quotes in prompt for shell
    const escapedPrompt = prompt.replace(/'/g, "'\\''");

    const parts = [
      'gemini',
      '--yolo',
      '--model gemini-2.5-flash-lite',
      '--output-format json',
      `'${escapedPrompt}'`,
    ];

    // Redirect output to file
    return `${parts.join(' ')} > "${outputPath}"`;
  }

  /**
   * Override complete to handle Gemini CLI's JSON wrapper format
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const outputPath = this.orchestrator.generateTempFilePath('gemini-output');

    try {
      const command = this.buildCommand(prompt, outputPath, options);

      await require('../../utils/cli-executor').CLIExecutor.execute(command, {
        timeout: 300000,
      });

      // Read the JSON wrapper
      const wrapper = await this.orchestrator.readJSON<{
        response: string;
        stats?: any;
        error?: {
          type: string;
          message: string;
          code?: string;
        };
      }>(outputPath);

      // Clean up
      await this.orchestrator.deleteFile(outputPath);

      if (wrapper.error) {
        throw new Error(`Gemini CLI error: ${wrapper.error.message}`);
      }

      return wrapper.response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Build prompt for file-based structured output
   * Gemini CLI doesn't have native schema support, rely on prompt instructions
   */
  protected buildFileBasedPrompt(
    prompt: string,
    outputPath: string,
    schema?: import('zod').ZodSchema<any>
  ): string {
    // For Gemini, be explicit about JSON-only response
    const schemaInstruction = schema
      ? '\n\nThe JSON must be valid and properly structured.'
      : '';

    return `${prompt}${schemaInstruction}

CRITICAL INSTRUCTIONS:
1. Respond with ONLY valid JSON - no explanations, no additional text
2. Do not wrap the JSON in markdown code blocks
3. Ensure proper JSON syntax with correct brackets, commas, and quotes
4. All strings must be properly escaped
5. The entire response should be parseable as JSON

Correct format example:
{"field": "value", "nested": {"key": "data"}}`;
  }

  /**
   * Override structuredComplete to handle Gemini's JSON wrapper
   */
  async structuredComplete<T>(
    prompt: string,
    schema: import('zod').ZodSchema<T>,
    retryCount: number = 0
  ): Promise<T> {
    const maxRetries = 2;
    const outputPath = this.orchestrator.generateTempFilePath('gemini-structured');

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
        response: string;
        error?: { message: string };
      }>(outputPath);

      if (wrapper.error) {
        throw new Error(`Gemini CLI error: ${wrapper.error.message}`);
      }

      // Parse the response as JSON
      let data: any;
      try {
        const responseText = wrapper.response;

        // Try to extract JSON from the response
        // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
        let jsonText = responseText;

        // First try to extract from markdown code blocks
        const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1].trim();
        } else {
          // If no code blocks, try to find JSON object/array
          const jsonMatch = responseText.match(/([\[\{][\s\S]*[\]\}])/);
          if (jsonMatch) {
            jsonText = jsonMatch[1].trim();
          }
        }

        // Clean up any potential issues
        // Remove any leading/trailing whitespace and normalize line breaks
        jsonText = jsonText.trim().replace(/\r\n/g, '\n');

        data = JSON.parse(jsonText);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON from Gemini response: ${parseError}`);
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

Please correct these issues and provide valid JSON matching the required structure.`;

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
 * Default Gemini CLI provider instance
 */
export const geminiProvider = new GeminiCLIProvider();
