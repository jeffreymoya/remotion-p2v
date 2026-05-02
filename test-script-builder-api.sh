#!/bin/bash
# Test script for Script Builder API endpoints

set -e

BASE_URL="http://localhost:3000"
PROJECT_ID="test-project-$(date +%s)"

echo "=== Script Builder API Test ==="
echo ""

# Helper function to pretty print JSON
print_json() {
  echo "$1" | jq '.' 2>/dev/null || echo "$1"
}

echo "Step 1: Create test project"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/projects" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Script Builder Test\",
    \"topic\": \"The Psychology of Toxic Fan Culture\",
    \"aspectRatio\": \"16:9\"
  }")

PROJECT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.project.id')
echo "Created project: $PROJECT_ID"
print_json "$CREATE_RESPONSE"
echo ""

echo "Step 2: Generate blueprint"
BLUEPRINT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/script-builder/blueprint" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"topic\": \"The Psychology of Toxic Fan Culture\",
    \"targetDurationMs\": 720000
  }")

BLUEPRINT_ID=$(echo "$BLUEPRINT_RESPONSE" | jq -r '.blueprint.id')
echo "Generated blueprint: $BLUEPRINT_ID"
print_json "$BLUEPRINT_RESPONSE"
echo ""

REVIEWS=$(echo "$BLUEPRINT_RESPONSE" | jq '{
  reviews: [.blueprint.beats[].index | {beatIndex: ., status: "approved"}]
}')

echo "Step 3: Review and approve blueprint"
APPROVE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/script-builder/blueprint/${BLUEPRINT_ID}/review" \
  -H "Content-Type: application/json" \
  -d "$REVIEWS")

echo "Blueprint approved through review endpoint"
print_json "$APPROVE_RESPONSE"
echo ""

echo "Step 4: Execute script generation"
EXECUTE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/script-builder/execute" \
  -H "Content-Type: application/json" \
  -d "{
    \"blueprintId\": \"$BLUEPRINT_ID\"
  }")

DRAFT_ID=$(echo "$EXECUTE_RESPONSE" | jq -r '.scriptDraftId')
echo "Execution started: $DRAFT_ID"
print_json "$EXECUTE_RESPONSE"
echo ""

echo "Step 5: Check execution status"
STATUS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/script-builder/execute/${DRAFT_ID}/status")

echo "Execution status:"
print_json "$STATUS_RESPONSE"
echo ""

echo "Step 6: Create segments"
SEGMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/script-builder/segment" \
  -H "Content-Type: application/json" \
  -d "{
    \"draftId\": \"$DRAFT_ID\"
  }")

echo "Segmentation complete"
print_json "$SEGMENT_RESPONSE"
echo ""

echo "=== Test Complete ==="
