# Handoff archive

History moved out of HANDOFF.md, newest first. HANDOFF.md keeps only the current state and the next step.

## Snapshot of HANDOFF.md, Oct 30, 2026 (before it was slimmed)

### Done
- Phase 0 audit (Oct 30, 2026, from commit c4dc551). App Store gaps found:
  1. No `PrivacyInfo.xcprivacy`, so uploads get rejected (ITMS-91053). **Fixed** on
     `feat/appstore-readiness`.
  2. `DEVELOPMENT_TEAM` is empty in the Xcode project. Noah has to set it.
  3. The app icon is a single 1024 px universal PNG. That's valid for Xcode 15+.
  4. The online leaderboard (`src/core/leaderboard.ts` + `worker/`) is off by
     default (`DEFAULT_API_URL = ''`). `worker/wrangler.toml` has the placeholder
     `database_id`. Turning it on needs a privacy policy, a data label and
     UGC-name moderation (Guideline 1.2), or a switch to Game Center.
  5. No App Store metadata yet: screenshots, description, privacy policy URL,
     support URL, age rating.

- Phase 1, Game Center (Noah said "whatever you think"; Claude chose Game
  Center over the Cloudflare leaderboard). Gemini CLI reviewed the design (run
  with `--skip-trust` from a scratch folder, since the repo isn't a trusted
  folder for it). Adopted: mark reported only after success; Today's Shift
  stays off. Its tip about achievement banners was not adopted, because the game
  HUD already shows unlocks.
  - `ios/EugeneicksKit/.../Store/GameCenterLedger.swift` works out what's pending,
    with 3 unit tests.
  - `ios/Eugeneicks/Services/GameCenterService.swift` handles sign-in,
    submitting and the dashboard.
  - `RootView` reports on every snapshot change. Progress has a Game Center
    button that shows only when signed in.
  - `ios/Config/Eugeneicks.entitlements` holds the Game Center entitlement,
    set as CODE_SIGN_ENTITLEMENTS for the app.
  - `docs/GAME-CENTER.md` lists the IDs to create in App Store Connect.

- Menus option A (Oct 30, 2026, branch `feat/menus-option-a`, draft PR). The
  app shows the web title and menus; `?native` boots to Title and `toTitle()`
  returns there. SwiftUI keeps the Settings sheet (the title's gear posts
  `openSettings`), Game Center (the LEADERBOARD tab and game-over button post
  `openGameCenter`), haptics and the landscape lock. PlayView, ProgressScreen
  and their view models are deleted; `start`/`open`/`hire` and the art in the
  snapshot are gone from the bridge. New tests: every title feature reachable in
  `?native` (Playwright + smoke); iOS UI test boots the real game to its title,
  checks all menu texts, taps START SHIFT and relaunches.

- Step 2, App Store compliance (Oct 30, 2026, branch `feat/app-store-compliance`,
  draft PR stacked on #92). Privacy policy `public/privacy.html`, linked from
  Settings → About (UI test `testSettingsLinksToThePrivacyPolicy`). Build
  number = commit count via `scripts/ios-build-number.sh` (Xcode build phase
  "Stamp the build number"; ios.yml fetches full history). Noah clarified the
  cap belongs to Kaya, not Ken (the poster was already right); the team logo
  and side brand mark are painted out of `title.jpg` and `social-card.png`
  (OpenCV inpaint, cap kept). `docs/APP-STORE.md` is the checklist.

### In progress
- PR #92 (menus option A): iOS CI is red for a CI-environment reason, not a
  game bug. The workflow's simulator picker takes the newest iOS runtime (iOS
  26.2, iPhone 17 Pro) while the runner's default Xcode is 16.4 (iOS 18.5 SDK).
  That unsupported pairing breaks synthesized touches into the WKWebView: run 1
  (8f8a46e) tapped START SHIFT with no effect; run 2 (d30cbaf, after the test
  learned to tap where the page reports the pill and re-tap) crashed the app in
  UIKit's gesture graph (`UIGestureGraphEdge`, SIGABRT) on the press. Both
  runs passed locally on Xcode 27.1. Crash report:
  xcresult artifact of run 41068034369.
  **Fix pushed Oct 30, 2026 (Noah said go):** in
  `.github/workflows/ios.yml` set `DEVELOPER_DIR` to the newest Xcode on the
  image (`ls -d /Applications/Xcode_*.app | sort -V | tail -1`, 26.3 today) so
  the toolchain matches the iOS 26 runtime, or make the picker choose an iOS
  18.x runtime. Prefer the first: Noah builds with Xcode 27.1 locally.
  Keep d30cbaf's test changes (they give better failure messages).

- Step 2 PR #93: Noah approved the painted cap and has consent from every real
  person in the game (Oct 30, 2026); privacy contact stays GitHub issues.
  Merge order: #92 when iOS CI is green, then retarget #93 to main.

### Next step (exact)
1. [Noah] Review and merge the menus option A PR. Then on a real phone: tap the
   gear (Settings sheet), tap LEADERBOARD (Game Center), play a shift.
2. [Any agent] Step 2 of Noah's plan: App Store compliance. Privacy policy page
   on GitHub Pages linked from Settings → About, build number from the CI run
   number, docs/APP-STORE.md checklist. Noah supplies or approves the title art
   without the NBA logo on Ken's cap.
3. [Noah] Set the Team in Xcode and create the Game Center IDs in
   `docs/GAME-CENTER.md`. Sign-in can't be checked in an unsigned simulator
   build.
4. [Any agent] Step 3: polish and weight (title-art seams at iPhone landscape
   width, crowded top nav, PNG → WebP/JPEG with CI size budgets, lazy menu art,
   WebKit cold start). Then step 4 hygiene (version bump, trim docs, stale
   branches: ask Noah before deleting) and step 5 (ask Noah about Janeen and
   Amanda's numbers).

### Blockers
- `DEVELOPMENT_TEAM` and an Apple Developer account (Noah).

### Last test result
- Step 2 branch, Oct 30, 2026, on Noah's Mac: build OK (14 bundle files incl.
  privacy.html); unit 172/172; smoke 207/0; EugeneicksKit 29/29; xcodebuild test 5
  passed, 1 skipped; the built app's CFBundleVersion is 295 = commit count.
- CI-fix commit on `feat/menus-option-a`, Oct 30, 2026, on Noah's Mac:
  `npm run build` OK; unit 172/172; smoke 207 passed, 0 failed; `swift test`
  (EugeneicksKit) 29/29; `xcodebuild test` on the booted iPhone simulator (Xcode
  27.1): 4 UI tests passed, 1 skipped, the real-game test in 28 s.
- Menus option A, Oct 30, 2026, on Noah's Mac: `npm run build` OK; unit
  172/172; Playwright native, mobile, leaderboard and menu-design specs 40/40
  (Chromium + WebKit); full smoke: see the PR description. `swift test`
  (EugeneicksKit) 29/29. `xcodebuild test` on the iPhone simulator (Xcode 27.1): 4 UI
  tests passed, 1 skipped (screenshots), including the real bundled game
  booting to its title with every menu and starting a shift from it.
- Earlier (main at 2fcf6fd): `npm run test:all` exit 0. Unit 173/173.
  Playwright 126 passed. Smoke 206 passed, 0 failed.
- iOS simulator build (Xcode 27.1, iPhone 18 Pro): BUILD SUCCEEDED, and
  `PrivacyInfo.xcprivacy` is in `Eugeneicks.app`.
- Phase 1, Oct 30, 2026: `swift test --package-path ios/EugeneicksKit` gives 39
  passed, 0 failed. `xcodebuild test` on the iPhone 18 Pro simulator (iOS 27,
  CODE_SIGNING_ALLOWED=NO) succeeded: 6 passed, 1 skipped (the optional
  screenshot test). The web game was not changed, so the web gate wasn't rerun.
  Not covered: a real Game Center sign-in and submission. That needs a signed
  build and the App Store Connect IDs.

### Last commit
- See `git log feat/menus-option-a -1`. It's based on main at 2fcf6fd.

### Agent / model + time
- Claude Code (claude-fable-5-1), Oct 30, 2026.


## Before the fresh repo (to 2026-11-02)

PR numbers and commit hashes below belong to the old repo, which was deleted when the game moved to
`ndabney562/eugeneicks` with a fresh history.

- Step 1, menus option A: PR #92 merged to main (f80d936, 2026-10-30) after
  iOS CI went green on the macos-26 runner with the newest Xcode. The old
  Xcode 16.4 + iOS 26 simulator mismatch lost or crashed synthesized taps;
  macos-15 runners were unavailable during a GitHub Actions incident.
- Step 2, App Store compliance: PR #93 merged (487894d). Privacy policy,
  build number = commit count, logos painted off Derick's cap (Noah approved),
  docs/APP-STORE.md. Noah has consent from every real person in the game.
- Step 3, polish and weight: PR #94 merged to main (24dca68, 2026-10-30).
  Lazy menu art, JPEG portraits and social card, bundle size budgets.
- Step 4, hygiene: PR #95 merged (ca80e45, 2026-10-30). v0.35.0, versioned
  CHANGELOG, one-off docs in docs/archive/. Live on Pages: version.json says
  v0.35.0 (ca80e45); privacy.html returns 200.
- Gloria and Karen's numbers are intentional (Noah).
- Branches: Noah deleted 67 stale remote branches (2026-10-30). Their
  commit IDs are in ~/Desktop/AI.Stuff/Local.Stuff/eugeneicks-branch-backup-2026-10-30.txt
  (outside the repo) for restoring any of them.
- HUD text overlap: PRs #98 and #99 merged to main (a1d6360, dd0712f; 2026-11-01, Noah approved after the before/after pictures in
  docs/previews/hud-text-overlap/).
- Real sound effects: PR #100 merged to main (1d503ab, 2026-11-01; live on
  Pages, all 18 files served). Nine slots (spray, hit,
  pop, splat, crit, sneezeWindup, sneeze, boss, purge) play CC0 Freesound
  recordings from `public/assets/sfx/`, loaded after the title shows, synth as
  fallback. Noah said "least annoying and most widely appealing", so Claude
  picked by length and harshness. Sources in docs/ASSETS.md. Kenney.nl blocks
  automated downloads, so nothing came from there.

- App Store screenshots (2026-11-01): `npm run screenshots:appstore` draws title,
  spray, Crystal, Sinus Purge, Locker and Discharge Summary at 6.9" and 6.5"
  as JPEG (no alpha). Copies and a contact sheet are in
  `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-app-store-screenshots/`.
- EUGENEICKS rebrand (2026-11-01, branch `feat/eugeneicks-rebrand`, PR #103):
  new name everywhere, Noah's icon, every provider, scribe and the boss renamed
  (old → new table in docs/ASSETS.md; ids unchanged so saves carry over), and
  Noah's redrawn title poster (1600×900) plus social card. Screenshots on the
  Desktop were redrawn with the new poster and names.

- Flat-cartoon menu art (PR #104) and PA Jin, the 12th provider (PR #105),
  merged 2026-11-01 and live on Pages (d60c13e). Jin's design and numbers: docs/PROVIDERS-BALANCE.md
  and `BALANCE.jin`. Source art and cutting scripts:
  `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-rebrand/`.

- Website Leaderboard is live (2026-11-01): `worker/` deployed to Noah's Cloudflare
  account (free plan) at https://eugeneicks-leaderboard.eugeneicks.workers.dev, D1 database
  `eugeneicks-leaderboard-db`. Redeploy with `cd worker && npx wrangler deploy` (Noah's Mac is
  logged in). The web game posts there by default (`DEFAULT_API_URL` in src/core/leaderboard.ts);
  the iPhone app doesn't post (Game Center only). Tests set the URL to `off` so they
  never post to the live board. Privacy policy updated to match.
- Game Center kit (PR #108): 34 badge images, points and paste table in
  `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-game-center/`; `scripts/upload.py`
  creates them through the App Store Connect API. Blocked: Noah's Apple ID isn't in the paid
  Apple Developer Program yet (needed for App Store Connect, Game Center, TestFlight).
- Twin-stick controls (PR #110, f2c9905). Website leaderboard live (PR #111, f32c98f).
- Branch cleanup 2026-11-01: merged local branches deleted, old worktree in
  Trash; SHAs in `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-branch-backup-2026-11-01.txt`.
  Remote deletes were blocked by the auto-mode classifier; Noah runs
  `git push origin --delete ...` himself.
