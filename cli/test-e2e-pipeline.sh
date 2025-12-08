#!/bin/bash
# E2E / Ad-hoc pipeline runner
# Usage:
#   npm run pipeline                  # run all stages
#   npm run pipeline -- --start gather --project <id>  # run from a stage through render
#
# Options:
#   --start   discover|curate|refine|script|gather|build|render (default: discover)
#   --project Required for all stages after discover

set -e  # Exit on any error

START_STAGE="discover"
PROJECT_ID=""

usage() {
  cat <<'EOF'
Usage: npm run pipeline -- [--start <stage>] [--project <project-id>]
Stages: discover, curate, refine, script, gather, build, render
Examples:
  npm run pipeline                          # run full pipeline
  npm run pipeline -- --start gather --project my-project
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --start)
      START_STAGE="$2"; shift 2 ;;
    --project)
      PROJECT_ID="$2"; shift 2 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1 ;;
  esac
done

STAGES=(discover curate refine script gather build render)

# Validate start stage
START_INDEX=-1
for i in "${!STAGES[@]}"; do
  if [[ "${STAGES[$i]}" == "$START_STAGE" ]]; then
    START_INDEX=$i
    break
  fi
done

if [[ $START_INDEX -lt 0 ]]; then
  echo "Invalid --start value '$START_STAGE'." >&2
  usage
  exit 1
fi

echo "========================================="
echo "Starting pipeline (from: $START_STAGE)"
echo "========================================="
echo ""

require_project() {
  if [[ -z "$PROJECT_ID" ]]; then
    echo "--project is required when starting from $START_STAGE." >&2
    exit 1
  fi
  if [[ ! -d "public/projects/$PROJECT_ID" ]]; then
    echo "Project public/projects/$PROJECT_ID not found." >&2
    exit 1
  fi
}

run_discover() {
  echo "📋 Stage 1: Discovering topics..."
  npm run discover
  echo ""
  PROJECT_ID=$(ls -t public/projects/ | head -1)
  echo "✓ Project created: $PROJECT_ID"
  echo ""
}

run_curate() {
  require_project
  echo "🎯 Stage 2: Curating topic (auto-select)..."
  npm run curate -- --project "$PROJECT_ID" --auto
  echo ""
}

run_refine() {
  require_project
  echo "✨ Stage 3: Refining topic..."
  npm run refine -- --project "$PROJECT_ID"
  echo ""
}

run_script() {
  require_project
  echo "📝 Stage 4: Generating script..."
  npm run script -- --project "$PROJECT_ID"
  echo ""
}

run_gather() {
  require_project
  echo "🖼️  Stage 5: Gathering assets..."
  npm run gather -- --project "$PROJECT_ID"
  echo ""
}

run_build() {
  require_project
  echo "⏱️  Stage 6: Building timeline..."
  npm run build:timeline -- --project "$PROJECT_ID"
  echo ""
}

run_render() {
  require_project
  echo "🎬 Stage 7: Rendering preview..."
  npm run render:project -- --project "$PROJECT_ID" --preview
  echo ""
}

for (( i=$START_INDEX; i<${#STAGES[@]}; i++ )); do
  stage="${STAGES[$i]}"
  case "$stage" in
    discover) run_discover ;;
    curate)   run_curate ;;
    refine)   run_refine ;;
    script)   run_script ;;
    gather)   run_gather ;;
    build)    run_build ;;
    render)   run_render ;;
  esac
done

echo "========================================="
echo "✓ Pipeline completed"
echo "========================================="
echo ""
echo "Project: $PROJECT_ID"
echo "Output: public/projects/$PROJECT_ID/"
echo ""
echo "View the generated video:"
echo "  public/projects/$PROJECT_ID/output-preview.mp4"
echo ""
