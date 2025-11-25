# Data Storage Implementation Specification

This document provides detailed technical specifications for file-based storage, including atomic operations, backups, caching, and schema versioning.

---

## Table of Contents

1. [File Storage Strategy](#1-file-storage-strategy)
2. [Atomic Write Operations](#2-atomic-write-operations)
3. [Backup Management](#3-backup-management)
4. [Cache Management](#4-cache-management)
5. [Schema Versioning](#5-schema-versioning)
6. [Concurrent Access](#6-concurrent-access)
7. [Error Recovery](#7-error-recovery)

---

## 1. File Storage Strategy

### 1.1 Project Directory Structure

```
public/projects/{project-id}/
├── metadata.json                 # Project-level metadata
├── topics/
│   ├── discovered.json          # Stage 1: Trending topics
│   ├── selected.json            # Stage 2: User-selected topics
│   └── refined.json             # Stage 3: Refined topics
├── scripts/
│   ├── {topic-id}.json          # Generated script
│   └── tags.json                # Extracted media tags
├── assets/
│   ├── images/
│   │   ├── {hash}.jpg
│   │   └── {hash}.metadata.json
│   ├── videos/
│   │   ├── {hash}.mp4
│   │   └── {hash}.metadata.json
│   ├── audio/
│   │   ├── {segment-id}.mp3
│   │   └── {segment-id}.timestamps.json
│   └── music/
│       ├── {track-id}.mp3
│       └── {track-id}.metadata.json
├── timeline.json                # Final timeline
└── logs/
    ├── errors.log              # Error log
    ├── warnings.log            # Warning log
    └── pipeline.log            # Full pipeline log
```

### 1.2 File Manager Class

```typescript
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';

export class FileManager {
  constructor(private basePath: string = 'public/projects') {}

  // Generate unique project ID
  generateProjectId(): string {
    return `project-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  // Get project path
  getProjectPath(projectId: string): string {
    return path.join(this.basePath, projectId);
  }

  // Ensure project directory exists
  async ensureProjectDirectory(projectId: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);

    await fs.ensureDir(path.join(projectPath, 'topics'));
    await fs.ensureDir(path.join(projectPath, 'scripts'));
    await fs.ensureDir(path.join(projectPath, 'assets/images'));
    await fs.ensureDir(path.join(projectPath, 'assets/videos'));
    await fs.ensureDir(path.join(projectPath, 'assets/audio'));
    await fs.ensureDir(path.join(projectPath, 'assets/music'));
    await fs.ensureDir(path.join(projectPath, 'logs'));

    // Create metadata file
    const metadataPath = path.join(projectPath, 'metadata.json');
    if (!await fs.pathExists(metadataPath)) {
      await this.atomicWrite(metadataPath, {
        projectId,
        createdAt: new Date().toISOString(),
        version: '1.0',
        status: 'initialized',
      });
    }
  }

  // Atomic write (see Section 2)
  async atomicWrite(filepath: string, data: any): Promise<void> {
    // Implementation in Section 2
  }

  // Read JSON file with validation
  async readJSON<T>(filepath: string): Promise<T> {
    if (!await fs.pathExists(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  // Check if file exists
  async exists(filepath: string): Promise<boolean> {
    return fs.pathExists(filepath);
  }

  // Delete file
  async delete(filepath: string): Promise<void> {
    if (await this.exists(filepath)) {
      await fs.remove(filepath);
    }
  }

  // List files in directory
  async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    const files = await fs.readdir(dirPath);

    if (extension) {
      return files.filter(f => f.endsWith(extension));
    }

    return files;
  }
}
```

---

## 2. Atomic Write Operations

### 2.1 Atomic Write Implementation

```typescript
export class FileManager {
  async atomicWrite(filepath: string, data: any): Promise<void> {
    const tempPath = `${filepath}.tmp.${crypto.randomBytes(4).toString('hex')}`;

    try {
      // 1. Write to temporary file
      await fs.writeFile(
        tempPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      // 2. Validate JSON structure
      const validated = await fs.readFile(tempPath, 'utf-8');
      JSON.parse(validated); // Will throw if invalid

      // 3. Create backup of existing file (if exists)
      if (await fs.pathExists(filepath)) {
        await this.createBackup(filepath);
      }

      // 4. Atomic rename (prevents corruption)
      await fs.rename(tempPath, filepath);

      logger.debug(`Atomic write successful: ${filepath}`);
    } catch (error) {
      // Cleanup temp file on error
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
      }

      throw new Error(`Atomic write failed: ${filepath} - ${error.message}`);
    }
  }

  private async createBackup(filepath: string): Promise<void> {
    const backupPath = `${filepath}.backup`;
    await fs.copy(filepath, backupPath, { overwrite: true });
  }
}
```

### 2.2 Concurrent Write Protection

```typescript
export class FileManager {
  private locks: Map<string, Promise<void>> = new Map();

  async atomicWrite(filepath: string, data: any): Promise<void> {
    // Wait for any existing write to complete
    if (this.locks.has(filepath)) {
      await this.locks.get(filepath);
    }

    // Create lock for this write
    const writePromise = this._atomicWriteInternal(filepath, data);
    this.locks.set(filepath, writePromise);

    try {
      await writePromise;
    } finally {
      // Remove lock after write completes
      this.locks.delete(filepath);
    }
  }

  private async _atomicWriteInternal(filepath: string, data: any): Promise<void> {
    // ... implementation from 2.1
  }
}
```

---

## 3. Backup Management

### 3.1 Rotating Backups

```typescript
export class BackupManager {
  private maxBackups = 3;

  async createRotatingBackup(filepath: string): Promise<void> {
    if (!await fs.pathExists(filepath)) {
      return;
    }

    // Rotate existing backups (.backup.1 → .backup.2, .backup.2 → .backup.3, etc.)
    for (let i = this.maxBackups - 1; i >= 1; i--) {
      const oldBackup = `${filepath}.backup.${i}`;
      const newBackup = `${filepath}.backup.${i + 1}`;

      if (await fs.pathExists(oldBackup)) {
        if (i === this.maxBackups - 1) {
          // Delete oldest backup
          await fs.remove(oldBackup);
        } else {
          await fs.move(oldBackup, newBackup, { overwrite: true });
        }
      }
    }

    // Create new backup.1
    const latestBackup = `${filepath}.backup.1`;
    await fs.copy(filepath, latestBackup, { overwrite: true });

    logger.debug(`Rotating backup created: ${latestBackup}`);
  }

  async restoreFromBackup(filepath: string, backupNumber: number = 1): Promise<void> {
    const backupPath = `${filepath}.backup.${backupNumber}`;

    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }

    await fs.copy(backupPath, filepath, { overwrite: true });
    logger.info(`Restored from backup: ${backupPath} → ${filepath}`);
  }

  async listBackups(filepath: string): Promise<string[]> {
    const backups: string[] = [];

    for (let i = 1; i <= this.maxBackups; i++) {
      const backupPath = `${filepath}.backup.${i}`;
      if (await fs.pathExists(backupPath)) {
        backups.push(backupPath);
      }
    }

    return backups;
  }

  async cleanupOldBackups(projectPath: string, daysToKeep: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const files = await fs.readdir(projectPath, { recursive: true });

    for (const file of files) {
      if (file.includes('.backup')) {
        const fullPath = path.join(projectPath, file);
        const stats = await fs.stat(fullPath);

        if (stats.mtime < cutoffDate) {
          await fs.remove(fullPath);
          logger.info(`Deleted old backup: ${fullPath}`);
        }
      }
    }
  }
}
```

---

## 4. Cache Management

### 4.1 Cache Structure

```
cache/
├── media/
│   ├── {hash}/
│   │   ├── image.jpg           # Cached media file
│   │   └── metadata.json       # Metadata (URL, tags, downloaded_at, expires_at)
│   └── index.json              # Cache index
├── tts/
│   ├── {hash}/
│   │   ├── audio.mp3
│   │   └── metadata.json
│   └── index.json
└── rate-limits.json            # Rate limit tracking
```

### 4.2 Cache Manager

```typescript
export class CacheManager {
  private cacheDir: string;
  private maxSizeBytes: number;
  private expiryDays: number;

  constructor(config: { cacheDir: string; maxSizeGB: number; expiryDays: number }) {
    this.cacheDir = config.cacheDir;
    this.maxSizeBytes = config.maxSizeGB * 1024 * 1024 * 1024;
    this.expiryDays = config.expiryDays;
  }

  // Generate cache key from URL
  generateCacheKey(url: string, params?: Record<string, any>): string {
    const dataString = JSON.stringify({ url, ...params });
    return crypto.createHash('md5').update(dataString).digest('hex');
  }

  // Get cached item
  async get(cacheKey: string, type: 'media' | 'tts'): Promise<CachedItem | null> {
    const cachePath = path.join(this.cacheDir, type, cacheKey);
    const metadataPath = path.join(cachePath, 'metadata.json');

    if (!await fs.pathExists(metadataPath)) {
      return null;
    }

    const metadata = await fs.readJSON(metadataPath);

    // Check expiry
    const expiresAt = new Date(metadata.expiresAt);
    if (expiresAt < new Date()) {
      logger.debug(`Cache expired: ${cacheKey}`);
      await this.delete(cacheKey, type);
      return null;
    }

    // Get file path
    const files = await fs.readdir(cachePath);
    const dataFile = files.find(f => f !== 'metadata.json');

    if (!dataFile) {
      return null;
    }

    return {
      path: path.join(cachePath, dataFile),
      metadata,
    };
  }

  // Save to cache
  async set(
    cacheKey: string,
    type: 'media' | 'tts',
    data: Buffer,
    extension: string,
    metadata: any
  ): Promise<string> {
    const cachePath = path.join(this.cacheDir, type, cacheKey);
    await fs.ensureDir(cachePath);

    const dataPath = path.join(cachePath, `data${extension}`);
    const metadataPath = path.join(cachePath, 'metadata.json');

    // Write data
    await fs.writeFile(dataPath, data);

    // Write metadata
    await fs.writeJSON(metadataPath, {
      ...metadata,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 0,
    });

    // Check cache size and evict if necessary
    await this.enforceMaxSize();

    return dataPath;
  }

  // Delete cached item
  async delete(cacheKey: string, type: 'media' | 'tts'): Promise<void> {
    const cachePath = path.join(this.cacheDir, type, cacheKey);
    await fs.remove(cachePath);
  }

  // Enforce max cache size (LRU eviction)
  private async enforceMaxSize(): Promise<void> {
    const totalSize = await this.getCacheSize();

    if (totalSize <= this.maxSizeBytes) {
      return;
    }

    logger.warn(`Cache size ${totalSize} exceeds max ${this.maxSizeBytes}, evicting LRU items`);

    // Get all cached items with metadata
    const items = await this.getAllCachedItems();

    // Sort by last used (LRU)
    items.sort((a, b) => {
      const aUsed = new Date(a.metadata.lastUsedAt || a.metadata.cachedAt).getTime();
      const bUsed = new Date(b.metadata.lastUsedAt || b.metadata.cachedAt).getTime();
      return aUsed - bUsed; // Oldest first
    });

    // Evict items until under limit
    let currentSize = totalSize;
    for (const item of items) {
      if (currentSize <= this.maxSizeBytes) {
        break;
      }

      await this.delete(item.cacheKey, item.type);
      currentSize -= item.size;
      logger.info(`Evicted cache item: ${item.cacheKey} (${item.size} bytes)`);
    }
  }

  private async getCacheSize(): Promise<number> {
    const types = ['media', 'tts'];
    let totalSize = 0;

    for (const type of types) {
      const typePath = path.join(this.cacheDir, type);
      if (await fs.pathExists(typePath)) {
        const size = await this.getDirectorySize(typePath);
        totalSize += size;
      }
    }

    return totalSize;
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0;
    const files = await fs.readdir(dirPath, { recursive: true });

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        size += stats.size;
      }
    }

    return size;
  }

  private async getAllCachedItems(): Promise<CachedItemInfo[]> {
    const items: CachedItemInfo[] = [];
    const types: ('media' | 'tts')[] = ['media', 'tts'];

    for (const type of types) {
      const typePath = path.join(this.cacheDir, type);
      if (!await fs.pathExists(typePath)) {
        continue;
      }

      const cacheKeys = await fs.readdir(typePath);

      for (const cacheKey of cacheKeys) {
        const cachePath = path.join(typePath, cacheKey);
        const metadataPath = path.join(cachePath, 'metadata.json');

        if (await fs.pathExists(metadataPath)) {
          const metadata = await fs.readJSON(metadataPath);
          const size = await this.getDirectorySize(cachePath);

          items.push({
            cacheKey,
            type,
            metadata,
            size,
          });
        }
      }
    }

    return items;
  }

  // Increment usage count
  async incrementUsage(cacheKey: string, type: 'media' | 'tts'): Promise<void> {
    const cachePath = path.join(this.cacheDir, type, cacheKey);
    const metadataPath = path.join(cachePath, 'metadata.json');

    if (await fs.pathExists(metadataPath)) {
      const metadata = await fs.readJSON(metadataPath);
      metadata.usageCount = (metadata.usageCount || 0) + 1;
      metadata.lastUsedAt = new Date().toISOString();
      await fs.writeJSON(metadataPath, metadata);
    }
  }

  // Clear cache
  async clear(type?: 'media' | 'tts'): Promise<void> {
    if (type) {
      const typePath = path.join(this.cacheDir, type);
      await fs.remove(typePath);
      await fs.ensureDir(typePath);
    } else {
      await fs.remove(this.cacheDir);
      await fs.ensureDir(this.cacheDir);
    }

    logger.info(`Cache cleared: ${type || 'all'}`);
  }
}

interface CachedItem {
  path: string;
  metadata: any;
}

interface CachedItemInfo {
  cacheKey: string;
  type: 'media' | 'tts';
  metadata: any;
  size: number;
}
```

---

## 5. Schema Versioning

### 5.1 Schema Version Management

```typescript
export class SchemaVersionManager {
  private currentVersion = '1.0';

  // Add version to data
  addVersion<T extends object>(data: T): T & { version: string } {
    return {
      ...data,
      version: this.currentVersion,
    };
  }

  // Validate and migrate data
  async validateAndMigrate<T>(data: any, expectedType: string): Promise<T> {
    if (!data.version) {
      throw new Error(`Missing version field in ${expectedType}`);
    }

    // Check if migration needed
    if (data.version !== this.currentVersion) {
      logger.info(`Migrating ${expectedType} from v${data.version} to v${this.currentVersion}`);
      data = await this.migrate(data, expectedType);
    }

    return data as T;
  }

  // Migration logic
  private async migrate(data: any, type: string): Promise<any> {
    const fromVersion = data.version;
    const toVersion = this.currentVersion;

    // Define migration paths
    const migrations = this.getMigrationPath(fromVersion, toVersion);

    let migrated = data;
    for (const migration of migrations) {
      migrated = await migration(migrated);
    }

    migrated.version = toVersion;
    return migrated;
  }

  private getMigrationPath(from: string, to: string): Array<(data: any) => any> {
    // Example migration: 0.9 → 1.0
    const migrations: Record<string, (data: any) => any> = {
      '0.9_to_1.0': (data: any) => {
        // Add new fields, rename old fields, etc.
        return {
          ...data,
          metadata: data.metadata || {},
          createdAt: data.timestamp || new Date().toISOString(),
        };
      },
    };

    // Build migration path
    const path: Array<(data: any) => any> = [];

    // For now, simple direct migration
    const key = `${from}_to_${to}`;
    if (migrations[key]) {
      path.push(migrations[key]);
    }

    return path;
  }
}
```

### 5.2 Usage Example

```typescript
const versionManager = new SchemaVersionManager();
const fileManager = new FileManager();

// Save with version
const script = {
  title: 'Example Script',
  segments: [...],
};

await fileManager.atomicWrite(
  'scripts/script-1.json',
  versionManager.addVersion(script)
);

// Load and migrate if needed
const loadedData = await fileManager.readJSON('scripts/script-1.json');
const migratedScript = await versionManager.validateAndMigrate<Script>(loadedData, 'Script');
```

---

## 6. Concurrent Access

### 6.1 Single-Process Assumption

```typescript
// For MVP, assume single-process execution
// No file locking needed since only one process accesses files at a time

// If multi-process support needed in future:
import * as lockfile from 'proper-lockfile';

export class FileManager {
  async atomicWriteWithLock(filepath: string, data: any): Promise<void> {
    // Acquire lock
    const release = await lockfile.lock(filepath, {
      retries: {
        retries: 5,
        minTimeout: 100,
        maxTimeout: 1000,
      },
    });

    try {
      await this.atomicWrite(filepath, data);
    } finally {
      // Release lock
      await release();
    }
  }
}
```

---

## 7. Error Recovery

### 7.1 Corruption Detection and Recovery

```typescript
export class FileRecovery {
  async recoverCorruptedFile(filepath: string): Promise<boolean> {
    try {
      // 1. Try to read file
      const content = await fs.readFile(filepath, 'utf-8');
      JSON.parse(content); // Will throw if corrupted
      return true; // File is valid
    } catch (error) {
      logger.error(`File corrupted: ${filepath}`, { error: error.message });

      // 2. Try to restore from backup
      const backupManager = new BackupManager();
      const backups = await backupManager.listBackups(filepath);

      for (const backup of backups) {
        try {
          const backupContent = await fs.readFile(backup, 'utf-8');
          JSON.parse(backupContent); // Validate backup

          // Restore from valid backup
          await fs.copy(backup, filepath, { overwrite: true });
          logger.info(`Restored from backup: ${backup}`);
          return true;
        } catch (backupError) {
          logger.warn(`Backup also corrupted: ${backup}`);
        }
      }

      // 3. No valid backup found
      logger.error(`Cannot recover file: ${filepath}. No valid backups.`);
      return false;
    }
  }

  async validateProjectIntegrity(projectId: string): Promise<IntegrityReport> {
    const fileManager = new FileManager();
    const projectPath = fileManager.getProjectPath(projectId);

    const report: IntegrityReport = {
      valid: true,
      issues: [],
    };

    // Check required files
    const requiredFiles = [
      'metadata.json',
      'topics/discovered.json',
      'topics/selected.json',
      'topics/refined.json',
    ];

    for (const file of requiredFiles) {
      const filepath = path.join(projectPath, file);

      if (!await fs.pathExists(filepath)) {
        report.valid = false;
        report.issues.push(`Missing required file: ${file}`);
        continue;
      }

      // Validate JSON structure
      try {
        await fs.readJSON(filepath);
      } catch (error) {
        report.valid = false;
        report.issues.push(`Corrupted file: ${file}`);
      }
    }

    return report;
  }
}

interface IntegrityReport {
  valid: boolean;
  issues: string[];
}
```

---

## Summary

This data storage implementation provides:

1. **Atomic write operations** with temp file + rename strategy
2. **Rotating backups** (keep last 3 backups, 7-day cleanup)
3. **LRU cache** with configurable size limit (10GB default)
4. **Schema versioning** with automatic migration
5. **Concurrent write protection** with in-memory locks
6. **Corruption detection and recovery** from backups
7. **Project integrity validation**
8. **Cache expiry** (30 days media, 90 days TTS)

All file operations ensure:
- Data integrity (atomic writes, validation)
- Recoverability (backups, error recovery)
- Performance (caching, efficient eviction)
- Consistency (schema versioning, migration)
- Safety (single-process assumption, optional locking)
