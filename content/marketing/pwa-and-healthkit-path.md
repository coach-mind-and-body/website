# PWA polish vs App Store + Health data

## What we shipped (PWA)

- Improved `manifest.json` (name, theme, shortcuts, screenshots)
- Install / Add-to-Home-Screen prompt (`HabitTrackerInstallPrompt`)
  - Android/Chrome: Install button
  - iPhone Safari: Share → Add to Home Screen steps
- Offline fallback page + service worker v2
- Brand theme color (forest green) + Apple touch icon metadata

**Test on phone (HTTPS production):**

1. Open `/habit-tracker` or `/habit-tracker-invite`
2. **iPhone:** Safari → Share → Add to Home Screen  
3. **Android:** Install banner or browser menu → Install app  
4. Open from home screen → should feel fullscreen (no browser chrome)

**Limits of PWA (especially iOS):**

- No **Apple Health / HealthKit** access
- No **Google Fit / Health Connect** from a pure website in the same way as native
- Background sync & push are restricted on iOS
- Still “web tech” under the hood — Apple will never treat it as a full App Store health app

---

## What you want: App Store app that **reads health data**

That **requires a native (or hybrid native) iOS app** with **HealthKit**.

| Capability | PWA | App Store (HealthKit) |
|------------|-----|------------------------|
| Home screen icon | Yes | Yes |
| Habits / macros UI | Yes | Yes |
| Read steps, weight, sleep, HR, workouts | **No** | **Yes** (with user permission) |
| Write workouts back to Apple Health | **No** | **Yes** (optional) |
| Listed on App Store | No | Yes |

### Recommended stack for *your* codebase

**Expo (React Native) + HealthKit** (via a maintained module, e.g. `react-native-health` / Expo config plugin):

1. Reuse your **same APIs** (login, habits, calories, fitness)
2. Rebuild UI in RN (not a WebView for HealthKit surfaces)
3. Request HealthKit types you need, e.g.:
   - Steps, active energy
   - Body mass / weight
   - Sleep analysis
   - Heart rate (if useful)
   - Workouts
4. Map Health data → habit checks / fitness log / dashboards
5. App Store: privacy nutrition labels, HealthKit usage description, account deletion

**Ballpark:** 2–4 months for solid v1 (habits + auth + core HealthKit reads + App Store), longer for full parity + polish.

### Not required for HealthKit

- Apple Watch app (nice later)
- Full rewrite of your web site

### Required for App Store + Health

- Apple Developer account ($99/yr)
- Privacy Policy covering health data
- Explicit purpose strings (“We use step count to…”)
- Review can be strict for health-related apps — be clear you’re **coaching/wellness tools**, not medical diagnosis

---

## Suggested sequence

1. **Now:** Ship & promote PWA (ads → `/habit-tracker-invite` → install)  
2. **Validate:** people actually use habits/macros daily  
3. **Then:** Expo iPhone app + HealthKit for steps/weight/sleep  
4. **Later:** optional Watch complications  

PWA wins distribution and testing; HealthKit is the reason to go native.
