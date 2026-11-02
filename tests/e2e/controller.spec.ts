import type { Page } from '@playwright/test';
import { test, expect, active, boot } from '../helpers/game';

/** A fake controller: tests set window.__pad.axes / window.__pad.down (standard-mapping button indexes). */
async function plugIn(page: Page) {
  await page.addInitScript(() => {
    const state = { axes: [0, 0, 0, 0], down: [] as number[] };
    (window as any).__pad = state;
    navigator.getGamepads = () => [{
      id: 'Test pad', index: 0, connected: true, mapping: 'standard', timestamp: 0, vibrationActuator: null,
      axes: state.axes,
      buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: state.down.includes(i), touched: false, value: state.down.includes(i) ? 1 : 0 })),
    } as unknown as Gamepad];
  });
}
/** Holds buttons for a few frames, then lets go. */
async function press(page: Page, ...buttons: number[]) {
  await page.evaluate((b) => { (window as any).__pad.down = b; }, buttons);
  await page.waitForTimeout(150);
  await page.evaluate(() => { (window as any).__pad.down = []; });
  await page.waitForTimeout(100);
}

test('a controller starts a shift, moves, aims and sprays, and pauses', async ({ page }) => {
  await plugIn(page);
  await boot(page);
  await press(page, 0); // A
  await active(page, 'Hud');
  await page.waitForTimeout(500);

  const start = await page.evaluate(() => { const p = window.game.scene.getScene('Game').player; return { x: p.x, y: p.y }; });
  await page.evaluate(() => { (window as any).__pad.axes = [1, 0, 0, 0]; });
  await expect.poll(() => page.evaluate(() => window.game.scene.getScene('Game').player.x)).toBeGreaterThan(start.x + 20);

  // Right stick down: aims down and sprays
  await page.evaluate(() => { (window as any).__pad.axes = [0, 0, 0, 1]; });
  await expect.poll(() => page.evaluate(() => window.game.scene.getScene('Game').stats().droplets)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => Math.abs(window.game.scene.getScene('Game').player.rotation - Math.PI / 2))).toBeLessThan(0.3);
  await page.evaluate(() => { (window as any).__pad.axes = [0, 0, 0, 0]; });

  await press(page, 9); // Start
  await page.waitForFunction(() => window.game.scene.isPaused('Game'));
  await press(page, 9);
  await page.waitForFunction(() => !window.game.scene.isPaused('Game'));
});

test('X refills and B fires the provider move', async ({ page }) => {
  await plugIn(page);
  await boot(page);
  await press(page, 0);
  await active(page, 'Hud');
  await page.waitForTimeout(500);
  // Spray some out so there's something to refill
  await page.evaluate(() => { (window as any).__pad.down = [7]; });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { (window as any).__pad.down = []; });
  await press(page, 2); // X
  await expect.poll(() => page.evaluate(() => window.game.scene.getScene('Game').hintState().refilling)).toBe(true);
  await page.waitForFunction(() => window.game.scene.getScene('Game').hintState().purgeReady, null, { timeout: 30000 });
  await press(page, 1); // B
  await expect.poll(() => page.evaluate(() => window.game.scene.getScene('Game').hintState().purgeReady)).toBe(false);
});
