# Project

- **Repo URL:** https://github.com/ndabney562/eugeneicks (public: never commit secrets or personal data)
- **Branch:** main (deploys to GitHub Pages). Work on feature branches, one draft PR per step.
- **Test command:** `npm run build && npm run test:unit && npm run smoke`; when `ios/` changes, also
  `swift test --package-path ios/EugeneicksKit` and `xcodebuild test -project ios/Eugeneicks.xcodeproj -scheme Eugeneicks -destination "id=<booted simulator>" CODE_SIGNING_ALLOWED=NO`.
  Don't run smoke and xcodebuild at the same time.
- **Stack:** Phaser 3.90, TypeScript, Vite, Vitest, Playwright, SwiftUI (iOS, `ios/`)

## Milestones
Goal: an App Store-ready iPhone game. Status from HANDOFF.md and docs/HANDOFF-ARCHIVE.md (2026-11-03).
- [x] Menus
- [x] App Store compliance: privacy policy, build numbers, logos
- [x] Polish and bundle weight
- [x] HUD text overlap fixed
- [x] Real sound effects
- [x] Renamed to Eugeneicks: fresh public repo, new bundle ID, leaderboard moved
- [x] Game controllers, competitive scorecard, iPad support
- [x] Walking feet and bigger title tabs
- [x] App Store screenshots (6.9", 6.5", 13" iPad)
- [ ] iCloud saves (scorecard row 6)
- [ ] Accessibility: larger-text option, germ tells that don't rely on colour (row 9)
- [ ] App Store Connect record and Game Center upload (Noah)
- [ ] Bluetooth controller checked on the iPhone
- [ ] TestFlight build played on a real iPhone
- [ ] Submitted for App Store review
