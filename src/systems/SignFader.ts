import Phaser from 'phaser';
import { DISPLAY } from '../config/display';
import { covered, hudCover, onScreen, type Box } from '../core/clearance';

type Sign = Phaser.GameObjects.Text;

/**
 * Fades world signs that sit under the HUD (or run off the screen) and brings them back once they're clear.
 * Signs are tracked once, when they're drawn; destroyed ones drop out on their own.
 */
export class SignFader {
  private readonly signs: { obj: Sign; base: number; level: number }[] = [];
  private readonly bounds = new Phaser.Geom.Rectangle();
  private readonly world: Box = { x: 0, y: 0, w: 0, h: 0 };
  private readonly box: Box = { x: 0, y: 0, w: 0, h: 0 };

  constructor(private readonly scene: Phaser.Scene) {}

  /** Starts watching `obj` at its current opacity. Returns it, for chaining. */
  track<T extends Sign>(obj: T): T {
    this.signs.push({ obj, base: obj.alpha, level: 1 });
    return obj;
  }

  /** Call every frame, after the camera has moved. */
  update(delta: number): void {
    const cam = this.scene.cameras.main;
    const { alpha, padding, ms } = DISPLAY.signFade;
    const step = delta / ms;
    const width = hudCover.width || cam.width;
    const height = hudCover.height || cam.height;
    let gone = 0;
    for (const s of this.signs) {
      if (!s.obj.scene) { gone++; continue; } // an opened door, a lifted fog
      // Hidden on another floor, or fading out with a lifted fog: leave it alone
      if (!s.obj.visible || this.scene.tweens.isTweening(s.obj)) continue;
      const b = s.obj.getBounds(this.bounds);
      this.world.x = b.x; this.world.y = b.y; this.world.w = b.width; this.world.h = b.height;
      onScreen(this.world, cam, this.box);
      const target = covered(this.box, hudCover.boxes, width, height, padding) ? alpha : 1;
      if (s.level === target) continue;
      s.level = target < s.level ? Math.max(target, s.level - step) : Math.min(target, s.level + step);
      s.obj.setAlpha(s.base * s.level);
    }
    if (gone > 0) {
      for (let i = this.signs.length - 1; i >= 0; i--) if (!this.signs[i].obj.scene) this.signs.splice(i, 1);
    }
  }
}
