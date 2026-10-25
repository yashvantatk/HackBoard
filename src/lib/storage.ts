import { Hackathon, HistoryEntry } from '../types/index';
import { createISTDate } from './time';

const STORAGE_KEYS = {
  HACKATHONS: 'hackboard_hackathons_v3',
  HISTORY: 'hackboard_history_v3',
  INITIALIZED: 'hackboard_initialized_v3',
};

/**
 * Creates dynamic demo hackathons.
 * "The demo board must always look alive, so if the demo deadlines are in the past when someone opens it, shift them to 1, 4 and 6 days from now."
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
      tasks: [
        {
          id: 'meta-t1',
          title: 'Project architecture diagram & spec',
          status: 'done',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T11:00:00Z').toISOString(),
        },
        {
          id: 'meta-t2',
          title: 'Fine-tune Llama 3.3 model on custom evaluation dataset',
          status: 'doing',
          estimateHours: 4,
          createdAt: new Date('2026-10-24T12:00:00Z').toISOString(),
        },
        {
          id: 'meta-t3',
          title: 'Record 3-minute demo pitch & voiceover',
          status: 'todo',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T13:00:00Z').toISOString(),
        },
        {
          id: 'meta-t4',
          title: 'Submit on Devpost & publish GitHub repository',
          status: 'todo',
          estimateHours: 1,
          createdAt: new Date('2026-10-24T14:00:00Z').toISOString(),
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
      tasks: [
        {
          id: 'nv-t1',
          title: 'Setup Nebius cloud GPU cluster & Triton server',
          status: 'done',
          estimateHours: 3,
          createdAt: new Date('2026-10-24T09:30:00Z').toISOString(),
        },
        {
          id: 'nv-t2',
          title: 'Integrate NIM microservices pipeline on Nebius',
          status: 'doing',
          estimateHours: 3,
          createdAt: new Date('2026-10-24T10:00:00Z').toISOString(),
        },
        {
          id: 'nv-t3',
          title: 'Demo video for Nebius',
          status: 'todo',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T10:15:00Z').toISOString(),
        },
        {
          id: 'nv-t4',
          title: 'Devpost readme & benchmark numbers',
          status: 'todo',
          estimateHours: 2,
          createdAt: new Date('2026-10-24T10:30:00Z').toISOString(),
        },
        {
          id: 'nv-t5',
          title: 'Deploy frontend & live testing endpoint',
          status: 'todo',
          estimateHours: 1,
          createdAt: new Date('2026-10-24T10:45:00Z').toISOString(),
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
      tasks: [
        {
          id: 'wispr-t1',
          title: 'Wispr Flow dictation voice commands hook',
          status: 'done',
          estimateHours: 2,
          createdAt: new Date('2026-10-23T15:30:00Z').toISOString(),
        },
        {
          id: 'wispr-t2',
          title: 'Chrono IST NLP parser and task extraction engine',
          status: 'done',
          estimateHours: 3,
          createdAt: new Date('2026-10-23T16:00:00Z').toISOString(),
        },
        {
          id: 'wispr-t3',
          title: 'Zero-latency war room UI with Kanban & countdown rings',
          status: 'doing',
          estimateHours: 3,
          createdAt: new Date('2026-10-23T16:30:00Z').toISOString(),
        },
        {
          id: 'wispr-t4',
          title: 'Record hands-free demo video using only Wispr key',
          status: 'todo',
          estimateHours: 1,
          createdAt: new Date('2026-10-23T17:00:00Z').toISOString(),
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

function normalizeHackathons(hackathons: Hackathon[]): Hackathon[] {
  return hackathons.map((h) => ({
    ...h,
    tasks: (h.tasks || []).map((t) => ({
      ...t,
      estimateHours: typeof t.estimateHours === 'number' && t.estimateHours > 0 ? t.estimateHours : 1,
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
 * Loads all hackathons from localStorage. Seeds alive demo data on first visit.
 */
export function getHackathons(): Hackathon[] {
  if (!isClient()) return getAliveDemoHackathons();

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HACKATHONS);
    if (!raw) {
      const aliveDemo = getAliveDemoHackathons();
      localStorage.setItem(STORAGE_KEYS.HACKATHONS, JSON.stringify(aliveDemo));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEMO_HISTORY));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return aliveDemo;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const aliveDemo = getAliveDemoHackathons();
      return aliveDemo;
    }

    // Check if demo hackathons are all in the past, shift them if needed
    const allDemoInPast = parsed.every(
      (h) => h.id.startsWith('demo-') && new Date(h.deadline).getTime() < Date.now()
    );
    if (allDemoInPast) {
      const aliveDemo = getAliveDemoHackathons();
      localStorage.setItem(STORAGE_KEYS.HACKATHONS, JSON.stringify(aliveDemo));
      return aliveDemo;
    }

    return normalizeHackathons(parsed);
  } catch (err) {
    console.error('Failed to parse hackathons from localStorage:', err);
    return getAliveDemoHackathons();
  }
}

/**
 * Saves hackathons list to localStorage
 */
export function saveHackathons(hackathons: Hackathon[]): void {
  if (!isClient()) return;
  try {
    const normalized = normalizeHackathons(hackathons);
    localStorage.setItem(STORAGE_KEYS.HACKATHONS, JSON.stringify(normalized));
    notifyStorageUpdate();
  } catch (err) {
    console.error('Failed to save hackathons to localStorage:', err);
  }
}

/**
 * Loads command history from localStorage
 */
export function getHistory(): HistoryEntry[] {
  if (!isClient()) return DEMO_HISTORY;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      return DEMO_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse history from localStorage:', err);
    return [];
  }
}

/**
 * Adds an entry to command history (prepended, newest first)
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
    const history = getHistory();
    const updated = [newEntry, ...history].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    notifyStorageUpdate();
  } catch (err) {
    console.error('Failed to add history entry:', err);
  }

  return newEntry;
}

/**
 * Resets data back to the demo board
 */
export function resetToDemo(): void {
  if (!isClient()) return;
  const aliveDemo = getAliveDemoHackathons();
  localStorage.setItem(STORAGE_KEYS.HACKATHONS, JSON.stringify(aliveDemo));
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEMO_HISTORY));
  notifyStorageUpdate();
}

/**
 * Clears history
 */
export function clearHistory(): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  notifyStorageUpdate();
}
