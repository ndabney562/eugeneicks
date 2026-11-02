# Walking feet: characters step instead of float

Approved by Noah, Nov 1, 2026. Branch `feat/walking-feet`.

## Goal
In a shift, doctors, Pals and patients read as people walking, not floating figures.

## What Noah chose
- **Style:** keep the top-down view and free 360° turning. Add two shoes that step out from under each
  character, plus a bob on each step. (Rejected: a 3/4 side view with 4 directions, and painted sprite sheets.)
- **Who:** everyone who walks. That's all playable doctors (Eugene and Eugene's cap, Kaya, Lucien, Ken,
  Jason, Dhiwya and her 3 looks, Raj, Lidiya, Dharma, Amanda, Janeen), the Pals who follow (Omar, Alan,
  Donald, Selina, Elaine, Alexandra), and patients. Germs keep floating.
- **Feel:** bouncy cartoon. Big clear steps, a visible bob, and the bob turns off with Reduce Motion.

## Behaviour
- Two shoes alternate: left foot forward while the right goes back, then swap. They are drawn just under the body,
  so they peek out in front of and behind the coat.
- The step phase advances with **distance actually moved** (position change per frame), not with input, so
  being pushed, pulled into Diamond's meeting or a Pal hurrying all step correctly. When the character
  stops, the feet ease back side by side under the body.
- Bob: squash on each footfall and stretch between steps, two per stride cycle. It replaces the current
  waddle in `Player.drive` (`src/entities/Player.ts`) and patients' squash in `Patient` (`src/entities/Patient.ts`).
  Off under `settings.reducedMotion`, and the feet still step.
- Arms don't swing. Doctors hold their tool forward, and the arms are baked into each drawing.
- Aiming, the nozzle position, hitboxes and turning are unchanged. Feet and bob are visual only.

## Build
1. **`src/entities/Walker.ts`:** attaches to any host `{ x, y, rotation, depth, visible }` (Phaser `Sprite` or
   `Image`). It owns two shoe images and the step phase, and has `update(dtMs)`, `setVisible()` and `destroy()`.
   It reads the host's position each frame to measure distance, and it returns the bob for the host to apply as scale.
2. **Step math as a pure function** (no Phaser): `footOffsets(phase, moving, scale)` returns both feet's
   forward/side offsets and the bob. It is unit-tested.
3. **Shoe art:** one `shoe` texture drawn in `BootScene` (a rounded oval with a darker sole edge), tinted per
   character.
4. **Content:** optional `shoes` colour per character in `src/data/characters.ts`, per Pal in `src/data/scribes.ts`
   and per patient type. It defaults to dark clogs.
5. **Tuning:** `DISPLAY.walk` in `src/config/display.ts` holds step length (px of travel per stride),
   forward reach, foot spacing, shoe size and bob amount. It's sized for the 96 px doctors and scaled down for
   64 px patients.
6. **Hook-ups:** `Player` (doctors), `Scribes` (Pal images and their shadows), and `Patient` (pooled: reset on
   reuse, hidden on retire).

## Proof
- Unit: feet alternate, both settle when standing still, offsets scale with size, and Reduce Motion gives a bob of 0.
- `npm run build && npm run test:unit && npm run smoke` and `npm run test:regression` stay green.
- A short before/after clip (Eugene, a Pal and a patient walking) in the PR, for Noah to judge the look before
  merge. This is a creative milestone, so Noah approves the look.

## Out of scope
Swinging arms, side or 3/4 views, germ animation, and new character drawings.
