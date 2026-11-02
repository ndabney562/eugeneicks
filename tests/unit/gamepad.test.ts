import { afterEach, expect, it, vi } from 'vitest';
import { PAD, PadReader } from '../../src/core/gamepad';

function pad(axes: number[], down: Partial<Record<keyof typeof PAD, number>> = {}) {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
  for (const [b, v] of Object.entries(down)) buttons[PAD[b as keyof typeof PAD]] = { pressed: v >= 1, value: v };
  return { connected: true, axes, buttons };
}
function connect(p: unknown) {
  vi.stubGlobal('navigator', { getGamepads: () => [null, p] });
}
afterEach(() => vi.unstubAllGlobals());

it('reads nothing without a controller', () => {
  vi.stubGlobal('navigator', { getGamepads: () => [null, null] });
  expect(new PadReader().read()).toBeNull();
});
it('ignores stick drift inside the dead zone and still reaches full tilt', () => {
  const r = new PadReader();
  connect(pad([0.1, 0.1, 0, 0]));
  expect(r.read()).toMatchObject({ moveX: 0, moveY: 0 });
  connect(pad([1, 0, 0, 1]));
  expect(r.read()).toMatchObject({ moveX: 1, moveY: 0, aimX: 0, aimY: 1 });
});
it('moves with the d-pad when the left stick is idle', () => {
  connect(pad([0, 0, 0, 0], { up: 1, right: 1 }));
  const s = new PadReader().read()!;
  expect(s.moveX).toBeCloseTo(Math.SQRT1_2);
  expect(s.moveY).toBeCloseTo(-Math.SQRT1_2);
});
it('counts a button press once, sprays on a half-pulled trigger', () => {
  const r = new PadReader();
  connect(pad([0, 0, 0, 0], { x: 1, rt: 0.5 }));
  const first = r.read()!;
  expect([...first.pressed].sort()).toEqual(['rt', 'x']);
  expect(first.spray).toBe(true);
  expect(r.read()!.pressed.size).toBe(0);
  connect(pad([0, 0, 0, 0]));
  expect(r.read()!.spray).toBe(false);
});
