import { test, expect, active, tapObject } from '../helpers/game';

/** Runs the game as the iPhone app does: `?native` with a message handler that records what the game posts. */
async function bootAsApp(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.__native = [];
    (window as any).webkit = { messageHandlers: { eugeneicks: { postMessage: (message: unknown) => window.__native.push(message) } } };
  });
  await page.goto('./?native&god&seed=123');
  await page.waitForFunction(() => window.__native.some((m) => m.type === 'ready'));
}
const posted = (page: import('@playwright/test').Page, type: string) => page.evaluate((t) => window.__native.filter((m) => m.type === t).length, type);
/** Presses a menu's BACK pill (Providers keeps its inside a container). */
const back = (page: import('@playwright/test').Page, scene: string) =>
  page.evaluate((key) => {
    const all = (objects: any[]): any[] => objects.flatMap((o) => [o, ...(o.list ? all(o.list) : [])]);
    all(window.game.scene.getScene(key).children.list).find((c: any) => c.text === 'BACK').emit('pointerup');
  }, scene);

test('native host boots to the web title with a snapshot, validates settings, and hears exits and shifts', async ({ page }) => {
  await bootAsApp(page);
  await active(page, 'Title');
  const snapshot = await page.evaluate(() => window.__native.find((m) => m.type === 'snapshot'));
  expect(snapshot.pals).toHaveLength(12);
  expect(snapshot.achievements.length).toBeGreaterThan(20);
  expect(snapshot.art).toBeUndefined();
  await page.evaluate(() => window.eugeneicksNative.setSettings({ difficulty: 'walkIn', sound: 'invalid', character: 'missing' }));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eugeneicks.settings.v1')!))).toMatchObject({ difficulty: 'walkIn', sound: true, character: 'eugene' });
  expect(await page.evaluate(() => Object.keys(window.eugeneicksNative).sort())).toEqual(['applyCloud', 'refresh', 'setSettings']);

  await tapObject(page, 'Title', 'boardButton');
  await active(page, 'Board');
  await back(page, 'Board');
  await active(page, 'Title');
  await page.waitForFunction(() => window.__native.filter((m) => m.type === 'ready').length === 2);
  expect(await posted(page, 'exit')).toBe(1);
  expect(await posted(page, 'snapshot')).toBe(3);

  await tapObject(page, 'Title', 'tap');
  await active(page, 'Hud');
  await page.waitForFunction(() => window.__native.some((m) => m.type === 'playing'));
  expect(await page.evaluate(() => window.game.scene.getScene('Game').shift.difficulty)).toBe('walkIn');
});

test('iCloud: another device\'s saves merge on the title, and wait for it during a shift', async ({ page }) => {
  await bootAsApp(page);
  await active(page, 'Title');
  const lastCloud = () => page.evaluate(() => window.__native.filter((m) => m.type === 'cloudSave').at(-1));
  expect(await lastCloud()).toMatchObject({ gen: 0, save: { v: 1, achievements: [] } });
  const theirs = (credits: number, earned: number) => ({
    v: 1, at: Date.now() + 60_000, save: null, achievements: [],
    progress: { credits, earned, nps: 0, npsEarned: 0, owned: [], specialty: '', startTool: '', kills: { basic: 7 }, bank: 0, locker: {}, staff: {} },
  });

  // On the title: merged at once, the title redraws (one more ready) and the copy comes back numbered 1
  const readies = await posted(page, 'ready');
  await page.evaluate((copy) => window.eugeneicksNative.applyCloud(copy, 1), theirs(40, 90));
  await page.waitForFunction((n) => window.__native.filter((m) => m.type === 'ready').length === n + 1, readies);
  expect(await lastCloud()).toMatchObject({ gen: 1, save: { progress: { credits: 40, earned: 90, kills: { basic: 7 } } } });
  expect(await page.evaluate(() => window.game.scene.getScene('Title').children.list.some((c: any) => /\b40\b/.test(c.text ?? '')))).toBe(true);

  // The same copy again changes nothing: no redraw
  await page.evaluate((copy) => window.eugeneicksNative.applyCloud(copy, 2), theirs(40, 90));
  expect(await lastCloud()).toMatchObject({ gen: 2 });
  expect(await posted(page, 'ready')).toBe(readies + 1);

  // During a shift it waits, and posts from the shift keep the old number
  await tapObject(page, 'Title', 'tap');
  await active(page, 'Hud');
  await page.evaluate((copy) => window.eugeneicksNative.applyCloud(copy, 3), theirs(70, 200));
  await page.evaluate(() => window.eugeneicksNative.refresh());
  expect(await lastCloud()).toMatchObject({ gen: 2, save: { progress: { earned: 90 } } });
  await page.evaluate(() => window.game.scene.getScene('Game').endRun());
  await active(page, 'GameOver');
  await page.evaluate(() => { window.game.scene.getScene('GameOver').scene.start('Title'); });
  await active(page, 'Title');
  await expect.poll(lastCloud).toMatchObject({ gen: 3, save: { progress: { earned: 200 } } });

  // A copy from a newer app is ignored
  await page.evaluate(() => window.eugeneicksNative.applyCloud({ v: 2 }, 4));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eugeneicks.progress.v1')!).earned)).toBe(200);
});

test('every title-screen feature is reachable in the app', async ({ page }) => {
  await bootAsApp(page);
  await active(page, 'Title');
  // Every pill of the title screen is there and interactive
  const buttons = ['tap', 'dailyButton', 'difficultyButton', 'modeButton', 'providersButton', 'lockerButton', 'boardButton', 'atlasButton', 'leaderboardButton', 'topHeader.settingsButton'];
  const state = await page.evaluate((names) => {
    const title = window.game.scene.getScene('Title');
    return names.map((n) => { const o = n.split('.').reduce((a: any, k) => a[k], title); return [n, !!o?.visible, !!o?.input?.enabled]; });
  }, buttons);
  expect(state).toEqual(buttons.map((n) => [n, true, true]));

  // The shared menus open and BACK returns to the title
  for (const [button, scene] of [['providersButton', 'Providers'], ['lockerButton', 'Locker'], ['boardButton', 'Board'], ['atlasButton', 'Board']] as const) {
    await tapObject(page, 'Title', button);
    await active(page, scene);
    await back(page, scene);
    await active(page, 'Title');
  }
  expect(await posted(page, 'exit')).toBe(4);

  // Today's Shift opens its panel; BACK closes it
  await tapObject(page, 'Title', 'dailyButton');
  expect(await page.evaluate(() => window.game.scene.getScene('Title').dailyPanel.visible)).toBe(true);
  await page.evaluate(() => window.game.scene.getScene('Title').panelButtons[1].bg.emit('pointerup'));
  expect(await page.evaluate(() => window.game.scene.getScene('Title').dailyPanel.visible)).toBe(false);

  // Difficulty and mode cycle and save
  await tapObject(page, 'Title', 'difficultyButton');
  await tapObject(page, 'Title', 'modeButton');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eugeneicks.settings.v1')!))).toMatchObject({ difficulty: 'trauma', mode: 'fluSeason' });

  // The gear and the leaderboard are the app's: the game asks for its sheets and stays on the title
  await tapObject(page, 'Title', 'topHeader.settingsButton');
  expect(await posted(page, 'openSettings')).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('eugeneicks.settings.v1')!).sound)).toBe(true);
  await tapObject(page, 'Title', 'leaderboardButton');
  expect(await posted(page, 'openGameCenter')).toBe(1);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.game.scene.isActive('Title') && !window.game.scene.isActive('Leaderboard'))).toBe(true);
});

test('@smoke a shared native-query link without the app host stays playable', async ({ page }) => {
  await page.goto('./?native&god&seed=123');
  await active(page, 'Title');
  expect(await page.evaluate(() => typeof window.eugeneicksNative)).toBe('undefined');
  await tapObject(page, 'Title', 'tap');
  await active(page, 'Hud');
});

test('the same bundle runs from a root index.html URL used by the native scheme', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await page.goto(`${origin}/index.html?god&seed=123`);
  await active(page, 'Title');
  await tapObject(page, 'Title', 'tap');
  await active(page, 'Hud');
});
