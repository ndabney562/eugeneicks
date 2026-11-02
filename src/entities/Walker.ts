import Phaser from 'phaser';
import { DISPLAY } from '../config/display';
import { damp } from '../core/math';
import { settings } from '../core/settings';
import { advanceStride, footOffsets } from '../core/walk';

type Host = Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

export interface WalkerOptions {
  /** Shoe colour (DISPLAY.walk.shoes when left out). */
  shoes?: number;
  /** Hips behind the sprite's centre, px at 96 px (DISPLAY.walk.hips for doctors; 0 for round bodies). */
  hips?: number;
}

/**
 * Two shoes that step out from under a character and a bob on each step. It watches how far the host moved each
 * frame (after physics), so it works the same for Eugene, the Pals and patients, whatever moves them.
 * Visual only: the host's body, aim and turning don't change.
 */
export class Walker {
  private readonly feet: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  private readonly size: number;
  private readonly hips: number;
  private phase = 0;
  private moving = 0;
  private lastX: number;
  private lastY: number;
  private wasShown: boolean;

  constructor(private readonly scene: Phaser.Scene, private readonly host: Host, opts: WalkerOptions = {}) {
    const cfg = DISPLAY.walk;
    this.size = host.width / 96;
    this.hips = (opts.hips ?? cfg.hips) * this.size;
    const make = () => scene.add.image(host.x, host.y, 'shoe').setTint(opts.shoes ?? cfg.shoes).setScale(this.size);
    this.feet = [make(), make()];
    this.lastX = host.x;
    this.lastY = host.y;
    this.wasShown = false;
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    host.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  private get shown(): boolean {
    return this.host.visible && this.host.active;
  }

  /** Changes the shoe colour (pooled patients come back as someone else). */
  setShoes(color = DISPLAY.walk.shoes): void {
    for (const f of this.feet) f.setTint(color);
  }

  /** Feet together, no bob, and the next move from here isn't a step (a patient back from the pool). */
  reset(): void {
    this.moving = 0;
    this.lastX = this.host.x;
    this.lastY = this.host.y;
  }

  private update(_time: number, delta: number): void {
    const { host } = this;
    const cfg = DISPLAY.walk;
    const shown = this.shown;
    for (const f of this.feet) f.setVisible(shown);
    if (!shown) {
      this.wasShown = false;
      return;
    }
    if (!this.wasShown) {
      this.wasShown = true;
      this.reset();
    }

    let moved = Math.hypot(host.x - this.lastX, host.y - this.lastY);
    this.lastX = host.x;
    this.lastY = host.y;
    if (moved > cfg.teleport) moved = 0;
    const walking = moved > cfg.still * (delta / (1000 / 60));
    this.moving += ((walking ? 1 : 0) - this.moving) * damp(cfg.ease, delta);
    if (this.moving < 0.01) this.moving = 0;
    if (walking) this.phase = advanceStride(this.phase, moved, this.size);

    const f = footOffsets(this.phase, this.moving, this.size, settings.reducedMotion);
    // Leave the scale alone while a tween owns it (Sinus Purge puff, collapse)
    const tweening = this.scene.tweens.isTweening(host);
    if (!tweening && (this.moving > 0 || host.scaleX !== host.scaleY)) host.setScale(1 + f.bob, 1 - f.bob);

    const cos = Math.cos(host.rotation), sin = Math.sin(host.rotation);
    const depth = host.depth - 0.05;
    const scale = this.size * (host.scaleX + host.scaleY) / 2;
    ([f.left, f.right] as const).forEach((o, i) => {
      const fwd = (this.hips + o.forward) * scale / this.size;
      const side = o.side * scale / this.size;
      this.feet[i].setPosition(host.x + fwd * cos - side * sin, host.y + fwd * sin + side * cos)
        .setRotation(host.rotation).setDepth(depth).setScale(scale).setAlpha(host.alpha);
    });
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.update, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.host.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    for (const f of this.feet) f.destroy();
  }
}
