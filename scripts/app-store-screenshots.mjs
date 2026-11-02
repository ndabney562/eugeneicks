/**
 * App Store screenshots: six landscape scenes at both required iPhone sizes and the 13" iPad size, drawn by
 * WebKit (the engine the app runs on) with that device's safe-area insets, so the HUD sits where it does on a device.
 *
 *   npm run build && node scripts/app-store-screenshots.mjs [scene ...]
 *
 * JPEGs land in output/app-store/<size>/ (git-ignored). Noah picks which go to App Store Connect.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { webkit } from '@playwright/test';
import { serveWeb } from './serve-web.mjs';

/** Points × scale = the pixel sizes App Store Connect asks for (docs/APP-STORE.md). Insets are the devices' landscape safe areas. */
const SIZES = [
  { name: '6.9in-2868x1320', width: 956, height: 440, scale: 3, insets: { left: 62, right: 62, bottom: 20 } },
  { name: '6.5in-2688x1242', width: 896, height: 414, scale: 3, insets: { left: 44, right: 44, bottom: 21 } },
  { name: '13in-ipad-2752x2064', width: 1376, height: 1032, scale: 2, insets: { left: 0, right: 0, bottom: 20 } },
];

const port = Number(process.env.SHOTS_PORT ?? 4183);
const server = await serveWeb({ port });
const base = `http://localhost:${port}/eugeneicks/`;
const only = process.argv.slice(2);

/** A returning player: every hint learned, sound on, so no tutorial bubbles cover the shots. */
const SETTINGS = { autoAim: true, sound: true, music: true, autoRefill: true, reducedMotion: false, character: 'eugene', difficulty: 'urgent', mode: 'standard',
  learned: { move: true, spray: true, pour: true, purge: true, buy: true } };

/** A player a few shifts in: some Copays banked, a few Locker upgrades, a Pal hired. */
const PROGRESS = { credits: 14, earned: 46, nps: 22, npsEarned: 61, owned: ['doctor:kaya', 'scribe:omar'], specialty: '', startTool: '',
  kills: { basic: 1840, sprinter: 412, sneezer: 166, sporePod: 58 }, bank: 1260, locker: { squirtBottle: 2, lysolFogger: 1, wipes: 1 }, staff: { omar: 1 } };

/** Every achievement already earned, so no unlock banner lands on a shot. */
const ACHIEVEMENTS = [...readFileSync('src/data/achievements.ts', 'utf8').matchAll(/id: '([^']+)'/g)].map((m) => m[1]);

const game = (page, fn, arg) => page.evaluate(fn, arg);
const settle = (page, ms) => page.waitForTimeout(ms);
const active = (page, key) => page.waitForFunction((k) => window.game?.scene.isActive(k), key, { timeout: 60000 });

/** Starts a shift as a player would (no test switches in the address, so no debug overlay), then sets the scene up. */
async function startShift(page, { round, copays }) {
  await page.goto(base);
  await active(page, 'Title');
  await game(page, () => window.game.scene.getScene('Title').begin());
  await active(page, 'Hud');
  await game(page, ([round, copays]) => {
    const sc = window.game.scene.getScene('Game');
    sc.player.invulnerableUntil = Number.MAX_SAFE_INTEGER;
    sc.copays = copays;
    sc.waves.round = round;
  }, [round, copays]);
  await settle(page, 600);
}

/** Puts `n` germs of the given kinds in a loose ring `r` px around Eugene. */
const crowd = (page, kinds, n, r) => game(page, ([kinds, n, r]) => {
  const sc = window.game.scene.getScene('Game');
  for (const g of sc.germs.getChildren()) if (g.active) g.kill();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    sc.spawnGermAt(kinds[i % kinds.length], sc.player.x + Math.cos(a) * r * (0.8 + (i % 3) * 0.2), sc.player.y + Math.sin(a) * r * 0.75, true);
  }
}, [kinds, n, r]);

/** Holds the wave director so nothing new spawns or ends the scene mid-shot. */
const holdWaves = (page) => game(page, () => {
  const w = window.game.scene.getScene('Game').waves;
  w.queue.length = 0;
  w.phase = 'intermission';
  w.nextRoundAt = Number.MAX_SAFE_INTEGER;
});

const SCENES = {
  async title(page) {
    await page.goto(base);
    await active(page, 'Title');
    await settle(page, 1500);
  },
  async spray(page) {
    await startShift(page, { round: 6, copays: 640 });
    await holdWaves(page);
    await game(page, () => {
      const sc = window.game.scene.getScene('Game');
      for (const g of sc.germs.getChildren()) if (g.active) g.kill();
      const kinds = ['basic', 'sprinter', 'basic', 'sneezer', 'basic'];
      for (let i = 0; i < 14; i++) sc.spawnGermAt(kinds[i % kinds.length], sc.player.x + 190 + (i % 4) * 60, sc.player.y - 130 + Math.floor(i / 4) * 75, true);
    });
    await page.keyboard.down('Space');
    await settle(page, 1100);
  },
  async boss(page) {
    await startShift(page, { round: 5, copays: 320 });
    await holdWaves(page);
    await game(page, () => {
      const sc = window.game.scene.getScene('Game');
      for (const g of sc.germs.getChildren()) if (g.active) g.kill();
      sc.spawnGerm('diamond', { hpMult: 1, speedMult: 1 });
      sc.boss.germ.setPosition(sc.player.x + 220, sc.player.y - 20);
      sc.spawnGermAt('basic', sc.player.x + 140, sc.player.y + 90, true);
      sc.spawnGermAt('sprinter', sc.player.x - 120, sc.player.y + 60, true);
    });
    await page.waitForFunction(() => window.game.scene.getScene('Game').boss?.bubble.text.length > 0, null, { timeout: 20000 }).catch(() => {});
    await page.keyboard.down('Space');
    await settle(page, 700);
  },
  async purge(page) {
    await startShift(page, { round: 4, copays: 180 });
    await holdWaves(page);
    await crowd(page, ['basic', 'basic', 'sprinter'], 10, 110);
    await settle(page, 400);
    await game(page, () => {
      const sc = window.game.scene.getScene('Game');
      sc.purgeReadyAt = 0;
      sc.sinusPurge(sc.time.now);
    });
    await settle(page, 180);
  },
  async locker(page) {
    await page.goto(base);
    await active(page, 'Title');
    await game(page, () => window.game.scene.getScene('Title').scene.start('Locker'));
    await active(page, 'Locker');
    await settle(page, 1500);
  },
  async gameover(page) {
    await startShift(page, { round: 9, copays: 0 });
    await game(page, () => {
      const sc = window.game.scene.getScene('Game');
      sc.score = 18450;
      sc.kills = 312;
      Object.assign(sc.runStats, {
        kills: { basic: 214, sprinter: 61, sneezer: 29, sporePod: 8 }, bestStreak: 38, copaysEarned: 2140, crits: 64,
        roomsOpened: 6, upgrades: 4, perfectPours: 11, purges: 9, killer: 'sprinter', startedAt: sc.time.now - 754_000,
      });
      sc.endRun();
    });
    await active(page, 'GameOver');
    await settle(page, 1800);
  },
};

const browser = await webkit.launch();
try {
  for (const size of SIZES) {
    const dir = `output/app-store/${size.name}`;
    mkdirSync(dir, { recursive: true });
    for (const [i, [name, setup]] of Object.entries(SCENES).entries()) {
      if (only.length && !only.includes(name)) continue;
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.scale, isMobile: true, hasTouch: true,
      });
      await context.addInitScript(([settings, achievements, progress, insets]) => {
        localStorage.setItem('eugeneicks.settings.v1', JSON.stringify(settings));
        localStorage.setItem('eugeneicks.achievements.v1', JSON.stringify(achievements));
        localStorage.setItem('eugeneicks.progress.v1', JSON.stringify(progress));
        // The app always has a LEADERBOARD (Game Center); the website hides it until its scores server is live
        window.__LEADERBOARD_API_URL__ = 'https://leaderboard.invalid';
        const css = `#safe-area-probe{padding:0 ${insets.right}px ${insets.bottom}px ${insets.left}px !important}`;
        document.addEventListener('DOMContentLoaded', () => document.head.append(Object.assign(document.createElement('style'), { textContent: css })));
      }, [SETTINGS, ACHIEVEMENTS, PROGRESS, size.insets]);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await setup(page);
      // JPEG: App Store Connect turns away screenshots with an alpha channel, which PNG screenshots carry
      const file = `${dir}/${i + 1}-${name}.jpg`;
      await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
      console.log(`${file}${errors.length ? `  (page errors: ${errors.join('; ')})` : ''}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.httpServer.close();
}
