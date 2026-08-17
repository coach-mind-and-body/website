# Habit Tracker (iOS)

SwiftUI app + WidgetKit. Written on Windows — **open it on your Mac in Xcode**. You do **not** need to pay Apple $99 to look at it, run the Simulator, or tap around.

## What to copy

Easiest: clone or pull the **whole repo** on the Mac.

```
git clone https://github.com/coach-mind-and-body/website.git
```

Or copy only this folder if you prefer AirDrop / USB:

```
apps/HabitTracker/
```

That folder is the entire Xcode project. You do not need `node_modules` or the website to *compile* the iPhone app. The app talks to production: `https://mindandbodyresetcoach.com`.

## What to download on the Mac (free)

| Thing | Cost | Why |
|---|---|---|
| **Xcode** from the Mac App Store | Free | Compiler, Simulator, iPhone run |
| A regular **Apple ID** (Settings → Sign in) | Free | Signing for Simulator / your own phone |
| This repo / `apps/HabitTracker` | Free | The project |

Xcode is large (~10–15 GB). After it installs, open:

`apps/HabitTracker/HabitTracker.xcodeproj`

Then: destination **iPhone 16 Simulator** (or any iOS 18+ sim) → **Run** (▶).

Sign in with a real Mind & Body Reset account (same email/password as the website).

### On your physical iPhone (still free)

1. Plug the phone in.
2. Xcode → Signing & Capabilities → Team → **Add Account** → your personal Apple ID (not a paid program).
3. Change the bundle id if Xcode complains it is taken, e.g. `com.yourname.habittracker.dev`.
4. Run on the device.

**Free “Personal Team” cannot use HealthKit, Push, or App Groups.** If signing fails, uncheck those three capabilities for now. Habits, food, login, and coach chat still work. Widgets and Health need the paid program later.

## What the $99 is *for* (later)

- TestFlight (send the app to Lee Anne / clients)
- App Store
- Real push when the app is **killed** (APNs)
- HealthKit + widgets on a real device with a stable App ID

Until then, the Coach tab can still request notification permission and fire a **local** alert if a reply arrives while the app is open or recently backgrounded.

## What’s in the app

Same screens as the PWA, with a matching bottom bar:

- **Habits** — Daily Reset + Progress (streak, week, challenges, Lee Anne updates, 3 victories, calendar, trophies)
- **Macros** — protein/calories, meal chips, log/delete
- **Recipes** — vault, this-week meal plan, shopping list
- **Fitness** — movement log + workout videos
- **Profile** — sign in (Apple / Google / email), Health, notifications
- **Coach** (circle) — thread, recipe share, attachments
- **Podcast** (circle) — episodes, YouTube play, add episode habits
- Home-screen widget (needs App Groups / paid team)

## If Xcode yells

- **Signing / Team:** pick your personal Apple ID.
- **HealthKit / Push / App Groups not available:** uncheck those capabilities.
- **iOS version:** project targets iOS 18. Use an iOS 18+ simulator.

Do not need: CocoaPods, Expo, Homebrew, Node, or a paid developer account to *see* the app.
