#!/bin/bash
# E2E Pipeline Test Script
# This script runs through all 7 stages of the video generation pipeline automatically

set -e  # Exit on any error

echo "========================================="
echo "Starting E2E Pipeline Test"
echo "========================================="
echo ""

# Stage 1: Discover topics
echo "📋 Stage 1: Discovering topics..."
npm run discover
echo ""

# Extract the latest project ID
PROJECT_ID=$(ls -t public/projects/ | head -1)
echo "✓ Project created: $PROJECT_ID"
echo ""

# Stage 2: Curate topic (auto-select top topic)
echo "🎯 Stage 2: Curating topic (auto-select)..."
npm run curate -- --project "$PROJECT_ID" --auto
echo ""

# Stage 3: Refine topic
echo "✨ Stage 3: Refining topic..."
npm run refine -- --project "$PROJECT_ID"
echo ""

# Stage 4: Generate script
echo "📝 Stage 4: Generating script..."
npm run script -- --project "$PROJECT_ID"
echo ""

# Stage 5: Gather assets
echo "🖼️  Stage 5: Gathering assets..."
npm run gather -- --project "$PROJECT_ID"
echo ""

# Stage 6: Build timeline
echo "⏱️  Stage 6: Building timeline..."
npm run build:timeline -- --project "$PROJECT_ID"
echo ""

# Stage 7: Render preview (first 10 seconds)
echo "🎬 Stage 7: Rendering preview..."
npm run render:project -- --project "$PROJECT_ID" --preview
echo ""

echo "========================================="
echo "✓ E2E Pipeline Test Completed!"
echo "========================================="
echo ""
echo "Project: $PROJECT_ID"
echo "Output: public/projects/$PROJECT_ID/"
echo ""
echo "View the generated video:"
echo "  public/projects/$PROJECT_ID/output-preview.mp4"
echo ""
