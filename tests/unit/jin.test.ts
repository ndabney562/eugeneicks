import { beforeEach, expect, it, vi } from 'vitest';
import { ProviderAbilities, type AbilityHost } from '../../src/systems/ProviderAbilities';
import { CHARACTERS } from '../../src/data/characters';
import { BALANCE } from '../../src/config/balance';
import { callOutChance } from '../../src/core/attendance';

beforeEach(() => { localStorage.clear(); vi.resetModules(); });

function setup(girls: number, targetCount = 3) {
  const targets = Array.from({ length: targetCount }, (_, i) => ({ x: 100 + i * 45, y: 0, hp: 1000, active: true, spawnVersion: 1, def: { radius: 15, boss: false } }));
  const host = {
    id: 'jin', player: { x: 0, y: 0, rotation: 0 }, targets: () => targets.filter((g) => g.active),
    damage: vi.fn((g, amount) => { g.hp -= amount; }), pulse: vi.fn(), beam: vi.fn(), heal: vi.fn(), guard: vi.fn(), rally: vi.fn(),
    helpers: () => 0, companion: () => false, joint: vi.fn(), refill: vi.fn(), recharge: vi.fn(), girls: () => girls, women: vi.fn(),
  };
  return { ability: new ProviderAbilities(host as unknown as AbilityHost), host, targets };
}

it('counts only the women Noah named, providers and staff alike', async () => {
  localStorage.setItem('eugeneicks.progress.v1', JSON.stringify({ owned: ['doctor:dhiwya', 'doctor:kaya', 'doctor:janeen', 'scribe:alexandra', 'scribe:omar', 'scribe:selina'] }));
  const p = await import('../../src/core/progress');
  expect(p.girlsUnlocked()).toBe(4);
});

it('makes every Locker damage level count three times for Jaykwellen', async () => {
  localStorage.setItem('eugeneicks.progress.v1', JSON.stringify({ locker: { squirtBottle: 3, lysolFogger: 2, uvWand: 1 } }));
  const p = await import('../../src/core/progress');
  expect(p.jinLockerBoost('bleachSoaker')).toBe(1);
  expect(p.jinLockerBoost('uvWand')).toBeCloseTo(1.3 / 1.1);
  expect(p.jinLockerBoost('lysolFogger')).toBeCloseTo(1.3 / 1.1);
  // With the tool's own ×1.21, a maxed tool reaches ×1.69 for her
  expect(p.jinLockerBoost('squirtBottle') * 1.1 * 1.1).toBeCloseTo(1.3 * 1.3);
});

it('GROUP CHAT sends one burst per girl, at least one, shared over the nearest germs', () => {
  const alone = setup(0);
  alone.ability.first(0);
  expect(alone.host.damage).toHaveBeenCalledTimes(1);
  expect(alone.host.damage.mock.calls[0][1]).toBe(BALANCE.jin.groupChat.damage);
  const squad = setup(5);
  squad.ability.first(0);
  expect(squad.host.damage).toHaveBeenCalledTimes(5);
  expect(new Set(squad.host.damage.mock.calls.map((c) => c[0])).size).toBe(3);
  expect(squad.host.pulse.mock.calls[0][4]).toBe('GROUP CHAT · 5 GIRLS');
});

it("her girls raise her damage, and GIRLS' NIGHT raises damage and speed per girl, rallies the women, then ends", () => {
  const { ability, host } = setup(7);
  expect(ability.toolPower(0, false)).toBeCloseTo(1.28);
  expect(ability.movement(0)).toBe(1);
  ability.second(1000);
  expect(host.women).toHaveBeenCalledWith(1000, 8000, 2);
  expect(ability.toolPower(2000, false)).toBeCloseTo(1.28 * 1.56);
  expect(ability.movement(2000)).toBeCloseTo(1.28);
  expect(ability.toolPower(9000, false)).toBeCloseTo(1.28);
  expect(ability.movement(9000)).toBe(1);
  expect(setup(0).ability.toolPower(0, false)).toBe(1);
});

it('starts weaker than everyone but Karen, has the best scribe affinity, and fully upgraded beats all but Gloria and Marina at her peak', () => {
  const jin = CHARACTERS.find((c) => c.id === 'jin')!;
  expect(jin.price).toBe(220);
  expect(jin.second).toMatchObject({ price: 160, cooldownMs: 24000 });
  for (const c of CHARACTERS.filter((c) => c.id !== 'jin' && c.id !== 'amanda')) expect(c.passive.toolDamage ?? 1).toBeGreaterThan(jin.passive.toolDamage!);
  for (const c of CHARACTERS.filter((c) => c.id !== 'jin')) expect(jin.helperDamage).toBeGreaterThan(c.helperDamage);
  expect(callOutChance('jin')).toBeLessThan(Math.min(...CHARACTERS.filter((c) => c.id !== 'jin').map((c) => callOutChance(c.id))));
  // Same maxed tool for everyone (its own ×1.21 cancels); Jaykwellen adds her 3× Locker, all 7 girls and Girls' Night
  const jinMax = jin.passive.toolDamage! * (1 + 0.04 * 7) * (1 + 0.08 * 7) * (1.3 * 1.3) / (1.1 * 1.1);
  const peaks: Record<string, number> = { lidiya: 3.2, dharma: 1.4, dhiwya: 1.35 };
  for (const c of CHARACTERS.filter((c) => !['jin', 'janeen', 'lidiya'].includes(c.id))) expect(jinMax).toBeGreaterThan((c.passive.toolDamage ?? 1) * (peaks[c.id] ?? 1));
  expect(jinMax).toBeLessThan(CHARACTERS.find((c) => c.id === 'janeen')!.passive.toolDamage!);
});
