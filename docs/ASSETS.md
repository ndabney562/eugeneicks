# Asset List

| Asset | Status |
|---|---|
| Eugene sprite | Placeholder drawn in code, matched to Noah's title poster (messy brown-grey hair, blue surgical mask, stethoscope, navy scrubs) |
| Pals: Dr. Derick, PA Julian (v0.16), Theo (v0.18) | Drawn in code (`BootScene`), loosely after Noah's reference photos; the photos are not in the repo. Plain clothing, no logos |
| Crystal | Germ monster drawn in code; v0.18 look (striped knit headwrap, beaded dreadlocks, hoops, bead necklaces) from Noah's reference picture, which is not in the repo |
| Jaykwellen | Portrait: Noah's picture (2026-11-01), in the portrait sheet's 12th cell. In-game sprite drawn in code (`providerArt.ts`): long dark waves, purple scrubs, stethoscope, silver hoop |
| Scribes Karim and Nate | Drawn in code (`BootScene`, `scribe-omar`, `scribe-alan`) from Noah's reference photos, which are not in the repo. No logos or printed text |
| Floor tile, furniture | Placeholder, drawn in code |
| Title screen art | Noah's EUGENEICKS poster (`public/assets/title.jpg`, 1600×900), redrawn flat-cartoon to match the game art (2026-11-01); `public/social-card.jpg` is its 1200×630 centre crop |
| Menu art | Flat-cartoon redraws matching the EUGENEICKS poster (Noah, ChatGPT, 2026-11-01): provider portraits (`public/assets/provider-portraits.jpg`, 4×3), tool/staff/germ icons (`menu-sprites.jpg`, 200×190 cells) and four room backgrounds, softened so menus stay readable (`menu-bgs.jpg`, 800×450 frames). Originals and the cutting scripts are in `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-rebrand/` |
| App icons | Noah's EUGENEICKS icon (2026-11-01). From his 1254 px original: `public/icons/` (512, 192, 180 px), the iPhone app's 1024 px icon and its 600 px rounded launch logo (`ios/Eugeneicks/Resources/Assets.xcassets`). Full-bleed; iOS rounds the corners |
| Basic Germ | Placeholder, drawn in code |
| Spray, splat, stain FX | Placeholder particles |
| Sounds: spray, hit, pop, splat, crit, sneeze wind-up, sneeze, boss arrives, Sinus Purge | CC0 recordings from Freesound (`public/assets/sfx/`, list below). Until a file loads, or if it can't, each plays its synthesized version |
| Every other sound (bump, empty, refill, round stings, tools…) | Synthesized placeholders (`src/core/sfx.ts`) |
| Music: clinic theme and boss theme | Synthesized live from step patterns (`src/data/music.ts`, played by `src/core/music.ts`) |
| Voice lines, music | Needed from M4 (placeholder) and M8 (Noah's recordings). Noah's own Sinus Purge can replace `purge.m4a`/`.mp3` |

## Recorded sound effects

All CC0 (public domain, no credit required; credited anyway). Each was trimmed, made mono, peak-normalized
and saved as `.m4a` (AAC, used by Safari, the iPhone app and Chrome) plus an `.mp3` fallback. Volumes are
in `src/config/sfx.ts`.

| Slot | Source | License | m4a | mp3 |
|---|---|---|---|---|
| `spray` | [perfume4.WAV](https://freesound.org/people/samplecat/sounds/11558/) by samplecat | CC0 | 2.4 KB | 1.5 KB |
| `hit` | [Single Water Drop](https://freesound.org/people/paespedro/sounds/174718/) by paespedro | CC0 | 2.7 KB | 1.8 KB |
| `pop` | [Plop!](https://freesound.org/people/Breviceps/sounds/447910/) by Breviceps | CC0 | 2.0 KB | 1.3 KB |
| `splat` | [Mud Splat](https://freesound.org/people/Breviceps/sounds/445109/) by Breviceps | CC0 | 3.3 KB | 2.5 KB |
| `crit` | [correct](https://freesound.org/people/ertfelda/sounds/243701/) by ertfelda | CC0 | 3.5 KB | 2.5 KB |
| `sneezeWindup` | [sneeze.wav](https://freesound.org/people/Zajjman/sounds/171519/) by Zajjman (the "ah-ah" before the sneeze) | CC0 | 2.7 KB | 1.8 KB |
| `sneeze` | [sneeze.wav](https://freesound.org/people/moxobna/sounds/54505/) by moxobna (the sneeze itself) | CC0 | 5.8 KB | 4.9 KB |
| `boss` | [Horn Stabs Entrance](https://freesound.org/people/bevibeldesign/sounds/350433/) by bevibeldesign | CC0 | 10.6 KB | 9.5 KB |
| `purge` | [Blowing Nose](https://freesound.org/people/jackthemurray/sounds/433588/) by jackthemurray | CC0 | 7.7 KB | 6.8 KB |

## Character names (2026-11-01)

Noah renamed everyone but Eugene. Only the shown names changed: ids, saves, art and abilities are the same.

| Id | Shown as | | Id | Shown as |
|---|---|---|---|---|
| `kaya` | Derick | | `omar` | Karim |
| `lucien` | Julian | | `alan` | Nate |
| `ken` | Theo | | `donald` | Gerald |
| `jason` | Derulo | | `selina` | Lena |
| `dhiwya` | Priya | | `elaine` | Maria |
| `raj` | Sanjay | | `alexandra` | Tatiana |
| `lidiya` | Marina | | `diamond` | Crystal (boss) |
| `dharma` | John | | | |
| `amanda` | Karen | | | |
| `janeen` | Gloria | | | |
| `jin` | Jaykwellen (was Jaykwellen, renamed 2026-11-03) | | | |

