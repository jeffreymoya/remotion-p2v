/**
 * Cleanup Manager for E2E Tests
 *
 * Handles cleanup of:
 * - Test project artifacts
 * - Downloaded media files
 * - Provider caches
 * - Temporary files
 *
 * Also provides artifact preservation for debugging failed tests
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { TestProjectManager } from './test-project-manager';

/**
 * Manages cleanup of test artifacts and preservation on failure
 */
export class CleanupManager {
  private static preservationRoot = path.join(
    process.cwd(),
    'tests',
    'reports',
    'e2e',
    'failures'
  );

  /**
   * Clean up test artifacts for a specific project
   *
   * @param projectId - The project ID to clean up
   */
  static async cleanupTestArtifacts(projectId: string): Promise<void> {
    try {
      // Use TestProjectManager to clean up the project
      await TestProjectManager.cleanupTestProject(projectId);

      console.log(`✅ Cleaned up test artifacts for project: ${projectId}`);
    } catch (error: any) {
      console.error(`⚠️  Failed to clean up project ${projectId}:`, error.message);
      // Don't throw - cleanup failures shouldn't fail tests
    }
  }

  /**
   * Preserve test artifacts for debugging
   *
   * @param projectId - The project ID to preserve
   * @param testName - Name of the test that failed
   * @returns Path where artifacts were preserved
   */
  static async preserveArtifacts(projectId: string, testName: string): Promise<string> {
    try {
      const preservedPath = await TestProjectManager.preserveTestProject(projectId, testName);

      console.log(`📦 Test artifacts preserved at: ${preservedPath}`);
      console.log(`   Test: ${testName}`);
      console.log(`   Project: ${projectId}`);

      // Create a README in the preserved directory with debug info
      await this.createDebugReadme(preservedPath, projectId, testName);

      return preservedPath;
    } catch (error: any) {
      console.error(`⚠️  Failed to preserve artifacts for ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Clean up all test artifacts (useful for test suite teardown)
   */
  static async cleanupAllTestArtifacts(): Promise<void> {
    try {
      await TestProjectManager.cleanupAllTestProjects();

      console.log('✅ All test artifacts cleaned up');
    } catch (error: any) {
      console.error('⚠️  Failed to clean up all test artifacts:', error.message);
      // Don't throw - cleanup failures shouldn't fail tests
    }
  }

  /**
   * Clear provider caches (TTS, media providers, etc.)
   */
  static async clearProviderCaches(): Promise<void> {
    try {
      // Clear any cache directories that might exist
      const cacheDirs = [
        path.join(process.cwd(), '.cache', 'tts'),
        path.join(process.cwd(), '.cache', 'media'),
        path.join(process.cwd(), '.cache', 'ai'),
      ];

      for (const cacheDir of cacheDirs) {
        if (await fs.pathExists(cacheDir)) {
          await fs.emptyDir(cacheDir);
          console.log(`🗑️  Cleared cache: ${cacheDir}`);
        }
      }

      console.log('✅ Provider caches cleared');
    } catch (error: any) {
      console.error('⚠️  Failed to clear provider caches:', error.message);
      // Don't throw - cache cleanup failures shouldn't fail tests
    }
  }

  /**
   * Clean up old preserved artifacts (older than specified days)
   *
   * @param daysToKeep - Number of days to keep artifacts (default: 7)
   */
  static async cleanupOldArtifacts(daysToKeep: number = 7): Promise<void> {
    try {
      if (!await fs.pathExists(this.preservationRoot)) {
        return;
      }

      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // Convert to milliseconds

      const entries = await fs.readdir(this.preservationRoot);

      let removedCount = 0;
      for (const entry of entries) {
        const entryPath = path.join(this.preservationRoot, entry);
        const stats = await fs.stat(entryPath);

        if (stats.isDirectory()) {
          const age = now - stats.mtimeMs;

          if (age > maxAge) {
            await fs.remove(entryPath);
            removedCount++;
            console.log(`🗑️  Removed old artifacts: ${entry}`);
          }
        }
      }

      if (removedCount > 0) {
        console.log(`✅ Cleaned up ${removedCount} old artifact directories`);
      } else {
        console.log('✅ No old artifacts to clean up');
      }
    } catch (error: any) {
      console.error('⚠️  Failed to clean up old artifacts:', error.message);
      // Don't throw - cleanup failures shouldn't fail tests
    }
  }

  /**
   * Get size of all preserved artifacts
   *
   * @returns Total size in bytes
   */
  static async getPreservedArtifactsSize(): Promise<number> {
    try {
      if (!await fs.pathExists(this.preservationRoot)) {
        return 0;
      }

      let totalSize = 0;

      const calculateDirSize = async (dirPath: string): Promise<number> => {
        let size = 0;
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            size += await calculateDirSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            size += stats.size;
          }
        }

        return size;
      };

      totalSize = await calculateDirSize(this.preservationRoot);

      return totalSize;
    } catch (error: any) {
      console.error('⚠️  Failed to calculate preserved artifacts size:', error.message);
      return 0;
    }
  }

  /**
   * List all preserved artifact directories
   *
   * @returns Array of artifact directory paths with metadata
   */
  static async listPreservedArtifacts(): Promise<
    Array<{
      path: string;
      name: string;
      created: Date;
      sizeBytes: number;
    }>
  > {
    try {
      if (!await fs.pathExists(this.preservationRoot)) {
        return [];
      }

      const entries = await fs.readdir(this.preservationRoot);
      const artifacts = [];

      for (const entry of entries) {
        const entryPath = path.join(this.preservationRoot, entry);
        const stats = await fs.stat(entryPath);

        if (stats.isDirectory()) {
          // Try to read metadata if it exists
          const metadataPath = path.join(entryPath, '_test_metadata.json');
          let size = 0;

          // Calculate directory size (simple version - just count files)
          const files = await fs.readdir(entryPath, { recursive: true });
          for (const file of files) {
            try {
              const filePath = path.join(entryPath, file);
              const fileStats = await fs.stat(filePath);
              if (fileStats.isFile()) {
                size += fileStats.size;
              }
            } catch {
              // Skip files we can't stat
            }
          }

          artifacts.push({
            path: entryPath,
            name: entry,
            created: stats.birthtime,
            sizeBytes: size,
          });
        }
      }

      return artifacts.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error: any) {
      console.error('⚠️  Failed to list preserved artifacts:', error.message);
      return [];
    }
  }

  /**
   * Print preserved artifacts summary
   */
  static async printPreservedArtifactsSummary(): Promise<void> {
    const artifacts = await this.listPreservedArtifacts();
    const totalSize = await this.getPreservedArtifactsSize();

    console.log('\n📦 Preserved Test Artifacts Summary');
    console.log('━'.repeat(80));

    if (artifacts.length === 0) {
      console.log('No preserved artifacts found');
    } else {
      console.log(`Total artifacts: ${artifacts.length}`);
      console.log(`Total size: ${formatBytes(totalSize)}`);
      console.log('\nRecent artifacts:');

      for (const artifact of artifacts.slice(0, 5)) {
        const age = Date.now() - artifact.created.getTime();
        const ageStr = formatDuration(age);
        console.log(`  • ${artifact.name}`);
        console.log(`    Created: ${artifact.created.toISOString()} (${ageStr} ago)`);
        console.log(`    Size: ${formatBytes(artifact.sizeBytes)}`);
      }

      if (artifacts.length > 5) {
        console.log(`  ... and ${artifacts.length - 5} more`);
      }
    }

    console.log('━'.repeat(80));
  }

  /**
   * Create a README file in preserved artifacts directory
   *
   * @param preservedPath - Path where artifacts were preserved
   * @param projectId - The project ID
   * @param testName - Name of the failed test
   */
  private static async createDebugReadme(
    preservedPath: string,
    projectId: string,
    testName: string
  ): Promise<void> {
    const readmeContent = `# Test Failure Artifacts

## Test Information

- **Test Name:** ${testName}
- **Project ID:** ${projectId}
- **Preserved At:** ${new Date().toISOString()}

## Directory Structure

This directory contains all artifacts from the failed test run.

### Files to Check

1. **Project Files:**
   - \`discovered.json\` - Stage 1 output
   - \`selected.json\` - Stage 2 output
   - \`refined.json\` - Stage 3 output
   - \`scripts/script-v1.json\` - Stage 4 output
   - \`tags.json\` - Stage 5 tag extraction
   - \`manifest.json\` - Stage 5 asset manifest
   - \`timeline.json\` - Stage 6 timeline
   - \`output.mp4\` - Stage 7 rendered video (if reached)

2. **Assets:**
   - \`assets/images/\` - Downloaded images
   - \`assets/videos/\` - Downloaded videos
   - \`assets/audio/\` - TTS audio files
   - \`assets/music/\` - Background music

3. **Metadata:**
   - \`_test_metadata.json\` - Test run metadata

## Debugging Tips

1. Check \`_test_metadata.json\` for test run details
2. Validate JSON files against schemas in \`src/lib/types.ts\`
3. Check asset files exist and are not corrupted
4. Verify file paths in manifest match actual files
5. Check timeline word timestamps for overlaps or gaps

## Cleanup

To remove these artifacts:
\`\`\`bash
rm -rf "${preservedPath}"
\`\`\`

Or use the cleanup helper:
\`\`\`typescript
import { CleanupManager } from 'tests/e2e/helpers/cleanup';
await CleanupManager.cleanupOldArtifacts(0); // Remove all
\`\`\`
`;

    await fs.writeFile(path.join(preservedPath, 'README.md'), readmeContent, 'utf-8');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
