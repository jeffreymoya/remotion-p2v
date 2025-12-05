#!/bin/bash
# Quick Preview Pipeline
# Runs gather, build timeline, and render with --preview flags where supported
#
# Usage: bash scripts/quick-preview.sh <project-id> [--scrape]

set -e  # Exit on error

# Check if project ID is provided
if [ -z "$1" ]; then
  echo "Error: Missing project ID"
  echo "Usage: bash scripts/quick-preview.sh <project-id> [--scrape]"
  exit 1
fi

PROJECT_ID="$1"
SCRAPE_FLAG=""

# Check for --scrape flag in any position
if [[ "$*" == *"--scrape"* ]]; then
  SCRAPE_FLAG="--scrape"
fi

echo "========================================="
echo "Quick Preview Pipeline for: $PROJECT_ID"
if [ -n "$SCRAPE_FLAG" ]; then
  echo "Mode: Web Scraping Enabled"
fi
echo "========================================="
echo ""

# Stage 1: Gather (with preview mode - processes only first 3 segments)
echo "Stage 1/3: Running gather with --preview $SCRAPE_FLAG..."
npm run gather -- --project "$PROJECT_ID" --preview $SCRAPE_FLAG
echo ""

# Stage 2: Build Timeline (no preview mode available)
echo "Stage 2/3: Building timeline..."
npm run build:timeline -- --project "$PROJECT_ID"
echo ""

# Stage 3: Render (with preview mode - renders only first 10 seconds)
echo "Stage 3/3: Rendering with --preview..."
npm run render:project -- --project "$PROJECT_ID" --preview
echo ""

echo "========================================="
echo "Preview Complete!"
echo "========================================="
echo "Output: public/projects/$PROJECT_ID/preview.mp4"
