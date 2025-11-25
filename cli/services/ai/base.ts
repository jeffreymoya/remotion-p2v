import { z } from 'zod';
import { CLIExecutor, CLIExecutionError } from '../../utils/cli-executor';
import { FileOrchestrator } from '../../utils/file-orchestration';
import { logger } from '../../utils/logger';
import {
  AIProvider,
  AIProviderConfig,
  AIProviderError,
  CompletionOptions,
  formatZodErrors,
  ValidationError,
} from '../../lib/types';

/**
 * Base class for all CLI-based AI providers
 */
export abstract class BaseCLIProvider implements AIProvider {
  protected orchestrator: FileOrchestrator;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.orchestrator = new FileOrchestrator({
      workDir: `/tmp/remotion-p2v-ai/${config.name}`,
      cleanupOnSuccess: true,
      cleanupOnError: false, // Keep files for debugging
    });
  }

  get name(): string {
    return this.config.name;
  }

  /**
   * Initialize the provider (create work directories, validate CLI)
   */
  async initialize(): Promise<void> {
    await this.orchestrator.initialize();

    // Validate CLI is installed
    const isInstalled = await CLIExecutor.isInstalled(this.config.cliCommand);
    if (!isInstalled) {
      throw new AIProviderError(
        `CLI tool '${this.config.cliCommand}' is not installed. Please install it and try again.`,
        this.name
      );
    }

    const version = await CLIExecutor.getVersion(this.config.cliCommand);
    logger.info(`${this.name} initialized`, { version });
  }

  /**
   * Build a CLI command for the specific provider
   */
  protected abstract buildCommand(
    prompt: string,
    outputPath: string,
    options?: CompletionOptions
  ): string;

  /**
   * Build a prompt that instructs the AI to write JSON to a file
   */
  protected buildFileBasedPrompt(
    prompt: string,
    outputPath: string,
    schema?: z.ZodSchema<any>
  ): string {
    const schemaInstruction = schema
      ? `\n\nThe JSON must match this structure:\n${this.describeSchema(schema)}`
      : '';

    return `${prompt}${schemaInstruction}

IMPORTANT: Write your response as valid JSON to the file: ${outputPath}
Do not include any explanations or markdown formatting - only the JSON object.
Ensure the JSON is properly formatted and can be parsed.`;
  }

  /**
   * Describe a Zod schema in a human-readable format
   */
  protected describeSchema(schema: z.ZodSchema<any>): string {
    try {
      // Try to generate a sample object from the schema
      // This is a simplified version - you might want to use zod-to-json-schema
      return JSON.stringify(
        {
          _note: 'Schema description (generate a valid object matching this structure)',
        },
        null,
        2
      );
    } catch {
      return 'A valid JSON object matching the expected schema';
    }
  }

  /**
   * Complete a prompt and return raw text
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const outputPath = this.orchestrator.generateTempFilePath(`${this.name}-output`, 'txt');

    try {
      // Build command
      const command = this.buildCommand(prompt, outputPath, options);

      // Execute CLI
      logger.debug(`Executing ${this.name} CLI`, { command });
      const result = await CLIExecutor.execute(command, {
        timeout: 300000, // 5 minutes
      });

      // For simple completion, return stdout directly
      // Some CLIs might write to file, some to stdout
      if (result.stdout) {
        return result.stdout;
      }

      // If no stdout, try reading from file
      if (await this.orchestrator.fileExists(outputPath)) {
        const content = await this.orchestrator.readFile(outputPath);
        await this.orchestrator.deleteFile(outputPath);
        return content;
      }

      throw new AIProviderError(
        'No output received from CLI',
        this.name
      );
    } catch (error: any) {
      if (error instanceof CLIExecutionError) {
        throw new AIProviderError(
          `CLI execution failed: ${error.message}`,
          this.name,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Complete a prompt and return structured data validated against a schema
   */
  async structuredComplete<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    retryCount: number = 0
  ): Promise<T> {
    const maxRetries = 2;
    const outputPath = this.orchestrator.generateTempFilePath(`${this.name}-structured`);

    try {
      // Build prompt with file output instruction
      const fileBasedPrompt = this.buildFileBasedPrompt(prompt, outputPath, schema);

      // Build and execute command
      const command = this.buildCommand(fileBasedPrompt, outputPath);

      logger.debug(`Executing ${this.name} for structured output`, {
        outputPath,
        retryCount,
      });

      await CLIExecutor.execute(command, {
        timeout: 300000, // 5 minutes
      });

      // Wait for file to be created (some CLIs are async)
      await this.orchestrator.waitForFile(outputPath, 30000);

      // Read and parse JSON
      const data = await this.orchestrator.readJSON(outputPath);

      // Validate with Zod schema
      try {
        const validated = schema.parse(data);
        logger.debug(`${this.name} structured output validated successfully`);

        // Clean up on success
        await this.orchestrator.deleteFile(outputPath);

        return validated;
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Validation failed, retry with error feedback
          if (retryCount < maxRetries) {
            logger.warn(`${this.name} validation failed, retrying with feedback`, {
              retryCount: retryCount + 1,
            });

            const errorMsg = formatZodErrors(error);
            const retryPrompt = `${prompt}

PREVIOUS ATTEMPT FAILED VALIDATION:
${errorMsg}

Please correct these issues and provide a valid JSON response.`;

            return this.structuredComplete(retryPrompt, schema, retryCount + 1);
          }

          // Max retries reached
          throw new ValidationError(
            `Validation failed after ${maxRetries} retries:\n${formatZodErrors(error)}`,
            error
          );
        }

        throw error;
      }
    } catch (error: any) {
      // Clean up on error
      if (await this.orchestrator.fileExists(outputPath)) {
        logger.debug(`Keeping failed output file for debugging: ${outputPath}`);
      }

      if (error instanceof ValidationError || error instanceof AIProviderError) {
        throw error;
      }

      if (error instanceof CLIExecutionError) {
        throw new AIProviderError(
          `CLI execution failed: ${error.message}`,
          this.name,
          error
        );
      }

      throw new AIProviderError(
        `Structured completion failed: ${error.message}`,
        this.name,
        error
      );
    }
  }
}
