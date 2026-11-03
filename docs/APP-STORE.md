# App Store checklist

Status as of Oct 30, 2026. **[Noah]** marks steps only Noah can do (Apple account, signing, consent).

## Done in the repo
- Privacy manifest `ios/Eugeneicks/Resources/PrivacyInfo.xcprivacy`: no tracking, no collected data.
- Privacy policy: https://ndabney562.github.io/eugeneicks/privacy.html (`public/privacy.html`,
  live once main deploys). Linked from Settings → About.
- Build number = commit count on HEAD (`scripts/ios-build-number.sh`, an Xcode build phase), so every
  archive from main is higher than the last. Version (`MARKETING_VERSION`) is set by hand.
- `ITSAppUsesNonExemptEncryption = NO` in `ios/Config/Info.plist`: no export-compliance question per upload.
- No team or brand logos in the art: the logos on Derick's cap are painted out of `title.jpg` and
  `social-card.jpg`.
- Game Center entitlement; IDs to create are in `docs/GAME-CENTER.md`.
- Consent: Noah has OK'd it with everyone the game depicts or names (confirmed Oct 30, 2026).
  Noah approved the painted cap the same day.

## Store page (filled 2026-11-03 through the API)
- Done by Claude with the App Manager key: subtitle, description, keywords, promotional text, support/marketing/privacy
  URLs, copyright "2026 STAN Gaming", Games › Action + Casual, age rating answers below, no third-party content, free,
  United States only, 6 screenshots at each of the 3 sizes. Scripts and the approved copy (`listing.json`):
  `~/Desktop/AI.Stuff/Apps.Games/Local.Stuff/eugeneicks/app-store-listing/` (`listing.py <step>`, `screenshots.py`).
- iOS version is 1.0 (App Store version record "1.0"); the web build keeps its own version.
- Still Noah's (not in the API): App Privacy "Data Not Collected", App Review contact details, the final Submit.

## Before the first upload
1. **[Noah] App Store Connect record.** Bundle ID `com.ndabney562.eugeneicks`, name "EUGENEICKS"
   (must be unique on the store), primary category Games › Action.
2. **[Noah] URLs.** Privacy Policy URL: the page above. Support URL (required):
   https://github.com/ndabney562/eugeneicks/issues, or an email page if you prefer.
3. **[Noah] App Privacy answers:** "Data Not Collected". Game Center scores go to Apple, and the iCloud copy
   of the saves lives in the player's own iCloud account (key-value storage); Apple says developers don't
   disclose data Apple collects or that stays in the user's iCloud.
4. **[Noah] Age rating questionnaire** (Apple computes the rating from these):
   | Question | Answer | Why |
   |---|---|---|
   | Cartoon or Fantasy Violence | Frequent/Intense | spraying germs is the whole game |
   | Profanity or Crude Humor | Infrequent/Mild | 10 patient lines in `src/data/patients.ts` |
   | Alcohol, Tobacco, or Drug Use or References | Infrequent/Mild | smoking and medication jokes |
   | Medical/Treatment Information | Infrequent/Mild | joke prescriptions, not advice |
   | Everything else (gambling, sexual content, horror, user-generated content, web access) | None/No | |
   Expect 13+. Removing the profanity would likely lower it.
5. **Screenshots, landscape** (3 to 10 each). `npm run build && npm run screenshots:appstore` draws six scenes
   (title, spray, boss, Sinus Purge, Locker, Discharge Summary) at all three sizes into `output/app-store/` as JPEGs
   (App Store Connect turns away PNGs with an alpha channel). Noah picks which to upload:
   | Display | Size (px) | Simulator |
   |---|---|---|
   | 6.9" | 2868 × 1320 | iPhone Pro Max |
   | 6.5" | 2688 × 1242 | iPhone 11 Pro Max or XS Max |
   | 13" iPad | 2752 × 2064 | iPad Pro 13" (M5) |

## TestFlight (Noah, about 20 minutes the first time)
1. Xcode → Eugeneicks target → Signing & Capabilities: pick your Team. Keep Game Center on.
2. Create the Game Center leaderboards and achievements in App Store Connect from `docs/GAME-CENTER.md`.
3. Select "Any iOS Device", then Product → Archive (from main, so the build number is new).
4. Organizer → Distribute App → App Store Connect → Upload.
5. App Store Connect → TestFlight: when the build finishes processing (~15 min), add yourself as an
   internal tester and install it from the TestFlight app.
