/**
 * Keeps text from landing on other text. No Phaser in here, so it's unit-testable.
 * The HUD writes `hudCover` every frame; the game reads it to fade world signs that end up underneath.
 */

/** A rectangle: screen pixels for the HUD, world pixels in the game. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** As much of a Phaser camera as `onScreen` needs. */
export interface View {
  worldView: { x: number; y: number };
  zoom: number;
  x: number;
  y: number;
}

/** Where the HUD is drawing this frame, in HUD (screen) pixels, and the screen size. */
export const hudCover: { boxes: Box[]; width: number; height: number } = { boxes: [], width: 0, height: 0 };

/** True when `a` and `b` overlap or come within `pad` px of each other. */
export function overlaps(a: Box, b: Box, pad = 0): boolean {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** True when `box` runs off a `width` x `height` screen or comes within `pad` px of anything in `cover`. */
export function covered(box: Box, cover: readonly Box[], width: number, height: number, pad: number): boolean {
  if (box.x < 0 || box.y < 0 || box.x + box.w > width || box.y + box.h > height) return true;
  return cover.some((c) => overlaps(box, c, pad));
}

/** The first of `spots` that stays clear of `avoid`, or the first spot when none does. */
export function firstClear<T extends Box>(spots: readonly T[], avoid?: Box): T {
  return (avoid && spots.find((s) => !overlaps(s, avoid))) || spots[0];
}

/** `world` (a box in world pixels) as seen through `cam`, in screen pixels, written into `out`. */
export function onScreen(world: Box, cam: View, out: Box): Box {
  out.x = (world.x - cam.worldView.x) * cam.zoom + cam.x;
  out.y = (world.y - cam.worldView.y) * cam.zoom + cam.y;
  out.w = world.w * cam.zoom;
  out.h = world.h * cam.zoom;
  return out;
}

/** Whether a speech bubble should hang under its speaker: only when the HUD covers the spot above and the spot below is clear. */
export function hangBelow(above: Box, below: Box, cover: readonly Box[], width: number, height: number, pad: number): boolean {
  return covered(above, cover, width, height, pad) && !covered(below, cover, width, height, pad);
}
