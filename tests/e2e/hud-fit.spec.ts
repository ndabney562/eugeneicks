import { test, expect, start } from '../helpers/game';

/** Screens in landscape, in points. iPads (11", and every 4:3 iPad back to the 9.7"; 13") lay the game out at 4:3. */
const SCREENS = [
  { name: 'iPhone 16 Pro', width: 852, height: 393, aspect: 852 / 393 },
  { name: '11-inch iPad', width: 1024, height: 768, aspect: 4 / 3 },
  { name: '13-inch iPad', width: 1376, height: 1032, aspect: 4 / 3 },
  { name: 'iPad mini', width: 1133, height: 744, aspect: 1133 / 744 },
];

for (const screen of SCREENS) {
  test(`the HUD fits the ${screen.name}: every control on screen, none on top of another`, async ({ page }) => {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await start(page);
    await page.waitForTimeout(300);
    const geometry = await page.evaluate(() => {
      const hud = window.game.scene.getScene('Hud');
      const names = ['health', 'roundText', 'roomText', 'shiftText', 'pauseButton', 'refillButton', 'bottle', 'toolText',
        'swapButton', 'purgeButton', 'secondButton', 'sprayButton'];
      const bounds = names.filter((name) => hud[name].visible).map((name) => {
        const b = hud[name].getBounds();
        return { name, x: b.x, y: b.y, width: b.width, height: b.height };
      });
      const stick = hud.moveStick.box;
      bounds.push({ name: 'moveStick', x: stick.x, y: stick.y, width: stick.w, height: stick.h });
      return { bounds, w: hud.scale.width, h: hud.scale.height };
    });
    expect(geometry.w / geometry.h).toBeCloseTo(screen.aspect, 2);
    for (const b of geometry.bounds) {
      expect(b.x, b.name).toBeGreaterThanOrEqual(0);
      expect(b.y, b.name).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, b.name).toBeLessThanOrEqual(geometry.w);
      expect(b.y + b.height, b.name).toBeLessThanOrEqual(geometry.h);
    }
    const overlaps: string[] = [];
    for (const [i, a] of geometry.bounds.entries()) {
      for (const b of geometry.bounds.slice(i + 1)) {
        if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) overlaps.push(`${a.name} × ${b.name}`);
      }
    }
    expect(overlaps).toEqual([]);
  });
}

for (const screen of SCREENS) {
  test(`Locker cards on the ${screen.name}: name, stars, next upgrade and button don't overlap`, async ({ page }) => {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.goto('./?god&seed=123');
    await page.waitForFunction(() => window.game?.scene.isActive('Title'));
    await page.evaluate(() => window.game.scene.getScene('Title').scene.start('Locker'));
    await page.waitForFunction(() => window.game?.scene.isActive('Locker'));
    await page.waitForTimeout(300);
    const overlaps = await page.evaluate(() => {
      const s = window.game.scene.getScene('Locker');
      // Every readable text in the card grid (the inspector panel and header sit elsewhere)
      const texts = s.body.list.filter((o: any) => o.type === 'Text' && o.alpha > 0.05 && o.text && o.y > 120)
        .map((o: any) => { const b = o.getBounds(); return { t: o.text.slice(0, 24), x: b.x, y: b.y, r: b.right, b: b.bottom }; });
      const hits: string[] = [];
      for (const [i, a] of texts.entries()) for (const b of texts.slice(i + 1)) {
        if (a.x < b.r - 1 && a.r > b.x + 1 && a.y < b.b - 1 && a.b > b.y + 1) hits.push(`${a.t} × ${b.t}`);
      }
      return hits;
    });
    expect(overlaps).toEqual([]);
  });
}
