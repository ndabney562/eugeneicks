# iCloud Saves Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the iPhone/iPad app, saved progress follows the player's Apple ID: a second device or a reinstall picks up records, unlocks, kills and balances, and nothing earned on either device is lost.

**Architecture:** The game owns the saves and the merge rule (TypeScript). The app only carries an opaque JSON copy between the game and `NSUbiquitousKeyValueStore`. The game posts `{type:'cloudSave', gen, save}` with every snapshot. The app sends the cloud copy back with `window.eugeneicksNative.applyCloud(save, gen)` when it has one the game hasn't seen: at launch, after an external iCloud change, and after the page reloads. The `gen` counter stops a stale pre-merge copy from overwriting the cloud.

**Tech Stack:** TypeScript, Vitest, Playwright, Swift 6 / SwiftUI, XCTest (EugeneicksKit).

**Spec:** HANDOFF.md "In progress → iCloud saves" plus the draft `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-cloud-save-draft.ts` (merge rules). This plan is the spec of record for anything the draft leaves open.

## Global Constraints

- Merge rule: records, kills and lifetime totals take the max. Achievements and `owned` are a union. Spendable balances (`credits`, `nps`, `bank`) and choices (`specialty`, `startTool`) come from the copy with the larger `at`.
- These are synced: `eugeneicks.save.v3`, `eugeneicks.progress.v1` and `eugeneicks.achievements.v1`. These stay on the device: settings, the saved shift, and the leaderboard name.
- Merge only while the Title scene is active, never mid-shift or in another menu. If a copy arrives at another time, keep it pending and apply it at the next Title CREATE.
- In a browser nothing changes (all of this is behind `NATIVE`).
- Entitlement `com.apple.developer.ubiquity-kvstore-identifier` = `$(TeamIdentifierPrefix)$(CFBundleIdentifier)`.
- The command JS embeds only JSON re-serialised by `JSONSerialization` (no raw strings), so no value can break out of the call.

## Review Focus

1. The launch race: the game posts its pre-merge copy (gen 0) before `ready`, while a cloud copy is waiting. The app must not upload it. Test: `CloudSaveSyncTests.testIgnoresPostsWhileACopyIsPending`.
2. The page reloads (the web process is killed): the game's gen resets to 0. The app must resend so uploads resume. Test: `testResendsAfterGameReset`.
3. The first ever launch, with no cloud copy: the game's gen-0 post must upload. Test: `testUploadsWhenCloudIsEmpty`.
4. A damaged or newer-format cloud copy (`v` not 1) leaves the local saves untouched. Unit test `parseCloud rejects other versions` plus `applyCloud ignores junk` in native.
5. A merge that changes nothing must not restart the Title (that would loop with `ready`). Unit test `applyCloud reports no change for identical copies`, and e2e checks a single restart.

---

### Task 1: Merge module + reload hooks (web)

**Files:**
- Create: `src/core/cloudSave.ts` (port of the draft)
- Modify: `src/core/progress.ts` (add `reloadProgress(): void`, which re-runs `load()` into `state`)
- Modify: `src/core/achievements.ts` (add `reloadAchievements(): void`, which clears `unlocked` and refills it from `load()`)
- Test: `tests/unit/cloudSave.test.ts`

**Interfaces:**
- Produces:
  - `CloudSave`
  - `mergeCloud(mine, theirs): CloudSave`
  - `localCloud(): CloudSave`
  - `parseCloud(v: unknown): CloudSave | undefined`
  - `applyCloud(theirs: CloudSave): boolean`, which also calls `reloadProgress()` and `reloadAchievements()` when anything changed
  - `noteLocalChanges(now = Date.now()): void`. It replaces the draft's `touchLocal`. It sets `at` to `now` only when the synced content (save + progress + achievements, `at` excluded) differs from the signature stored in `eugeneicks.cloud.sig`, then stores the new signature. `applyCloud` also stores the merged signature.

- [ ] Tests:
  - Records take the max per field.
  - Kills, locker and staff take the max.
  - `owned` and achievements are unions.
  - Balances come from the larger `at`.
  - The daily record uses the later date's best; on the same date it takes the max of each field.
  - `parseCloud` rejects `v: 2` and non-objects.
  - `applyCloud` returns false for an identical copy.
  - `applyCloud` makes `progress()` show the merged credits without a page reload.
  - `noteLocalChanges` bumps `at` only when content changed.
- [ ] Run `npx vitest run tests/unit/cloudSave.test.ts`. It should fail, then pass after the implementation.
- [ ] Commit `feat: cloud save merge for the game's saves`.

### Task 2: Bridge in the game (web)

**Files:**
- Modify: `src/core/native.ts`
- Test: `tests/e2e/native.spec.ts` (new test)

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - Posts `{ type: 'cloudSave', gen: number, save: CloudSave }` right after every `snapshot`. Before posting, it calls `noteLocalChanges()`.
  - `api.applyCloud(value: unknown, gen: number): void`:
    - It always records `gen` (as long as the number isn't smaller than the last one).
    - If `parseCloud` fails, it posts the cloudSave and stops.
    - If the Title is active, it applies now. If that changed anything, it restarts the Title; Title CREATE then posts the snapshot, cloudSave and `ready`. Otherwise it posts the cloudSave with the new gen.
    - If the Title isn't active, it keeps the copy pending. The Title CREATE handler applies the pending copy before it posts.

- [ ] e2e test `native host merges an iCloud copy on the title and reports it back`:
  1. Set local progress `{credits: 5, earned: 5}`.
  2. Call `applyCloud({v:1, at: Date.now()+1000, progress:{credits: 40, earned: 90, ...}}, 1)`.
  3. Expect `progress().credits === 40` and `earned === 90`.
  4. Expect the last posted cloudSave to have `gen === 1`.
  5. Expect the Title to have restarted once.
  6. A copy sent while the Game scene is active is applied only after `toTitle`.
- [ ] Run `npx playwright test tests/e2e/native.spec.ts`.
- [ ] Commit `feat: game side of iCloud saves`.

### Task 3: Bridge types + sync logic (EugeneicksKit)

**Files:**
- Modify: `ios/EugeneicksKit/Sources/EugeneicksKit/Bridge/BridgeMessage.swift`. Add `case cloudSave(json: Data, gen: Int)`. `json` is the `save` object re-serialised with sorted keys.
- Modify: `ios/EugeneicksKit/Sources/EugeneicksKit/Bridge/BridgeCommand.swift`. Add `case applyCloud(json: Data, gen: Int)`, which runs `applyCloud(<json>, <gen>)`. If the data doesn't parse as a JSON object, it runs `refresh()` instead.
- Create: `ios/EugeneicksKit/Sources/EugeneicksKit/Store/CloudSaveSync.swift`:
  - `protocol KeyValueStoring { func data(forKey:) -> Data?; func set(_: Data?, forKey:) }`
  - `final class MemoryKeyValueStore`, for tests.
  - `@MainActor final class CloudSaveSync` with:
    - `init(store: KeyValueStoring, key = "saves.v1")`, which sets `pending = store has data`
    - `func received(json: Data, gen: Int)`, which writes only if `!pending && gen >= sentGen` and the data differs
    - `func commandForGame() -> BridgeCommand?`, which returns `.applyCloud` with `sentGen += 1` and clears `pending`
    - `func cloudChanged()` and `func gameReset()`, which each set `pending = true`
- Modify: `ios/EugeneicksKit/Sources/EugeneicksKit/Store/GameStore.swift`:
  - Optional `cloud: CloudSaveSync?` in `init`.
  - On `.ready`, send `cloud.commandForGame()` if there is one.
  - On `.cloudSave`, call `cloud.received`.
  - `gameDidReset()` calls `cloud.gameReset()`.
  - New `public func cloudChanged()`, which calls `cloud.cloudChanged()` and sends the command (queued if the game isn't ready).
- Test: `ios/EugeneicksKit/Tests/EugeneicksKitTests/CloudSaveTests.swift`. Covers the Review Focus 1–3 tests, plus decoding `cloudSave` and the `applyCloud` JS shape.

- [ ] Write the tests, then run `swift test --package-path ios/EugeneicksKit`. They should fail, then pass after the implementation.
- [ ] Commit `feat: iCloud sync logic in EugeneicksKit`.

### Task 4: App wiring + entitlement

**Files:**
- Create: `ios/Eugeneicks/Services/UbiquitousStore.swift`, an `NSUbiquitousKeyValueStore` conforming to `KeyValueStoring`. It calls `synchronize()` at start, observes `didChangeExternallyNotification`, and calls `store.cloudChanged()` on the main actor.
- Modify: the app's `GameStore` construction (`ios/Eugeneicks/App/EugeneicksApp.swift`) to pass `CloudSaveSync(store: NSUbiquitousKeyValueStore.default)`.
- Modify: `ios/Config/Eugeneicks.entitlements` to add the kvstore key.
- Modify: `docs/CHANGELOG.md` and `docs/APP-STORE.md` (privacy: data synced through the user's own iCloud).

- [ ] Run `xcodebuild test -project ios/Eugeneicks.xcodeproj -scheme Eugeneicks -destination "id=<booted simulator>" CODE_SIGNING_ALLOWED=NO`. It should pass.
- [ ] Run the full web gate (`npm run test:all`), but not at the same time as xcodebuild.
- [ ] Commit, push and open the PR. Noah checks on a real iPhone + iPad (KVS doesn't sync in the simulator) before merging.
