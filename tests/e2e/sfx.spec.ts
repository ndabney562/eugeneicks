import { test, expect, boot, active, tapObject } from '../helpers/game';

const RECORDED = ['spray', 'hit', 'pop', 'splat', 'crit', 'sneezeWindup', 'sneeze', 'boss', 'purge'];

/** Logs every buffer the game starts and every ramp of a gain, so a test can tell a recording from the synth. */
async function listenToAudio(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__started = [];
    w.__ramps = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: any[]) {
      w.__started.push(this.buffer);
      return start.apply(this, args as any);
    };
    const ramp = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (value: number, ...rest: any[]) {
      w.__ramps.push(value);
      return ramp.call(this, value, ...(rest as [number, number]));
    };
  });
}

const recordingsLoaded = (page: import('@playwright/test').Page) => page.evaluate((names) =>
  names.every((n) => window.game.cache.audio.get(`sfx-${n}`) instanceof AudioBuffer), RECORDED);

/** True once the spray recording (not a synth noise burst) has started since `since`. */
const sprayRecordingPlayed = (page: import('@playwright/test').Page, since: number) => page.evaluate((from) => {
  const spray = window.game.cache.audio.get('sfx-spray');
  return (window as any).__started.slice(from).includes(spray);
}, since);

test('the title loads every recording, and spraying plays it before and after mute and unmute', async ({ page }) => {
  await listenToAudio(page);
  await boot(page);
  await expect.poll(() => recordingsLoaded(page)).toBe(true);
  await tapObject(page, 'Title', 'tap');
  await active(page, 'Hud');
  await page.keyboard.down('Space');
  await expect.poll(() => sprayRecordingPlayed(page, 0)).toBe(true);
  await page.keyboard.up('Space');

  await tapObject(page, 'Hud', 'pauseButton');
  await page.waitForFunction(() => window.game.scene.isPaused('Game'));
  await tapObject(page, 'Hud', 'soundToggle');
  expect(await page.evaluate(() => (window as any).__ramps.at(-1))).toBe(0);
  await tapObject(page, 'Hud', 'soundToggle');
  expect(await page.evaluate(() => (window as any).__ramps.at(-1))).toBe(0.5);
  await tapObject(page, 'Hud', 'resumeItem');

  const before = await page.evaluate(() => (window as any).__started.length);
  await page.keyboard.down('Space');
  await expect.poll(() => sprayRecordingPlayed(page, before)).toBe(true);
  await page.keyboard.up('Space');
});

test('a quick tap on Start still gets the recordings during the shift', async ({ page }) => {
  await listenToAudio(page);
  await page.route('**/assets/sfx/**', async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.continue().catch(() => undefined);
  });
  await boot(page);
  await tapObject(page, 'Title', 'tap');
  await active(page, 'Hud');
  await expect.poll(() => recordingsLoaded(page), { timeout: 15_000 }).toBe(true);
  await page.keyboard.down('Space');
  await expect.poll(() => sprayRecordingPlayed(page, 0)).toBe(true);
  await page.keyboard.up('Space');
});
