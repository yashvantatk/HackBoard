import * as chrono from 'chrono-node';
import { Hackathon, ParsedCommand, TaskStatus } from '../types/index';
import { formatIST } from './time';
import { getWhatNowRecommendation } from './whatnow';

// Common speech-to-text dictation phonetic aliases
const SPEECH_ALIASES: Record<string, string> = {
  'navya': 'nvidia',
  'navyas': 'nvidia',
  'navya\'s': 'nvidia',
  'nivea': 'nvidia',
  'nividia': 'nvidia',
  'whisper': 'wispr',
  'whisper challenge': 'wispr',
  'meta': 'meta',
  'llama': 'meta',
  'nebius nvidia': 'nebius nvidia',
  'nebius': 'nebius',
  'gemini': 'google',
};

// Conversational speech filler phrases to clean
const FILLER_WORDS_REGEX = /\b(?:um|uh|so|like|you know|basically|actually|and also|i mean|i think|hey)\b/gi;

/**
 * Normalizes speech text, strips conversational fillers and maps aliases
 */
export function normalizeSpokenText(text: string): string {
  let normalized = text.toLowerCase().trim();

  // Strip common conversational speech fillers
  normalized = normalized.replace(FILLER_WORDS_REGEX, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  for (const [alias, replacement] of Object.entries(SPEECH_ALIASES)) {
    const reg = new RegExp(`\\b${alias}\\b`, 'gi');
    normalized = normalized.replace(reg, replacement);
  }
  return normalized;
}

/**
 * Calculates similarity between two strings with token matching
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.88;

  // Token overlap check
  const qTokens = s1.split(/\s+/).filter((t) => t.length > 2);
  const tTokens = s2.split(/\s+/).filter((t) => t.length > 2);
  let tokenSim = 0;
  if (qTokens.length > 0 && tTokens.length > 0) {
    let matches = 0;
    for (const q of qTokens) {
      if (tTokens.some((t) => t.includes(q) || q.includes(t))) {
        matches++;
      }
    }
    tokenSim = matches / qTokens.length;
  }

  // Levenshtein distance on raw string
  const clean1 = s1.replace(/\s+/g, '');
  const clean2 = s2.replace(/\s+/g, '');
  const m = clean1.length;
  const n = clean2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = clean1[i - 1] === clean2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  const maxLen = Math.max(m, n);
  const levSim = maxLen === 0 ? 1 : 1 - dp[m][n] / maxLen;

  return Math.max(levSim, tokenSim);
}

/**
 * Finds the best matching hackathon from a query string
 */
export function findMatchingHackathon(
  query: string,
  hackathons: Hackathon[]
): { hackathon: Hackathon | null; score: number } {
  if (!query || hackathons.length === 0) return { hackathon: null, score: 0 };
  const normalizedQuery = normalizeSpokenText(query);

  let bestMatch: Hackathon | null = null;
  let bestScore = 0;

  for (const h of hackathons) {
    const normName = h.name.toLowerCase();
    
    // Direct substring
    if (normName.includes(normalizedQuery) || normalizedQuery.includes(normName)) {
      return { hackathon: h, score: 0.95 };
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const nameTokens = normName.split(/\s+/).filter(Boolean);

    for (const qTok of queryTokens) {
      if (qTok.length < 3) continue;
      for (const nTok of nameTokens) {
        const sim = stringSimilarity(qTok, nTok);
        if (sim > bestScore) {
          bestScore = sim;
          bestMatch = h;
        }
      }
    }

    const fullSim = stringSimilarity(normalizedQuery, normName);
    if (fullSim > bestScore) {
      bestScore = fullSim;
      bestMatch = h;
    }
  }

  return { hackathon: bestMatch, score: bestScore };
}

/**
 * Extracts date and time using chrono-node configured for IST (+05:30)
 */
function extractDateWithIST(text: string, referenceDate: Date = new Date()): { date: Date; matchText: string } | null {
  const clean = text
    .replace(/\bwhat\s+now\b/i, '')
    .replace(/\bright\s+now\b/i, '')
    .replace(/\bwhat\s+next\b/i, '')
    .replace(/\bwhat\s+should\s+i\s+do\b/i, '');

  const parsed = chrono.parse(
    clean,
    { instant: referenceDate, timezone: 330 },
    { forwardDate: true }
  );

  if (!parsed || parsed.length === 0) return null;
  const match = parsed[0];

  if (/^(?:now|today)$/i.test(match.text.trim())) {
    if (!/(?:closes|closing|ends|deadline|due)/i.test(text)) {
      return null;
    }
  }

  const dateObj = match.start.date();

  if (!match.start.isCertain('hour')) {
    dateObj.setHours(23, 59, 59, 0);
  }

  return { date: dateObj, matchText: match.text };
}

/**
 * Splits task items from dictation after trigger words
 */
function extractTasksFromText(text: string): { tasks: Array<{ title: string; estimateHours?: number }>; taskClause: string | null } {
  const triggerRegex = /(?:still\s+need|need|needs|need\s+to\s+do|tasks?\s*(?:are|is|:)?|to-?do(?:s)?\s*(?:are|:)?|have\s+to\s+do|must\s+finish|pending\s*(?:tasks)?)\s*:?\s*(.+)$/i;
  const match = text.match(triggerRegex);

  if (!match || !match[1]) {
    return { tasks: [], taskClause: null };
  }

  const rawClause = match[1];
  const rawList = rawClause.split(/,\s*(?:and\s+)?|\s+and\s+|;\s*|\n+/i);

  const cleanedTasks = rawList
    .map((t) => {
      let item = t.trim();
      item = item.replace(/[.,;!?]+$/, '').trim();
      item = item.replace(/^(?:the|a|an|my|our|to)\s+/i, '').trim();
      item = item.replace(FILLER_WORDS_REGEX, ' ').trim();
      if (!item) return null;

      let estimateHours = 1;
      const estimateMatch = item.match(/(?:takes|\(|\b)(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\)?/i);
      if (estimateMatch) {
        estimateHours = parseFloat(estimateMatch[1]);
        item = item.replace(estimateMatch[0], '').replace(/[()]/g, '').trim();
      }

      const title = item.charAt(0).toUpperCase() + item.slice(1);
      return { title, estimateHours };
    })
    .filter((t): t is { title: string; estimateHours: number } => t !== null && t.title.length > 0 && !/^(?:etc|and\s+so\s+on)$/i.test(t.title));

  return { tasks: cleanedTasks, taskClause: match[0] };
}

/**
 * Main parser entry point
 */
export function parseVoiceCommand(
  rawInput: string,
  existingHackathons: Hackathon[],
  referenceDate: Date = new Date()
): ParsedCommand {
  const input = rawInput.trim();

  if (!input) {
    return {
      type: 'unknown',
      confidence: 'low',
      rawText: input,
      summary: 'Empty command received.',
    };
  }

  // 1. Detect UI Navigation: "show timeline", "view timeline", "gantt chart"
  if (/(?:show\s+timeline|view\s+timeline|open\s+timeline|gantt\s+chart|show\s+gantt)/i.test(input)) {
    return {
      type: 'view_timeline',
      confidence: 'high',
      rawText: input,
      summary: 'Switched to Operations Timeline (Gantt Chart).',
    };
  }

  // 2. Detect Calendar Export: "export my deadlines", "export to calendar", "download ics"
  if (/(?:export\s+(?:my\s+)?deadlines|export\s+(?:to\s+)?calendar|download\s+calendar|download\s+ics)/i.test(input)) {
    return {
      type: 'export_calendar',
      confidence: 'high',
      rawText: input,
      summary: 'Exported deadlines to iCalendar (.ics) with 24h & 2h reminders.',
    };
  }

  // 3. Detect Questions: "What now?", "What should I do next?", "I have 2 hours what should I do", "next", "status"
  if (/(?:what\s+now|what\s+next|what's\s+next|whats\s+next|what\s+(?:should|can|do)\s+i\s+do|what\s+to\s+do|what\s+to\s+work\s+on|what\s+should\s+i\s+work\s+on|what['’]?s\s+on\s+my\s+plate|what\s+is\s+on\s+my\s+plate|next\s+task|next\s+deadline|^next$|^status$|status\s+report|how\s+much\s+time|i\s+(?:have|got)\s+\d+)/i.test(input)) {
    return handleQuestionCommand(input, existingHackathons, referenceDate);
  }

  // 4. Detect Hourly Estimate Updates: "demo video for Nebius takes 2 hours"
  const estimateMatch = detectTaskEstimateCommand(input, existingHackathons);
  if (estimateMatch) {
    return estimateMatch;
  }

  // 5. Detect Adding Single Task with Estimate: "add record demo for Wispr, 1 hour"
  const singleTaskAddMatch = detectSingleTaskAddCommand(input, existingHackathons);
  if (singleTaskAddMatch) {
    return singleTaskAddMatch;
  }

  // 6. Detect Task Status Change: "Mark readme for Navya's", "Start demo video", "Mark deploy as done"
  const taskChangeMatch = detectTaskChangeCommand(input, existingHackathons);
  if (taskChangeMatch) {
    return taskChangeMatch;
  }

  // 7. Detect Hackathon Add/Update: "Nvidia closes October 30 at 11:59 pm. I still need the demo video, readme, and deploy."
  const hackathonMatch = detectHackathonCommand(input, existingHackathons, referenceDate);
  if (hackathonMatch) {
    return hackathonMatch;
  }

  return {
    type: 'unknown',
    confidence: 'low',
    rawText: input,
    summary: `Could not confidently determine action for: "${input}". Try dictating a deadline, task update, or asking "What now?".`,
  };
}

/**
 * Handles question commands like "What now?" and "I have 2 hours what should I do"
 */
function handleQuestionCommand(
  input: string,
  hackathons: Hackathon[],
  referenceDate: Date
): ParsedCommand {
  let availableHours: number | undefined;
  const hoursMatch = input.match(/(?:have|got|with)\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/i);
  if (hoursMatch) {
    availableHours = parseFloat(hoursMatch[1]);
  }

  const recommendation = getWhatNowRecommendation(hackathons, availableHours, referenceDate);

  if (!recommendation) {
    return {
      type: 'question',
      confidence: 'high',
      rawText: input,
      summary: 'All tasks completed across all hackathons! Your war room is clear.',
      questionAnswer: 'All tasks completed across all hackathons! Your war room is clear.',
      availableHours,
    };
  }

  const answer = `Recommended: "${recommendation.task.title}" in ${recommendation.hackathon.name} (${recommendation.task.estimateHours || 1}h). ${recommendation.reason}`;

  return {
    type: 'question',
    confidence: 'high',
    rawText: input,
    summary: answer,
    questionAnswer: answer,
    availableHours,
    taskTarget: {
      taskName: recommendation.task.title,
      taskId: recommendation.task.id,
      hackathonId: recommendation.hackathon.id,
      hackathonName: recommendation.hackathon.name,
      targetStatus: 'doing',
      estimateHours: recommendation.task.estimateHours,
    },
  };
}

/**
 * Detects task estimate commands: "demo video for Nebius takes 2 hours"
 */
function detectTaskEstimateCommand(
  input: string,
  hackathons: Hackathon[]
): ParsedCommand | null {
  const match = input.match(/(?:(?:set\s+)?estimate\s+(?:of|for)\s+)?(.+?)\s+(?:takes|to|is|estimated\s+at)\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/i);
  if (!match) return null;

  const rawTaskClause = match[1].trim();
  const estimateHours = Math.max(0.5, parseFloat(match[2]));

  let hackathonQuery = '';
  let taskQuery = rawTaskClause;

  const prepMatch = rawTaskClause.match(/\b(?:for|in|on|at|of)\s+([a-zA-Z0-9'\s]+)$/i);
  if (prepMatch) {
    hackathonQuery = prepMatch[1].trim();
    taskQuery = taskQuery.substring(0, prepMatch.index).trim();
  }

  taskQuery = taskQuery
    .replace(/\b(?:the|a|an|my)\s+/i, '')
    .replace(/\b(?:set\s+)?estimate\s+(?:of|for)?\b/gi, '')
    .replace(/\b(?:task|estimate)\b/gi, '')
    .replace(FILLER_WORDS_REGEX, ' ')
    .trim();

  let targetHackathons = hackathons;
  if (hackathonQuery) {
    const { hackathon, score } = findMatchingHackathon(hackathonQuery, hackathons);
    if (hackathon && score > 0.4) {
      targetHackathons = [hackathon];
    }
  }

  let bestTask: { task: Hackathon['tasks'][0]; hackathon: Hackathon; score: number } | null = null;
  for (const h of targetHackathons) {
    for (const t of h.tasks) {
      const sim = stringSimilarity(taskQuery, t.title);
      if (!bestTask || sim > bestTask.score) {
        bestTask = { task: t, hackathon: h, score: sim };
      }
    }
  }

  if (bestTask && bestTask.score >= 0.45) {
    return {
      type: 'estimate_task',
      confidence: 'high',
      rawText: input,
      summary: `Set estimate for "${bestTask.task.title}" in ${bestTask.hackathon.name} to ${estimateHours} hour${estimateHours === 1 ? '' : 's'}.`,
      taskTarget: {
        taskName: bestTask.task.title,
        taskId: bestTask.task.id,
        hackathonId: bestTask.hackathon.id,
        hackathonName: bestTask.hackathon.name,
        estimateHours,
      },
    };
  }

  return null;
}

/**
 * Detects single task additions with optional estimates: "add record demo for Wispr, 1 hour"
 */
function detectSingleTaskAddCommand(
  input: string,
  hackathons: Hackathon[]
): ParsedCommand | null {
  const match = input.match(/^(?:um\s+|so\s+)?add\s+(.+?)(?:,\s*|\s+taking\s+|\s+with\s+)?(\d+(?:\.\d+)?\s*(?:hours?|hrs?|h))?$/i);
  if (!match) return null;

  const rawSegment = match[1].trim();
  let estimateHours = 1;

  if (match[2]) {
    const parsedH = parseFloat(match[2]);
    if (!isNaN(parsedH) && parsedH > 0) estimateHours = parsedH;
  }

  let hackathonQuery = '';
  let taskTitle = rawSegment;

  const prepMatch = rawSegment.match(/\b(?:for|in|to)\s+([a-zA-Z0-9'\s]+)$/i);
  if (prepMatch) {
    hackathonQuery = prepMatch[1].trim();
    taskTitle = taskTitle.substring(0, prepMatch.index).trim();
  }

  taskTitle = taskTitle
    .replace(/^(?:the|a|an|my)\s+/i, '')
    .replace(FILLER_WORDS_REGEX, ' ')
    .trim();
  if (!taskTitle) return null;

  taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);

  let targetHackathon: Hackathon | null = null;
  if (hackathonQuery) {
    const { hackathon, score } = findMatchingHackathon(hackathonQuery, hackathons);
    if (hackathon && score > 0.4) {
      targetHackathon = hackathon;
    }
  }

  if (!targetHackathon && hackathons.length > 0) {
    const sorted = [...hackathons].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    targetHackathon = sorted[0];
  }

  if (targetHackathon) {
    return {
      type: 'update_hackathon',
      confidence: 'high',
      rawText: input,
      summary: `Add task "${taskTitle}" (${estimateHours}h) to ${targetHackathon.name}.`,
      targetHackathonName: targetHackathon.name,
      matchedHackathonId: targetHackathon.id,
      tasksToCreate: [{ title: taskTitle, estimateHours }],
    };
  }

  return null;
}

/**
 * Detects task status change commands: "Mark readme for Navya's", "Start demo video"
 */
function detectTaskChangeCommand(
  input: string,
  hackathons: Hackathon[]
): ParsedCommand | null {
  const isStart = /\b(?:start|begin|working\s+on|in\s+progress|started)\b/i.test(input);
  const isDone = /\b(?:mark|done|finish|finished|complete|completed|check|resolve|closed)\b/i.test(input);
  const isTodo = /\b(?:uncheck|reset|todo|to-do|reopen)\b/i.test(input);

  if (!isStart && !isDone && !isTodo) {
    return null;
  }

  const targetStatus: TaskStatus = isStart ? 'doing' : isTodo ? 'todo' : 'done';

  let hackathonQuery = '';
  const prepMatch = input.match(/\b(?:for|in|on|at|of)\s+([a-zA-Z0-9'\s]+)$/i);
  if (prepMatch) {
    hackathonQuery = prepMatch[1].trim();
  } else {
    const possMatch = input.match(/([a-zA-Z0-9']+)'s/i);
    if (possMatch) {
      hackathonQuery = possMatch[1].trim();
    }
  }

  let taskQuery = input;
  if (prepMatch) {
    taskQuery = taskQuery.substring(0, prepMatch.index);
  }
  taskQuery = taskQuery
    .replace(/\b(?:mark|start|begin|finish|complete|check|uncheck|reset|working\s+on|set)\b/gi, '')
    .replace(/\b(?:as\s+done|as\s+doing|as\s+todo|done|to\s+doing|to\s+done)\b/gi, '')
    .replace(/[a-zA-Z0-9']+'s/gi, '')
    .replace(FILLER_WORDS_REGEX, ' ')
    .trim();

  taskQuery = taskQuery.replace(/^(?:the|a|an|my)\s+/i, '').trim();

  if (!taskQuery) {
    return null;
  }

  let targetHackathons = hackathons;
  if (hackathonQuery) {
    const { hackathon, score } = findMatchingHackathon(hackathonQuery, hackathons);
    if (hackathon && score > 0.35) {
      targetHackathons = [hackathon];
    }
  }

  let bestTask: { task: Hackathon['tasks'][0]; hackathon: Hackathon; score: number } | null = null;

  for (const h of targetHackathons) {
    for (const t of h.tasks) {
      const sim = stringSimilarity(taskQuery, t.title);
      if (!bestTask || sim > bestTask.score) {
        bestTask = { task: t, hackathon: h, score: sim };
      }
    }
  }

  if (bestTask && bestTask.score >= 0.4) {
    const statusLabels: Record<TaskStatus, string> = {
      todo: 'To-Do',
      doing: 'In Progress (Doing)',
      done: 'Done',
    };

    return {
      type: 'change_task',
      confidence: bestTask.score > 0.65 ? 'high' : 'medium',
      rawText: input,
      summary: `Mark "${bestTask.task.title}" in ${bestTask.hackathon.name} as ${statusLabels[targetStatus]}.`,
      taskTarget: {
        taskName: bestTask.task.title,
        targetStatus,
        hackathonId: bestTask.hackathon.id,
        hackathonName: bestTask.hackathon.name,
        taskId: bestTask.task.id,
        estimateHours: bestTask.task.estimateHours,
      },
    };
  }

  return null;
}

/**
 * Detects hackathon creation or deadline updates with tasks
 */
function detectHackathonCommand(
  input: string,
  existingHackathons: Hackathon[],
  referenceDate: Date
): ParsedCommand | null {
  const dateResult = extractDateWithIST(input, referenceDate);
  const { tasks: extractedTasks, taskClause } = extractTasksFromText(input);

  if (!dateResult && extractedTasks.length === 0 && !/(?:closes|deadline|hackathon)/i.test(input)) {
    return null;
  }

  let nameSegment = input;
  if (taskClause) {
    nameSegment = nameSegment.replace(taskClause, '');
  }
  if (dateResult) {
    nameSegment = nameSegment.replace(dateResult.matchText, '');
  }

  let extractedName = nameSegment
    .replace(/\b(?:closes\s+at|closes\s+on|closes|closing|ends\s+at|ends\s+on|ends|ending|deadline\s+is|deadline|hackathon|add|update|create|for|the|new|board|war\s+room|i\s+still|i)\b/gi, ' ')
    .replace(FILLER_WORDS_REGEX, ' ')
    .replace(/[.,:;!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!extractedName && dateResult) {
    extractedName = 'New Hackathon';
  } else if (extractedName) {
    extractedName = extractedName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  const { hackathon: matchedHackathon, score } = findMatchingHackathon(extractedName, existingHackathons);
  const isExisting = matchedHackathon !== null && score >= 0.5;

  const targetName = isExisting ? matchedHackathon.name : (extractedName || 'Hackathon');
  const targetId = isExisting ? matchedHackathon.id : undefined;

  const deadlineIso = dateResult ? dateResult.date.toISOString() : undefined;
  const deadlineDisplay = dateResult ? formatIST(dateResult.date) : undefined;

  let summary = '';
  const taskTitles = extractedTasks.map((t) => t.title);

  if (isExisting) {
    const parts: string[] = [];
    if (deadlineDisplay) parts.push(`update deadline to ${deadlineDisplay}`);
    if (extractedTasks.length > 0) parts.push(`add ${extractedTasks.length} task${extractedTasks.length > 1 ? 's' : ''} (${taskTitles.join(', ')})`);
    summary = `Update "${targetName}": ${parts.join(' and ')}.`;
  } else {
    const parts: string[] = [];
    if (deadlineDisplay) parts.push(`closing ${deadlineDisplay}`);
    if (extractedTasks.length > 0) parts.push(`with ${extractedTasks.length} task${extractedTasks.length > 1 ? 's' : ''} (${taskTitles.join(', ')})`);
    summary = `Create new hackathon "${targetName}" ${parts.join(' ')}.`;
  }

  return {
    type: isExisting ? 'update_hackathon' : 'create_hackathon',
    confidence: (dateResult && (extractedTasks.length > 0 || isExisting)) ? 'high' : 'medium',
    rawText: input,
    summary,
    targetHackathonName: targetName,
    matchedHackathonId: targetId,
    deadlineIso,
    deadlineDisplay,
    tasksToCreate: extractedTasks,
  };
}
