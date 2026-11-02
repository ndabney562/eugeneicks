import { describe, expect, it } from 'vitest';
import { covered, firstClear, hangBelow, onScreen, overlaps } from '../../src/core/clearance';

const W = 1555, H = 720; // an 852x393 iPhone screen at the game's 720 px logical height

describe('overlaps', () => {
  it('sees boxes that cross', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });
  it('keeps apart boxes that only sit side by side', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
  it('counts boxes within the padding as touching', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 14, y: 0, w: 10, h: 10 }, 6)).toBe(true);
  });
});

describe('covered (world signs under the HUD)', () => {
  const spray = { x: 1290, y: 470, w: 160, h: 160 };

  it('fades a sign under the SPRAY button', () => {
    expect(covered({ x: 1300, y: 600, w: 200, h: 40 }, [spray], W, H, 6)).toBe(true);
  });
  it('fades a sign cut off by the screen edge', () => {
    expect(covered({ x: 1450, y: 150, w: 300, h: 80 }, [], W, H, 6)).toBe(true);
  });
  it('leaves a sign in open floor alone', () => {
    expect(covered({ x: 400, y: 300, w: 200, h: 40 }, [spray], W, H, 6)).toBe(false);
  });
});

describe('firstClear (BREAK FREE hint vs. speech bubble)', () => {
  const above = { x: 0, y: -60, w: 180, h: 40, at: 'above' };
  const below = { x: 0, y: 50, w: 180, h: 40, at: 'below' };

  it('keeps the hint above Eugene when nothing is talking', () => {
    expect(firstClear([above, below]).at).toBe('above');
  });
  it('moves the hint below Eugene when the bubble is in the way', () => {
    expect(firstClear([above, below], { x: 100, y: -80, w: 260, h: 70 }).at).toBe('below');
  });
  it('keeps the hint above when the bubble is elsewhere', () => {
    expect(firstClear([above, below], { x: 600, y: -80, w: 260, h: 70 }).at).toBe('above');
  });
});

describe('onScreen', () => {
  it('maps a world box through a zoomed, scrolled camera', () => {
    const cam = { worldView: { x: 100, y: 50 }, zoom: 2, x: 0, y: 0 };
    expect(onScreen({ x: 110, y: 60, w: 20, h: 5 }, cam, { x: 0, y: 0, w: 0, h: 0 })).toEqual({ x: 20, y: 20, w: 40, h: 10 });
  });
});

describe('hangBelow (speech bubbles vs. the HUD)', () => {
  const toast = { x: 600, y: 150, w: 400, h: 80 };
  const above = { x: 650, y: 160, w: 280, h: 70 };
  const below = { x: 650, y: 330, w: 280, h: 70 };

  it('hangs a bubble under the speaker when the achievement toast covers the spot above', () => {
    expect(hangBelow(above, below, [toast], W, H, 6)).toBe(true);
  });
  it('keeps it above when nothing covers it', () => {
    expect(hangBelow(above, below, [], W, H, 6)).toBe(false);
  });
  it('keeps it above when the spot below is covered too', () => {
    expect(hangBelow(above, below, [toast, { x: 600, y: 320, w: 400, h: 100 }], W, H, 6)).toBe(false);
  });
  it('hangs it below when the spot above runs off the top of the screen', () => {
    expect(hangBelow({ ...above, y: -30 }, below, [], W, H, 6)).toBe(true);
  });
});
