import { expect, it } from 'vitest';
import { DISPLAY } from '../../src/config/display';
import { settings } from '../../src/core/settings';
import { applyTextScale, scalable, textScale } from '../../src/ui/textScale';

function fakeText(px: number) {
  const listeners: Array<() => void> = [];
  const t = {
    style: { fontSize: `${px}px` },
    setFontSize(size: number) { this.style.fontSize = `${size}px`; return this; },
    once(_e: 'destroy', fn: () => void) { listeners.push(fn); return this; },
    destroy() { listeners.forEach((fn) => fn()); },
  };
  return t;
}

it('LARGE TEXT scales small labels live, from the size they were made at', () => {
  settings.largeText = false;
  const t = scalable(fakeText(14));
  expect(t.style.fontSize).toBe('14px');
  settings.largeText = true;
  applyTextScale();
  expect(textScale()).toBe(DISPLAY.largeTextScale);
  expect(t.style.fontSize).toBe(`${Math.round(14 * DISPLAY.largeTextScale)}px`);
  // Switching back returns to the original size, not a compounded one
  settings.largeText = false;
  applyTextScale();
  expect(t.style.fontSize).toBe('14px');
});

it('labels made while LARGE TEXT is on start big, and destroyed labels are forgotten', () => {
  settings.largeText = true;
  const t = scalable(fakeText(10));
  expect(t.style.fontSize).toBe('13px');
  t.destroy();
  settings.largeText = false;
  applyTextScale();
  expect(t.style.fontSize).toBe('13px');
});
