import { DISPLAY } from '../config/display';
import { settings } from '../core/settings';

/** The bits of a Phaser Text this needs (so unit tests can pass a stand-in). */
interface SizedText {
  style: { fontSize: string | number };
  setFontSize(size: number): unknown;
  once(event: 'destroy', fn: () => void): unknown;
}

/** How much bigger small labels are drawn: LARGE TEXT on the pause menu. */
export function textScale(): number {
  return settings.largeText ? DISPLAY.largeTextScale : 1;
}

/** Live labels and the size each was made at. */
const tracked = new Map<SizedText, number>();

/** Draws `t` at its own font size × `textScale()`, now and whenever LARGE TEXT changes. Returns `t`. */
export function scalable<T extends SizedText>(t: T): T {
  const base = parseFloat(String(t.style.fontSize));
  tracked.set(t, base);
  t.once('destroy', () => tracked.delete(t));
  t.setFontSize(Math.round(base * textScale()));
  return t;
}

/** Re-sizes every live label after LARGE TEXT is switched. */
export function applyTextScale(): void {
  const k = textScale();
  for (const [t, base] of tracked) t.setFontSize(Math.round(base * k));
}
