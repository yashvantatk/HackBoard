export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  estimateHours?: number; // Optional estimate in hours (defaults to 1h)
}

export interface Hackathon {
  id: string;
  name: string;
  deadline: string; // ISO string representing deadline in IST
  url?: string;
  tasks: Task[];
  createdAt: string;
  accentColor?: string;
}

export type ActionType = 
  | 'create_hackathon'
  | 'update_hackathon'
  | 'change_task'
  | 'estimate_task'
  | 'question'
  | 'view_timeline'
  | 'export_calendar'
  | 'unknown';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  rawInput: string;
  actionSummary: string;
  actionType: ActionType;
  details?: {
    hackathonName?: string;
    deadline?: string;
    tasksAdded?: string[];
    taskChanged?: {
      taskTitle: string;
      hackathonName: string;
      newStatus?: TaskStatus;
      estimateHours?: number;
    };
  };
}

export interface ParsedCommand {
  type: ActionType;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
  summary: string;
  targetHackathonName?: string;
  matchedHackathonId?: string;
  deadlineIso?: string;
  deadlineDisplay?: string;
  tasksToCreate?: Array<{ title: string; estimateHours?: number }>;
  taskTarget?: {
    taskName: string;
    targetStatus?: TaskStatus;
    estimateHours?: number;
    hackathonId?: string;
    hackathonName?: string;
    taskId?: string;
  };
  questionAnswer?: string;
  availableHours?: number; // For "I have 2 hours what should I do"
}

export interface WhatNowRecommendation {
  hackathon: Hackathon;
  task: Task;
  reason: string;
  hoursLeft: number;
  remainingWorkHours: number;
  slack: number;
  isOverbooked: boolean;
}

export interface ExtractedChecklistItem {
  id: string;
  category: 'video' | 'code' | 'deploy' | 'docs' | 'media' | 'team' | 'other';
  title: string;
  detail?: string;
  selected: boolean;
  estimateHours: number;
}

export interface RulesExtractionResult {
  hackathonName: string;
  deadlines: Array<{
    isoString: string;
    displayText: string;
    rawText: string;
  }>;
  selectedDeadlineIso: string;
  checklist: ExtractedChecklistItem[];
  teamSizeRule?: string;
}
