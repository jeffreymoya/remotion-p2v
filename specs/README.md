# Implementation Specifications Index

This directory contains detailed specifications for each phase of the web scraping implementation.

## Overview

The web scraping feature adds a `--scrape` parameter to the gather command, enabling AI-powered image search using Gemini's web search capabilities instead of stock media APIs.

**Main Plan**: [`PLAN_SCRAPE_IMPLEMENTATION.md`](../PLAN_SCRAPE_IMPLEMENTATION.md)

## Phase Specifications

### Phase 1: Core Infrastructure
**File**: [`phase-1-core-infrastructure.md`](phase-1-core-infrastructure.md)
**Time**: 3-4 hours
**Status**: Not Started

**Deliverables**:
- Type definitions and Zod schemas (`cli/lib/scraper-types.ts`)
- Image quality validator (`cli/services/media/image-validator.ts`)
- Gemini prompts (`config/prompts/web-scrape.prompt.ts`)

**Key Components**:
- Complete TypeScript interfaces and types
- Zod schemas for runtime validation
- Image validation with quality scoring
- Error classes for proper error handling
- Unit tests

---

### Phase 2: Web Scraper Service
**File**: [`phase-2-web-scraper-service.md`](phase-2-web-scraper-service.md)
**Time**: 6-8 hours
**Status**: Not Started
**Dependencies**: Phase 1

**Deliverables**:
- Web scraper service (`cli/services/media/web-scraper.ts`)

**Key Components**:
- Query generation using Gemini
- Web search orchestration
- Parallel image downloads
- Validation pipeline
- AI-powered image selection
- Error handling with fallbacks

---

### Phase 3: Integration
**File**: [`phase-3-integration.md`](phase-3-integration.md)
**Time**: 4-6 hours
**Status**: Not Started
**Dependencies**: Phase 2

**Deliverables**:
- Gather command integration (`cli/commands/gather.ts`)
- Configuration updates (`config/stock-assets.config.json`, `cli/lib/config.ts`)
- Basic documentation (`README.md`)

**Key Components**:
- CLI parameter parsing
- Conditional scrape mode logic
- Configuration schema
- Integration testing

---

### Phase 4: Testing & Validation
**File**: [`phase-4-testing.md`](phase-4-testing.md)
**Time**: 4-6 hours
**Status**: Not Started
**Dependencies**: Phase 3

**Deliverables**:
- Unit tests (`tests/scraper-types.test.ts`, `tests/image-validator.test.ts`, `tests/web-scraper.test.ts`)
- Integration tests (`tests/e2e/stage-gather-scrape.test.ts`)
- Test fixtures (`tests/fixtures/*.jpg`)

**Key Components**:
- Comprehensive unit test suite
- Integration tests with mocks
- End-to-end pipeline tests
- Performance benchmarks
- Test fixtures and utilities

---

### Phase 5: Documentation
**File**: [`phase-5-documentation.md`](phase-5-documentation.md)
**Time**: 1-2 hours
**Status**: Not Started
**Dependencies**: Phase 4

**Deliverables**:
- User documentation (`README.md`)
- Configuration guide (`config/README.md`)
- Architecture docs (`docs/web-scraper-architecture.md`)
- API reference (`docs/api/web-scraper-api.md`)

**Key Components**:
- User guide with examples
- Configuration reference
- Troubleshooting guide
- Developer documentation
- API documentation

---

## Total Timeline

**Total Estimated Time**: 18-26 hours

**Breakdown**:
- Phase 1: 3-4 hours (infrastructure)
- Phase 2: 6-8 hours (core service)
- Phase 3: 4-6 hours (integration)
- Phase 4: 4-6 hours (testing)
- Phase 5: 1-2 hours (documentation)

---

## Quick Reference

### Key Files Created

**Core Infrastructure**:
- `cli/lib/scraper-types.ts` - Types and schemas
- `cli/services/media/image-validator.ts` - Validation logic
- `cli/services/media/web-scraper.ts` - Main service
- `config/prompts/web-scrape.prompt.ts` - AI prompts

**Integration**:
- `cli/commands/gather.ts` - Modified for scrape mode
- `config/stock-assets.config.json` - Updated with webScrape config
- `cli/lib/config.ts` - Updated schema

**Testing**:
- `tests/scraper-types.test.ts` - Type tests
- `tests/image-validator.test.ts` - Validator tests
- `tests/web-scraper.test.ts` - Service tests
- `tests/e2e/stage-gather-scrape.test.ts` - E2E tests
- `tests/fixtures/*.jpg` - Test images

**Documentation**:
- `README.md` - User guide
- `config/README.md` - Config reference
- `docs/web-scraper-architecture.md` - Architecture
- `docs/api/web-scraper-api.md` - API docs

---

## Usage After Implementation

```bash
# Enable scrape mode
npm run gather -- --project <project-id> --scrape

# Combine with preview mode
npm run gather -- --project <project-id> --scrape --preview
```

---

## Configuration Preview

```json
{
  "webScrape": {
    "enabled": true,
    "candidateCount": { "min": 5, "max": 10 },
    "quality": {
      "minWidth": 1920,
      "minHeight": 1080,
      "allowedFormats": ["jpeg", "jpg", "png", "webp"],
      "aspectRatio": { "target": 1.777778, "tolerance": 0.3 }
    },
    "selection": {
      "weights": {
        "sceneRelevance": 0.4,
        "technicalQuality": 0.3,
        "aestheticAppeal": 0.2,
        "aspectRatioMatch": 0.1
      }
    }
  }
}
```

---

## Architecture Overview

```
Scene → Query Gen → Web Search → Download → Validate → Select → Best Image
  ↓         ↓            ↓           ↓          ↓         ↓         ↓
 Tags    Gemini      Gemini     HTTP Req    Sharp    Gemini    Project
```

---

## Notes

- Each spec file contains detailed implementation instructions
- Code examples are provided for all major components
- Testing requirements are comprehensive
- All phases have clear acceptance criteria
- Follow existing code patterns from the codebase
