import { Hackathon, HistoryEntry, Task } from '../types/index';
import { createISTDate } from './time';

export const STORAGE_VERSION = 1;
export const STORAGE_KEY_V1 = 'hackboard_v1';

export const LEGACY_STORAGE_KEYS = {
  HACKATHONS: 'hackboard_hackathons_v4',
  HISTORY: 'hackboard_history_v4',
  INITIALIZED: 'hackboard_initialized_v4',
};

export interface StorageStateV1 {
  version: number;
  initialized: boolean;
  hackathons: Hackathon[];
  history: HistoryEntry[];
  updatedAt: string;
}

/**
 * Creates dynamic demo hackathons.
 * "Tag every demo hackathon and task with isDemo true."
 */
export function getAliveDemoHackathons(now: Date = new Date()): Hackathon[] {
  // If October 2026 is currently future or current, keep Oct 26, Oct 30, Oct 31, 2026
  const metaFixed = new Date('2026-10-26T23:59:59+05:30');
  const isFixedValid = metaFixed.getTime() > now.getTime();

  let metaDeadlineIso: string;
  let nebiusDeadlineIso: string;
  let wisprDeadlineIso: string;

  if (isFixedValid) {
    metaDeadlineIso = createISTDate(2026, 10, 26, 23, 59, 59);
    nebiusDeadlineIso = createISTDate(2026, 10, 30, 23, 59, 59);
    wisprDeadlineIso = createISTDate(2026, 10, 31, 23, 59, 59);
  } else {
    // Shift dynamically to 1, 4 and 6 days from now at 11:59:59 PM IST
    const shiftDays = (days: number) => {
      const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const istFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = istFormatter.formatToParts(target);
      const year = parseInt(parts.find((p) => p.type === 'year')?.value || `${target.getFullYear()}`);
      const month = parseInt(parts.find((p) => p.type === 'month')?.value || `${target.getMonth() + 1}`);
      const day = parseInt(parts.find((p) => p.type === 'day')?.value || `${target.getDate()}`);
      return createISTDate(year, month, day, 23, 59, 59);
    };

    metaDeadlineIso = shiftDays(1);
    nebiusDeadlineIso = shiftDays(4);
    wisprDeadlineIso = shiftDays(6);
  }

  return [
    {
      id: 'demo-meta-global-ai',
      name: 'Meta Global AI Hackathon',
      deadline: metaDeadlineIso,
      url: 'https://metaglobalai.devpost.com',
      accentColor: '#3b82f6',
      createdAt: new Date('2026-10-24T10:00:00Z').toISOString(),
      isDemo: true,
      tasks: [
        {
          id: 'meta-t1',
          title: 'Project architecture diagram & spec',
          status: 'done',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T11:00:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'meta-t2',
          title: 'Fine-tune Llama 3.3 model on custom evaluation dataset',
          status: 'doing',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T12:00:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'meta-t3',
          title: 'Record 3-minute demo pitch & voiceover',
          status: 'todo',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T13:00:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'meta-t4',
          title: 'Submit on Devpost & publish GitHub repository',
          status: 'todo',
          estimateHours: 1,
          createdAt: new Date('2026-10-24T14:00:00Z').toISOString(),
          isDemo: true,
        },
      ],
    },
    {
      id: 'demo-nebius-nvidia',
      name: 'Nebius NVIDIA Hackathon',
      deadline: nebiusDeadlineIso,
      url: 'https://nebius.com/hackathons/nvidia',
      accentColor: '#22c55e',
      createdAt: new Date('2026-10-24T09:00:00Z').toISOString(),
      isDemo: true,
      tasks: [
        {
          id: 'nv-t1',
          title: 'Setup Nebius cloud GPU cluster & Triton server',
          status: 'done',
          estimateHours: 3,
          createdAt: new Date('2026-10-24T09:30:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'nv-t2',
          title: 'Integrate NIM microservices pipeline on Nebius',
          status: 'doing',
          estimateHours: 3,
          createdAt: new Date('2026-10-24T10:00:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'nv-t3',
          title: 'Demo video for Nebius',
          status: 'todo',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T10:15:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'nv-t4',
          title: 'Devpost readme & benchmark numbers',
          status: 'todo',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T10:30:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'nv-t5',
          title: 'Deploy frontend & live testing endpoint',
          status: 'todo',
          estimateHours: 1,
          createdAt: new Date('2026-10-24T10:45:00Z').toISOString(),
          isDemo: true,
        },
      ],
    },
    {
      id: 'demo-wispr-no-hands',
      name: 'Wispr No Hands Challenge',
      deadline: wisprDeadlineIso,
      url: 'https://wispr.ai/hackathon',
      accentColor: '#a855f7',
      createdAt: new Date('2026-10-23T15:00:00Z').toISOString(),
      isDemo: true,
      tasks: [
        {
          id: 'wispr-t1',
          title: 'Wispr Flow dictation voice commands hook',
          status: 'done',
          estimateHours: 2,
          createdAt: new Date('2026-10-23T15:30:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'wispr-t2',
          title: 'Chrono IST NLP parser and task extraction engine',
          status: 'done',
          estimateHours: 3,
          createdAt: new Date('2026-10-23T16:00:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'wispr-t3',
          title: 'Zero-latency war room UI with Kanban & countdown rings',
          status: 'doing',
          estimateHours: 3,
          createdAt: new Date('2026-10-23T16:30:00Z').toISOString(),
          isDemo: true,
        },
        {
          id: 'wispr-t4',
          title: 'Record hands-free demo video using only Wispr key',
          status: 'todo',
          estimateHours: 1,
          createdAt: new Date('2026-10-23T17:00:00Z').toISOString(),
          isDemo: true,
        },
      ],
    },
  ];
}

export const DEMO_HISTORY: HistoryEntry[] = [
  {
    id: 'hist-demo-1',
    timestamp: new Date('2026-10-25T17:45:00+05:30').toISOString(),
    rawInput: 'Nebius NVIDIA closes October 30 at 11:59 pm. Need Triton setup, NIM microservices, demo video, and deploy.',
    actionSummary: "Preloaded 'Nebius NVIDIA Hackathon' closing Oct 30, 11:59 PM IST with tasks",
    actionType: 'create_hackathon',
  },
  {
    id: 'hist-demo-2',
    timestamp: new Date('2026-10-25T18:10:00+05:30').toISOString(),
    rawInput: 'Demo video for Nebius takes 2 hours',
    actionSummary: "Set estimate of 'Demo video for Nebius' to 2 hours",
    actionType: 'estimate_task',
  },
  {
    id: 'hist-demo-3',
    timestamp: new Date('2026-10-25T18:30:00+05:30').toISOString(),
    rawInput: 'What now?',
    actionSummary: 'Queried optimal task: Meta Global AI. In progress: Fine-tune Llama 3.3 model (4h).',
    actionType: 'question',
  },
];

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function notifyStorageUpdate() {
  if (isClient()) {
    window.dispatchEvent(new Event('hackboard-storage-changed'));
  }
}

export function normalizeTaskForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(?:the|a|an)\b/gi, ' ')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isTaskAlreadyInHackathon(existingTasks: Task[], newTitle: string): boolean {
  const normNew = normalizeTaskForComparison(newTitle);
  if (!normNew) return false;

  return existingTasks.some((t) => {
    const normExisting = normalizeTaskForComparison(t.title);
    if (normExisting === normNew) return true;
    if (normExisting.includes(normNew) || normNew.includes(normExisting)) return true;
    const newTokens = normNew.split(' ').filter((w) => w.length > 2);
    if (newTokens.length > 0 && newTokens.every((w) => normExisting.includes(w))) return true;
    return false;
  });
}

export function normalizeHackathons(hackathons: Hackathon[]): Hackathon[] {
  return hackathons.map((h) => ({
    ...h,
    isDemo: Boolean(h.isDemo || h.id.startsWith('demo-')),
    tasks: (h.tasks || []).map((t) => ({
      ...t,
      estimateHours: typeof t.estimateHours === 'number' && t.estimateHours > 0 ? t.estimateHours : 1,
      isDemo: Boolean(t.isDemo || h.isDemo || h.id.startsWith('demo-')),
    })),
  }));
}

/**
 * Splits hackathons into Active (deadline > now) and Past / Closed (deadline <= now)
 */
export function splitActiveAndPastHackathons(hackathons: Hackathon[], now: Date = new Date()): {
  active: Hackathon[];
  past: Hackathon[];
} {
  const active: Hackathon[] = [];
  const past: Hackathon[] = [];

  for (const h of hackathons) {
    const isClosed = new Date(h.deadline).getTime() <= now.getTime();
    if (isClosed) {
      past.push(h);
    } else {
      active.push(h);
    }
  }

  return { active, past };
}

/**
 * Loads the complete versioned storage state.
 * Handles migration from legacy keys and corruption recovery.
 */
export function getStorageState(): StorageStateV1 {
  if (!isClient()) {
    const aliveDemo = getAliveDemoHackathons();
    return {
      version: STORAGE_VERSION,
      initialized: true,
      hackathons: aliveDemo,
      history: DEMO_HISTORY,
      updatedAt: new Date().toISOString(),
    };
  }

  // 1. Check versioned key
  const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
  if (rawV1 !== null) {
    try {
      const parsed = JSON.parse(rawV1);
      if (parsed && typeof parsed === 'object' && parsed.version === 1 && Array.isArray(parsed.hackathons)) {
        return {
          version: 1,
          initialized: Boolean(parsed.initialized),
          hackathons: normalizeHackathons(parsed.hackathons),
          history: Array.isArray(parsed.history) ? parsed.history : [],
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
      throw new Error('Invalid schema structure in hackboard_v1');
    } catch (err) {
      console.error('hackboard_v1 is corrupt. Backing up and starting fresh empty board:', err);
      // Backup corrupt state under another key
      const backupKey = `hackboard_v1_corrupt_backup_${Date.now()}`;
      try {
        localStorage.setItem(backupKey, rawV1);
      } catch (e) {
        console.error('Failed to save corrupt backup:', e);
      }

      // Start fresh empty board
      const recoveryState: StorageStateV1 = {
        version: 1,
        initialized: true,
        hackathons: [],
        history: [],
        updatedAt: new Date().toISOString(),
      };
      saveStorageState(recoveryState);
      return recoveryState;
    }
  }

  // 2. Migration from legacy keys (hackboard_hackathons_v4, hackboard_initialized_v4)
  const legacyHackathonsRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.HACKATHONS);
  const legacyInitialized = localStorage.getItem(LEGACY_STORAGE_KEYS.INITIALIZED);

  if (legacyHackathonsRaw !== null || legacyInitialized !== null) {
    try {
      let migratedHackathons: Hackathon[] = [];
      if (legacyHackathonsRaw) {
        const parsed = JSON.parse(legacyHackathonsRaw);
        if (Array.isArray(parsed)) {
          migratedHackathons = normalizeHackathons(parsed);
        }
      }

      let migratedHistory: HistoryEntry[] = [];
      const legacyHistoryRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.HISTORY);
      if (legacyHistoryRaw) {
        const parsedHist = JSON.parse(legacyHistoryRaw);
        if (Array.isArray(parsedHist)) {
          migratedHistory = parsedHist;
        }
      }

      const migratedState: StorageStateV1 = {
        version: 1,
        initialized: true,
        hackathons: migratedHackathons,
        history: migratedHistory,
        updatedAt: new Date().toISOString(),
      };

      saveStorageState(migratedState);
      return migratedState;
    } catch (err) {
      console.error('Migration from legacy storage failed:', err);
    }
  }

  // 3. First visit: seed demo once and save initialized = true
  const aliveDemo = getAliveDemoHackathons();
  const initialFreshState: StorageStateV1 = {
    version: 1,
    initialized: true,
    hackathons: aliveDemo,
    history: DEMO_HISTORY,
    updatedAt: new Date().toISOString(),
  };

  saveStorageState(initialFreshState);
  return initialFreshState;
}

/**
 * Saves the complete versioned state to localStorage
 */
export function saveStorageState(state: StorageStateV1): void {
  if (!isClient()) return;
  try {
    const payload: StorageStateV1 = {
      version: 1,
      initialized: Boolean(state.initialized),
      hackathons: normalizeHackathons(state.hackathons || []),
      history: Array.isArray(state.history) ? state.history : [],
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(payload));
    notifyStorageUpdate();
  } catch (err) {
    console.error('Failed to save storage state to localStorage:', err);
  }
}

/**
 * Loads all hackathons from localStorage.
 * Respects initialized flag: empty array is valid and NEVER reseeded automatically.
 */
export function getHackathons(): Hackathon[] {
  const state = getStorageState();
  return state.hackathons;
}

/**
 * Saves hackathons list to localStorage
 */
export function saveHackathons(hackathons: Hackathon[]): void {
  const state = getStorageState();
  state.hackathons = hackathons;
  saveStorageState(state);
}

/**
 * Loads command history from localStorage
 */
export function getHistory(): HistoryEntry[] {
  const state = getStorageState();
  return state.history;
}

/**
 * Adds an entry to command history
 */
export function addHistoryEntry(
  rawInput: string,
  actionSummary: string,
  actionType: HistoryEntry['actionType'] = 'unknown',
  details?: HistoryEntry['details']
): HistoryEntry {
  const newEntry: HistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    rawInput,
    actionSummary,
    actionType,
    details,
  };

  if (!isClient()) return newEntry;

  try {
    const state = getStorageState();
    const updatedHistory = [newEntry, ...(state.history || [])].slice(0, 50);
    state.history = updatedHistory;
    saveStorageState(state);
  } catch (err) {
    console.error('Failed to add history entry:', err);
  }

  return newEntry;
}

/**
 * Clears history
 */
export function clearHistory(): void {
  const state = getStorageState();
  state.history = [];
  saveStorageState(state);
}

/**
 * Removes only demo items (h.isDemo === true or id starts with 'demo-'),
 * keeping anything the user created.
 */
export function startFreshBoard(): Hackathon[] {
  const state = getStorageState();
  const userOnlyHackathons = (state.hackathons || []).filter(
    (h) => !h.isDemo && !h.id.startsWith('demo-')
  );

  state.hackathons = userOnlyHackathons;
  saveStorageState(state);
  return userOnlyHackathons;
}

/**
 * Merges incoming hackathons into an existing hackathon list without duplicate tasks or hackathons.
 */
export function mergeHackathons(existing: Hackathon[], incoming: Hackathon[]): Hackathon[] {
  const result: Hackathon[] = [...existing];

  for (const inc of incoming) {
    const normIncName = inc.name.trim().toLowerCase();
    const existingIndex = result.findIndex(
      (e) => e.id === inc.id || e.name.trim().toLowerCase() === normIncName
    );

    if (existingIndex >= 0) {
      // Merge tasks into existing hackathon
      const currentH = result[existingIndex];
      const mergedTasks = [...currentH.tasks];

      for (const t of inc.tasks || []) {
        if (!isTaskAlreadyInHackathon(mergedTasks, t.title)) {
          mergedTasks.push({
            ...t,
            id: `task-m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          });
        }
      }

      result[existingIndex] = {
        ...currentH,
        deadline: inc.deadline || currentH.deadline,
        url: inc.url || currentH.url,
        tasks: mergedTasks,
      };
    } else {
      // Add as new hackathon
      result.push({
        ...inc,
        tasks: [...(inc.tasks || [])],
      });
    }
  }

  return normalizeHackathons(result);
}

/**
 * Loads sample data by adding the demo hackathons back WITHOUT wiping the user's own hackathons.
 */
export function loadSampleData(): Hackathon[] {
  const state = getStorageState();
  const demoHackathons = getAliveDemoHackathons();
  const merged = mergeHackathons(state.hackathons || [], demoHackathons);
  state.hackathons = merged;
  saveStorageState(state);
  return merged;
}

/**
 * Legacy resetToDemo alias (for backwards compatibility) -> calls loadSampleData
 */
export function resetToDemo(): void {
  loadSampleData();
}

/**
 * Deletes a single hackathon and all of its tasks from storage
 */
export function deleteHackathon(hackathonId: string): Hackathon[] {
  const state = getStorageState();
  const updated = (state.hackathons || []).filter((h) => h.id !== hackathonId);
  state.hackathons = updated;
  saveStorageState(state);
  return updated;
}

/**
 * Export full board backup as JSON
 */
export interface BoardBackup {
  app: 'Hackboard';
  version: number;
  exportedAt: string;
  hackathons: Hackathon[];
  history: HistoryEntry[];
}

export function createBackupData(): BoardBackup {
  const state = getStorageState();
  return {
    app: 'Hackboard',
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    hackathons: state.hackathons,
    history: state.history,
  };
}

export function downloadBackupFile(): void {
  if (typeof window === 'undefined') return;
  const backup = createBackupData();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Format IST filename: hackboard-backup-YYYY-MM-DD.json
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = istFormatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '10';
  const day = parts.find((p) => p.type === 'day')?.value || '26';
  const filename = `hackboard-backup-${year}-${month}-${day}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Merges a backup JSON file into current board.
 * Skips duplicates.
 */
export function importBackupData(backupJson: unknown): {
  success: boolean;
  hackathonsCount: number;
  tasksCount: number;
  error?: string;
} {
  try {
    if (!backupJson || typeof backupJson !== 'object') {
      return { success: false, hackathonsCount: 0, tasksCount: 0, error: 'Invalid file format: not a JSON object.' };
    }

    const backupObj = backupJson as { hackathons?: Hackathon[]; history?: HistoryEntry[] };
    const incomingHackathons = Array.isArray(backupObj.hackathons) ? backupObj.hackathons : [];
    if (incomingHackathons.length === 0 && !Array.isArray(backupObj.history)) {
      return { success: false, hackathonsCount: 0, tasksCount: 0, error: 'No hackathons or history found in backup file.' };
    }

    const state = getStorageState();
    const mergedHackathons = mergeHackathons(state.hackathons || [], incomingHackathons);

    // Merge history without duplicating identical IDs
    const existingHistIds = new Set((state.history || []).map((h) => h.id));
    const newHistEntries: HistoryEntry[] = [];
    for (const h of backupObj.history || []) {
      if (h && h.id && !existingHistIds.has(h.id)) {
        newHistEntries.push(h);
      }
    }
    const mergedHistory = [...newHistEntries, ...(state.history || [])].slice(0, 50);

    state.hackathons = mergedHackathons;
    state.history = mergedHistory;
    saveStorageState(state);

    const totalTasks = mergedHackathons.reduce((acc, h) => acc + h.tasks.length, 0);

    return {
      success: true,
      hackathonsCount: mergedHackathons.length,
      tasksCount: totalTasks,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to parse and merge backup file.';
    return {
      success: false,
      hackathonsCount: 0,
      tasksCount: 0,
      error: errorMsg,
    };
  }
}
