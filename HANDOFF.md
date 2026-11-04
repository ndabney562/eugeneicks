# Handoff: EUGENEICKS

## Goal
- Take EUGENEICKS from "works" to an App Store-ready iPhone and iPad game, and keep closing the gaps in
  `docs/COMPETITIVE.md` in order, one PR each. Owner: Noah. Ask him before anything creative, irreversible or
  public-facing. Standing order "always merge": merge green PRs without asking.

## Done
- 2026-11-04, PR #23 merged (109ff4d): the offline PWA sound check (`tests/e2e/pwa.spec.ts`) now waits 30 s on
  WebKit. CI `build-and-smoke-test` passed on both runs (a cancelled duplicate push run was re-run to pass).
- 2026-11-03: App Store Connect record created (Noah); Claude uploaded Game Center (34 achievements, 3 leaderboards).
- 2026-11-02: the game moved to a fresh public repo, `ndabney562/eugeneicks`, with one starting commit. Noah wanted
  the game's former name and Eugene's real surname gone everywhere (locally and online). Eugene has no surname in
  the game now (chart and germs say EUGENE), the clinic is EugeneLand Urgent Care, the bundle ID is
  `com.ndabney562.eugeneicks`, the iOS project is `ios/Eugeneicks.xcodeproj` with the `EugeneicksKit` package, and the
  web saves start fresh (no migration, Noah's call). The title poster's bottle labels and name badge were painted
  plain. Earlier history is in `docs/HANDOFF-ARCHIVE.md`.
- Included in the first commit: game controllers and the competitive scorecard, and iPad support (HUD and Locker
  fit checks at iPad sizes, 13" iPad screenshots).
- Leaderboard: new D1 database `eugeneicks-leaderboard-db` (empty, created 2026-11-02); `worker/wrangler.toml`
  points at it. The worker `eugeneicks-leaderboard` is deployed (https://eugeneicks-leaderboard.eugeneicks.workers.dev);
  the old repo, worker and database are deleted.
- 2026-11-02, PR #3: walking feet. Two tinted shoes step out from under Eugene, the Pals and patients
  (`src/entities/Walker.ts`, math in `src/core/walk.ts`, tuning in `DISPLAY.walk`). Tatiana floats, so she has none.
  Every shoe is dark grey (`DISPLAY.walk.shoes`); characters, Pals and patient types take an optional `shoes` colour.
  Noah approved the look.
- 2026-11-02, PR #4: the title's tab pills are 25% bigger, lower and nearer the middle, and the whole pill takes the
  tap (`DISPLAY.titleTabs`). Noah found them hard to press.

## In progress
- 2026-11-03: **EUGENEICKS 1.0 (53) submitted; App Store state WAITING_FOR_REVIEW.** Free, United States only.
  Store page filled through the API (docs/APP-STORE.md "Store page"); Noah did App Privacy, review contact and the
  Submit. Game Center enabled on the version and all 34 achievements + 3 leaderboards attached to the release.
  PR #20 (controller keys, iOS version 1.0) merged on local checks with Noah's OK.
- 2026-11-03, PR #14 merged (3a97c4f): PA Jin renamed Jaykwellen (Noah's call; id stays `jin` so saves and unlocks keep working;
  short/chart/surname JAYKWELLEN, fits the roster card and health bar). Feet step half as often
  (`DISPLAY.walk.stride` 46 → 92, Noah: "too fast, make 50% the speed").
- 2026-11-03: Noah approved LARGE TEXT at 1.3× ("it looked good").
- 2026-11-03, PR #12 merged (5c63ee8): LARGE TEXT switch in the pause menu (`settings.largeText`,
  `DISPLAY.largeTextScale` 1.3, helper `src/ui/textScale.ts`: wrap a label in `scalable()` and it follows the
  switch live). Scaled: HUD small labels, pause tip, toasts, trap signs, scribe markers, elite tags, boss hints. Not
  scaled on purpose: the bottle readout (it ran into REFILL and SPRAY; the canister level shows the same), menus and
  ChoicePanel cards (already 17 px or more, fixed-height cards). Germs winding up a sneeze or charge show a bobbing
  "!" (`Germ.preUpdate`). Tests: `tests/e2e/accessibility.spec.ts`, LARGE TEXT variants in `hud-fit.spec.ts`,
  `tests/unit/text-scale.test.ts`. Web only; the iOS Settings screen has no LARGE TEXT switch yet.
- 2026-11-03: iOS CI rerun 41680963554 on main was again not acquired (7th run, GitHub macOS arm64 capacity).
- 2026-11-03: PR #7 merged (title tabs no longer overlap on narrow phones). It fixes the Pages deploy, which had
  failed since #5 on the menu-design e2e test, so the live site was stuck on the build from before #3.
- 2026-11-03: iCloud saves (PR #6) passed Noah's iPhone test: he deleted the app, Claude reinstalled it, and his
  record and coins came back from iCloud. Not tried on the iPad (none was plugged in). Merged as ee01a00 on
  2026-11-03 with local checks only: the iOS CI job never got a `macos-26` runner (3 of 3 runs, zero steps), and
  Noah chose "merge now, then fix CI".
- iOS CI has never run in this repo. PR #10 tried `macos-15` and was closed: it wasn't acquired either, and GitHub's
  annotation says macOS arm64 runners are short on capacity. Keep `macos-26`; rerun the iOS job later
  (`gh run list --workflow ios.yml`, then `gh run rerun <id>`) and check it passes on main's ee01a00.
- iCloud saves design notes (built in #6): draft merge module at
  `~/Desktop/AI.Stuff/Apps.Games/Local.Stuff/eugeneicks/eugeneicks-cloud-save-draft.ts` (merge rule: records/kills/lifetime
  totals take the max, achievements and purchases union, spendable balances from the device that played last). Plan:
  game posts `{type:'cloudSave', gen, blob}` with each snapshot; app keeps it in `NSUbiquitousKeyValueStore`
  (entitlement `com.apple.developer.ubiquity-kvstore-identifier`), sends the cloud copy to the game on `ready` and on
  external change with a `gen` counter, and ignores posts older than the last `gen` it sent. Merge only on the title
  screen, never mid-shift; reload `progress.ts`/`achievements.ts` state after a merge.

## Next step (exact)
0. [Assigned: Claude Code] Check the review: `ASC_KEY=~/Downloads/AuthKey_8N39839RBM.p8 ASC_ISSUER=<Noah's issuer ID>`
   then `appStoreVersions` state (scripts in `~/Desktop/AI.Stuff/Apps.Games/Local.Stuff/eugeneicks/app-store-listing/`).
   If Apple rejects it, read the Resolution Center message (Noah pastes it) and fix.
1. [Assigned: Noah] Try the new feet and tabs on the iPhone; say if the shoes want colours per character.
1a. [Assigned: Claude Code] Rerun iOS CI on main (`gh run rerun 41680963554`) until a runner picks it up.
2. [Assigned: Noah] Try the slower feet and the "!" on a Sneezer on the iPhone. Optional follow-up: a LARGE
   TEXT switch in the app's native Settings screen (needs `ios/` changes, so iOS CI).
3. [Done 2026-11-03] App Store Connect record EUGENEICKS (app ID 6830328638, SKU `eugeneicks`). Game Center on, 34
   achievements and 3 leaderboards uploaded (re-run dry run: 34 exist, 0 to create). API key: App Manager,
   `~/Downloads/AuthKey_8N39839RBM.p8` (mode 600), issuer ID in Noah's chat; reuse it for TestFlight uploads. The
   script needs `pyjwt cryptography requests` (use a venv).
3a. [Done 2026-11-03] TestFlight 0.35.0 (44) uploaded by Noah from Xcode's Organizer and installed on his iPhone
   as an internal tester. Xcode cloud-signed it, so this Mac still has no distribution certificate: Claude's App
   Manager key can archive but not upload ("Cloud signing permission error"). For later builds, either Noah uploads
   from the Organizer (Claude archives and opens it with `open <xcarchive>`), or Noah makes an Admin API key.
3b. [Done 2026-11-03] Noah played the TestFlight build: Game Center sign-in, achievements and iCloud saves all work.
4. [Done 2026-11-03] Noah: a Bluetooth controller moves Eugene in the app. PR #20 adds `GCSupportsControllerUserInteraction`
   and `GCSupportedGameControllers` (ExtendedGamepad) to `ios/Config/Info.plist`.
5. [Assigned: Noah] Delete the old app from the iPhone (its bundle ID changed, so the new build installs alongside).

## Blockers
- Cloudflare deploys and GitHub repo deletion are blocked for Claude (auto-mode check, missing `delete_repo` scope); Noah runs those.
- GitHub's macOS runners are short on capacity: iOS CI run 41485107835 was never picked up (no code failure).

## Last test result
- 2026-11-03, Noah's Mac, `feat/jaykwellen-slower-feet`: test:all (unit 223/223, regression 178), smoke 207/0.
- 2026-11-03, Noah's Mac, `feat/accessibility`: test:all (typecheck, unit 223/223, build, bundle, regression 178
  passed across Chromium + WebKit), smoke 207/0. No `ios/` changes.
- 2026-11-03, Noah's Mac, PR #6 merged with main: test:all (typecheck, unit 221/221, build, bundle, regression
  Chromium 83 + WebKit 83 passed), smoke 207/0, `swift test` 38/38, `xcodebuild test` 5 passed, 1 skipped.
- 2026-11-02, Noah's Mac, PR #4 (tabs): typecheck, unit 206/206, build, bundle, regression 162 passed, smoke
  207/0; PR #3 (feet): unit 213/213, regression 164, smoke 207/0. No `ios/` changes since the first commit.
- 2026-11-02, Noah's Mac, before the first commit: typecheck OK; build OK; unit, smoke and Playwright regression all
  passed; `swift test` EugeneicksKit 29/29; `xcodebuild test` UI tests 5 passed, 1 skipped (screenshots).

## Last commit hash
- 109ff4d (main, PR #23 PWA sound check timeout merged 2026-11-04).

## Model + timestamp
- Claude Code (claude-opus-5-5), 2026-11-04 EST.

## Read first
- CLAUDE.md, AGENTS.md, PROJECT.md, docs/ROADMAP.md, docs/MY_CONTRIBUTIONS.md, docs/APP-STORE.md.

<!-- hivemind:auto -->
- **Last test result:** `Local (Noah's Mac): typecheck, build, unit 206/206, smoke 207/0, regression 162 passed, \`swift test\` 29/29, \`xcodebui` → result unknown (2026-11-02T09:32:04-0500)
- **Last commit hash:** 6a36e55
- **Model + timestamp:** claude / 2026-11-02T11:53:25-0500
<!-- /hivemind:auto -->
