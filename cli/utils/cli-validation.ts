import { CLIExecutor } from './cli-executor';
import { ConfigManager } from '../lib/config';
import { logger } from './logger';

export interface CLIValidationResult {
  tool: string;
  installed: boolean;
  version?: string;
  error?: string;
}

export interface ValidationSummary {
  allInstalled: boolean;
  results: CLIValidationResult[];
  missing: string[];
}

/**
 * Utility for validating CLI tool installations
 */
export class CLIValidator {
  /**
   * Validate a single CLI tool
   */
  static async validateTool(toolName: string): Promise<CLIValidationResult> {
    try {
      const installed = await CLIExecutor.isInstalled(toolName);

      if (!installed) {
        return {
          tool: toolName,
          installed: false,
          error: `CLI tool '${toolName}' is not installed`,
        };
      }

      const version = await CLIExecutor.getVersion(toolName);

      return {
        tool: toolName,
        installed: true,
        version: version || 'unknown',
      };
    } catch (error: any) {
      return {
        tool: toolName,
        installed: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate all AI provider CLI tools from configuration
   */
  static async validateAIProviders(): Promise<ValidationSummary> {
    logger.info('Validating AI provider CLI tools...');

    const config = await ConfigManager.loadAIConfig();

    // Get all enabled providers
    const enabledProviders = Object.values(config.providers).filter((p) => p.enabled);

    // Validate each CLI tool
    const results = await Promise.all(
      enabledProviders.map((provider) => this.validateTool(provider.cliCommand))
    );

    const missing = results.filter((r) => !r.installed).map((r) => r.tool);
    const allInstalled = missing.length === 0;

    return {
      allInstalled,
      results,
      missing,
    };
  }

  /**
   * Validate and report on CLI installations
   * Throws error if required CLIs are missing
   */
  static async validateAndReport(throwOnMissing: boolean = true): Promise<ValidationSummary> {
    const summary = await this.validateAIProviders();

    // Log results
    logger.info('CLI Validation Results:');
    for (const result of summary.results) {
      if (result.installed) {
        logger.info(`  ✓ ${result.tool} (${result.version})`);
      } else {
        logger.error(`  ✗ ${result.tool} - ${result.error}`);
      }
    }

    // If not all installed, provide installation instructions
    if (!summary.allInstalled) {
      logger.error('\nMissing CLI tools. Please install them:');
      logger.error('');

      for (const tool of summary.missing) {
        logger.error(`${tool}:`);

        switch (tool) {
          case 'codex':
            logger.error('  npm install -g @openai/codex');
            logger.error('  OR: Visit https://github.com/openai/codex for installation');
            break;

          case 'claude':
            logger.error('  npm install -g @anthropic-ai/claude-code');
            logger.error('  OR: curl -fsSL https://claude.ai/install.sh | bash');
            break;

          case 'gemini':
            logger.error('  npm install -g @google/gemini-cli');
            logger.error('  OR: Visit https://github.com/google-gemini/gemini-cli');
            break;

          default:
            logger.error(`  Please install '${tool}' and ensure it's in your PATH`);
        }

        logger.error('');
      }

      if (throwOnMissing) {
        throw new Error(
          `Missing required CLI tools: ${summary.missing.join(', ')}\nPlease install them and try again.`
        );
      }
    } else {
      logger.info('\n✓ All required CLI tools are installed');
    }

    return summary;
  }

  /**
   * Validate a specific provider CLI tool
   */
  static async validateProvider(providerName: string): Promise<CLIValidationResult> {
    const config = await ConfigManager.loadAIConfig();
    const provider = config.providers[providerName];

    if (!provider) {
      throw new Error(`Provider '${providerName}' not found in configuration`);
    }

    return this.validateTool(provider.cliCommand);
  }

  /**
   * Get installation instructions for a CLI tool
   */
  static getInstallationInstructions(toolName: string): string[] {
    const instructions: Record<string, string[]> = {
      codex: [
        'Option 1: npm install -g @openai/codex',
        'Option 2: Visit https://github.com/openai/codex',
        'After installation, authenticate with: codex auth login',
      ],
      claude: [
        'Option 1: npm install -g @anthropic-ai/claude-code',
        'Option 2: curl -fsSL https://claude.ai/install.sh | bash',
        'After installation, authenticate with: claude auth login',
      ],
      gemini: [
        'Option 1: npm install -g @google/gemini-cli',
        'Option 2: Visit https://github.com/google-gemini/gemini-cli',
        'After installation, authenticate with: gemini auth login',
      ],
    };

    return (
      instructions[toolName] || [
        `Please install '${toolName}' CLI tool`,
        'Ensure it is in your system PATH',
      ]
    );
  }

  /**
   * Check if a provider is ready to use (installed and configured)
   */
  static async isProviderReady(providerName: string): Promise<boolean> {
    try {
      const result = await this.validateProvider(providerName);
      return result.installed;
    } catch {
      return false;
    }
  }

  /**
   * Get list of ready (installed) providers
   */
  static async getReadyProviders(): Promise<string[]> {
    const config = await ConfigManager.loadAIConfig();
    const providers = Object.keys(config.providers);

    const results = await Promise.all(
      providers.map(async (name) => ({
        name,
        ready: await this.isProviderReady(name),
      }))
    );

    return results.filter((r) => r.ready).map((r) => r.name);
  }
}
