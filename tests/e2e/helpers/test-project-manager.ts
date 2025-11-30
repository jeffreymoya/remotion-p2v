import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';

export type PipelineStage = 'discover' | 'curate' | 'refine' | 'script' | 'gather' | 'build' | 'render';

export interface TestProject {
  id: string;
  paths: {
    root: string;
    discovered: string;
    selected: string;
    refined: string;
    scripts: string;
    assets: string;
    images: string;
    videos: string;
    audio: string;
    music: string;
    timeline: string;
  };
  createdAt: Date;
  stage: PipelineStage;
}

/**
 * Manages isolated test project lifecycle for E2E tests
 *
 * Key features:
 * - Creates test projects in OS temp directory
 * - Symlinks into /public/projects/ during test execution
 * - Cleans up after tests complete
 * - Preserves artifacts on failure for debugging
 * - Validates project structure per pipeline stage
 */
export class TestProjectManager {
  private static testProjects: Map<string, TestProject> = new Map();
  private static publicProjectsPath = path.join(process.cwd(), 'public', 'projects');

  /**
   * Create an isolated test project
   *
   * @param name - Human-readable name for the test project
   * @returns TestProject with all necessary paths
   */
  static async createTestProject(name: string): Promise<TestProject> {
    // Generate unique project ID
    const randomId = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now();
    const projectId = `test-${name}-${timestamp}-${randomId}`;

    // Create project in temp directory
    const tempRoot = path.join(os.tmpdir(), `remotion-p2v-test-${timestamp}-${randomId}`);

    // Define all project paths
    const projectPaths = {
      root: tempRoot,
      discovered: path.join(tempRoot, 'discovered.json'),
      selected: path.join(tempRoot, 'selected.json'),
      refined: path.join(tempRoot, 'refined.json'),
      scripts: path.join(tempRoot, 'scripts'),
      assets: path.join(tempRoot, 'assets'),
      images: path.join(tempRoot, 'assets', 'images'),
      videos: path.join(tempRoot, 'assets', 'videos'),
      audio: path.join(tempRoot, 'assets', 'audio'),
      music: path.join(tempRoot, 'assets', 'music'),
      timeline: path.join(tempRoot, 'timeline.json'),
    };

    // Create directory structure
    await fs.ensureDir(tempRoot);
    await fs.ensureDir(projectPaths.scripts);
    await fs.ensureDir(projectPaths.assets);
    await fs.ensureDir(projectPaths.images);
    await fs.ensureDir(projectPaths.videos);
    await fs.ensureDir(projectPaths.audio);
    await fs.ensureDir(projectPaths.music);

    // Create symlink in public/projects/ for pipeline commands to find it
    await fs.ensureDir(this.publicProjectsPath);
    const symlinkPath = path.join(this.publicProjectsPath, projectId);

    try {
      await fs.symlink(tempRoot, symlinkPath, 'dir');
    } catch (error: any) {
      // If symlink fails on Windows, try junction instead
      if (error.code === 'EPERM' && process.platform === 'win32') {
        await fs.symlink(tempRoot, symlinkPath, 'junction');
      } else {
        throw error;
      }
    }

    // Create test project object
    const testProject: TestProject = {
      id: projectId,
      paths: projectPaths,
      createdAt: new Date(),
      stage: 'discover', // Initial stage
    };

    // Store in map for tracking
    this.testProjects.set(projectId, testProject);

    return testProject;
  }

  /**
   * Clean up a test project (remove temp directory and symlink)
   *
   * @param projectId - The project ID to clean up
   */
  static async cleanupTestProject(projectId: string): Promise<void> {
    const project = this.testProjects.get(projectId);

    if (!project) {
      console.warn(`⚠️  Test project ${projectId} not found in tracking map`);
      return;
    }

    try {
      // Remove symlink from public/projects/
      const symlinkPath = path.join(this.publicProjectsPath, projectId);
      if (await fs.pathExists(symlinkPath)) {
        await fs.unlink(symlinkPath);
      }

      // Remove temp directory
      if (await fs.pathExists(project.paths.root)) {
        await fs.remove(project.paths.root);
      }

      // Remove from tracking map
      this.testProjects.delete(projectId);

    } catch (error) {
      console.error(`❌ Error cleaning up test project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Preserve test project artifacts for debugging
   * Moves project from temp to a permanent location
   *
   * @param projectId - The project ID to preserve
   * @param reason - Reason for preservation (e.g., test name that failed)
   * @returns Path where artifacts were preserved
   */
  static async preserveTestProject(projectId: string, reason: string): Promise<string> {
    const project = this.testProjects.get(projectId);

    if (!project) {
      throw new Error(`Test project ${projectId} not found`);
    }

    // Create preservation directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = reason.replace(/[^a-z0-9-]/gi, '_');
    const preservationDir = path.join(
      process.cwd(),
      'tests',
      'reports',
      'e2e',
      'failures',
      `${safeName}-${timestamp}`
    );

    await fs.ensureDir(preservationDir);

    // Copy all project files to preservation directory
    await fs.copy(project.paths.root, preservationDir);

    // Write metadata file
    const metadata = {
      projectId: project.id,
      reason,
      createdAt: project.createdAt.toISOString(),
      preservedAt: new Date().toISOString(),
      stage: project.stage,
      paths: project.paths,
    };

    await fs.writeJSON(
      path.join(preservationDir, '_test_metadata.json'),
      metadata,
      { spaces: 2 }
    );

    // Still clean up the original (symlink and temp dir)
    await this.cleanupTestProject(projectId);

    console.log(`📦 Test artifacts preserved at: ${preservationDir}`);
    return preservationDir;
  }

  /**
   * Validate project structure for a specific pipeline stage
   *
   * @param projectId - The project ID to validate
   * @param stage - The pipeline stage to validate against
   * @throws Error if validation fails
   */
  static async validateProjectStructure(projectId: string, stage: PipelineStage): Promise<void> {
    const project = this.testProjects.get(projectId);

    if (!project) {
      throw new Error(`Test project ${projectId} not found`);
    }

    // Update project stage
    project.stage = stage;

    // Define required files per stage
    const requiredFiles: Record<PipelineStage, string[]> = {
      discover: ['discovered.json'],
      curate: ['selected.json'],
      refine: ['refined.json'],
      script: ['scripts/script-v1.json'],
      gather: ['tags.json', 'manifest.json'],
      build: ['timeline.json'],
      render: ['output.mp4'],
    };

    const filesToCheck = requiredFiles[stage];
    const missingFiles: string[] = [];

    for (const file of filesToCheck) {
      const filePath = path.join(project.paths.root, file);
      const exists = await fs.pathExists(filePath);

      if (!exists) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(
        `Project structure validation failed for stage "${stage}".\n` +
        `Missing files: ${missingFiles.join(', ')}\n` +
        `Project path: ${project.paths.root}`
      );
    }

    // Additional validation for gather stage (check assets directory)
    if (stage === 'gather') {
      const hasAssets = await this.hasAssetsInDirectory(project.paths.assets);
      if (!hasAssets) {
        throw new Error(
          `Project structure validation failed for stage "gather".\n` +
          `Assets directory is empty: ${project.paths.assets}`
        );
      }
    }

    // Additional validation for render stage (check output file size)
    if (stage === 'render') {
      const outputPath = path.join(project.paths.root, 'output.mp4');
      const stats = await fs.stat(outputPath);

      if (stats.size === 0) {
        throw new Error(
          `Project structure validation failed for stage "render".\n` +
          `Output video file is empty: ${outputPath}`
        );
      }
    }
  }

  /**
   * Check if a directory has any asset files
   *
   * @param dirPath - Directory path to check
   * @returns True if directory has files, false otherwise
   */
  private static async hasAssetsInDirectory(dirPath: string): Promise<boolean> {
    if (!await fs.pathExists(dirPath)) {
      return false;
    }

    const files = await fs.readdir(dirPath, { recursive: true });

    // Filter for actual files (not directories)
    const actualFiles: string[] = [];
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stats = await fs.stat(fullPath);
      if (stats.isFile()) {
        actualFiles.push(file);
      }
    }

    return actualFiles.length > 0;
  }

  /**
   * Clean up all test projects (useful for test suite teardown)
   */
  static async cleanupAllTestProjects(): Promise<void> {
    const projectIds = Array.from(this.testProjects.keys());

    for (const projectId of projectIds) {
      try {
        await this.cleanupTestProject(projectId);
      } catch (error) {
        console.error(`Error cleaning up project ${projectId}:`, error);
        // Continue with other projects even if one fails
      }
    }
  }

  /**
   * Get a test project by ID
   *
   * @param projectId - The project ID to retrieve
   * @returns TestProject or undefined if not found
   */
  static getTestProject(projectId: string): TestProject | undefined {
    return this.testProjects.get(projectId);
  }

  /**
   * List all active test projects
   *
   * @returns Array of all test project IDs
   */
  static listTestProjects(): string[] {
    return Array.from(this.testProjects.keys());
  }
}
