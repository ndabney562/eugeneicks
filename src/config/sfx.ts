/**
 * Recorded sound effects (core/sfx.ts). Each slot plays `public/assets/sfx/<slot>.m4a` (or `.mp3`)
 * once it has loaded, and its synthesized voice until then. Sources and licenses: docs/ASSETS.md.
 *
 * The files are peak-normalized, so this is each recording's volume before the shared sfx master.
 * Sounds that repeat a lot (spray, hit) sit lowest.
 */
export const SFX_SAMPLE_GAIN = {
  spray: 0.2,
  hit: 0.25,
  pop: 0.4,
  splat: 0.4,
  crit: 0.3,
  sneezeWindup: 0.35,
  sneeze: 0.5,
  boss: 0.45,
  purge: 0.5,
} as const;

export type SfxSampleName = keyof typeof SFX_SAMPLE_GAIN;
export const SFX_SAMPLE_NAMES = Object.keys(SFX_SAMPLE_GAIN) as SfxSampleName[];
