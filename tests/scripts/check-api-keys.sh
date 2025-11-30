#!/bin/bash
###############################################################################
# API Key Validation Script for CI/CD
#
# This script validates that all required API keys are present and properly
# formatted before running E2E tests. It's designed to be used in CI/CD
# pipelines to fail fast if API keys are missing or invalid.
#
# Usage:
#   ./tests/scripts/check-api-keys.sh
#
# Exit Codes:
#   0 - All API keys valid
#   1 - One or more API keys missing or invalid
#
# Environment Variables:
#   GOOGLE_TTS_API_KEY      - Required for TTS generation
#   PEXELS_API_KEY          - Required for media search
#   PIXABAY_API_KEY         - Required for media fallback
#   UNSPLASH_ACCESS_KEY     - Required for media fallback
#   SKIP_API_KEY_CHECK      - Set to 'true' to skip validation (use with caution)
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we should skip validation
if [ "${SKIP_API_KEY_CHECK}" = "true" ]; then
  echo -e "${YELLOW}⚠️  Skipping API key validation (SKIP_API_KEY_CHECK=true)${NC}"
  exit 0
fi

echo -e "${BLUE}🔑 Validating API Keys for E2E Tests...${NC}\n"

# Track validation status
VALIDATION_FAILED=0
MISSING_KEYS=()
INVALID_KEYS=()
VALID_KEYS=()

###############################################################################
# Helper Functions
###############################################################################

# Check if a variable is set and not a placeholder
check_api_key() {
  local key_name=$1
  local key_value="${!key_name}"
  local required=${2:-true}

  # Check if key exists
  if [ -z "$key_value" ]; then
    if [ "$required" = "true" ]; then
      MISSING_KEYS+=("$key_name")
      echo -e "${RED}❌ $key_name: NOT SET${NC}"
      return 1
    else
      echo -e "${YELLOW}⚠️  $key_name: NOT SET (optional)${NC}"
      return 0
    fi
  fi

  # Check if key is a placeholder (common patterns)
  if [[ "$key_value" =~ ^\$\{.*\}$ ]] || \
     [[ "$key_value" == "your_key_here" ]] || \
     [[ "$key_value" == "YOUR_"* ]] || \
     [[ "$key_value" == "REPLACE_"* ]] || \
     [[ "$key_value" == "TODO"* ]]; then
    INVALID_KEYS+=("$key_name")
    echo -e "${RED}❌ $key_name: PLACEHOLDER VALUE${NC}"
    return 1
  fi

  # Check minimum length (API keys are typically at least 20 chars)
  if [ ${#key_value} -lt 10 ]; then
    INVALID_KEYS+=("$key_name")
    echo -e "${RED}❌ $key_name: TOO SHORT (likely invalid)${NC}"
    return 1
  fi

  # Key appears valid
  VALID_KEYS+=("$key_name")
  local masked_value="${key_value:0:8}...${key_value: -4}"
  echo -e "${GREEN}✅ $key_name: ${masked_value}${NC}"
  return 0
}

###############################################################################
# Validate Required API Keys
###############################################################################

echo -e "${BLUE}Required API Keys:${NC}"
check_api_key "GOOGLE_TTS_API_KEY" || VALIDATION_FAILED=1
check_api_key "PEXELS_API_KEY" || VALIDATION_FAILED=1
check_api_key "PIXABAY_API_KEY" || VALIDATION_FAILED=1
check_api_key "UNSPLASH_ACCESS_KEY" || VALIDATION_FAILED=1

echo ""

###############################################################################
# Summary
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${GREEN}Valid:${NC}   ${#VALID_KEYS[@]}"
echo -e "  ${RED}Missing:${NC} ${#MISSING_KEYS[@]}"
echo -e "  ${RED}Invalid:${NC} ${#INVALID_KEYS[@]}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $VALIDATION_FAILED -eq 1 ]; then
  echo ""
  echo -e "${RED}❌ API key validation failed!${NC}"
  echo ""

  if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Missing keys:${NC}"
    for key in "${MISSING_KEYS[@]}"; do
      echo "  - $key"
    done
    echo ""
  fi

  if [ ${#INVALID_KEYS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Invalid/placeholder keys:${NC}"
    for key in "${INVALID_KEYS[@]}"; do
      echo "  - $key"
    done
    echo ""
  fi

  echo -e "${BLUE}To fix:${NC}"
  echo "  1. Set missing API keys in your environment"
  echo "  2. Replace placeholder values with real API keys"
  echo "  3. Ensure API keys are properly configured in CI secrets"
  echo ""
  echo -e "${BLUE}Example:${NC}"
  echo "  export GOOGLE_TTS_API_KEY=\"your-actual-api-key\""
  echo "  export PEXELS_API_KEY=\"your-actual-api-key\""
  echo ""
  echo -e "${YELLOW}To skip this check (not recommended):${NC}"
  echo "  export SKIP_API_KEY_CHECK=true"
  echo ""

  exit 1
fi

echo ""
echo -e "${GREEN}✅ All API keys validated successfully!${NC}"
echo ""

exit 0
