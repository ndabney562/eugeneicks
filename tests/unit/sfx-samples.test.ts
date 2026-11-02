import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it, vi } from 'vitest';
import { SFX_SAMPLE_GAIN, SFX_SAMPLE_NAMES } from '../../src/config/sfx';

function audioSession() {
  const master = { gain: { value: 0, setTargetAtTime: vi.fn() }, connect: vi.fn().mockReturnThis() };
  const gains: { gain: { value: number }; connect: ReturnType<typeof vi.fn> }[] = [];
  const sources: { buffer: unknown; playbackRate: { value: number }; connect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn> }[] = [];
  let made = 0;
  const ctx = {
    state: 'running', currentTime: 2, sampleRate: 4, destination: {}, resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => {
      if (made++ === 0) return master;
      const node = { gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn((n) => n) };
      gains.push(node);
      return node;
    }),
    createDynamicsCompressor: () => ({ threshold: {}, knee: {}, ratio: {}, attack: {}, release: {}, connect: vi.fn().mockReturnThis() }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(4) }),
    createBufferSource: vi.fn(() => {
      const src = { buffer: null as unknown, playbackRate: { value: 1 }, connect: vi.fn((n) => n), start: vi.fn() };
      sources.push(src);
      return src;
    }),
    createOscillator: vi.fn(() => ({ type: '', frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn((n) => n), start: vi.fn(), stop: vi.fn() })),
    createBiquadFilter: vi.fn(() => ({ type: '', frequency: { value: 0 }, connect: vi.fn((n) => n) })),
  };
  return { ctx, master, gains, sources, scene: { sound: { context: ctx } } };
}

const recording = () => ({ getChannelData: () => new Float32Array(4), duration: 0.2 });

it('plays a loaded recording through the sfx master at its slot volume, instead of the synth', async () => {
  const { initSfx, setSfxSample, sfx } = await import('../../src/core/sfx');
  const { ctx, master, gains, sources, scene } = audioSession();
  initSfx(scene as any);
  const buffer = recording();
  setSfxSample('spray', buffer);
  sfx.spray();
  expect(ctx.createOscillator).not.toHaveBeenCalled();
  expect(ctx.createBiquadFilter).not.toHaveBeenCalled();
  expect(sources).toHaveLength(1);
  expect(sources[0].buffer).toBe(buffer);
  expect(sources[0].start).toHaveBeenCalledWith(2);
  const env = gains.at(-1)!;
  expect(env.gain.value).toBe(SFX_SAMPLE_GAIN.spray);
  expect(sources[0].connect).toHaveBeenCalledWith(env);
  expect(env.connect).toHaveBeenCalledWith(master);
});

it('falls back to the synth when a slot has no recording, or got something other than a decoded buffer', async () => {
  const { initSfx, setSfxSample, sfx } = await import('../../src/core/sfx');
  const { ctx, sources, scene } = audioSession();
  initSfx(scene as any);
  setSfxSample('hit', undefined);
  setSfxSample('hit', document.createElement('audio'));
  sfx.hit();
  expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  sfx.splat();
  expect(ctx.createBiquadFilter).toHaveBeenCalledTimes(1);
  // The synth's noise bursts use buffer sources too, but never a recording
  expect(sources.every((s) => !(s.buffer as any)?.duration)).toBe(true);
});

it('keeps the pitch wobble, streak pitch and per-sound cooldown for recordings', async () => {
  const { initSfx, setSfxSample, sfx } = await import('../../src/core/sfx');
  const { sources, scene } = audioSession();
  initSfx(scene as any);
  setSfxSample('pop', recording());
  const now = vi.spyOn(performance, 'now').mockReturnValue(10_000);
  vi.spyOn(Math, 'random').mockReturnValue(1);
  sfx.pop();
  expect(sources[0].playbackRate.value).toBeCloseTo(1.08);
  sfx.pop();
  expect(sources).toHaveLength(1); // within the 30 ms cooldown
  now.mockReturnValue(10_100);
  vi.spyOn(Math, 'random').mockReturnValue(0);
  sfx.pop(30);
  expect(sources[1].playbackRate.value).toBeCloseTo(0.92 * 2);
});

it('stays silent while audio is suspended, and mutes recordings with the same master gain', async () => {
  const { initSfx, setSfxMuted, setSfxSample, sfx } = await import('../../src/core/sfx');
  const { ctx, master, sources, scene } = audioSession();
  initSfx(scene as any);
  setSfxSample('crit', recording());
  ctx.state = 'suspended';
  sfx.crit();
  expect(sources).toHaveLength(0);
  ctx.state = 'running';
  setSfxMuted(true);
  expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 2, 0.015);
  sfx.crit();
  expect(sources).toHaveLength(1);
});

function loaderScene(cached: Record<string, unknown> = {}, loading = false) {
  const handlers: Record<string, () => void> = {};
  const scene = {
    cache: { audio: { exists: (k: string) => k in cached, get: (k: string) => cached[k] } },
    load: {
      audio: vi.fn(), start: vi.fn(), isLoading: () => loading,
      once: vi.fn((event: string, fn: () => void) => { handlers[event] = fn; }),
    },
  };
  return { scene, handlers, cached };
}

it('queues every recording as m4a with an mp3 fallback, and starts the loader only when idle', async () => {
  const { preloadSfxSamples } = await import('../../src/core/sfx');
  const { scene } = loaderScene();
  preloadSfxSamples(scene as any);
  expect(scene.load.audio).toHaveBeenCalledTimes(SFX_SAMPLE_NAMES.length);
  expect(scene.load.audio).toHaveBeenCalledWith('sfx-spray', ['assets/sfx/spray.m4a', 'assets/sfx/spray.mp3']);
  expect(scene.load.start).toHaveBeenCalledTimes(1);

  const busy = loaderScene({}, true);
  preloadSfxSamples(busy.scene as any);
  expect(busy.scene.load.start).not.toHaveBeenCalled();
});

it('hands each slot its decoded file when it finishes loading, and reuses files already cached', async () => {
  const { initSfx, preloadSfxSamples, sfx } = await import('../../src/core/sfx');
  const session = audioSession();
  initSfx(session.scene as any);
  const { scene, handlers, cached } = loaderScene({ 'sfx-boss': recording() });
  preloadSfxSamples(scene as any);
  expect(scene.load.audio).not.toHaveBeenCalledWith('sfx-boss', expect.anything());
  cached['sfx-sneeze'] = recording();
  vi.spyOn(performance, 'now').mockReturnValue(10_000); // past every cooldown
  handlers['filecomplete-audio-sfx-sneeze']();
  sfx.sneeze();
  sfx.bossArrives();
  expect(session.sources.map((s) => s.buffer)).toEqual([cached['sfx-sneeze'], cached['sfx-boss']]);
  expect(session.ctx.createOscillator).not.toHaveBeenCalled();
  // Nothing left to load the next time the title shows
  const again = loaderScene(cached);
  preloadSfxSamples(again.scene as any);
  expect(again.scene.load.audio).toHaveBeenCalledTimes(SFX_SAMPLE_NAMES.length - 2);
});

it('ships a small m4a and mp3 for every recorded slot', () => {
  for (const name of SFX_SAMPLE_NAMES) {
    for (const ext of ['m4a', 'mp3']) {
      const file = resolve('public/assets/sfx', `${name}.${ext}`);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size, file).toBeLessThan(40 * 1024);
    }
  }
});
