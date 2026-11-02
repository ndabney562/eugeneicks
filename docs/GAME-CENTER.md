# Game Center setup (App Store Connect)

The iPhone app reports to Game Center on its own (`ios/Eugeneicks/Services/GameCenterService.swift`).
Nothing shows up until these IDs exist in App Store Connect → the app → Services → Game Center.
The IDs must match exactly. Generated from `src/data/difficulties.ts` and `src/data/achievements.ts`.
Add a matching entry here and in App Store Connect when you add an achievement or difficulty.

## Leaderboards (Classic, Best score, High to Low, Integer)

| ID | Name |
|---|---|
| `eugeneicks.best.walkIn` | Walk-In |
| `eugeneicks.best.urgent` | Urgent |
| `eugeneicks.best.trauma` | Trauma Center |

Today's Shift is not on Game Center: it resets at local midnight, and Game Center's recurring leaderboards reset on a fixed UTC schedule.

## Achievements (34, 945 points)

Points total 945 of the 1,000 allowed, leaving room for new ones. `miracleCure` is hidden: the quest is a secret. "Achievable more than once" is No for all.
Images (1024×1024 PNG, one per ID, same cartoon style as the menus) and a paste-ready CSV live outside the repo in `~/Desktop/AI.Stuff/Apps & Games/Local.Stuff/eugeneicks-game-center/`, with the scripts that made them.

| ID | Points | Name | How (pre-earned) | Earned |
|---|---|---|---|---|
| `eugeneicks.ach.firstKill` | 10 | Hand Hygiene Compliant | Disinfect your first germ | Disinfected your first germ. |
| `eugeneicks.ach.perfectPour` | 20 | Steady Hands | Land a Perfect Pour | Landed a Perfect Pour. |
| `eugeneicks.ach.honk` | 20 | HRRRNNNKKK | Hit 5 germs with one Sinus Purge | Hit 5 germs with one Sinus Purge. |
| `eugeneicks.ach.flipper` | 20 | Board-Certified Flipper | Flip a Spore Pod onto its back | Flipped a Spore Pod onto its back. |
| `eugeneicks.ach.spotless` | 20 | Spotless Record | Finish a round without getting hurt | Finished a round without getting hurt. |
| `eugeneicks.ach.streak25` | 30 | On a Roll | Reach a 25 Sanitation Streak | Reached a 25 Sanitation Streak. |
| `eugeneicks.ach.gesundheit` | 30 | Gesundheit | Disinfect 10 Sneezers in one shift | Disinfected 10 Sneezers in one shift. |
| `eugeneicks.ach.doctorsOrders` | 10 | Doctor's Orders | Rest on an exam table | Rested on an exam table. |
| `eugeneicks.ach.rxStrength` | 20 | Prescription Strength | Fully upgrade a tool at the Compounding Station | Fully upgraded a tool at the Compounding Station. |
| `eugeneicks.ach.upstairs` | 10 | Upstairs Privileges | Open the upstairs | Opened the upstairs. |
| `eugeneicks.ach.secondOpinion` | 10 | Second Opinion | Appeal a Supply Requisition | Appealed a Supply Requisition. |
| `eugeneicks.ach.claimDenied` | 10 | Out of Network | Get a claim denied (sorry) | Got a claim denied. Sorry. |
| `eugeneicks.ach.pendingApproval` | 10 | Pending Approval | Grab a Prior Authorization | Grabbed a Prior Authorization. |
| `eugeneicks.ach.wallBanger` | 20 | Brake Check | Make a Bacillus Bulldozer charge into a wall | Made a Bacillus Bulldozer charge into a wall. |
| `eugeneicks.ach.cultureShock` | 20 | Culture Shock | Disinfect a Mother Culture | Disinfected a Mother Culture. |
| `eugeneicks.ach.remediation` | 20 | Mold Remediation | Disinfect a Mold Spot | Disinfected a Mold Spot. |
| `eugeneicks.ach.airDried` | 10 | Air Dried | Blast germs with a bathroom hand dryer | Blasted germs with a bathroom hand dryer. |
| `eugeneicks.ach.sterilized` | 20 | Sterile Field | Cook a germ in the Lab autoclave | Cooked a germ in the Lab autoclave. |
| `eugeneicks.ach.radiology` | 10 | Radiology Consult | Fire the X-ray | Fired the X-ray. |
| `eugeneicks.ach.snackBreak` | 10 | Snack Break | Buy something from the vending machine | Bought something from the vending machine. |
| `eugeneicks.ach.meetingAdjourned` | 40 | Meeting Adjourned | Defeat Crystal the Practice Manager | Defeated Crystal the Practice Manager. |
| `eugeneicks.ach.discharged` | 30 | Discharged | Defeat Patient Zero before he leaves | Defeated Patient Zero before he left. |
| `eugeneicks.ach.ama` | 10 | Against Medical Advice | Let Patient Zero walk out | Let Patient Zero walk out. |
| `eugeneicks.ach.sensitivityReport` | 40 | Sensitivity Report | Defeat Methicillin the Unkillable | Defeated Methicillin the Unkillable. |
| `eugeneicks.ach.herdImmunity` | 40 | Herd Immunity | Defeat the Influenza Twins | Defeated the Influenza Twins. |
| `eugeneicks.ach.exitInterview` | 40 | Exit Interview | Defeat Crystal as Theo | Defeated Crystal as Theo. |
| `eugeneicks.ach.delegation` | 30 | Delegation | Scribes clean up 5 patients in one shift | Your scribes cleaned up 5 patients in one shift. |
| `eugeneicks.ach.doubleShift` | 30 | Double Shift | Reach round 10 | Reached round 10. |
| `eugeneicks.ach.attending` | 75 | Attending Physician | Reach round 20 | Reached round 20. |
| `eugeneicks.ach.clockedIn` | 30 | Clocked In | Finish a Today's Shift | Finished a Today's Shift. |
| `eugeneicks.ach.traumaTen` | 50 | Level One Trauma | Reach round 10 on Trauma Center | Reached round 10 on Trauma Center. |
| `eugeneicks.ach.darkShift` | 50 | Working in the Dark | Reach round 8 during a Power Outage | Reached round 8 during a Power Outage. |
| `eugeneicks.ach.miracleCure` | 100 (hidden) | The Miracle Cure | Read the old magazines. All of them. Then call. | Found the Miracle Cure. |
| `eugeneicks.ach.shiftComplete` | 50 | Shift Complete | Clock out. Actually clock out. | Clocked out. Actually clocked out. |
