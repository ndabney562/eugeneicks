import Phaser from 'phaser';
import { DISPLAY } from '../config/display';
import { settings } from '../core/settings';
import { hangBelow, hudCover, onScreen, type Box } from '../core/clearance';

const PAD = 10;
const TAIL = 14;

/**
 * A comic speech bubble in the game world that follows whoever is talking.
 * It hangs under the speaker instead (tail up) while the HUD covers the spot above them.
 */
export class SpeechBubble extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private target?: { x: number; y: number };
  private offsetY = 0;
  private hideAt = 0;
  /** Size of the bubble body last drawn (tail included in the height). */
  private boxW = 0;
  private boxH = 0;
  private below = false;
  private readonly spot: Box = { x: 0, y: 0, w: 0, h: 0 };
  private readonly aboveOnScreen: Box = { x: 0, y: 0, w: 0, h: 0 };
  private readonly belowOnScreen: Box = { x: 0, y: 0, w: 0, h: 0 };

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.bg = scene.add.graphics();
    this.label = scene.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#3a1030',
      align: 'center', wordWrap: { width: 260 }, lineSpacing: 3,
    }).setOrigin(0.5, 1);
    this.add([this.bg, this.label]);
    this.setDepth(30).setVisible(false);
    scene.add.existing(this);
  }

  /** Shows `text` above `target` for `ms`, replacing whatever was said before. */
  say(text: string, target: { x: number; y: number }, offsetY: number, ms: number): void {
    this.target = target;
    this.offsetY = offsetY;
    this.hideAt = this.scene.time.now + ms;
    this.label.setText(text);
    this.boxW = this.label.width + PAD * 2;
    this.boxH = this.label.height + PAD * 2 + TAIL;
    this.below = false;
    this.draw();
    this.scene.tweens.killTweensOf(this);
    this.setVisible(true).setScale(settings.reducedMotion ? 1 : 0.92);
    if (!settings.reducedMotion) this.scene.tweens.add({ targets: this, scale: 1, duration: 140, ease: 'Cubic.out' });
    this.follow();
  }

  get text(): string {
    return this.visible ? this.label.text : '';
  }

  /** Where the bubble is in the world, or undefined while it's hidden. */
  get box(): Box | undefined {
    if (!this.visible) return undefined;
    const h = this.boxH * this.scaleY;
    return { x: this.x - (this.boxW / 2) * this.scaleX, y: this.below ? this.y : this.y - h, w: this.boxW * this.scaleX, h };
  }

  /** Call every frame. */
  follow(): void {
    if (!this.visible || !this.target) return;
    if (this.scene.time.now >= this.hideAt) {
      this.setVisible(false);
      return;
    }
    const { x, y } = this.target;
    const below = this.hangsBelow(x, y);
    if (below !== this.below) {
      this.below = below;
      this.draw();
    }
    this.setPosition(x, below ? y + this.offsetY : y - this.offsetY);
  }

  /** True while the HUD covers the spot above the speaker and the spot below is clear. */
  private hangsBelow(x: number, y: number): boolean {
    if (!hudCover.boxes.length) return false;
    const cam = this.scene.cameras.main;
    const s = this.spot;
    s.x = x - this.boxW / 2;
    s.w = this.boxW;
    s.h = this.boxH;
    s.y = y - this.offsetY - this.boxH;
    onScreen(s, cam, this.aboveOnScreen);
    s.y = y + this.offsetY;
    onScreen(s, cam, this.belowOnScreen);
    return hangBelow(this.aboveOnScreen, this.belowOnScreen, hudCover.boxes,
      hudCover.width || cam.width, hudCover.height || cam.height, DISPLAY.signFade.padding);
  }

  /** The body over a downward tail, or (hanging below) under an upward one. */
  private draw(): void {
    const w = this.boxW, h = this.boxH - TAIL;
    const up = this.below ? -1 : 1;
    const top = this.below ? TAIL : -TAIL - h;
    this.label.setOrigin(0.5, this.below ? 0 : 1).setPosition(0, this.below ? TAIL + PAD : -TAIL - PAD);
    this.bg.clear()
      .fillStyle(0xfff6e8).fillRoundedRect(-w / 2, top, w, h, 12)
      .lineStyle(3, 0x3a1030).strokeRoundedRect(-w / 2, top, w, h, 12)
      .fillStyle(0xfff6e8).fillTriangle(-10, -(TAIL + 1) * up, 10, -(TAIL + 1) * up, 0, 0)
      .lineStyle(3, 0x3a1030).lineBetween(-10, -TAIL * up, 0, 0).lineBetween(10, -TAIL * up, 0, 0);
  }
}
