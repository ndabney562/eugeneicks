/**
 * Shared Online Leaderboard Client
 * Submits and retrieves scores from the Cloudflare Workers + D1 backend.
 * Gracefully handles offline / network failures without interrupting gameplay.
 */

import { validateLeaderboardName } from './leaderboardName';
import type { ShiftMode } from './shift';
import type { DifficultyId } from '../data/difficulties';

export interface LeaderboardEntry {
  id?: number;
  name: string;
  score: number;
  round: number;
  mode: ShiftMode;
  difficulty: DifficultyId;
  provider: string;
  streak?: number;
  kills?: number;
  created_at?: number;
}

export interface ScoreSubmission {
  name: string;
  score: number;
  round: number;
  mode: ShiftMode;
  difficulty: DifficultyId;
  provider: string;
  streak?: number;
  kills?: number;
}

export interface LeaderboardFilter {
  mode?: ShiftMode;
  difficulty?: DifficultyId;
  provider?: string;
  limit?: number;
}

const NAME_KEY = 'eugeneicks.leaderboard.name';
/** The live scores server (`worker/`, Cloudflare). */
const DEFAULT_API_URL = 'https://eugeneicks-leaderboard.eugeneicks.workers.dev';

/**
 * The scores server: `?leaderboard=<url>`, then `window.__LEADERBOARD_API_URL__`, then a saved
 * `eugeneicks.leaderboard.url`, then the live one. `off` from any of them turns it off (the tests do this,
 * so they never post to the live board).
 */
export function getLeaderboardApiUrl(): string {
  let url = DEFAULT_API_URL;
  if (typeof window !== 'undefined') {
    try {
      url = new URLSearchParams(window.location.search).get('leaderboard')
        || (window as any).__LEADERBOARD_API_URL__
        || localStorage.getItem('eugeneicks.leaderboard.url')
        || DEFAULT_API_URL;
    } catch {
      // ignore
    }
  }
  return url === 'off' ? '' : url;
}

/** Get the saved player name on this device. */
export function getSavedPlayerName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? 'Dr. Eugene';
  } catch {
    return 'Dr. Eugene';
  }
}

/** Save player name for future runs. */
export function savePlayerName(name: string): void {
  try {
    const val = validateLeaderboardName(name);
    if (val.ok) {
      localStorage.setItem(NAME_KEY, val.name);
    }
  } catch {
    // ignore
  }
}

/** Submit a run score to the online leaderboard. */
export async function submitOnlineScore(submission: ScoreSubmission): Promise<{ ok: boolean; error?: string }> {
  const val = validateLeaderboardName(submission.name);
  if (!val.ok) {
    return { ok: false, error: `Invalid player name (${val.reason})` };
  }

  savePlayerName(val.name);

  const apiUrl = getLeaderboardApiUrl();
  if (!apiUrl) {
    return { ok: false, error: 'Leaderboard backend pending deployment' };
  }

  const url = `${apiUrl}/api/scores`;
  const payload = {
    ...submission,
    name: val.name,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { ok: false, error: (errJson as any)?.error ?? `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: msg };
  }
}

/** Fetch online leaderboard scores matching query filter. */
export async function fetchOnlineLeaderboard(filter: LeaderboardFilter = {}): Promise<{ ok: boolean; scores: LeaderboardEntry[]; error?: string }> {
  const params = new URLSearchParams();
  if (filter.mode) params.set('mode', filter.mode);
  if (filter.difficulty) params.set('difficulty', filter.difficulty);
  if (filter.provider) params.set('provider', filter.provider);
  if (filter.limit) params.set('limit', String(filter.limit));

  const apiUrl = getLeaderboardApiUrl();
  if (!apiUrl) {
    return { ok: false, scores: [], error: 'Leaderboard backend pending deployment' };
  }

  const url = `${apiUrl}/api/scores?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { ok: false, scores: [], error: (errJson as any)?.error ?? `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, scores: data.scores ?? [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { ok: false, scores: [], error: msg };
  }
}
