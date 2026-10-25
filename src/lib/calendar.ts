import { Hackathon } from '../types/index';
import { formatIST } from './time';

/**
 * Formats a Date object to iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function formatIcsDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const pad = (n: number) => String(n).padStart(2, '0');
  
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Generates an RFC 5545 compliant iCalendar string containing all hackathons with IST timing & alarms
 */
export function generateIcsCalendar(hackathons: Hackathon[]): string {
  const now = new Date();
  const dtstamp = formatIcsDate(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hackboard//Hackathon War Room//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Hackboard Hackathon Deadlines (IST)',
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  for (const h of hackathons) {
    const deadlineDate = new Date(h.deadline);
    // DTSTART: 1 hour before deadline, DTEND: deadline
    const startDate = new Date(deadlineDate.getTime() - 60 * 60 * 1000);
    const dtstart = formatIcsDate(startDate);
    const dtend = formatIcsDate(deadlineDate);

    const pendingTasks = h.tasks.filter((t) => t.status !== 'done');
    const doneTasks = h.tasks.filter((t) => t.status === 'done');

    let desc = `Hackathon: ${h.name}\\nDeadline: ${formatIST(h.deadline)}\\n\\n`;
    if (pendingTasks.length > 0) {
      desc += `Pending Tasks (${pendingTasks.length}):\\n`;
      desc += pendingTasks.map((t) => ` - [ ] ${t.title} (${t.estimateHours || 1}h)`).join('\\n');
      desc += '\\n\\n';
    }
    if (doneTasks.length > 0) {
      desc += `Completed Tasks (${doneTasks.length}):\\n`;
      desc += doneTasks.map((t) => ` - [x] ${t.title}`).join('\\n');
    }
    if (h.url) {
      desc += `\\n\\nURL: ${h.url}`;
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:hackboard-${h.id}@local`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${h.name} Deadline`,
      `DESCRIPTION:${desc}`,
      ...(h.url ? [`URL:${h.url}`] : []),
      'STATUS:CONFIRMED',
      // Reminder 1: 24 hours before
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: 24 hours until ${h.name} deadline!`,
      'TRIGGER:-P1D',
      'END:VALARM',
      // Reminder 2: 2 hours before
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:CRITICAL: 2 hours until ${h.name} closes! Final submission window!`,
      'TRIGGER:-PT2H',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads the .ics calendar file in the user's browser
 */
export function downloadCalendarIcs(hackathons: Hackathon[]): void {
  if (typeof window === 'undefined') return;

  const icsContent = generateIcsCalendar(hackathons);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `hackboard-deadlines-${new Date().toISOString().split('T')[0]}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
