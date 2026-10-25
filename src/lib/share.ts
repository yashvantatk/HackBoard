import LZString from 'lz-string';
import { Hackathon } from '../types/index';

const HASH_PREFIX = 'shared=';

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
 * Copies the shared board URL to the clipboard
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

  // Update URL hash without re-triggering navigation
  window.history.replaceState(null, '', shareUrl);
  return shareUrl;
}

/**
 * Decompresses board data from the URL hash if present
 */
export function decodeBoardFromHash(): Hackathon[] | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith(HASH_PREFIX)) return null;

  const rawEncoded = hash.substring(HASH_PREFIX.length);
  if (!rawEncoded) return null;

  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(rawEncoded);
    if (!decompressed) return null;
    const parsed = JSON.parse(decompressed);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error('Failed to decompress board from hash:', err);
    return null;
  }
}

/**
 * Removes the share hash from the current URL
 */
export function clearSharedHash(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', window.location.pathname);
}
