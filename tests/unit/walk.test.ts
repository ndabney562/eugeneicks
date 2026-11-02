import { describe, expect, it } from 'vitest';
import { DISPLAY } from '../../src/config/display';
import { advanceStride, footOffsets } from '../../src/core/walk';

const W = DISPLAY.walk;

describe('walking feet', () => {
  it('alternates: one foot forward while the other goes back', () => {
    const f = footOffsets(Math.PI / 2, 1, 1, false);
    expect(f.left.forward).toBeCloseTo(W.reach);
    expect(f.right.forward).toBeCloseTo(-W.reach);
    const g = footOffsets(3 * Math.PI / 2, 1, 1, false);
    expect(g.left.forward).toBeCloseTo(-W.reach);
    expect(g.right.forward).toBeCloseTo(W.reach);
  });

  it('keeps the feet either side of the body', () => {
    const f = footOffsets(1, 1, 1, false);
    expect(f.left.side).toBeCloseTo(-W.spacing);
    expect(f.right.side).toBeCloseTo(W.spacing);
  });

  it('settles both feet side by side, with no bob, when standing still', () => {
    const f = footOffsets(Math.PI / 2, 0, 1, false);
    expect(f.left.forward).toBeCloseTo(0);
    expect(f.right.forward).toBeCloseTo(0);
    expect(f.bob).toBeCloseTo(0);
  });

  it('squashes on each footfall and stretches between steps', () => {
    expect(footOffsets(Math.PI / 2, 1, 1, false).bob).toBeCloseTo(W.bob);
    expect(footOffsets(3 * Math.PI / 2, 1, 1, false).bob).toBeCloseTo(W.bob);
    expect(footOffsets(0, 1, 1, false).bob).toBeCloseTo(-W.bob);
  });

  it('scales offsets with the character size (64 px patients vs 96 px doctors)', () => {
    const big = footOffsets(Math.PI / 2, 1, 1, false);
    const small = footOffsets(Math.PI / 2, 1, 64 / 96, false);
    expect(small.left.forward).toBeCloseTo(big.left.forward * 64 / 96);
    expect(small.right.side).toBeCloseTo(big.right.side * 64 / 96);
  });

  it('turns the bob off with Reduce Motion, but the feet still step', () => {
    const f = footOffsets(Math.PI / 2, 1, 1, true);
    expect(f.bob).toBe(0);
    expect(f.left.forward).toBeCloseTo(W.reach);
  });

  it('advances the stride with distance moved, so a smaller character takes more steps', () => {
    expect(advanceStride(0, W.stride, 1)).toBeCloseTo(2 * Math.PI);
    expect(advanceStride(0, W.stride / 2, 64 / 96)).toBeCloseTo(Math.PI * 96 / 64);
    expect(advanceStride(1, 0, 1)).toBe(1);
  });
});
