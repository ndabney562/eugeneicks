# Handoff: EUGENEICKS

## Goal
- Take EUGENEICKS from "works" to an App Store-ready iPhone and iPad game, and keep closing the gaps in
  `docs/COMPETITIVE.md` in order, one PR each. Owner: Noah. Ask him before anything creative, irreversible or
  public-facing. Standing order "always merge": merge green PRs without asking.

## Done
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
- 2026-11-03: PR #7 merged (title tabs no longer overlap on narrow phones). It fixes the Pages deploy, which had
  failed since #5 on the menu-design e2e test, so the live site was stuck on the build from before #3.
- 2026-11-03: iCloud saves (PR #6) passed Noah's iPhone test: he deleted the app, Claude reinstalled it, and his
  record and coins came back from iCloud. Not tried on the iPad (none was plugged in). Its iOS CI job
  (`build-and-test`) timed out at 15 min on the slow runner; local `swift test` 38/38 and `xcodebuild test` passed.
  Original design notes: Draft merge module at
  `~/Desktop/AI.Stuff/Apps.Games/Local.Stuff/eugeneicks/eugeneicks-cloud-save-draft.ts` (merge rule: records/kills/lifetime
  totals take the max, achievements and purchases union, spendable balances from the device that played last). Plan:
  game posts `{type:'cloudSave', gen, blob}` with each snapshot; app keeps it in `NSUbiquitousKeyValueStore`
  (entitlement `com.apple.developer.ubiquity-kvstore-identifier`), sends the cloud copy to the game on `ready` and on
  external change with a `gen` counter, and ignores posts older than the last `gen` it sent. Merge only on the title
  screen, never mid-shift; reload `progress.ts`/`achievements.ts` state after a merge.

## Next step (exact)
1. [Assigned: Noah] Try the new feet and tabs on the iPhone; say if the shoes want colours per character.
2. [Assigned: Claude Code] Accessibility (row 9: larger-text option, germ tells that don't rely on colour).
3. [Assigned: Noah] App Store Connect: create the app record (bundle ID `com.ndabney562.eugeneicks`, SKU
   `eugeneicks`), make an App Manager API key, paste the Issuer ID. Claude then runs
   `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-game-center/scripts/upload.py <AuthKey.p8> <issuer>`
   (dry run, then `--go`).
4. [Assigned: Noah] With a Bluetooth controller paired to the iPhone, check it moves Eugene in the app. If yes,
   Claude adds the `GCSupportedGameControllers` Info.plist keys. If no, Claude bridges GameController.framework.
5. [Assigned: Noah] Delete the old app from the iPhone (its bundle ID changed, so the new build installs alongside).

## Blockers
- Cloudflare deploys and GitHub repo deletion are blocked for Claude (auto-mode check, missing `delete_repo` scope); Noah runs those.
- GitHub's macOS runners are short on capacity: iOS CI run 41485107835 was never picked up (no code failure).

## Last test result
- 2026-11-03, Noah's Mac, PR #6 merged with main: test:all (typecheck, unit 221/221, build, bundle, regression
  Chromium 83 + WebKit 83 passed), smoke 207/0, `swift test` 38/38, `xcodebuild test` 5 passed, 1 skipped.
- 2026-11-02, Noah's Mac, PR #4 (tabs): typecheck, unit 206/206, build, bundle, regression 162 passed, smoke
  207/0; PR #3 (feet): unit 213/213, regression 164, smoke 207/0. No `ios/` changes since the first commit.
- 2026-11-02, Noah's Mac, before the first commit: typecheck OK; build OK; unit, smoke and Playwright regression all
  passed; `swift test` EugeneicksKit 29/29; `xcodebuild test` UI tests 5 passed, 1 skipped (screenshots).

## Last commit hash
- 6608a03 (main, PR #7 merged 2026-11-03; Pages redeploy running).

## Model + timestamp
- Claude Code (claude-opus-5-5), 2026-11-03 EST.

## Read first
- CLAUDE.md, AGENTS.md, PROJECT.md, docs/ROADMAP.md, docs/MY_CONTRIBUTIONS.md, docs/APP-STORE.md.

<!-- hivemind:auto -->
- **Last test result:** `Local (Noah's Mac): typecheck, build, unit 206/206, smoke 207/0, regression 162 passed, \`swift test\` 29/29, \`xcodebui` → result unknown (2026-11-02T09:32:04-0500)
- **Last commit hash:** 6a36e55
- **Model + timestamp:** claude / 2026-11-02T11:53:25-0500
<!-- /hivemind:auto -->
