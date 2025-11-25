import * as fs from 'fs/promises';
import * as path from 'path';
import { randomBytes } from 'crypto';

export interface FileOrchestrationOptions {
  workDir?: string; // Directory for temporary files
  cleanupOnSuccess?: boolean; // Delete files after successful read
  cleanupOnError?: boolean; // Delete files even on error
  maxRetries?: number; // Max retries for file operations
  retryDelay?: number; // Delay between retries in ms
}

export class FileOrchestrationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly filePath?: string
  ) {
    super(message);
    this.name = 'FileOrchestrationError';
  }
}

/**
 * Helper for file-based orchestration with AI CLI tools
 */
export class FileOrchestrator {
  private workDir: string;
  private cleanupOnSuccess: boolean;
  private cleanupOnError: boolean;
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: FileOrchestrationOptions = {}) {
    this.workDir = options.workDir || '/tmp/remotion-p2v-ai';
    this.cleanupOnSuccess = options.cleanupOnSuccess ?? true;
    this.cleanupOnError = options.cleanupOnError ?? false;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 100;
  }

  /**
   * Initialize the work directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.workDir, { recursive: true });
    } catch (error: any) {
      throw new FileOrchestrationError(
        `Failed to create work directory: ${error.message}`,
        'initialize',
        this.workDir
      );
    }
  }

  /**
   * Generate a unique temporary file path
   */
  generateTempFilePath(prefix: string, extension: string = 'json'): string {
    const timestamp = Date.now();
    const random = randomBytes(4).toString('hex');
    const filename = `${prefix}-${timestamp}-${random}.${extension}`;
    return path.join(this.workDir, filename);
  }

  /**
   * Write content to a file with retry logic
   */
  async writeFile(
    filePath: string,
    content: string,
    retryCount: number = 0
  ): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error: any) {
      if (retryCount < this.maxRetries) {
        await this.sleep(this.retryDelay * (retryCount + 1));
        return this.writeFile(filePath, content, retryCount + 1);
      }

      throw new FileOrchestrationError(
        `Failed to write file after ${retryCount} retries: ${error.message}`,
        'write',
        filePath
      );
    }
  }

  /**
   * Read content from a file with retry logic
   */
  async readFile(
    filePath: string,
    retryCount: number = 0
  ): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error: any) {
      // If file doesn't exist and we have retries left, wait and try again
      if (error.code === 'ENOENT' && retryCount < this.maxRetries) {
        await this.sleep(this.retryDelay * (retryCount + 1));
        return this.readFile(filePath, retryCount + 1);
      }

      throw new FileOrchestrationError(
        `Failed to read file after ${retryCount} retries: ${error.message}`,
        'read',
        filePath
      );
    }
  }

  /**
   * Read and parse JSON from a file
   */
  async readJSON<T = any>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);

    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;

      return JSON.parse(jsonContent) as T;
    } catch (error: any) {
      throw new FileOrchestrationError(
        `Failed to parse JSON: ${error.message}`,
        'parseJSON',
        filePath
      );
    }
  }

  /**
   * Write JSON to a file
   */
  async writeJSON(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.writeFile(filePath, content);
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      // Ignore if file doesn't exist
      if (error.code !== 'ENOENT') {
        console.warn(`Failed to delete file ${filePath}: ${error.message}`);
      }
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map((fp) => this.deleteFile(fp)));
  }

  /**
   * Execute a file-based AI interaction
   */
  async executeAIInteraction<T = any>(
    promptBuilder: (outputPath: string) => string,
    cliCommand: (prompt: string, outputPath: string) => string,
    validator?: (data: any) => T
  ): Promise<T> {
    const outputPath = this.generateTempFilePath('ai-output');
    const promptPath = this.generateTempFilePath('ai-prompt', 'txt');

    try {
      // Build prompt with output path instruction
      const prompt = promptBuilder(outputPath);

      // Write prompt to file (for debugging and audit trail)
      await this.writeFile(promptPath, prompt);

      // Execute CLI command (caller is responsible for this)
      // Just return the paths for the caller to use
      const data = await this.readJSON<T>(outputPath);

      // Validate if validator provided
      if (validator) {
        const validated = validator(data);

        // Clean up on success if configured
        if (this.cleanupOnSuccess) {
          await this.cleanup([outputPath, promptPath]);
        }

        return validated;
      }

      // Clean up on success if configured
      if (this.cleanupOnSuccess) {
        await this.cleanup([outputPath, promptPath]);
      }

      return data;
    } catch (error) {
      // Clean up on error if configured
      if (this.cleanupOnError) {
        await this.cleanup([outputPath, promptPath]);
      }

      throw error;
    }
  }

  /**
   * Wait for a file to be created with timeout
   */
  async waitForFile(
    filePath: string,
    timeout: number = 30000 // 30 seconds default
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 200; // Check every 200ms

    while (Date.now() - startTime < timeout) {
      try {
        await fs.access(filePath);
        return; // File exists
      } catch {
        // File doesn't exist yet, wait
        await this.sleep(checkInterval);
      }
    }

    throw new FileOrchestrationError(
      `File was not created within ${timeout}ms`,
      'waitForFile',
      filePath
    );
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default file orchestrator instance
 */
export const defaultOrchestrator = new FileOrchestrator({
  workDir: '/tmp/remotion-p2v-ai',
  cleanupOnSuccess: true,
  cleanupOnError: false, // Keep files on error for debugging
});
