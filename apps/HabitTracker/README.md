# Habit Tracker (iOS)

SwiftUI app + WidgetKit. Written on Windows — **open it on your Mac in Xcode**, then Archive to TestFlight.

Same workflow as before: push from this repo, `git pull` on the Mac, open the `.xcodeproj`.

## On the Mac

### 1. Get the code

If the repo is already on the Mac:

```
cd path/to/website
git pull origin main
```

First time:

```
git clone https://github.com/coach-mind-and-body/website.git
```

You only need `apps/HabitTracker/`. No `node_modules`, Homebrew, CocoaPods, or Expo. The app talks to production: `https://mindandbodyresetcoach.com`.

### 2. Open Xcode

Mac App Store → **Xcode** (free, ~10–15 GB) if it is not installed.

Open:

`apps/HabitTracker/HabitTracker.xcodeproj`

Scheme should be **HabitTracker** (not the widget). Destination: an iPhone simulator or a plugged-in iPhone.

### 3. Paid Apple team ($99)

Lee Anne paid the Developer Program fee. Enrollment can take **24–48 hours** after payment. Until Apple emails that the membership is active, Xcode only shows **Personal Team** and Archive will fail.

Xcode → Settings → Accounts → the Apple ID that is **on the paid team**.

- If **Lee Anne enrolled** under her Apple ID: she invites you at [App Store Connect → Users and Access](https://appstoreconnect.apple.com/access/users) as **Admin** or **App Manager**, and at [developer.apple.com](https://developer.apple.com/account) → People. Then you add **her** Apple ID (or accept the invite and sign in with the Apple ID she added).
- If the $99 went on **your** Apple ID: sign in with that ID. Team should be an organization / paid team, **not** “Personal Team”.

Signing & Capabilities (select **both** targets: HabitTracker and HabitTrackerWidget):

| Setting | Value |
|---|---|
| Team | paid team |
| Automatically manage signing | on |
| Bundle ID (app) | `com.mindandbodyreset.habittracker` |
| Bundle ID (widget) | `com.mindandbodyreset.habittracker.widget` |

Do **not** change the bundle IDs. Xcode will create the App ID and turn on HealthKit, Push, App Groups (`group.com.mindandbodyreset.habittracker`), and Sign in with Apple.

### 4. Run it once on a phone (optional but worth it)

Plug in an iPhone → pick it as destination → Run (▶). Sign in with a real Mind & Body Reset email/password (same as the website). Challenge enrollments only show if that email is enrolled.

Testers need **iOS 18+**.

### 5. First-time App Store Connect app

[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Apps → **+** → New App:

- Platform: iOS
- Name: **Mind & Body Reset** (home-screen name is still “Habit Tracker” until we change it)
- Bundle ID: `com.mindandbodyreset.habittracker`
- SKU: `mbr-habittracker`
- User Access: Full Access

Privacy policy URL when asked: `https://mindandbodyresetcoach.com/privacy`

### 6. Archive → TestFlight

1. Destination: **Any iOS Device (arm64)** — not a simulator.
2. Product → **Archive**. Wait for Organizer.
3. **Distribute App** → App Store Connect → Upload → defaults are fine.
4. Processing takes 5–15 minutes. Refresh TestFlight.
5. **Internal testers** (anyone already on the App Store Connect team) can install immediately. No Beta Review.
6. **External testers** (Lee Anne if she is not on the team) need **Beta App Review** (often 24–48h). Faster path: add her as a user on the team, then Internal.

She installs the **TestFlight** app from the App Store, then opens the invite.

Each new upload must bump **Build** (`CURRENT_PROJECT_VERSION` in the project — currently `1`). Version (`MARKETING_VERSION`) can stay `1.0` until App Store.

## If Xcode yells

| Symptom | Fix |
|---|---|
| Team is Personal Team / cannot Archive | Membership not active yet, or you are not invited onto Lee Anne’s team |
| Failed to register bundle ID | Bundle ID already exists on a different Apple team — must use the team that owns it |
| HealthKit / Push / App Groups | Paid team required. Automatic signing should enable them |
| Widget signing | Select the **HabitTrackerWidget** target and set the same paid Team |
| “No accounts with App Store Connect access” | Sign in with the paid-team Apple ID in Xcode Settings → Accounts |
| iOS version | Project targets iOS 18. Use an iOS 18+ sim or phone |

## What’s in the app

Same screens as the PWA:

- **Habits** — Daily Reset + Progress (streak, week, challenges, Lee Anne updates, 3 victories, calendar, trophies). Challenge card + **Join live (Google Meet)** after enroll.
- **Macros** — protein/calories, meal chips, log/delete
- **Recipes** — vault, this-week meal plan, shopping list
- **Fitness** — movement log + workout videos
- **Podcast** — episodes, YouTube play, add episode habits
- **Coach** (floating circle) — thread, recipe share, attachments
- **Profile** (top-right) — sign in (Apple / Google / email), Health, notifications
- Home-screen widget (needs App Groups / paid team)

Do not need: CocoaPods, Expo, Homebrew, or Node to compile or ship TestFlight.
