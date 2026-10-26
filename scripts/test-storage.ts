/**
 * Comprehensive Unit Test Suite for Hackboard Storage, Migration, and Safety
 * Tests:
 * 1. No reseeding after the board is cleared
 * 2. Start fresh keeping user items
 * 3. Migration from legacy storage format (v4 -> v1)
 * 4. Share link preview not overwriting saved data & duplicate-free merging
 * 5. Data corruption fallback and backup
 */

// Setup mock browser environment for Node.js / tsx
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  getAllKeys(): string[] {
    return Object.keys(this.store);
  }
}

const mockStorage = new MockLocalStorage();

(globalThis as any).localStorage = mockStorage;
try {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: {
      writeText: async (text: string) => {
        (globalThis as any).__lastCopiedText = text;
      },
    },
    configurable: true,
    writable: true,
  });
} catch {
  // If navigator is not defined or cannot define property
}
(globalThis as any).window = {
  location: {
    origin: 'https://hackerboard.vercel.app',
    pathname: '/',
    hash: '',
  },
  history: {
    replaceState: (_data: any, _unused: string, url: string) => {
      const hashIndex = url.indexOf('#');
      (globalThis as any).window.location.hash = hashIndex >= 0 ? url.substring(hashIndex) : '';
    },
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import {
  STORAGE_KEY_V1,
  LEGACY_STORAGE_KEYS,
  getStorageState,
  saveStorageState,
  getHackathons,
  saveHackathons,
  startFreshBoard,
  loadSampleData,
  mergeHackathons,
  isTaskAlreadyInHackathon,
} from '../src/lib/storage';
import { encodeBoardToHash, decodeBoardFromHash, parseShareHash, copyShareLink } from '../src/lib/share';
import { Hackathon } from '../src/types/index';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       Detail: ${detail}`);
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('HACKBOARD STORAGE & DATA SAFETY VERIFICATION SUITE');
  console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// TEST GROUP 1: First Visit Seeding & No Reseeding After Board is Cleared
// ---------------------------------------------------------------------------
console.log('--- TEST GROUP 1: Initial Seeding & No Reseed When Cleared ---');
mockStorage.clear();

// First visit: Should seed demo hackathons and mark initialized: true
const initialHackathons = getHackathons();
assert(initialHackathons.length === 3, 'First visit loads 3 demo hackathons');
assert(
  initialHackathons.every((h) => h.isDemo === true),
  'Demo hackathons are tagged with isDemo: true'
);

const stateV1 = JSON.parse(mockStorage.getItem(STORAGE_KEY_V1) || '{}');
assert(stateV1.version === 1, 'Storage state schema version is 1');
assert(stateV1.initialized === true, 'Storage state has initialized flag set to true');

// Clear the board: user deletes all hackathons
saveHackathons([]);
const clearedHackathons = getHackathons();
assert(clearedHackathons.length === 0, 'Board is cleared to 0 hackathons');

// Subsequent access: MUST NEVER reseed automatically!
const reloadedHackathons = getHackathons();
assert(
  reloadedHackathons.length === 0,
  'Cleared board NEVER reseeds automatically (empty array is preserved)'
);

// ---------------------------------------------------------------------------
// TEST GROUP 2: Start Fresh Keeps User Items and Removes Only Demo Items
// ---------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Start Fresh Keeps User Items ---');
mockStorage.clear();

// Initialize demo board
getHackathons();

// Add a user-created hackathon
const userCreatedHackathon: Hackathon = {
  id: 'hack-user-smart-india',
  name: 'Smart India Hackathon',
  deadline: '2026-11-05T23:59:59+05:30',
  accentColor: '#06b6d4',
  createdAt: '2026-10-26T12:00:00Z',
  isDemo: false,
  tasks: [
    {
      id: 'task-user-1',
      title: 'Submit PPT architecture deck',
      status: 'todo',
      estimateHours: 4,
      createdAt: '2026-10-26T12:30:00Z',
      isDemo: false,
    },
    {
      id: 'task-user-2',
      title: 'Backend microservice implementation',
      status: 'doing',
      estimateHours: 5,
      createdAt: '2026-10-26T13:00:00Z',
      isDemo: false,
    },
  ],
};

const current = getHackathons();
saveHackathons([...current, userCreatedHackathon]);
assert(getHackathons().length === 4, 'Added user hackathon to board (total 4)');

// Call startFreshBoard()
const freshRemaining = startFreshBoard();
assert(freshRemaining.length === 1, 'Start fresh removes all 3 demo items, keeping 1 item');
assert(
  freshRemaining[0].id === 'hack-user-smart-india',
  'User hackathon "Smart India Hackathon" is preserved'
);
assert(
  freshRemaining[0].tasks.length === 2,
  'User hackathon tasks are preserved completely'
);

// Verify subsequent reload still keeps only user hackathon
const afterReload = getHackathons();
assert(afterReload.length === 1 && afterReload[0].name === 'Smart India Hackathon', 'Reloading board maintains user-only state');

// ---------------------------------------------------------------------------
// TEST GROUP 3: Migration from Legacy Storage Format (v4 -> v1)
// ---------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Migration from Legacy Storage Format ---');
mockStorage.clear();

// Populate legacy keys
const legacyHackathons = [
  {
    id: 'legacy-hack-1',
    name: 'Legacy Hackathon A',
    deadline: '2026-11-01T23:59:59+05:30',
    tasks: [{ id: 'lt-1', title: 'Legacy task 1', status: 'done', estimateHours: 2 }],
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'demo-meta-global-ai',
    name: 'Meta Global AI Hackathon',
    deadline: '2026-10-26T23:59:59+05:30',
    tasks: [{ id: 'dt-1', title: 'Meta spec', status: 'todo', estimateHours: 1 }],
    createdAt: '2026-10-20T10:00:00Z',
  },
];

const legacyHistory = [
  {
    id: 'hist-legacy-1',
    timestamp: '2026-10-20T10:05:00Z',
    rawInput: 'legacy voice command',
    actionSummary: 'Created legacy task',
    actionType: 'create_hackathon' as const,
  },
];

mockStorage.setItem(LEGACY_STORAGE_KEYS.HACKATHONS, JSON.stringify(legacyHackathons));
mockStorage.setItem(LEGACY_STORAGE_KEYS.HISTORY, JSON.stringify(legacyHistory));
mockStorage.setItem(LEGACY_STORAGE_KEYS.INITIALIZED, 'true');

// Ensure hackboard_v1 does not exist yet
assert(mockStorage.getItem(STORAGE_KEY_V1) === null, 'hackboard_v1 does not exist prior to migration');

// Calling getStorageState() triggers automatic upgrade migration
const migratedState = getStorageState();
assert(migratedState.version === 1, 'Migrated state has version 1');
assert(migratedState.initialized === true, 'Migrated state preserves initialized = true');
assert(migratedState.hackathons.length === 2, 'Migrated state preserves all legacy hackathons');
assert(migratedState.history.length === 1, 'Migrated state preserves history entries');

// Verify that hackboard_v1 was written
assert(mockStorage.getItem(STORAGE_KEY_V1) !== null, 'hackboard_v1 was successfully written to localStorage');

// Verify tagging
const migratedDemo = migratedState.hackathons.find((h) => h.id === 'demo-meta-global-ai');
const migratedUser = migratedState.hackathons.find((h) => h.id === 'legacy-hack-1');
assert(migratedDemo?.isDemo === true, 'Legacy demo hackathon tagged with isDemo: true');
assert(migratedUser?.isDemo === false, 'Legacy user hackathon tagged with isDemo: false');

// ---------------------------------------------------------------------------
// TEST GROUP 4: Share Link Preview Safe & Duplicate-Free Merging
// ---------------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: Share Link Safety & Duplicate-Free Merging ---');
mockStorage.clear();

// User has their own private board
const userPrivateBoard: Hackathon[] = [
  {
    id: 'user-private-hack',
    name: 'Autonomous Agent Hackathon',
    deadline: '2026-11-10T23:59:59+05:30',
    tasks: [
      { id: 'pt-1', title: 'Agent prompt eval spec', status: 'todo', estimateHours: 2, isDemo: false, createdAt: '2026-10-26T15:10:00Z' },
      { id: 'pt-2', title: 'Build tool execution loop', status: 'doing', estimateHours: 4, isDemo: false, createdAt: '2026-10-26T15:20:00Z' },
    ],
    createdAt: '2026-10-26T15:00:00Z',
    isDemo: false,
  },
];

saveHackathons(userPrivateBoard);
const userStorageBeforeShare = mockStorage.getItem(STORAGE_KEY_V1);

// Test: Copying a share link leaves the current hash and storage untouched
(globalThis as any).window.location.hash = '';
const copyResult = await copyShareLink(userPrivateBoard);
assert(copyResult.success === true, 'copyShareLink returned success: true');
assert(
  copyResult.url.includes('#shared='),
  'copyShareLink generated valid share URL with #shared='
);
assert(
  (globalThis as any).window.location.hash === '',
  'Copying a share link leaves current hash untouched (never changes window.location or hash)'
);
assert(
  mockStorage.getItem(STORAGE_KEY_V1) === userStorageBeforeShare,
  'Copying a share link leaves storage untouched (never touches localStorage)'
);

// Incoming shared board from friend
const friendSharedBoard: Hackathon[] = [
  {
    id: 'friend-hack-1',
    name: 'Autonomous Agent Hackathon', // Same name! Tests merge
    deadline: '2026-11-10T23:59:59+05:30',
    tasks: [
      { id: 'ft-1', title: 'Build tool execution loop', status: 'done', estimateHours: 4, createdAt: '2026-10-26T16:10:00Z' }, // Duplicate task
      { id: 'ft-2', title: 'Record 2-min demo pitch', status: 'todo', estimateHours: 2, createdAt: '2026-10-26T16:20:00Z' }, // New task!
    ],
    createdAt: '2026-10-26T16:00:00Z',
    isDemo: false,
  },
  {
    id: 'friend-hack-2',
    name: 'Wispr No Hands Challenge',
    deadline: '2026-10-31T23:59:59+05:30',
    tasks: [{ id: 'ft-3', title: 'Wispr Flow dictation hook', status: 'todo', estimateHours: 2, createdAt: '2026-10-26T16:35:00Z' }],
    createdAt: '2026-10-26T16:30:00Z',
    isDemo: false,
  },
];

// Encode into URL hash
const encoded = encodeBoardToHash(friendSharedBoard);
(globalThis as any).window.location.hash = `#shared=${encoded}`;

// Parse share hash into preview mode
const parseResult = parseShareHash();
assert(parseResult.status === 'success', 'parseShareHash returns status: success for valid hash');
assert(
  parseResult.status === 'success' && parseResult.hackathons.length === 2,
  'Parsed share hash into preview mode with exact 2 hackathons'
);

// Check that localStorage was NOT overwritten by parsing into preview mode
const userStorageAfterPreview = mockStorage.getItem(STORAGE_KEY_V1);
assert(
  userStorageBeforeShare === userStorageAfterPreview,
  'Opening or parsing a share hash does NOT touch or overwrite localStorage'
);

// Test decoding when hash is URI-percent-encoded (%2B instead of +)
const uriEncodedHash = `#shared=${encodeURIComponent(encoded)}`;
const parseResultUri = parseShareHash(uriEncodedHash);
assert(
  parseResultUri.status === 'success' && parseResultUri.hackathons.length === 2,
  'parseShareHash handles URI-percent-encoded share hashes seamlessly'
);
assert(
  mockStorage.getItem(STORAGE_KEY_V1) === userStorageBeforeShare,
  'URI-percent-encoded share hash parsing does NOT touch storage'
);

// Test malformed share hash: returns error status without touching storage
const parseResultMalformed = parseShareHash('#shared=not_a_valid_lz_string_payload!@#$%');
assert(
  parseResultMalformed.status === 'error',
  'parseShareHash returns status: error for malformed hash'
);
assert(
  mockStorage.getItem(STORAGE_KEY_V1) === userStorageBeforeShare,
  'Malformed share hash parsing does NOT touch storage'
);

// Test empty share hash: returns error status without touching storage
const parseResultEmpty = parseShareHash('#shared=');
assert(
  parseResultEmpty.status === 'error',
  'parseShareHash returns status: error for empty share payload'
);
assert(
  mockStorage.getItem(STORAGE_KEY_V1) === userStorageBeforeShare,
  'Empty share hash parsing does NOT touch storage'
);

// Test non-share hash (normal anchor): returns status none
const parseResultNone = parseShareHash('#timeline-section');
assert(
  parseResultNone.status === 'none',
  'parseShareHash returns status: none for non-share URL hash'
);

// Decode from hash for read-only preview (backward compatibility)
const previewData = decodeBoardFromHash();
assert(previewData !== null && previewData.length === 2, 'Decoded shared board from URL hash (decodeBoardFromHash)');

// Now test importing/merging shared board into user board
const currentBoard = getHackathons();
const merged = mergeHackathons(currentBoard, friendSharedBoard);

assert(merged.length === 2, 'Merged board contains exactly 2 hackathons (no duplicate hackathon)');
const mergedAgentHack = merged.find((h) => h.name === 'Autonomous Agent Hackathon');
assert(mergedAgentHack !== undefined, 'Found merged Autonomous Agent Hackathon');

// Tasks count should be 3: pt-1 ("Agent prompt eval spec"), pt-2 ("Build tool execution loop"), and new ft-2 ("Record 2-min demo pitch"). ft-1 was skipped because duplicate!
assert(
  mergedAgentHack?.tasks.length === 3,
  'Duplicate task was skipped, new task was appended (total 3 tasks)'
);

// ---------------------------------------------------------------------------
// TEST GROUP 5: Storage Corruption Fallback and Backup
// ---------------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Storage Corruption Fallback & Backup ---');
// Write intentionally corrupted JSON to hackboard_v1
mockStorage.setItem(STORAGE_KEY_V1, '{ corrupt_data: [not valid json ...');

// Call getStorageState()
const recoveryState = getStorageState();
assert(recoveryState.version === 1, 'Corrupted data recovers to valid schema version 1');
assert(recoveryState.hackathons.length === 0, 'Corrupted data starts empty without crashing');

// Check backup key
const keys = mockStorage.getAllKeys();
const backupKeyFound = keys.some((k) => k.startsWith('hackboard_v1_corrupt_backup_'));
assert(backupKeyFound, 'Corrupted data was backed up under hackboard_v1_corrupt_backup_* key');

// ---------------------------------------------------------------------------
// TEST GROUP 6: Load Sample Data Preserves User Hackathons
// ---------------------------------------------------------------------------
console.log('\n--- TEST GROUP 6: Load Sample Data Preserves User Hackathons ---');
mockStorage.clear();

// User starts fresh with an empty board
saveHackathons([userCreatedHackathon]);
assert(getHackathons().length === 1, 'Board has 1 user hackathon');

// Call loadSampleData()
const boardWithSample = loadSampleData();
assert(
  boardWithSample.length === 4,
  'Load sample data adds 3 demo hackathons alongside the user hackathon (total 4)'
);
const stillHasUserHack = boardWithSample.some((h) => h.id === 'hack-user-smart-india');
assert(stillHasUserHack, 'User hackathon was preserved without being wiped');

  console.log('\n======================================================================');
  console.log(`STORAGE TEST SUITE RESULTS: ${passedTests} PASSED / ${totalTests} TOTAL`);
  console.log('======================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
