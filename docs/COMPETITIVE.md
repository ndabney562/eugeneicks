# Competitive scorecard

Noah's goal (2026-11-01): make EUGENEICKS the best app in its space. "Best" isn't a single number, so this
file tracks it as a checklist of things players and reviewers measure. Each row is either something EUGENEICKS
already leads on, or a gap with a plan. Ratings, downloads and revenue can't be won with code; they come after
launch, so they aren't scored here.

**The space:** single-player top-down horde/wave survival games on iPhone (and the web). Benchmark set,
checked 2026-11-01 from press and store coverage (sources below): Vampire Survivors, Survivor.io, Brotato,
20 Minutes Till Dawn, Archero 2, Magic Survival. This is a curated set of the most-recommended titles, not a
measured top-six ranking.

## Scorecard

| # | What players measure | Best in the set | EUGENEICKS | Status |
|---|---|---|---|---|
| 1 | Price and pressure | Brotato and 20MTD: paid once, no ads. VS: free, optional ads | Free, no ads, no purchases, no energy timer | **Leads** |
| 2 | Time to play | Store download (hundreds of MB) | Plays instantly in a browser (3.7 MB) or as an app; works offline | **Leads** |
| 3 | Touch controls | Auto-aim with one thumb (Brotato, Survivor.io) | Auto-aim SPRAY button, or twin-stick (PR #110); keyboard and mouse on desktop | **Leads** |
| 4 | Game controllers | VS, 20MTD, Brotato support controllers | Web: done (this PR). iPhone app: needs a device check with a controller | **Gap, closing** |
| 5 | iPad | VS, Brotato run on iPad | Runs full-screen in landscape on every iPad; HUD and Locker checked at iPad mini, 11" and 13"; 13" iPad screenshots | **Matches** |
| 6 | Cloud saves | VS: Game Center cloud save | Saves stay on one device | **Gap** |
| 7 | Portrait and landscape | VS plays in both | Landscape; portrait rotates the canvas | Partial |
| 8 | Social | Leaderboards, achievements | Game Center (34 achievements, 3 boards; upload pending), web leaderboard, Today's Shift | Matches once uploaded |
| 9 | Accessibility | Options menus | Separate sound and music, no-shake, auto-refill, haptics, LARGE TEXT; attack wind-ups show a "!" as well as a red flash. No full colourblind palette | Matches |
| 10 | Languages | VS: many | English only | **Gap** (needs Noah: which languages) |
| 11 | Personality | Each has a strong theme | A clinic of Noah's coworkers, germs, bosses with jokes; unique in the genre | **Leads** |
| 12 | Content depth | VS: hundreds of weapons and characters | 12 providers, staff, tools, 4 bosses, Flu Season, daily shift | Behind (content, not code) |

## Plan, in order

1. Controllers (row 4): web done; check the app on Noah's iPhone with a controller, then add the App Store
   "game controller" Info.plist keys.
2. iPad (row 5): done.
3. Cloud saves (row 6): sync the save through iCloud key-value storage in the app.
4. ~~Accessibility (row 9): a larger-text option and germ shapes that don't rely on colour.~~ Done 2026-11-03.
5. Languages (row 10) and content (row 12): Noah's call.

Per AGENTS.md, a Gemini comparison in Antigravity should review this before big gameplay changes.

## Sources (checked 2026-11-01)

- [TouchArcade: Vampire Survivors mobile review](https://toucharcade.com/2022/12/09/vampire-survivors-mobile-review-controller-cloud-save-sync-dlc-unlock-iphone-ipad-pro/) (controllers, cloud save, iPad)
- [TouchArcade: 20 Minutes Till Dawn controller support and offline](https://toucharcade.com/2022/09/20/20-minutes-till-dawn-mobile-controller-support-offline-vampire-survivors-update/)
- [TouchArcade: Brotato premium release on iOS](https://toucharcade.com/2023/03/28/top-down-roguelite-shooter-brotato-is-out-now-on-ios-and-android-as-a-premium-release/)
- [Kimola: Survivor.io App Store feedback](https://kimola.com/reports/insightful-survivor-io-player-feedback-analysis-report-app-store-us-140531) and [JustUseApp: Archero reviews](https://justuseapp.com/en/app/1453651052/archero/reviews) (energy, ads, pay-to-win complaints; small, aggregated samples)
- [Mobile Game Report: games like Survivor.io (2026)](https://www.mobilegamereport.com/articles/best-games-like-survivor-io-2026) and [Pocket Gamer: best iOS survival games](https://www.pocketgamer.com/ios/best-ios-survival-games/)
- [WebKit bug 269292](https://bugs.webkit.org/show_bug.cgi?id=269292): controllers only reach a WKWebView that is first responder
