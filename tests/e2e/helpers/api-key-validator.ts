/**
 * API Key Validator for E2E Tests
 *
 * Validates API keys before running expensive tests to:
 * - Check environment variables exist
 * - Validate format (not placeholder values like ${VAR_NAME})
 * - Make minimal test API call to verify connectivity
 * - Skip tests gracefully if keys missing (don't fail entire suite)
 * - Cache validation results for session
 */

export interface APIKeyValidationResult {
  provider: string;
  keyName: string;
  exists: boolean;
  isValid: boolean;
  error?: string;
}

export class APIKeyValidator {
  // Cache validation results to avoid repeated API calls
  private static validationCache: Map<string, APIKeyValidationResult> = new Map();

  /**
   * Validate Google TTS API key
   */
  static async validateGoogleTTS(): Promise<APIKeyValidationResult> {
    const keyName = 'GOOGLE_TTS_API_KEY';

    // Check cache first
    if (this.validationCache.has(keyName)) {
      return this.validationCache.get(keyName)!;
    }

    const result: APIKeyValidationResult = {
      provider: 'Google TTS',
      keyName,
      exists: false,
      isValid: false,
    };

    // Check if key exists
    const apiKey = process.env[keyName];
    if (!apiKey) {
      result.error = `${keyName} environment variable not set`;
      this.validationCache.set(keyName, result);
      return result;
    }

    result.exists = true;

    // Check if key is a placeholder
    if (this.isPlaceholder(apiKey)) {
      result.error = `${keyName} appears to be a placeholder value`;
      this.validationCache.set(keyName, result);
      return result;
    }

    // Make minimal test API call to verify key works
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        result.isValid = true;
      } else if (response.status === 403 || response.status === 401) {
        result.error = 'API key is invalid or lacks permissions';
      } else if (response.status === 429) {
        // Rate limited, but key is probably valid
        result.isValid = true;
        result.error = 'Rate limited (key likely valid)';
      } else {
        result.error = `API returned status ${response.status}`;
      }
    } catch (error: any) {
      result.error = `API call failed: ${error.message}`;
    }

    this.validationCache.set(keyName, result);
    return result;
  }

  /**
   * Validate Pexels API key
   */
  static async validatePexels(): Promise<APIKeyValidationResult> {
    const keyName = 'PEXELS_API_KEY';

    // Check cache first
    if (this.validationCache.has(keyName)) {
      return this.validationCache.get(keyName)!;
    }

    const result: APIKeyValidationResult = {
      provider: 'Pexels',
      keyName,
      exists: false,
      isValid: false,
    };

    // Check if key exists
    const apiKey = process.env[keyName];
    if (!apiKey) {
      result.error = `${keyName} environment variable not set`;
      this.validationCache.set(keyName, result);
      return result;
    }

    result.exists = true;

    // Check if key is a placeholder
    if (this.isPlaceholder(apiKey)) {
      result.error = `${keyName} appears to be a placeholder value`;
      this.validationCache.set(keyName, result);
      return result;
    }

    // Make minimal test API call
    try {
      const response = await fetch(
        'https://api.pexels.com/v1/search?query=test&per_page=1',
        {
          method: 'GET',
          headers: {
            'Authorization': apiKey,
          },
        }
      );

      if (response.ok) {
        result.isValid = true;
      } else if (response.status === 403 || response.status === 401) {
        result.error = 'API key is invalid';
      } else if (response.status === 429) {
        // Rate limited, but key is probably valid
        result.isValid = true;
        result.error = 'Rate limited (key likely valid)';
      } else {
        result.error = `API returned status ${response.status}`;
      }
    } catch (error: any) {
      result.error = `API call failed: ${error.message}`;
    }

    this.validationCache.set(keyName, result);
    return result;
  }

  /**
   * Validate Pixabay API key
   */
  static async validatePixabay(): Promise<APIKeyValidationResult> {
    const keyName = 'PIXABAY_API_KEY';

    // Check cache first
    if (this.validationCache.has(keyName)) {
      return this.validationCache.get(keyName)!;
    }

    const result: APIKeyValidationResult = {
      provider: 'Pixabay',
      keyName,
      exists: false,
      isValid: false,
    };

    // Check if key exists
    const apiKey = process.env[keyName];
    if (!apiKey) {
      result.error = `${keyName} environment variable not set`;
      this.validationCache.set(keyName, result);
      return result;
    }

    result.exists = true;

    // Check if key is a placeholder
    if (this.isPlaceholder(apiKey)) {
      result.error = `${keyName} appears to be a placeholder value`;
      this.validationCache.set(keyName, result);
      return result;
    }

    // Make minimal test API call
    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${apiKey}&q=test&per_page=3`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Pixabay returns 200 even with invalid key, but empty results
        if (data.totalHits !== undefined) {
          result.isValid = true;
        } else {
          result.error = 'API key appears invalid (unexpected response format)';
        }
      } else if (response.status === 429) {
        // Rate limited, but key is probably valid
        result.isValid = true;
        result.error = 'Rate limited (key likely valid)';
      } else {
        result.error = `API returned status ${response.status}`;
      }
    } catch (error: any) {
      result.error = `API call failed: ${error.message}`;
    }

    this.validationCache.set(keyName, result);
    return result;
  }

  /**
   * Validate Unsplash API key
   */
  static async validateUnsplash(): Promise<APIKeyValidationResult> {
    const keyName = 'UNSPLASH_ACCESS_KEY';

    // Check cache first
    if (this.validationCache.has(keyName)) {
      return this.validationCache.get(keyName)!;
    }

    const result: APIKeyValidationResult = {
      provider: 'Unsplash',
      keyName,
      exists: false,
      isValid: false,
    };

    // Check both possible environment variable names
    const apiKey = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_APP_ID;
    if (!apiKey) {
      result.error = `${keyName} (or UNSPLASH_APP_ID) environment variable not set`;
      this.validationCache.set(keyName, result);
      return result;
    }

    result.exists = true;

    // Check if key is a placeholder
    if (this.isPlaceholder(apiKey)) {
      result.error = `${keyName} appears to be a placeholder value`;
      this.validationCache.set(keyName, result);
      return result;
    }

    // Make minimal test API call
    try {
      const response = await fetch(
        'https://api.unsplash.com/search/photos?query=test&per_page=1',
        {
          method: 'GET',
          headers: {
            'Authorization': `Client-ID ${apiKey}`,
          },
        }
      );

      if (response.ok) {
        result.isValid = true;
      } else if (response.status === 403 || response.status === 401) {
        result.error = 'API key is invalid';
      } else if (response.status === 429) {
        // Rate limited, but key is probably valid
        result.isValid = true;
        result.error = 'Rate limited (key likely valid)';
      } else {
        result.error = `API returned status ${response.status}`;
      }
    } catch (error: any) {
      result.error = `API call failed: ${error.message}`;
    }

    this.validationCache.set(keyName, result);
    return result;
  }

  /**
   * Validate all API keys
   */
  static async validateAll(): Promise<APIKeyValidationResult[]> {
    const results = await Promise.all([
      this.validateGoogleTTS(),
      this.validatePexels(),
      this.validatePixabay(),
      this.validateUnsplash(),
    ]);

    return results;
  }

  /**
   * Determine if tests should be skipped based on validation results
   *
   * @param results - Array of validation results
   * @param requiredProviders - Optional array of required provider names (defaults to Google TTS only)
   * @returns True if tests should be skipped
   */
  static shouldSkipTests(
    results: APIKeyValidationResult[],
    requiredProviders: string[] = ['Google TTS']
  ): boolean {
    for (const provider of requiredProviders) {
      const result = results.find(r => r.provider === provider);
      if (!result || !result.isValid) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a value appears to be a placeholder
   *
   * @param value - The value to check
   * @returns True if the value looks like a placeholder
   */
  private static isPlaceholder(value: string): boolean {
    // Check for common placeholder patterns
    const placeholderPatterns = [
      /^\$\{.*\}$/,           // ${VAR_NAME}
      /^<.*>$/,               // <YOUR_KEY>
      /^your.*key.*here$/i,   // your_key_here, YOUR-KEY-HERE
      /^replace.*$/i,         // REPLACE_ME, replace-with-key
      /^example.*$/i,         // example-key
      /^test$/i,              // test
      /^abc.*123$/i,          // abc123, abcdef123
    ];

    return placeholderPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Print validation results to console
   *
   * @param results - Array of validation results
   */
  static printValidationResults(results: APIKeyValidationResult[]): void {
    console.log('\n🔑 API Key Validation Results:');
    console.log('━'.repeat(60));

    for (const result of results) {
      const status = result.isValid ? '✅' : result.exists ? '⚠️' : '❌';
      const message = result.error || 'Valid';

      console.log(`${status} ${result.provider.padEnd(15)} | ${message}`);
    }

    console.log('━'.repeat(60));
  }

  /**
   * Clear the validation cache (useful for testing)
   */
  static clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Check if at least one media provider is available
   *
   * @param results - Array of validation results
   * @returns True if at least one media provider is valid
   */
  static hasMediaProvider(results: APIKeyValidationResult[]): boolean {
    const mediaProviders = ['Pexels', 'Pixabay', 'Unsplash'];
    return results.some(r => mediaProviders.includes(r.provider) && r.isValid);
  }
}
