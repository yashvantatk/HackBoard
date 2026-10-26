import LZString from 'lz-string';
import { Hackathon } from '../types/index';
import { normalizeHackathons } from './storage';

export const HASH_PREFIX = 'shared=';

export type ShareHashParseResult =
  | { status: 'none' }
  | { status: 'success'; hackathons: Hackathon[] }
  | { status: 'error'; message: string };

/**
 * Compresses the hackathon board array into a safe URL hash string
 */
export function encodeBoardToHash(hackathons: Hackathon[]): string {
  try {
    const json = JSON.stringify(hackathons);
    return LZString.compressToEncodedURIComponent(json);
  } catch (err) {
    console.error('Failed to compress board:', err);
    return '';
  }
}

/**
 * Extracts raw share payload from a hash string or window.location
 */
export function extractSharePayload(hashInput?: string): string | null {
  let hash = '';
  if (hashInput !== undefined) {
    hash = hashInput;
  } else if (typeof window !== 'undefined') {
    if (window.location.hash) {
      hash = window.location.hash;
    } else if (window.location.href && window.location.href.includes('#')) {
      const idx = window.location.href.indexOf('#');
      hash = window.location.href.substring(idx);
    }
  }

  if (!hash) return null;

  // Strip leading '#' and any slashes '#/' or '/'
  const clean = hash.replace(/^[#\/]+/, '');

  if (clean.startsWith(HASH_PREFIX)) {
    return clean.substring(HASH_PREFIX.length);
  }

  // Support /#shared=... or #/shared=... or ...&shared=...
  const match = clean.match(/(?:^|[&?#/])shared=([^&?#]*)/);
  if (match) {
    return match[1];
  }

  return null;
}

/**
 * Robustly parses a share hash into preview mode data, detecting valid, malformed, or absent shares.
 * Preview parsing never touches localStorage.
 */
export function parseShareHash(hashInput?: string): ShareHashParseResult {
  const rawEncoded = extractSharePayload(hashInput);

  // No share hash in URL
  if (rawEncoded === null) {
    return { status: 'none' };
  }

  if (!rawEncoded.trim()) {
    return { status: 'error', message: 'Share link payload is empty.' };
  }

  try {
    // 1. Try direct decompression
    let decompressed: string | null = null;
    try {
      decompressed = LZString.decompressFromEncodedURIComponent(rawEncoded);
    } catch {
      decompressed = null;
    }

    // 2. If null, handle URI-percent-encoded characters (like %2B) and spaces
    if (!decompressed) {
      try {
        const decodedUri = decodeURIComponent(rawEncoded).replace(/ /g, '+');
        decompressed = LZString.decompressFromEncodedURIComponent(decodedUri);
      } catch {
        // Fall through
      }
    }

    // 3. If still null, try replacing spaces with + directly
    if (!decompressed && rawEncoded.includes(' ')) {
      try {
        decompressed = LZString.decompressFromEncodedURIComponent(rawEncoded.replace(/ /g, '+'));
      } catch {
        // Fall through
      }
    }

    if (!decompressed) {
      return { status: 'error', message: 'Could not decompress share link data.' };
    }

    const parsed = JSON.parse(decompressed);
    if (!Array.isArray(parsed)) {
      return { status: 'error', message: 'Share link data is not a valid hackathon list.' };
    }

    return {
      status: 'success',
      hackathons: normalizeHackathons(parsed),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse share link data.';
    return {
      status: 'error',
      message,
    };
  }
}

/**
 * Copies the shared board URL to the clipboard and updates the current URL hash,
 * dispatching a hashchange event so open tabs immediately enter preview mode.
 */
export async function copyShareLink(hackathons: Hackathon[]): Promise<string> {
  if (typeof window === 'undefined') return '';

  const encoded = encodeBoardToHash(hackathons);
  const shareUrl = `${window.location.origin}${window.location.pathname}#${HASH_PREFIX}${encoded}`;

  try {
    await navigator.clipboard.writeText(shareUrl);
  } catch (err) {
    console.warn('Clipboard write failed, falling back:', err);
  }

  // Update URL hash
  window.history.replaceState(null, '', shareUrl);

  // Dispatch hashchange event so any open tab enters preview mode immediately
  try {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch {
    window.dispatchEvent(new Event('hashchange'));
  }

  return shareUrl;
}

/**
 * Decompresses board data from the URL hash if present (backward compatibility)
 */
export function decodeBoardFromHash(hashInput?: string): Hackathon[] | null {
  const result = parseShareHash(hashInput);
  return result.status === 'success' ? result.hackathons : null;
}

/**
 * Removes the share hash from the current URL using history.replaceState
 * and dispatches a hashchange event.
 */
export function clearSharedHash(): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = window.location.pathname + (window.location.search || '');
  window.history.replaceState(null, '', cleanUrl);

  try {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch {
    window.dispatchEvent(new Event('hashchange'));
  }
}
