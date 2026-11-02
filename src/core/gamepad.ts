import type Phaser from 'phaser';
import { CONTROLS } from '../config/controls';

/**
 * Game controllers (Xbox, PlayStation, MFi) through the browser's Gamepad API, standard mapping:
 * left stick or d-pad moves, right stick aims and sprays, RT or A sprays (auto-aim), X refills,
 * B is the provider's move, Y the second ability, LB swaps tools, RB uses, Start pauses.
 */
export const PAD = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, select: 8, start: 9, up: 12, down: 13, left: 14, right: 15 } as const;
export type PadButton = keyof typeof PAD;

export interface PadState {
  moveX: number;
  moveY: number;
  /** Right stick, length 0..1 with the dead zone removed. */
  aimX: number;
  aimY: number;
  /** RT or A held. */
  spray: boolean;
  /** Buttons that went down since the last read. */
  pressed: Set<PadButton>;
}

/** Stick value with the dead zone removed, rescaled so it starts at 0 and still reaches 1. */
function stick(x: number, y: number, deadZone: number): [number, number] {
  const len = Math.hypot(x, y);
  if (len <= deadZone) return [0, 0];
  const k = Math.min(1, (len - deadZone) / (1 - deadZone)) / len;
  return [x * k, y * k];
}

/** Reads the first connected controller once a frame and remembers which buttons were down, for presses. */
export class PadReader {
  private down = new Set<PadButton>();

  /** The first connected controller, or null (no controller, or no Gamepad API). */
  private pad(): Gamepad | null {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  read(): PadState | null {
    const p = this.pad();
    if (!p) {
      this.down.clear();
      return null;
    }
    const { deadZone, triggerThreshold } = CONTROLS.gamepad;
    const held = (b: PadButton) => {
      const btn = p.buttons[PAD[b]];
      return !!btn && (btn.pressed || btn.value > triggerThreshold);
    };
    const pressed = new Set<PadButton>();
    const now = new Set<PadButton>();
    for (const b of Object.keys(PAD) as PadButton[]) {
      if (!held(b)) continue;
      now.add(b);
      if (!this.down.has(b)) pressed.add(b);
    }
    this.down = now;

    let [moveX, moveY] = stick(p.axes[0] ?? 0, p.axes[1] ?? 0, deadZone);
    if (!moveX && !moveY) {
      moveX = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
      moveY = (held('down') ? 1 : 0) - (held('up') ? 1 : 0);
      const len = Math.hypot(moveX, moveY);
      if (len > 1) { moveX /= len; moveY /= len; }
    }
    const [aimX, aimY] = stick(p.axes[2] ?? 0, p.axes[3] ?? 0, deadZone);
    return { moveX, moveY, aimX, aimY, spray: held('rt') || held('a'), pressed };
  }
}

/** Calls `fn` once, the first time `button` goes down on a controller while `scene` runs (a held button doesn't count). */
export function oncePadPress(scene: Phaser.Scene, button: PadButton, fn: () => void): void {
  const reader = new PadReader();
  reader.read();
  const poll = () => {
    if (!reader.read()?.pressed.has(button)) return;
    scene.events.off('update', poll);
    fn();
  };
  scene.events.on('update', poll);
  scene.events.once('shutdown', () => scene.events.off('update', poll));
}
