---
name: inspire-watch
description: >
  Analyze git changes to propose the right `npm run inspire` command and params,
  run it with live log monitoring plus LangSmith trace cross-checking, detect
  blocking bugs mid-run, and propose fixes with user confirmation gates.
user_invocable: true
---

# inspire-watch

Runs the inspire pipeline against the current branch's changes. Analyzes the
diff to pick the right resume phase and flags, monitors local stdout and
LangSmith traces simultaneously, detects regressions or implementation drift,
and gates on user confirmation at three checkpoints.

---

## Phase 0 — Diff Analysis

**No questions during Phase 0.** Apply all heuristics mechanically and proceed
directly to Phase 1. Only ask a question if two conditions are both true:
(a) the topic cannot be resolved at all (zero longform.json files AND no
topic argument was provided), and (b) the phase cannot be determined from the
diff because no files in the heuristic table changed.

Run these commands to capture the working state:

```bash
git status --short
git diff HEAD --name-only
```

Also read `scripts/inspire.ts` (lines 11–57) for the canonical list of phases
and flags.

### File → Phase Heuristic Table

| Changed file(s) | Suggested phase / flag |
|---|---|
| `src/lib/inspire/research/**` | `--from=research` |
| `src/lib/inspire/longform-narration-prompt.ts`, `src/lib/inspire/narration-archetypes.ts` | `--from=plan` — archetypes.ts drives plan-time decisions (imported in longform-narration-prompt.ts) |
| `src/lib/inspire/narration-guidelines.ts`, `src/lib/inspire/inspire-pipeline.ts`, `src/lib/inspire/gates/**` | `--from=narration` — gates execute during the narration phase |
| `src/lib/inspire/refine/**` | `--from=refine` — skip narration regeneration when only the revision logic changed |
| `src/lib/inspire/proofread/**` | `--from=proofread` — skip all upstream phases when only cross-chapter proofreading changed |
| `src/lib/inspire/audio-postprocess.ts`, TTS client files, `src/lib/config.ts` (TTS fields) | `--from=tts` |
| `src/lib/inspire/pixabay-video-client.ts`, `src/lib/inspire/pexels-video-client.ts`, `src/lib/inspire/pexels-image-client.ts`, `src/lib/inspire/video-query-prompt.ts`, `src/lib/inspire/image-query-prompt.ts` | `--from=videos` |
| `src/lib/inspire/art-direction-prompt.ts`, `src/lib/inspire/art-direction-schema.ts` | `--from=artdirect` |
| `src/lib/inspire/combine-segments.ts`, `src/lib/inspire/write-inspire-script.ts`, `src/components/InspirationComposition.tsx`, `src/components/KineticCaption.tsx` | `--from=compose` |
| `src/lib/inspire/inspire-schema.ts`, `src/lib/inspire/research/research-schema.ts` | Add `--clean` — schema changes invalidate cached JSON |
| `src/lib/config.ts` (gate thresholds, model, timeout constants) | Add `--clean` — threshold/model changes can corrupt cached gate decisions |
| `scripts/inspire.ts` | Inspect what changed; default to earliest affected phase |
| Mixed / uncertain scope | Use the earliest affected phase; add `--limit=2` to keep the run cheap |

**Stop-after flags** (use when testing a phase in isolation without continuing):
- `--narration-only` — stop after narration text is finalized
- `--tts-only` — stop after TTS audio is generated

**Cost-reduction flags** (recommend for CI-style iteration):
- `--limit=2` — process only first 2 segments; good for all but compose verification
- `--skip-research` — when research artifacts exist and research code is unchanged
- `--skip-proofread` — when proofread code is unchanged and you're iterating on a later phase

### Topic Resolution

**Apply in order, stop at first match — do not ask:**

1. If the user provided a topic in their message, use it.
2. List `prompts/inspire/*-longform.json` sorted by modification time (newest first).
   - If exactly one file exists, extract and use that topic.
   - If multiple files exist, auto-select the most recently modified one.
3. Only ask if no files exist and no topic was supplied.

### Command Assembly

Produce a command of the form:

```
npm run inspire -- "<topic>" [--from=<phase>] [--limit=N] [--clean] [--skip-research] [--skip-proofread] [--narration-only|--tts-only] [--verbose]
```

Always include `--verbose` to maximize log signal during monitoring.

When multiple changed files match different rows in the heuristic table, pick
the **earliest phase** automatically — no confirmation needed at this step.

---

## Phase 1 — User Confirmation Gate (pre-launch)

Present:
1. Which files changed and the reasoning for the proposed command
2. The exact command you will run
3. Estimated scope (phases that will execute, segments that will be processed)
4. Any risks (e.g., `--clean` will delete cached artifacts)

**Wait for explicit approval before running.**

---

## Phase 2 — Launch and Dual Monitor

### Launch

Run the command in the background and attach a Monitor in the same response:

```
Bash(command="npm run inspire -- \"<topic>\" <params>", run_in_background=true)
```

Then immediately attach a Monitor to stream stdout/stderr as it arrives.

### Spawn Parallel LangSmith Agent

In the same response as the launch (parallel tool calls), spawn a background
agent to tail LangSmith traces throughout the run:

```
Agent({
  description: "LangSmith trace monitor for inspire run",
  subagent_type: "general-purpose",
  run_in_background: true,
  prompt: "
You are monitoring a LangSmith project for a live `npm run inspire` pipeline run.

Project name: remotion-p2v

Steps:
1. Use ToolSearch with query \"langsmith\" to discover available MCP tools.
   If no LangSmith tools are found, return a one-line note and stop.
2. Use list_projects (or equivalent) to confirm the remotion-p2v project exists.
3. Poll for the latest run in that project every 60 seconds. The run was just
   launched — look for any run that started within the last 5 minutes.
4. For each new or in-progress run found, check:
   - Phase transitions (research → plan → narration → refine → proofread → tts → videos → artdirect → compose)
   - Gate invocations (genre-tells-gate, prosody-marks-gate, specificity-gate,
     abstract-pivot-closer, paradigm-challenge-opener, seed-payoff-gate,
     through-line-gate, escalation-gate, citation-fidelity-gate,
     internal-consistency-gate). Note which gates triggered and revision counts.
   - LLM call inputs: do they contain the expected prompt text?
   - Schema shapes on outputs: do they match InspirationScript fields?
   - Any run that appears in traces but should have been removed by a recent diff
     (implementation drift signal).
5. Continue polling until:
   - The run transitions to a terminal state (success or error), OR
   - You have polled 20 times (~20 min) without the run completing.
6. Return a structured summary:

   LANGSMITH TRACE SUMMARY
   Run ID: <id>
   Status: <running|success|error>
   Phases seen: <list>
   Gates triggered: <name: N invocations, last revision count>
   Drift signals: <any gate/prompt that should not appear given the current diff>
   Errors in traces: <any error objects found>
   Recommendation: <none | investigate <specific signal>>
  "
})
```

If LangSmith MCP tools are not available (ToolSearch returns nothing), log a
single note — do not block or ask; continue with local log monitoring only.

### Local Log Monitoring

Continue watching local stdout/stderr via Monitor for the conditions in
Phase 3. The parallel LangSmith agent runs independently and will post its
summary when complete.

---

## Phase 3 — Drift and Bug Detection

### Blocking Conditions (interrupt the run)

Halt monitoring and move to Phase 4 immediately on any of these:

| Signal | Evidence pattern |
|---|---|
| Non-zero process exit | Exit code in Monitor output |
| Zod parse / schema validation failure | `ZodError`, `parse failed`, `invalid type` in logs |
| Missing required env var | `must be set`, `undefined API key`, `process.exit(1)` |
| API auth failure | HTTP 401 / 403 from Pixabay, Pexels, Google, ElevenLabs, DeepSeek |
| Revision loop exhausted without pass | `max-revisions reached`, gate still failing after N attempts |
| Unhandled exception / crash | `UnhandledPromiseRejection`, stack trace followed by exit |
| Phase never starts (stuck) | No log output for the expected next phase after >10 min — note: research brainstorm (`RESEARCH_BRAINSTORM_TIMEOUT_MS` = 600s) and DeepSeek calls (`DEEPSEEK_TIMEOUT_MS` = 300s) are legitimately slow; only flag as stuck if silence exceeds these per-phase ceilings |
| LangSmith shows call that should not exist | A gate or prompt that the diff removed still appears in traces |

### Non-Blocking Conditions (note, continue, report post-run)

| Signal | Action |
|---|---|
| Slow throughput (>5 min per segment) | Note; do not interrupt |
| Suboptimal clip match warnings | Note; do not interrupt |
| Gate revision iteration (within `max-revisions`) | Expected; track count |
| LangSmith trace shows new code path not exercised | Flag as drift; report post-run |
| Minor formatting / warning logs | Note; do not interrupt |
| Diff introduced a gate but LangSmith shows it never triggered | Flag as drift — may mean the gate path wasn't reached given this test input |

### Implementation Drift Checks

"Drift" means the git diff implies a behavior change that the running trace does
not confirm. After each major phase completes, verify:

1. **New gate added** → LangSmith trace must show at least one invocation of that
   gate function. If absent, the gate may be unwired from the pipeline.
2. **Gate threshold changed** (`src/lib/config.ts`) → compare the revision count
   in traces against the new threshold — if revisions stop exactly at the old
   threshold, the config change may not have taken effect (cached build?).
3. **New prompt template** → LangSmith LLM call inputs should contain the new
   prompt text, not the old one.
4. **Schema field added** → Trace outputs should include the new field; absence
   means the field isn't being populated.
5. **Phase removed or renamed** → Trace must not contain the old phase name.

---

## Phase 4 — Blocking Bug: Termination Gate

Present to the user:
1. The blocking condition detected (exact log lines or trace evidence)
2. Root cause hypothesis
3. Specific fix you recommend (file + line if possible)
4. The kill command to terminate the background process

**Wait for user to confirm termination** before suggesting further action. After
confirmation, propose the fix and ask whether to apply it.

---

## Phase 5 — Post-Run: Fix Proposal Gate

When the run completes (exit 0) or after a non-blocking run with issues noted:

1. Summarize all observations from both local logs and the LangSmith agent summary
2. List any drift signals detected during monitoring
3. For each issue, propose a concrete fix (file, line, change)
4. State whether a re-run is needed and with what params
5. Ask the user: "Apply fixes and re-run?" — list the files that would change

**Wait for explicit approval before editing files or re-running.**

---

## Output Contract

At each gate, produce a structured block:

```
── inspire-watch ────────────────────────────────────
Phase: <0|1|2|3|4|5>
Command: npm run inspire -- "<topic>" <params>
Status: <proposed|awaiting-approval|running|blocked|complete>
Observations:
  - <observation>
Issues:
  - [BLOCKING|NON-BLOCKING] <description>
Proposed fix: <file>:<line> — <description>
Next action: <what user needs to do>
─────────────────────────────────────────────────────
```
