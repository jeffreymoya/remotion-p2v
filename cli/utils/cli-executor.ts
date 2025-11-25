import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CLIExecutionOptions {
  timeout?: number; // milliseconds
  cwd?: string;
  env?: Record<string, string>;
  maxBuffer?: number; // bytes
}

export interface CLIExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number; // milliseconds
}

export class CLIExecutionError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly exitCode: number
  ) {
    super(message);
    this.name = 'CLIExecutionError';
  }
}

/**
 * Safely execute a CLI command with timeout and error handling
 */
export class CLIExecutor {
  /**
   * Execute a shell command and return the result
   * @throws CLIExecutionError if command fails
   */
  static async execute(
    command: string,
    options: CLIExecutionOptions = {}
  ): Promise<CLIExecutionResult> {
    const startTime = Date.now();

    const {
      timeout = 120000, // 2 minutes default
      cwd = process.cwd(),
      env = process.env,
      maxBuffer = 10 * 1024 * 1024, // 10MB default
    } = options;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd,
        env: { ...process.env, ...env },
        maxBuffer,
      });

      const executionTime = Date.now() - startTime;

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Check if it's a timeout error
      if (error.killed && error.signal === 'SIGTERM') {
        throw new CLIExecutionError(
          `Command timed out after ${timeout}ms`,
          command,
          error.stdout || '',
          error.stderr || '',
          -1
        );
      }

      // Check if command not found
      if (error.code === 127 || error.message.includes('command not found')) {
        throw new CLIExecutionError(
          `Command not found: ${command.split(' ')[0]}`,
          command,
          error.stdout || '',
          error.stderr || '',
          127
        );
      }

      // Other execution errors
      throw new CLIExecutionError(
        `Command failed with exit code ${error.code || 'unknown'}: ${error.message}`,
        command,
        error.stdout || '',
        error.stderr || '',
        error.code || 1
      );
    }
  }

  /**
   * Check if a CLI tool is installed and accessible
   */
  static async isInstalled(toolName: string): Promise<boolean> {
    try {
      await this.execute(`which ${toolName}`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the version of an installed CLI tool
   */
  static async getVersion(toolName: string): Promise<string | null> {
    try {
      const result = await this.execute(`${toolName} --version`, { timeout: 5000 });
      return result.stdout || result.stderr || null;
    } catch {
      return null;
    }
  }

  /**
   * Validate that all required CLI tools are installed
   */
  static async validateTools(tools: string[]): Promise<{
    installed: string[];
    missing: string[];
  }> {
    const results = await Promise.all(
      tools.map(async (tool) => ({
        tool,
        installed: await this.isInstalled(tool),
      }))
    );

    return {
      installed: results.filter((r) => r.installed).map((r) => r.tool),
      missing: results.filter((r) => !r.installed).map((r) => r.tool),
    };
  }
}
