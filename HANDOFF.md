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
  points at it. The worker `eugeneicks-leaderboard` still needs deploying (see Next step).

## In progress
- `feat/walking-feet`: Noah's approved design spec only (`docs/superpowers/specs/2026-11-01-walking-feet-design.md`).
- iCloud saves: design drafted, not started in the repo. Draft merge module at
  `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-cloud-save-draft.ts` (merge rule: records/kills/lifetime
  totals take the max, achievements and purchases union, spendable balances from the device that played last). Plan:
  game posts `{type:'cloudSave', gen, blob}` with each snapshot; app keeps it in `NSUbiquitousKeyValueStore`
  (entitlement `com.apple.developer.ubiquity-kvstore-identifier`), sends the cloud copy to the game on `ready` and on
  external change with a `gen` counter, and ignores posts older than the last `gen` it sent. Merge only on the title
  screen, never mid-shift; reload `progress.ts`/`achievements.ts` state after a merge.

## Next step (exact)
0. [Assigned: Noah] Delete the old public repo (needs a one-time login scope):
   `gh auth refresh -h github.com -s delete_repo`, then `gh repo delete ndabney562/<old repo name> --yes`.
   Also merge ai-scheduled PR #3 and empty `~/.Trash/eugeneicks-cleanup-2026-11-02/` when ready.
1. [Assigned: Noah] In Terminal: `cd ~/eugeneicks/worker && npx wrangler d1 execute eugeneicks-leaderboard-db --remote --file schema.sql && npx wrangler deploy`, then delete the old leaderboard worker and its database in the Cloudflare dashboard (Workers & Pages, and D1).
2. [Assigned: Claude Code] iCloud saves (scorecard row 6) per the plan above, then accessibility (row 9: larger-text
   option, germ tells that don't rely on colour).
3. [Assigned: Noah] App Store Connect: create the app record (bundle ID `com.ndabney562.eugeneicks`, SKU
   `eugeneicks`), make an App Manager API key, paste the Issuer ID. Claude then runs
   `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-game-center/scripts/upload.py <AuthKey.p8> <issuer>`
   (dry run, then `--go`).
4. [Assigned: Noah] With a Bluetooth controller paired to the iPhone, check it moves Eugene in the app. If yes,
   Claude adds the `GCSupportedGameControllers` Info.plist keys. If no, Claude bridges GameController.framework.
5. [Assigned: Noah] Delete the old app from the iPhone (its bundle ID changed, so the new build installs alongside).

## Blockers
- Cloudflare deploys and GitHub repo deletion are blocked for Claude (auto-mode check, missing `delete_repo` scope); Noah runs those.

## Last test result
- 2026-11-02, Noah's Mac, before the first commit: typecheck OK; build OK; unit, smoke and Playwright regression all
  passed; `swift test` EugeneicksKit 29/29; `xcodebuild test` UI tests 5 passed, 1 skipped (screenshots).

## Last commit hash
- 7a6b7a0 (main, PR #1 merged; Pages live at https://ndabney562.github.io/eugeneicks/, 2026-11-02).

## Model + timestamp
- Claude Code (claude-opus-5-5), 2026-11-02 EST.

## Read first
- CLAUDE.md, AGENTS.md, PROJECT.md, docs/ROADMAP.md, docs/MY_CONTRIBUTIONS.md, docs/APP-STORE.md.
