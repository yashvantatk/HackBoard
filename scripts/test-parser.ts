import { parseVoiceCommand } from '../src/lib/parser';
import { getAliveDemoHackathons } from '../src/lib/storage';
import { getRemainingWorkHours } from '../src/lib/whatnow';
import { ActionType, Hackathon } from '../src/types/index';

const referenceDate = new Date('2026-10-25T23:04:56+05:30');
const demoHackathons = getAliveDemoHackathons(referenceDate);

interface TestCase {
  id: number;
  input: string;
  expectedType: ActionType;
  expectedHackathon?: string;
  expectedMinTasks?: number;
  expectedTaskMatch?: string;
  expectedHours?: number;
}

const TEST_CASES: TestCase[] = [
  // 1. Natural ramble creating/updating hackathon with tasks
  {
    id: 1,
    input: 'um so Nvidia closes October 30 at 11:59 pm. I still need the demo video, readme, and deploy.',
    expectedType: 'update_hackathon',
    expectedHackathon: 'NVIDIA',
    expectedMinTasks: 3,
  },
  // 2. Speech error: "Navya's" for Nvidia
  {
    id: 2,
    input: "so like mark readme for Navya's",
    expectedType: 'change_task',
    expectedHackathon: 'NVIDIA',
    expectedTaskMatch: 'readme',
  },
  // 3. Simple verb task start
  {
    id: 3,
    input: 'start demo video',
    expectedType: 'change_task',
    expectedTaskMatch: 'demo video',
  },
  // 4. Question: What now?
  {
    id: 4,
    input: 'what now?',
    expectedType: 'question',
  },
  // 5. Time-constrained question
  {
    id: 5,
    input: 'hey I have 2 hours what should I do',
    expectedType: 'question',
    expectedHours: 2,
  },
  // 6. Estimate update with filler words
  {
    id: 6,
    input: 'um demo video for Nebius takes 2 hours',
    expectedType: 'estimate_task',
    expectedHackathon: 'Nebius',
    expectedHours: 2,
  },
  // 7. Single task addition with estimate
  {
    id: 7,
    input: 'so add record demo for Wispr, 1 hour',
    expectedType: 'update_hackathon',
    expectedHackathon: 'Wispr',
    expectedMinTasks: 1,
  },
  // 8. Speech error: "Whisper" for Wispr
  {
    id: 8,
    input: 'Whisper closes October 31 at 11:59 pm. Need dictation hook and war room UI.',
    expectedType: 'update_hackathon',
    expectedHackathon: 'Wispr',
    expectedMinTasks: 2,
  },
  // 9. Mark deploy in Nvidia
  {
    id: 9,
    input: 'mark deploy as done in Nvidia',
    expectedType: 'change_task',
    expectedHackathon: 'NVIDIA',
    expectedTaskMatch: 'deploy',
  },
  // 10. Meta update with tasks
  {
    id: 10,
    input: 'Meta closes October 26 at 11:59 pm. Need pitch deck, demo video, and devpost submit',
    expectedType: 'update_hackathon',
    expectedHackathon: 'Meta',
    expectedMinTasks: 3,
  },
  // 11. Conversational question
  {
    id: 11,
    input: 'um what should I do next',
    expectedType: 'question',
  },
  // 12. View timeline command
  {
    id: 12,
    input: 'show timeline',
    expectedType: 'view_timeline',
  },
  // 13. Calendar export command
  {
    id: 13,
    input: 'export my deadlines',
    expectedType: 'export_calendar',
  },
  // 14. Mark task with filler words
  {
    id: 14,
    input: 'basically finish pitch deck for Meta',
    expectedType: 'change_task',
    expectedHackathon: 'Meta',
  },
  // 15. Task estimate update
  {
    id: 15,
    input: 'you know set estimate of readme for Nebius to 3 hours',
    expectedType: 'estimate_task',
    expectedHackathon: 'Nebius',
    expectedHours: 3,
  },
  // 16. Mark setup container as done
  {
    id: 16,
    input: 'mark setup Nebius cloud GPU cluster as done',
    expectedType: 'change_task',
    expectedTaskMatch: 'cluster',
  },
  // 17. Add single task with duration
  {
    id: 17,
    input: 'so add test voice commands for Wispr taking 2h',
    expectedType: 'update_hackathon',
    expectedHackathon: 'Wispr',
    expectedMinTasks: 1,
  },
  // 18. Start NIM microservices
  {
    id: 18,
    input: 'start NIM microservices pipeline',
    expectedType: 'change_task',
    expectedTaskMatch: 'NIM',
  },
  // 19. What on my plate question
  {
    id: 19,
    input: "what's on my plate right now?",
    expectedType: 'question',
  },
  // 20. Alternative calendar export
  {
    id: 20,
    input: 'export to calendar',
    expectedType: 'export_calendar',
  },
  // 21. Alternative timeline view
  {
    id: 21,
    input: 'view gantt chart',
    expectedType: 'view_timeline',
  },
  // 22. Mark fine-tune Llama
  {
    id: 22,
    input: 'like Mark fine-tune Llama 3.3 model for Meta as done',
    expectedType: 'change_task',
    expectedHackathon: 'Meta',
    expectedTaskMatch: 'Llama',
  },
  // 23. Create brand new hackathon
  {
    id: 23,
    input: 'uh Google Gemini closes November 5 at 5 pm. Need api key setup, prompt chain, and test cases',
    expectedType: 'create_hackathon',
    expectedHackathon: 'Google',
    expectedMinTasks: 3,
  },
  // 24. Speech error with Whisper
  {
    id: 24,
    input: 'and also mark record hands-free demo video for Whisper',
    expectedType: 'change_task',
    expectedHackathon: 'Wispr',
    expectedTaskMatch: 'hands-free',
  },
  // 25. Reset task status to todo
  {
    id: 25,
    input: 'so reset demo video for Nebius to todo',
    expectedType: 'change_task',
    expectedHackathon: 'Nebius',
    expectedTaskMatch: 'demo video',
  },
  // 26. Question with 3 hours
  {
    id: 26,
    input: 'I got 3 hours what should I work on',
    expectedType: 'question',
    expectedHours: 3,
  },
  // 27. Task estimate update
  {
    id: 27,
    input: 'Triton setup for Nebius takes 4 hours',
    expectedType: 'estimate_task',
    expectedHackathon: 'Nebius',
    expectedHours: 4,
  },
  // 28. Next deadline question
  {
    id: 28,
    input: 'hey um next deadline',
    expectedType: 'question',
  },
  // 29. Mark devpost submit
  {
    id: 29,
    input: 'mark devpost submit for Meta',
    expectedType: 'change_task',
    expectedHackathon: 'Meta',
    expectedTaskMatch: 'devpost',
  },
  // 30. Add task with 2 hours
  {
    id: 30,
    input: 'so add benchmark numbers for Nvidia, 2 hours',
    expectedType: 'update_hackathon',
    expectedHackathon: 'NVIDIA',
    expectedMinTasks: 1,
  },
  // 31. Whisper challenge closes tomorrow
  {
    id: 31,
    input: 'Whisper challenge closes tomorrow at 10 pm. Need final commit and video',
    expectedType: 'update_hackathon',
    expectedHackathon: 'Wispr',
    expectedMinTasks: 2,
  },
  // 32. Speech error Navya's with doing status
  {
    id: 32,
    input: "mark demo video walkthrough for Navya's as doing",
    expectedType: 'change_task',
    expectedHackathon: 'NVIDIA',
    expectedTaskMatch: 'demo video',
  },
];

console.log('='.repeat(70));
console.log('HACKBOARD PARSER VERIFICATION TEST SUITE (32 REALISTIC DICTATIONS)');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

for (const test of TEST_CASES) {
  const result = parseVoiceCommand(test.input, demoHackathons, referenceDate);
  const typePass = result.type === test.expectedType;

  let hackathonPass = true;
  if (test.expectedHackathon) {
    const candidateName =
      result.targetHackathonName ||
      result.taskTarget?.hackathonName ||
      '';
    hackathonPass = candidateName.toLowerCase().includes(test.expectedHackathon.toLowerCase());
  }

  let tasksPass = true;
  if (test.expectedMinTasks) {
    tasksPass = (result.tasksToCreate?.length || 0) >= test.expectedMinTasks;
  }

  let taskMatchPass = true;
  if (test.expectedTaskMatch) {
    const candidateTask = result.taskTarget?.taskName || '';
    taskMatchPass = candidateTask.toLowerCase().includes(test.expectedTaskMatch.toLowerCase());
  }

  let hoursPass = true;
  if (test.expectedHours) {
    const hours = result.type === 'question' ? result.availableHours : result.taskTarget?.estimateHours;
    hoursPass = hours === test.expectedHours;
  }

  const isSuccess = typePass && hackathonPass && tasksPass && taskMatchPass && hoursPass;

  if (isSuccess) {
    passed++;
    console.log(`[PASS] #${String(test.id).padStart(2, '0')}: "${test.input.slice(0, 48)}..." -> ${result.type}`);
  } else {
    failed++;
    console.log(`[FAIL] #${String(test.id).padStart(2, '0')}: "${test.input}"`);
    console.log(`       Expected: type=${test.expectedType}, h=${test.expectedHackathon || 'any'}, t=${test.expectedTaskMatch || 'any'}, hrs=${test.expectedHours || 'any'}`);
    console.log(`       Got:      type=${result.type}, h=${result.targetHackathonName || result.taskTarget?.hackathonName}, t=${result.taskTarget?.taskName}, hrs=${result.taskTarget?.estimateHours || result.availableHours}`);
  }
}

console.log('='.repeat(70));
console.log(`TEST SUITE RESULTS: ${passed} PASSED / ${TEST_CASES.length} TOTAL (${Math.round((passed / TEST_CASES.length) * 100)}%)`);
console.log('='.repeat(70));

// --------------------------------------------------------------------
// UNIT TEST: What Now Remaining Work Calculation (Bug 3 Verification)
// --------------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log('UNIT TEST: WHAT NOW REMAINING WORK HOURS (TODO + DOING ONLY)');
console.log('='.repeat(70));

let mathPassed = 0;
let mathFailed = 0;

// Test 1: Verify Meta Global AI demo hackathon unfinished work equals 5 hours
const metaHackathon = demoHackathons.find((h) => h.id === 'demo-meta-global-ai');
if (!metaHackathon) {
  console.log('[FAIL] Could not find Meta Global AI Hackathon in demo data');
  mathFailed++;
} else {
  const metaRemaining = getRemainingWorkHours(metaHackathon);
  const doneTasks = metaHackathon.tasks.filter((t) => t.status === 'done');
  const unfinishedTasks = metaHackathon.tasks.filter((t) => t.status === 'todo' || t.status === 'doing');
  const doneHours = doneTasks.reduce((sum, t) => sum + (t.estimateHours || 1), 0);
  const unfinishedHours = unfinishedTasks.reduce((sum, t) => sum + (t.estimateHours || 1), 0);

  if (metaRemaining === 5 && unfinishedHours === 5 && doneHours === 2) {
    console.log(`[PASS] Meta Hackathon remaining work is exactly ${metaRemaining}h (5h unfinished, 2h done ignored)`);
    mathPassed++;
  } else {
    console.log(`[FAIL] Meta Hackathon remaining work expected 5h, got ${metaRemaining}h (unfinished: ${unfinishedHours}h, done: ${doneHours}h)`);
    mathFailed++;
  }
}

// Test 2: Verify that Done tasks are strictly excluded from remaining work
const customHackathon: Hackathon = {
  id: 'test-custom',
  name: 'Test Hackathon',
  deadline: new Date(Date.now() + 86400000).toISOString(),
  createdAt: new Date().toISOString(),
  tasks: [
    { id: '1', title: 'Task in To Do', status: 'todo', estimateHours: 2, createdAt: new Date().toISOString() },
    { id: '2', title: 'Task in Doing', status: 'doing', estimateHours: 3, createdAt: new Date().toISOString() },
    { id: '3', title: 'Task in Done (Large)', status: 'done', estimateHours: 10, createdAt: new Date().toISOString() },
    { id: '4', title: 'Task in Done (Small)', status: 'done', estimateHours: 4, createdAt: new Date().toISOString() },
  ],
};

const customRemaining = getRemainingWorkHours(customHackathon);
if (customRemaining === 5) {
  console.log(`[PASS] Custom hackathon remaining work is ${customRemaining}h (2h todo + 3h doing, 14h done ignored)`);
  mathPassed++;
} else {
  console.log(`[FAIL] Custom hackathon expected 5h, got ${customRemaining}h`);
  mathFailed++;
}

// Test 3: If all tasks are Done, remaining work is 0
const allDoneHackathon: Hackathon = {
  id: 'test-all-done',
  name: 'Completed Hackathon',
  deadline: new Date(Date.now() + 86400000).toISOString(),
  createdAt: new Date().toISOString(),
  tasks: [
    { id: '1', title: 'Done 1', status: 'done', estimateHours: 5, createdAt: new Date().toISOString() },
    { id: '2', title: 'Done 2', status: 'done', estimateHours: 8, createdAt: new Date().toISOString() },
  ],
};

const allDoneRemaining = getRemainingWorkHours(allDoneHackathon);
if (allDoneRemaining === 0) {
  console.log(`[PASS] All-done hackathon remaining work is ${allDoneRemaining}h`);
  mathPassed++;
} else {
  console.log(`[FAIL] All-done hackathon expected 0h, got ${allDoneRemaining}h`);
  mathFailed++;
}

console.log('='.repeat(70));
console.log(`WHAT NOW MATH TESTS: ${mathPassed} PASSED / ${mathPassed + mathFailed} TOTAL`);
console.log('='.repeat(70));

if (failed > 0 || mathFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
