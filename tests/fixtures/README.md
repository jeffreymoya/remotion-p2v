# Test Fixtures

This directory contains test images used for validating image processing, validation, and scraping functionality.

## Overview

All test images are **generated programmatically** to ensure consistency and reproducibility across different environments. The images are NOT committed to git - they are generated on demand.

## Generated Test Images

The following test images are created by running `npm run test:fixtures`:

### 1. test-1920x1080.jpg
- **Purpose:** Baseline valid image
- **Dimensions:** 1920x1080 (perfect Full HD)
- **Format:** JPEG
- **Size:** ~500KB
- **Use Case:** Standard validation tests, baseline for comparisons

### 2. test-3840x2160.webp
- **Purpose:** High-resolution image testing
- **Dimensions:** 3840x2160 (4K)
- **Format:** WebP
- **Size:** ~2MB
- **Use Case:** Tests upper bounds, format support, large file handling

### 3. test-640x480.jpg
- **Purpose:** Below minimum dimension testing
- **Dimensions:** 640x480 (VGA)
- **Format:** JPEG
- **Size:** ~100KB
- **Use Case:** Tests rejection of images below minimum requirements

### 4. test-portrait-1080x1920.jpg
- **Purpose:** Portrait orientation testing
- **Dimensions:** 1080x1920 (portrait)
- **Format:** JPEG
- **Size:** ~500KB
- **Use Case:** Tests aspect ratio handling, orientation detection

### 5. test-tiny.jpg
- **Purpose:** File size validation
- **Dimensions:** 100x100
- **Format:** JPEG
- **Size:** <50KB
- **Use Case:** Tests file size validation and rejection

### 6. test-exactly-1920x1080.jpg
- **Purpose:** Boundary condition testing
- **Dimensions:** 1920x1080 (exact minimum)
- **Format:** JPEG
- **Size:** ~500KB
- **Use Case:** Tests edge case where dimensions exactly meet minimum requirements

### 7. test-corrupted.jpg
- **Purpose:** Error handling testing
- **Format:** Corrupted JPEG (invalid magic bytes)
- **Size:** ~12KB (same size as valid image, but with corrupted header)
- **Use Case:** Tests error handling for malformed image data, invalid file format detection

## Usage

### Generate Fixtures

```bash
npm run test:fixtures
```

This will create all test images in the `tests/fixtures/` directory.

### In Tests

```typescript
import * as path from 'path';

const fixturesDir = path.join(__dirname, '../fixtures');
const testImage = path.join(fixturesDir, 'test-1920x1080.jpg');

// Use in your tests...
```

### Pre-test Hook

The fixtures are automatically generated before running tests via the `pretest` script in `package.json` (if configured).

## Git Ignore

Test fixtures are **not committed to version control**. They are listed in `.gitignore`:

```
tests/fixtures/*.jpg
tests/fixtures/*.webp
tests/fixtures/*.png
!tests/fixtures/README.md
```

## Maintenance

If you need to modify the test fixtures:

1. Edit `/scripts/generate-test-fixtures.ts`
2. Run `npm run test:fixtures` to regenerate
3. Update this README if adding/removing fixtures

## Requirements

The fixture generation script requires:
- `sharp` - Image processing library
- `fs-extra` - File system utilities

These are already included in the project's `devDependencies`.
