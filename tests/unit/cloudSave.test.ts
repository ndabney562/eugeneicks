import { describe, expect, it, vi } from 'vitest';
vi.mock('../../src/core/events', () => ({ events: { emit: vi.fn() }, GameEvents: { AchievementUnlocked: 'unlocked' } }));
import { applyCloud, localCloud, mergeCloud, noteLocalChanges, parseCloud, type CloudSave } from '../../src/core/cloudSave';
import { progress } from '../../src/core/progress';
import { hasAchievement } from '../../src/core/achievements';
import { ACHIEVEMENTS } from '../../src/data/achievements';

const copy = (over: Partial<CloudSave>): CloudSave => ({ v: 1, at: 0, save: null, progress: null, achievements: [], ...over });
const prog = (over: Record<string, unknown>) => ({ credits: 0, earned: 0, nps: 0, npsEarned: 0, owned: [], specialty: '', startTool: '', kills: {}, bank: 0, locker: {}, staff: {}, ...over });
const rec = (bestScore: number, bestRound: number, bestStreak: number) => ({ bestScore, bestRound, bestStreak });

describe('cloud save merge', () => {
  it('keeps the best of each record, per difficulty', () => {
    const m = mergeCloud(
      copy({ save: { version: 3, records: { urgent: rec(500, 3, 9) }, totalKills: 40, runs: 2 } }),
      copy({ save: { version: 3, records: { urgent: rec(300, 7, 2), er: rec(10, 1, 1) }, totalKills: 90, runs: 1 } }),
    );
    expect(m.save?.records).toEqual({ urgent: rec(500, 7, 9), er: rec(10, 1, 1) });
    expect(m.save).toMatchObject({ totalKills: 90, runs: 2 });
  });

  it('keeps the later day for Today\'s Shift, and the best of each on the same day', () => {
    const day = (date: string, bestScore: number, finished: number) => ({ version: 3, records: {}, daily: { date, bestScore, bestRound: 1, finished } });
    expect(mergeCloud(copy({ save: day('2026-11-01', 900, 1) }), copy({ save: day('2026-11-02', 100, 0) })).save?.daily)
      .toEqual({ date: '2026-11-02', bestScore: 100, bestRound: 1, finished: 0 });
    expect(mergeCloud(copy({ save: day('2026-11-02', 900, 0) }), copy({ save: day('2026-11-02', 100, 1) })).save?.daily)
      .toEqual({ date: '2026-11-02', bestScore: 900, bestRound: 1, finished: 1 });
  });

  it('adds up nothing twice: lifetime numbers take the max, purchases and achievements combine', () => {
    const m = mergeCloud(
      copy({ at: 10, progress: prog({ earned: 50, kills: { basic: 9 }, locker: { squirtBottle: 2 }, owned: ['starterKit'] }), achievements: ['a'] }),
      copy({ at: 5, progress: prog({ earned: 80, kills: { basic: 3, sprinter: 4 }, locker: { squirtBottle: 1, wipes: 1 }, owned: ['doctor:kaya'] }), achievements: ['b'] }),
    );
    expect(m.progress).toMatchObject({ earned: 80, kills: { basic: 9, sprinter: 4 }, locker: { squirtBottle: 2, wipes: 1 } });
    expect([...(m.progress?.owned as string[])].sort()).toEqual(['doctor:kaya', 'starterKit']);
    expect(m.achievements).toEqual(['a', 'b']);
  });

  it('takes spendable balances from the device that played last', () => {
    const older = copy({ at: 100, progress: prog({ credits: 99, nps: 99, bank: 99, specialty: 'x' }) });
    const newer = copy({ at: 200, progress: prog({ credits: 1, nps: 2, bank: 3, specialty: '' }) });
    for (const m of [mergeCloud(older, newer), mergeCloud(newer, older)]) {
      expect(m.progress).toMatchObject({ credits: 1, nps: 2, bank: 3, specialty: '' });
      expect(m.at).toBe(200);
    }
  });

  it('rejects copies it cannot read', () => {
    expect(parseCloud({ v: 2, at: 1 })).toBeUndefined();
    expect(parseCloud('junk')).toBeUndefined();
    expect(parseCloud(null)).toBeUndefined();
    expect(parseCloud({ v: 1, at: 5, achievements: ['x', 3] })).toEqual(copy({ at: 5, achievements: ['x'] }));
  });
});

describe('applying a cloud copy on this device', () => {
  it('merges into the saves and the running game sees it without a reload', () => {
    localStorage.setItem('eugeneicks.progress.v1', JSON.stringify(prog({ credits: 5, earned: 5 })));
    noteLocalChanges(1000);
    const id = ACHIEVEMENTS[0].id;
    expect(applyCloud(copy({ at: 2000, progress: prog({ credits: 40, earned: 90 }), achievements: [id] }))).toBe(true);
    expect(progress()).toMatchObject({ credits: 40, earned: 90 });
    expect(hasAchievement(id)).toBe(true);
  });

  it('reports no change for a copy it already has', () => {
    localStorage.setItem('eugeneicks.progress.v1', JSON.stringify(prog({ credits: 5 })));
    noteLocalChanges(1000);
    expect(applyCloud(localCloud())).toBe(false);
  });

  it('dates this device\'s saves only when they change', () => {
    localStorage.setItem('eugeneicks.progress.v1', JSON.stringify(prog({ credits: 5 })));
    noteLocalChanges(1000);
    noteLocalChanges(2000);
    expect(localCloud().at).toBe(1000);
    localStorage.setItem('eugeneicks.progress.v1', JSON.stringify(prog({ credits: 6 })));
    noteLocalChanges(3000);
    expect(localCloud().at).toBe(3000);
  });
});
