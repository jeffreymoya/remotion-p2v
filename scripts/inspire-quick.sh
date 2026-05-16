#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 \"topic\""
  echo ""
  echo "Example: $0 \"resilience\""
  exit 1
fi

topic="$1"
shift

# Use npx to ensure local devDependency resolution when run directly
npx tsx scripts/inspire.ts "$topic" --segments=2 --limit=2 --clean "$@"
