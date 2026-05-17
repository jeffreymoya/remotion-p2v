/**
 * Opener diversity gate tests.
 *
 * Usage: tsx tests/inspire/gates/opener-diversity-gate.test.ts
 */
import { runOpenerDiversityCheck } from "../../../src/lib/inspire/proofread/opener-diversity-gate";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log("── Opener Diversity Gate Tests ──\n");

// Test 1: Two chapters both opening with "We tend to…" should FAIL
{
  const chapters = [
    "We tend to believe that talent is innate. But research shows otherwise — deliberate practice over 10,000 hours is what matters.",
    "We tend to think that motivation comes before action. In reality, as William James noted in 1890, the body leads the mind.",
    "There is something beautiful about the compound effect. Small daily actions build momentum over months and years.",
  ];

  const result = runOpenerDiversityCheck(chapters);
  assert(result.result.pass === false, "FAIL when two chapters open with 'We tend to'");
  assert(result.conflictPairs.length >= 1, "at least one conflict pair detected");
  assert(
    result.conflictPairs.some((p) => p.earlierIdx === 0 && p.laterIdx === 1),
    "conflict between chapter 1 and 2 detected",
  );
  assert(result.result.notes.length >= 1, "blocking notes generated");
}

// Test 2: All distinct openers should PASS
{
  const chapters = [
    "The most stubborn myth in psychology is that willpower is a finite resource. Roy Baumeister's 1998 radish experiment seemed to prove it.",
    "In 2010, a team at Stanford ran an elegant counter-study. Veronika Job showed that belief in limited willpower was the limiting factor.",
    "Consider what happens when you stop treating energy as a tank and start treating it as a signal. The implications ripple outward.",
  ];

  const result = runOpenerDiversityCheck(chapters);
  assert(result.result.pass === true, "PASS for distinct openers");
  assert(result.conflictPairs.length === 0, "no conflict pairs");
}

// Test 3: Same first three words should FAIL
{
  const chapters = [
    "Every morning at 5am, she sat at the same desk. The ritual wasn't about discipline.",
    "Every morning at dawn, the lab technicians filed in. Their routine was invisible to outsiders.",
  ];

  const result = runOpenerDiversityCheck(chapters);
  assert(result.result.pass === false, "FAIL when first 3 words match");
  assert(result.conflictPairs.length === 1, "one conflict pair for same-3-words");
}

// Test 4: Formulaic patterns across non-adjacent chapters should FAIL
{
  const chapters = [
    "Most of us carry an invisible assumption about intelligence. We inherit it before we can question it.",
    "The year was 1983 when Howard Gardner published Frames of Mind. Seven types of intelligence, he argued.",
    "Perhaps the deepest misconception is that IQ captures the whole story. Daniel Goleman would later challenge this.",
    "There is a quieter revolution happening in classrooms today. Teachers are learning to see multiple intelligences.",
  ];

  const result = runOpenerDiversityCheck(chapters);
  assert(result.result.pass === false, "FAIL for formulaic patterns across chapters");
  assert(
    result.conflictPairs.some((p) => p.earlierIdx === 0 && p.laterIdx === 2),
    "detects 'Most of us' + 'Perhaps the' as formulaic pair",
  );
}

console.log(`\n── Results: ${passed} passed, ${failed} failed ──`);
if (failed > 0) process.exit(1);
