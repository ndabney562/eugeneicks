import { DISPLAY } from '../config/display';

/** One foot's offset from the body's centre: `forward` along the way the character faces, `side` to its right. */
export interface FootOffset {
  forward: number;
  side: number;
}

export interface Feet {
  left: FootOffset;
  right: FootOffset;
  /** Squash (+) or stretch (-) for the body: scale it by (1 + bob, 1 - bob). */
  bob: number;
}

/**
 * Where both feet sit at stride `phase` (radians; a full turn is one stride). `moving` (0..1) eases the steps in
 * and lets the feet settle side by side when the character stops. `size` is the character's size against the
 * 96 px doctors. The bob squashes on each footfall and stretches between steps, and is 0 with Reduce Motion.
 */
export function footOffsets(phase: number, moving: number, size: number, reducedMotion: boolean, cfg = DISPLAY.walk): Feet {
  const step = Math.sin(phase) * cfg.reach * size * moving;
  return {
    left: { forward: step, side: -cfg.spacing * size },
    right: { forward: -step, side: cfg.spacing * size },
    bob: reducedMotion ? 0 : -Math.cos(2 * phase) * cfg.bob * moving,
  };
}

/** The stride phase after moving `distance` px: smaller characters take shorter strides, so more steps. */
export function advanceStride(phase: number, distance: number, size: number, cfg = DISPLAY.walk): number {
  return phase + (distance / (cfg.stride * size)) * 2 * Math.PI;
}
