/**
 * Time and IST calculation utilities for Hackboard
 * Indian Standard Time (IST) is UTC + 5:30
 */

export const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes in minutes

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
  isExpired: boolean;
  urgency: 'critical' | 'warning' | 'normal' | 'expired';
}

/**
 * Formats an ISO string or Date to Indian Standard Time (IST) readable format
 */
export function formatIST(dateInput: string | Date | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' 
    ? new Date(dateInput) 
    : dateInput;

  if (isNaN(date.getTime())) return 'Invalid Date';

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatter.format(date)} IST`;
}

/**
 * Returns formatted short time like "Oct 30 • 11:59 PM"
 */
export function formatISTShort(dateInput: string | Date | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' 
    ? new Date(dateInput) 
    : dateInput;

  if (isNaN(date.getTime())) return 'Invalid Date';

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatter.format(date)} IST`;
}

/**
 * Returns YYYY-MM-DD formatted strictly in Indian Standard Time (IST)
 */
export function getISTDateStamp(dateInput: Date | string | number = new Date()): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '10';
  const day = parts.find((p) => p.type === 'day')?.value || '26';

  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or ISO string to Gantt format strictly in Indian Standard Time (IST):
 * YYYY-MM-DD-HH:mm
 */
export function formatISTGantt(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '2026-10-26-00:00';

  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value || '2026';
  const month = parts.find((p) => p.type === 'month')?.value || '10';
  const day = parts.find((p) => p.type === 'day')?.value || '26';
  let hour = parts.find((p) => p.type === 'hour')?.value || '00';
  if (hour === '24') hour = '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';

  return `${year}-${month}-${day}-${hour}:${minute}`;
}

/**
 * Calculates live countdown from current moment to target deadline
 */
export function getCountdown(deadlineInput: string | Date | number, now: Date = new Date()): Countdown {
  const deadline = typeof deadlineInput === 'string' || typeof deadlineInput === 'number'
    ? new Date(deadlineInput)
    : deadlineInput;

  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: diffMs,
      isExpired: true,
      urgency: 'expired',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  // Urgency logic:
  // Red: <= 12 hours
  // Amber: <= 48 hours
  // Green: > 48 hours
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  let urgency: 'critical' | 'warning' | 'normal' = 'normal';

  if (hoursRemaining <= 12) {
    urgency = 'critical';
  } else if (hoursRemaining <= 48) {
    urgency = 'warning';
  } else {
    urgency = 'normal';
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds: diffMs,
    isExpired: false,
    urgency,
  };
}

/**
 * Creates an ISO string for an IST target date and time.
 * e.g., year=2026, month=10 (Oct is 10), day=30, hours=23, minutes=59
 */
export function createISTDate(year: number, month: number, day: number, hours = 23, minutes = 59, seconds = 59): string {
  // Convert IST components to UTC ISO string
  // IST is UTC + 5:30, so UTC = IST - 5:30
  const pad = (n: number) => String(n).padStart(2, '0');
  const istString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}+05:30`;
  return new Date(istString).toISOString();
}

/**
 * Human friendly relative time e.g., "2 days, 4 hours left"
 */
export function formatTimeLeft(countdown: Countdown): string {
  if (countdown.isExpired) {
    return 'Deadline passed';
  }
  const parts: string[] = [];
  if (countdown.days > 0) parts.push(`${countdown.days}d`);
  if (countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.hours}h`);
  parts.push(`${countdown.minutes}m`);
  parts.push(`${countdown.seconds}s`);
  return parts.join(' ');
}
