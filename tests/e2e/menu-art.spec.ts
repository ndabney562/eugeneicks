import { test, expect } from '../helpers/game';

// The title starts loading the menu art in the background. A tap on a menu before it arrives (slow phone, slow
// network) used to queue the same art a second time, and the second copy failed with "Texture key already in use".
// The fixture fails the test on any console error.
test('opening the Locker while the menu art is still loading loads it once, without errors', async ({ page }) => {
  const requests: string[] = [];
  await page.route('**/assets/menu-*.jpg', async (route) => {
    requests.push(new URL(route.request().url()).pathname);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto('./?god&seed=123');
  await page.waitForFunction(() => window.game?.scene.isActive('Title'));
  await page.evaluate(() => window.game.scene.getScene('Title').scene.start('Locker'));
  await page.waitForFunction(() => window.game?.scene.isActive('Locker'));
  await page.waitForFunction(() => window.game.textures.exists('menu-sprites') && window.game.textures.exists('menu-bgs'));
  // Let any second copy finish, so an error from it would show up
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.game.textures.get('menu-bgs').has('bg-locker'))).toBe(true);
  expect(await page.evaluate(() => window.game.textures.getTextureKeys().filter((k: string) => k.startsWith('menu-')).sort()))
    .toEqual(['menu-bgs', 'menu-sprites']);
  expect(requests.length).toBeGreaterThanOrEqual(2);
});
