import { test, expect, start, tapObject } from '../helpers/game';

test('a germ winding up a sneeze or a charge shows a "!" (not just a red flash)', async ({ page }) => {
  await start(page);
  const shown = await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game');
    for (const c of g.germs.getChildren()) if (c.active) c.kill();
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const spawn = (id: string, dx: number) => {
      g.spawnGermAt(id, g.player.x + dx, g.player.y, true);
      return g.germs.getChildren().find((c: any) => c.active && c.def.id === id);
    };
    const sneezer = spawn('sneezer', 300);
    sneezer.windupUntil = g.time.now + 60_000;
    await frame();
    const sneeze = sneezer.alert?.visible === true;
    sneezer.windupUntil = 0;
    sneezer.nextSpitAt = g.time.now + 60_000;
    await frame();
    const cleared = sneezer.alert.visible === false;
    const bulldozer = spawn('charger', -300);
    bulldozer.chargeState = 'windup';
    bulldozer.chargeUntil = g.time.now + 60_000;
    await frame();
    return { sneeze, cleared, charge: bulldozer.alert?.visible === true, above: bulldozer.alert.y < bulldozer.y };
  });
  expect(shown).toEqual({ sneeze: true, cleared: true, charge: true, above: true });
});

test('LARGE TEXT in the pause menu makes the small labels bigger at once, and stays on', async ({ page }) => {
  await start(page);
  const size = () => page.evaluate(() => parseFloat(window.game.scene.getScene('Hud').scoreText.style.fontSize));
  const before = await size();
  await tapObject(page, 'Hud', 'pauseButton');
  await tapObject(page, 'Hud', 'textToggle');
  expect(await page.evaluate(() => window.game.scene.getScene('Hud').textToggle.text)).toBe('LARGE TEXT: ON');
  expect(await size()).toBeGreaterThan(before * 1.2);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('eugeneicks.settings.v1') ?? '{}').largeText);
  expect(saved).toBe(true);
});
