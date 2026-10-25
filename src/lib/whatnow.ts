import { Hackathon, Task, WhatNowRecommendation } from '../types/index';

export interface OverbookedAlert {
  hackathonId: string;
  hackathonName: string;
  hoursLeft: number;
  remainingWorkHours: number;
  overbookedByHours: number;
}

/**
 * Calculates total remaining work hours for a hackathon's incomplete tasks.
 * Strictly counts only tasks in To Do and Doing, never Done.
 */
export function getRemainingWorkHours(hackathon: Hackathon): number {
  return hackathon.tasks
    .filter((t) => t.status === 'todo' || t.status === 'doing')
    .reduce((sum, t) => sum + (t.estimateHours && t.estimateHours > 0 ? t.estimateHours : 1), 0);
}

/**
 * Calculates hours left until deadline
 */
export function getHoursUntilDeadline(deadlineIso: string, now: Date = new Date()): number {
  const diffMs = new Date(deadlineIso).getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // 1 decimal place
}

/**
 * Detects all hackathons that have more remaining work than time left before deadline
 */
export function getOverbookedHackathons(hackathons: Hackathon[], now: Date = new Date()): OverbookedAlert[] {
  const alerts: OverbookedAlert[] = [];

  for (const h of hackathons) {
    const hoursLeft = getHoursUntilDeadline(h.deadline, now);
    const remainingWork = getRemainingWorkHours(h);

    // Overbooked if remaining work > hours left and the hackathon hasn't already expired
    if (hoursLeft > 0 && remainingWork > hoursLeft) {
      alerts.push({
        hackathonId: h.id,
        hackathonName: h.name,
        hoursLeft,
        remainingWorkHours: remainingWork,
        overbookedByHours: Math.round((remainingWork - hoursLeft) * 10) / 10,
      });
    }
  }

  return alerts;
}

/**
 * Core "What Now" Recommendation Algorithm:
 * 1. Score each hackathon by slack: hoursLeft - remainingWorkHours.
 * 2. Hackathon with the least slack wins.
 * 3. Inside it:
 *    - Task in 'doing' comes first.
 *    - If availableHours is provided (e.g. "I have 2 hours"), prefer a task that fits.
 *    - Otherwise, biggest task comes first.
 * 4. Reason formatted in one plain sentence: e.g. "Nebius has 31 hours left and 6 hours of work."
 */
export function getWhatNowRecommendation(
  hackathons: Hackathon[],
  availableHours?: number,
  now: Date = new Date()
): WhatNowRecommendation | null {
  // Filter hackathons that have at least one pending task and haven't expired
  const eligibleHackathons = hackathons
    .filter((h) => {
      const hoursLeft = getHoursUntilDeadline(h.deadline, now);
      const hasPendingTasks = h.tasks.some((t) => t.status !== 'done');
      return hoursLeft > 0 && hasPendingTasks;
    })
    .map((h) => {
      const hoursLeft = getHoursUntilDeadline(h.deadline, now);
      const remainingWork = getRemainingWorkHours(h);
      const slack = hoursLeft - remainingWork;
      return {
        hackathon: h,
        hoursLeft,
        remainingWork,
        slack,
        isOverbooked: remainingWork > hoursLeft,
      };
    });

  if (eligibleHackathons.length === 0) {
    // If no active hackathons with pending tasks, check if any hackathon exists
    const anyHackathonWithTasks = hackathons.find((h) => h.tasks.some((t) => t.status !== 'done'));
    if (!anyHackathonWithTasks) return null;

    const task = anyHackathonWithTasks.tasks.find((t) => t.status !== 'done')!;
    return {
      hackathon: anyHackathonWithTasks,
      task,
      reason: `${anyHackathonWithTasks.name} has pending tasks ready for review.`,
      hoursLeft: 0,
      remainingWorkHours: getRemainingWorkHours(anyHackathonWithTasks),
      slack: 0,
      isOverbooked: false,
    };
  }

  // Hackathon with LEAST slack wins (most urgent crunch)
  eligibleHackathons.sort((a, b) => a.slack - b.slack);
  const winningChoice = eligibleHackathons[0];
  const pendingTasks = winningChoice.hackathon.tasks.filter((t) => t.status !== 'done');

  let chosenTask: Task | null = null;

  // 1. Task already in 'doing' comes first
  const doingTask = pendingTasks.find((t) => t.status === 'doing');
  if (doingTask) {
    chosenTask = doingTask;
  } else if (availableHours && availableHours > 0) {
    // 2. If available hours given (e.g. "I have 2 hours"), prefer a task that fits
    const fittingTasks = pendingTasks.filter(
      (t) => (t.estimateHours || 1) <= availableHours
    );

    if (fittingTasks.length > 0) {
      // Pick the largest one that fits
      fittingTasks.sort((a, b) => (b.estimateHours || 1) - (a.estimateHours || 1));
      chosenTask = fittingTasks[0];
    } else {
      // None fit under availableHours; pick the smallest pending task to make progress
      const sortedBySmallest = [...pendingTasks].sort(
        (a, b) => (a.estimateHours || 1) - (b.estimateHours || 1)
      );
      chosenTask = sortedBySmallest[0];
    }
  } else {
    // 3. Biggest task comes first (highest estimated hours)
    const sortedByBiggest = [...pendingTasks].sort(
      (a, b) => (b.estimateHours || 1) - (a.estimateHours || 1)
    );
    chosenTask = sortedByBiggest[0];
  }

  if (!chosenTask) return null;

  // Plain sentence reason: "Nebius has 31 hours left and 6 hours of work."
  const roundedHoursLeft = Math.round(winningChoice.hoursLeft);
  const roundedWork = Math.round(winningChoice.remainingWork);
  let reason = `${winningChoice.hackathon.name} has ${roundedHoursLeft} hours left and ${roundedWork} hours of work.`;

  if (availableHours && availableHours > 0) {
    reason += ` Picked to fit your ${availableHours}-hour focus window.`;
  }

  return {
    hackathon: winningChoice.hackathon,
    task: chosenTask,
    reason,
    hoursLeft: winningChoice.hoursLeft,
    remainingWorkHours: winningChoice.remainingWork,
    slack: winningChoice.slack,
    isOverbooked: winningChoice.isOverbooked,
  };
}
