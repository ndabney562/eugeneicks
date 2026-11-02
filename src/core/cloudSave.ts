import { reloadAchievements } from './achievements';
import { reloadProgress } from './progress';

/**
 * CLOUD SAVES: in the iPhone/iPad app, saved progress follows the player's Apple ID through iCloud
 * (key-value storage, ios/Eugeneicks/Services/CloudSaveSync.swift). The game posts its saves to the app
 * whenever progress changes; when another device's copy arrives, the two are merged so nothing earned on
 * either device is lost: records, kills and lifetime totals take the larger number, achievements and
 * purchases are combined, and spendable balances (CME, NPS, banked Copays) come from whichever device
 * played last. Settings and a saved shift stay on their own device.
 *
 * The merge works on localStorage; after one, the progress and achievement modules re-read it, so the running
 * game sees the merged saves without a reload. The bridge (core/native.ts) only merges on the title screen.
 */

export const CLOUD_KEYS = { save: 'eugeneicks.save.v3', progress: 'eugeneicks.progress.v1', achievements: 'eugeneicks.achievements.v1' } as const;
/** When this device last changed its saves (ms), so a merge knows whose balances are newer. */
const AT_KEY = 'eugeneicks.cloud.at';
/** The synced saves as they were when `at` was last set, to tell when they change. */
const SIG_KEY = 'eugeneicks.cloud.sig';

export interface CloudSave {
  v: 1;
  /** When the saves last changed on the device that wrote this copy (ms since 1970). */
  at: number;
  save: Record<string, unknown> | null;
  progress: Record<string, unknown> | null;
  achievements: string[];
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Every key of either, each value the larger. */
function maxEach(a: unknown, b: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of [...Object.entries(obj(a)), ...Object.entries(obj(b))]) out[k] = Math.max(out[k] ?? 0, num(v));
  return out;
}

/** Per-difficulty records: each difficulty's each field the larger. */
function mergeRecords(a: unknown, b: unknown): Obj {
  const out: Obj = {};
  for (const k of new Set([...Object.keys(obj(a)), ...Object.keys(obj(b))])) out[k] = maxEach(obj(a)[k], obj(b)[k]);
  return out;
}

function mergeSave(mine: Obj | null, theirs: Obj | null): Obj | null {
  if (!mine || !theirs) return mine ?? theirs;
  const da = obj(mine.daily), db = obj(theirs.daily);
  const dateA = typeof da.date === 'string' ? da.date : '', dateB = typeof db.date === 'string' ? db.date : '';
  // Today's Shift: the later date's best (same day: the larger of each)
  const daily = dateA === dateB ? { ...maxEach(da, db), date: dateA } : dateA > dateB ? da : db;
  return {
    ...theirs, ...mine, version: 3,
    records: mergeRecords(mine.records, theirs.records),
    fluSeason: mergeRecords(mine.fluSeason, theirs.fluSeason),
    daily,
    totalKills: Math.max(num(mine.totalKills), num(theirs.totalKills)),
    runs: Math.max(num(mine.runs), num(theirs.runs)),
  };
}

function mergeProgress(mine: Obj | null, mineAt: number, theirs: Obj | null, theirsAt: number): Obj | null {
  if (!mine || !theirs) return mine ?? theirs;
  const newer = theirsAt > mineAt ? theirs : mine;
  return {
    ...newer,
    earned: Math.max(num(mine.earned), num(theirs.earned)),
    npsEarned: Math.max(num(mine.npsEarned), num(theirs.npsEarned)),
    owned: [...new Set([...strings(mine.owned), ...strings(theirs.owned)])],
    kills: maxEach(mine.kills, theirs.kills),
    locker: maxEach(mine.locker, theirs.locker),
    staff: maxEach(mine.staff, theirs.staff),
  };
}

/** Both devices' progress in one: nothing earned on either is lost. */
export function mergeCloud(mine: CloudSave, theirs: CloudSave): CloudSave {
  return {
    v: 1,
    at: Math.max(mine.at, theirs.at),
    save: mergeSave(mine.save, theirs.save),
    progress: mergeProgress(mine.progress, mine.at, theirs.progress, theirs.at),
    achievements: [...new Set([...mine.achievements, ...theirs.achievements])].sort(),
  };
}

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

/** This device's saves, as the copy the app keeps in iCloud. */
export function localCloud(): CloudSave {
  const save = read(CLOUD_KEYS.save), progress = read(CLOUD_KEYS.progress);
  return {
    v: 1,
    at: num(read(AT_KEY)),
    save: save && typeof save === 'object' ? (save as Obj) : null,
    progress: progress && typeof progress === 'object' ? (progress as Obj) : null,
    achievements: strings(read(CLOUD_KEYS.achievements)).sort(),
  };
}

/** A copy from the app, or undefined if it isn't one (a newer format, damaged). */
export function parseCloud(value: unknown): CloudSave | undefined {
  const o = obj(value);
  if (o.v !== 1) return undefined;
  return {
    v: 1, at: num(o.at),
    save: Object.keys(obj(o.save)).length ? obj(o.save) : null,
    progress: Object.keys(obj(o.progress)).length ? obj(o.progress) : null,
    achievements: strings(o.achievements),
  };
}

/** JSON with every object's keys sorted, so the same saves always read the same. */
function canon(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as Obj).sort(([x], [y]) => (x < y ? -1 : 1))) : v);
}

/** The synced saves without their date: equal signatures mean nothing changed. */
function signature(c: CloudSave): string {
  return canon([c.save, c.progress, c.achievements]);
}

/**
 * Dates this device's saves `now` if they changed since the last call (or the last merge). The bridge calls it
 * before every report to the app, so `at` is when this device last earned or spent something.
 */
export function noteLocalChanges(now = Date.now()): void {
  try {
    const sig = signature(localCloud());
    if (localStorage.getItem(SIG_KEY) === sig) return;
    localStorage.setItem(SIG_KEY, sig);
    localStorage.setItem(AT_KEY, JSON.stringify(now));
  } catch {
    // Not fatal
  }
}

/** Merges another device's copy into this device's saves. True if anything changed. */
export function applyCloud(theirs: CloudSave): boolean {
  const mine = localCloud();
  const merged = mergeCloud(mine, theirs);
  let changed = false;
  try {
    const put = (key: string, value: unknown, was: unknown) => {
      if (value === null || canon(value) === canon(was)) return;
      localStorage.setItem(key, JSON.stringify(value));
      changed = true;
    };
    put(CLOUD_KEYS.save, merged.save, mine.save);
    put(CLOUD_KEYS.progress, merged.progress, mine.progress);
    put(CLOUD_KEYS.achievements, merged.achievements, mine.achievements);
    localStorage.setItem(AT_KEY, JSON.stringify(merged.at));
    localStorage.setItem(SIG_KEY, signature(localCloud()));
  } catch {
    return false;
  }
  if (changed) {
    reloadProgress();
    reloadAchievements();
  }
  return changed;
}
