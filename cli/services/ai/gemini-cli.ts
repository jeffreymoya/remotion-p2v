import { BaseCLIProvider } from './base';
import { AIProviderConfig, CompletionOptions } from '../../lib/types';
import { GeminiLogger } from './gemini-logger';

/**
 * Gemini CLI provider
 * Uses the `gemini` CLI tool for headless automation
 *
 * Note: Gemini CLI uses its own internal model configuration.
 * The command does not accept model parameters - it relies on
 * models configured in the Gemini CLI settings (e.g., gemini-2.5-flash-lite).
 */
export class GeminiCLIProvider extends BaseCLIProvider {
  private logger: GeminiLogger;
  private pipelineStage: string = 'unknown';

  constructor(config?: Partial<AIProviderConfig>) {
    super({
      name: 'gemini-cli',
      cliCommand: 'gemini',
      // Note: defaultModel removed - Gemini CLI uses its own configured models
      temperature: 0.7,
      maxTokens: 8000,
      ...config,
    });
    this.logger = GeminiLogger.getInstance();
  }

  /**
   * Set the current pipeline stage for logging purposes
   */
  public setPipelineStage(stage: string): void {
    this.pipelineStage = stage;
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
    const startTime = Date.now();

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
        const errorMsg = `Gemini CLI error: ${wrapper.error.message}`;
        await this.logger.logError(
          this.pipelineStage,
          prompt,
          errorMsg,
          {
            model: 'gemini-2.5-flash-lite',
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 8000,
          },
          startTime,
          undefined,
          { stats: wrapper.stats }
        );
        throw new Error(errorMsg);
      }

      // Log successful response
      await this.logger.logResponse(
        this.pipelineStage,
        prompt,
        wrapper.response,
        {
          model: 'gemini-2.5-flash-lite',
          temperature: this.config.temperature || 0.7,
          maxTokens: this.config.maxTokens || 8000,
        },
        startTime,
        undefined,
        { stats: wrapper.stats }
      );

      return wrapper.response;
    } catch (error) {
      // Log error if not already logged
      if (!(error instanceof Error && error.message.startsWith('Gemini CLI error:'))) {
        await this.logger.logError(
          this.pipelineStage,
          prompt,
          error instanceof Error ? error.message : String(error),
          {
            model: 'gemini-2.5-flash-lite',
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 8000,
          },
          startTime
        );
      }
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
    // Extract schema shape for explicit field requirements
    let schemaInstruction = '';
    let exampleOutput = '{"field": "value", "nested": {"key": "data"}}';

    if (schema) {
      try {
        // Try to extract shape from Zod schema for explicit field requirements
        const shape = (schema as any)._def?.shape?.();
        if (shape) {
          const fields = Object.entries(shape).map(([key, value]: [string, any]) => {
            const typeName = value._def?.typeName || 'unknown';
            const description = value._def?.description || '';
            let typeStr = 'any';
            if (typeName === 'ZodString') typeStr = 'string';
            else if (typeName === 'ZodNumber') typeStr = 'number';
            else if (typeName === 'ZodBoolean') typeStr = 'boolean';
            else if (typeName === 'ZodArray') typeStr = 'array';
            else if (typeName === 'ZodObject') typeStr = 'object';
            return `  - "${key}" (${typeStr}, REQUIRED)${description ? ': ' + description : ''}`;
          });

          schemaInstruction = `\n\nREQUIRED JSON STRUCTURE:
The response MUST include ALL of these fields:
${fields.join('\n')}`;

          // Build example based on actual schema
          const exampleFields = Object.entries(shape).map(([key, value]: [string, any]) => {
            const typeName = value._def?.typeName || 'unknown';
            if (typeName === 'ZodNumber') return `"${key}": 5`;
            if (typeName === 'ZodBoolean') return `"${key}": true`;
            if (typeName === 'ZodArray') return `"${key}": []`;
            if (typeName === 'ZodObject') return `"${key}": {}`;
            return `"${key}": "example value"`;
          });
          exampleOutput = `{${exampleFields.join(', ')}}`;
        }
      } catch {
        // Fallback if schema introspection fails
        schemaInstruction = '\n\nThe JSON must be valid and properly structured.';
      }
    }

    return `${prompt}${schemaInstruction}

CRITICAL INSTRUCTIONS:
1. Respond with ONLY valid JSON - no explanations, no additional text
2. Do not wrap the JSON in markdown code blocks
3. Ensure proper JSON syntax with correct brackets, commas, and quotes
4. All strings must be properly escaped
5. The entire response should be parseable as JSON
6. Include ALL required fields - missing fields will cause validation failure

Correct format example:
${exampleOutput}`;
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
    const startTime = Date.now();
    const isRetry = retryCount > 0;

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
        const errorMsg = `Gemini CLI error: ${wrapper.error.message}`;
        await this.logger.logError(
          this.pipelineStage,
          prompt,
          errorMsg,
          {
            model: 'gemini-2.5-flash-lite',
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 8000,
          },
          startTime,
          undefined,
          { isRetry, retryCount, structuredOutput: true }
        );
        throw new Error(errorMsg);
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
        const errorMsg = `Failed to parse JSON from Gemini response: ${parseError}`;
        await this.logger.logError(
          this.pipelineStage,
          prompt,
          errorMsg,
          {
            model: 'gemini-2.5-flash-lite',
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 8000,
          },
          startTime,
          undefined,
          { isRetry, retryCount, structuredOutput: true, parseError: true }
        );
        throw new Error(errorMsg);
      }

      // Validate with schema
      try {
        const validated = schema.parse(data);

        // Log successful structured response
        await this.logger.logResponse(
          this.pipelineStage,
          prompt,
          JSON.stringify(validated),
          {
            model: 'gemini-2.5-flash-lite',
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 8000,
          },
          startTime,
          undefined,
          { isRetry, retryCount, structuredOutput: true, validated: true }
        );

        // Clean up on success
        await this.orchestrator.deleteFile(outputPath);

        return validated;
      } catch (error) {
        if (error instanceof require('zod').ZodError) {
          // Validation failed, retry with error feedback
          if (retryCount < maxRetries) {
            const errorMsg = require('../../lib/types').formatZodErrors(error);

            // Log validation failure before retry
            await this.logger.logError(
              this.pipelineStage,
              prompt,
              `Validation failed, retrying: ${errorMsg}`,
              {
                model: 'gemini-2.5-flash-lite',
                temperature: this.config.temperature || 0.7,
                maxTokens: this.config.maxTokens || 8000,
              },
              startTime,
              undefined,
              { isRetry, retryCount, structuredOutput: true, validationError: true, willRetry: true }
            );

            const retryPrompt = `${prompt}

PREVIOUS ATTEMPT FAILED VALIDATION:
${errorMsg}

Please correct these issues and provide valid JSON matching the required structure.`;

            return this.structuredComplete(retryPrompt, schema, retryCount + 1);
          }

          // Final validation failure
          await this.logger.logError(
            this.pipelineStage,
            prompt,
            `Validation failed after ${maxRetries} retries`,
            {
              model: 'gemini-2.5-flash-lite',
              temperature: this.config.temperature || 0.7,
              maxTokens: this.config.maxTokens || 8000,
            },
            startTime,
            undefined,
            { isRetry, retryCount, structuredOutput: true, validationError: true, maxRetriesReached: true }
          );

          throw new require('../../lib/types').ValidationError(
            `Validation failed after ${maxRetries} retries`,
            error
          );
        }

        throw error;
      }
    } catch (error) {
      // Log error if not already logged
      if (
        !(error instanceof Error) ||
        (!error.message.startsWith('Gemini CLI error:') &&
          !error.message.startsWith('Failed to parse JSON') &&
          !error.message.startsWith('Validation failed'))
      ) {
        await this.logger.logError(
          this.pipelineStage,
          prompt,
          error instanceof Error ? error.message : String(error),
          {
            model: 'gemini-2.5-flash-lite',
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 8000,
          },
          startTime,
          undefined,
          { isRetry, retryCount, structuredOutput: true }
        );
      }
      throw error;
    }
  }
}

/**
 * Default Gemini CLI provider instance
 */
export const geminiProvider = new GeminiCLIProvider();
