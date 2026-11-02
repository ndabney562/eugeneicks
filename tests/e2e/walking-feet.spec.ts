import { test, expect, start } from '../helpers/game';

/** Eugene's two shoes: the 'shoe' images nearest him. */
async function eugeneFeet(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const scene = window.game.scene.getScene('Game');
    const p = scene.player;
    return scene.children.list
      .filter((c: any) => c.texture?.key === 'shoe' && c.visible)
      .map((c: any) => ({ x: c.x - p.x, y: c.y - p.y, d: Math.hypot(c.x - p.x, c.y - p.y), depth: c.depth }))
      .sort((a: any, b: any) => a.d - b.d)
      .slice(0, 2)
      .map((f: any) => ({ ...f, playerDepth: p.depth }));
  });
}

test('Eugene steps with alternating feet while walking, and they settle side by side when he stops', async ({ page }) => {
  await start(page);
  const still = await eugeneFeet(page);
  expect(still).toHaveLength(2);
  expect(still[0].depth).toBeLessThan(still[0].playerDepth);

  // Facing right while walking right: one foot ahead of the other along x at some point in the stride
  await page.keyboard.down('ArrowRight');
  let widest = 0;
  for (let i = 0; i < 20 && widest < 20; i++) {
    await page.waitForTimeout(50);
    const [a, b] = await eugeneFeet(page);
    widest = Math.max(widest, Math.abs(a.x - b.x));
  }
  await page.keyboard.up('ArrowRight');
  expect(widest).toBeGreaterThan(20);

  await expect.poll(async () => {
    const [a, b] = await eugeneFeet(page);
    return Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) > 10;
  }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.game.scene.getScene('Game').player.scaleX)).toBe(1);
});
