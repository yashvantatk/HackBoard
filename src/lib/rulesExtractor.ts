import * as chrono from 'chrono-node';
import { ExtractedChecklistItem, RulesExtractionResult } from '../types/index';
import { formatIST } from './time';

/**
 * Intelligent analyzer that parses raw hackathon rules and guidelines
 */
export function extractHackathonRules(rawText: string, referenceDate: Date = new Date()): RulesExtractionResult {
  const text = rawText.trim();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Extract Hackathon Name
  let hackathonName = '';
  // Check header lines or explicit intro patterns
  const nameRegex = /(?:welcome to (?:the)?|rules for (?:the)?|about (?:the)?|participating in (?:the)?|submission guidelines for (?:the)?)\s+([a-zA-Z0-9\s&'-]+(?:hackathon|challenge|cup|sprint|bounty)?)/i;
  const directMatch = text.match(nameRegex);

  if (directMatch && directMatch[1]) {
    hackathonName = directMatch[1].trim();
  } else {
    // Check first 3 lines for a title-like line containing "hackathon" or "challenge"
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const line = lines[i];
      if (/(?:hackathon|challenge|sprint|olympiad|ai|global)/i.test(line) && line.length < 60) {
        hackathonName = line.replace(/^[#*>\s]+/, '').trim();
        break;
      }
    }
  }

  // Fallback if still empty
  if (!hackathonName) {
    hackathonName = lines[0] && lines[0].length < 50 ? lines[0] : 'Extracted Hackathon';
  }

  // Clean trailing punctuation
  hackathonName = hackathonName.replace(/[.,:;!?]+$/, '').trim();

  // 2. Extract All Deadlines Mentioned
  const chronoMatches = chrono.parse(
    text,
    { instant: referenceDate, timezone: 330 },
    { forwardDate: true }
  );

  const seenDates = new Set<string>();
  const deadlines: RulesExtractionResult['deadlines'] = [];

  for (const match of chronoMatches) {
    // Skip words like "now" or relative single words
    if (/^(?:now|today)$/i.test(match.text.trim()) && !/(?:close|due|deadline|end|submit)/i.test(text)) {
      continue;
    }

    const d = match.start.date();
    if (!match.start.isCertain('hour')) {
      d.setHours(23, 59, 59, 0); // Default to end-of-day IST
    }

    const iso = d.toISOString();
    if (!seenDates.has(iso)) {
      seenDates.add(iso);
      deadlines.push({
        isoString: iso,
        displayText: formatIST(d),
        rawText: match.text,
      });
    }
  }

  // Default deadline: if multiple, sort ascending and pick the last submission deadline or default to 3 days
  deadlines.sort((a, b) => new Date(a.isoString).getTime() - new Date(b.isoString).getTime());
  const selectedDeadlineIso = deadlines.length > 0 
    ? deadlines[0].isoString 
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  // 3. Extract Team Size Rule
  let teamSizeRule: string | undefined;
  const teamMatch = text.match(/(?:team(?:\s+size)?(?:\s*:\s*|\s+of\s+|\s+is\s+)?(?:up\s+to\s+)?\d+(?:\s*(?:-|to)\s*\d+)?\s*(?:members?|people|participants?)?|solo\s+or\s+teams?\s+up\s+to\s+\d+|individuals?\s+or\s+teams?\s+of\s+\d+)/i);
  if (teamMatch) {
    teamSizeRule = teamMatch[0].trim();
  }

  // 4. Extract Submission Checklist Items
  const checklist: ExtractedChecklistItem[] = [];

  // A. Demo Video
  const videoMatch = text.match(/(?:demo\s+video|video\s+demo|screencast|pitch\s+video|walkthrough\s+video|loom|youtube)/i);
  if (videoMatch) {
    // Extract duration (e.g. "3-minute", "max 2 mins", "under 5 minutes")
    const durationMatch = text.match(/(\d+)\s*(?:-|to\s*\d+\s*)?(?:min(?:ute)?s?)\s*(?:demo|video|screencast|pitch)?/i);
    const durationStr = durationMatch ? ` (Max ${durationMatch[1]} mins)` : '';
    checklist.push({
      id: 'item-video',
      category: 'video',
      title: `Record demo video & voiceover${durationStr}`,
      detail: `Submission requires a video demo${durationStr}`,
      selected: true,
      estimateHours: 2,
    });
  }

  // B. GitHub Repo / Source Code
  const codeMatch = text.match(/(?:github|gitlab|source\s+code|codebase|public\s+repo|repository)/i);
  if (codeMatch) {
    checklist.push({
      id: 'item-code',
      category: 'code',
      title: 'Public GitHub repository with commit history',
      detail: 'Make repository public and verify all branch code is pushed',
      selected: true,
      estimateHours: 1,
    });
  }

  // C. Live Deployed Link / Web App
  const liveMatch = text.match(/(?:live\s+link|deployed\s+url|working\s+demo|hosted\s+application|production\s+deployment|vercel|netlify|endpoint)/i);
  if (liveMatch) {
    checklist.push({
      id: 'item-deploy',
      category: 'deploy',
      title: 'Deploy frontend & live testing URL',
      detail: 'Ensure deployed application is live and accessible without auth barriers',
      selected: true,
      estimateHours: 1,
    });
  }

  // D. README & Setup Docs
  const readmeMatch = text.match(/(?:readme|documentation|setup\s+instructions|install\s+guide|architecture)/i);
  if (readmeMatch) {
    checklist.push({
      id: 'item-docs',
      category: 'docs',
      title: 'Devpost submission text & comprehensive README',
      detail: 'Include architecture overview, setup steps, and benchmark results',
      selected: true,
      estimateHours: 2,
    });
  }

  // E. Screenshots / Architecture Diagrams
  const mediaMatch = text.match(/(?:screenshots?|architecture\s+diagram|ui\s+mockups?|infographic)/i);
  if (mediaMatch) {
    checklist.push({
      id: 'item-media',
      category: 'media',
      title: 'Architecture diagrams and UI screenshots',
      detail: 'Capture high-res screenshots and system architecture diagram',
      selected: true,
      estimateHours: 1,
    });
  }

  // F. Slides / Presentation Deck
  const slidesMatch = text.match(/(?:slides?|pitch\s+deck|presentation|deck|pdf\s+deck)/i);
  if (slidesMatch) {
    checklist.push({
      id: 'item-slides',
      category: 'other',
      title: 'Pitch deck slides (PDF)',
      detail: 'Prepare presentation deck highlighting problem, solution, and impact',
      selected: true,
      estimateHours: 2,
    });
  }

  // G. Team size confirmation if rule detected
  if (teamSizeRule) {
    checklist.push({
      id: 'item-team',
      category: 'team',
      title: `Confirm team roster & submission credits (${teamSizeRule})`,
      detail: `Rules state: "${teamSizeRule}"`,
      selected: true,
      estimateHours: 1,
    });
  }

  // If no items were detected from keywords, add standard essential hackathon checklist items
  if (checklist.length === 0) {
    checklist.push(
      {
        id: 'item-default-video',
        category: 'video',
        title: 'Record 3-minute demo video',
        selected: true,
        estimateHours: 2,
      },
      {
        id: 'item-default-repo',
        category: 'code',
        title: 'Clean GitHub repo & push code',
        selected: true,
        estimateHours: 1,
      },
      {
        id: 'item-default-readme',
        category: 'docs',
        title: 'Write Devpost README & pitch description',
        selected: true,
        estimateHours: 1,
      },
      {
        id: 'item-default-deploy',
        category: 'deploy',
        title: 'Verify live deployment link',
        selected: true,
        estimateHours: 1,
      }
    );
  }

  return {
    hackathonName,
    deadlines,
    selectedDeadlineIso,
    checklist,
    teamSizeRule,
  };
}
