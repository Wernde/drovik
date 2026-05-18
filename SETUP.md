# Drovik — Setup Instructions

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 15+ (Mac only) or Expo Go app
- Android: Android Studio or Expo Go app

## 1. Install dependencies

```bash
cd drovik
npm install
```

## 2. Add missing Expo dependencies

```bash
npx expo install react-native-gesture-handler react-native-safe-area-context react-native-screens
```

## 3. Start the development server

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

## 4. Run on simulators

```bash
# iOS simulator (Mac only)
npx expo run:ios

# Android emulator
npx expo run:android
```

---

## Project Structure

```
drovik/
├── App.tsx                        ← Entry point, DB init, navigation mount
├── app.json                       ← Expo config
├── package.json
├── babel.config.js
├── tsconfig.json
└── src/
    ├── theme/
    │   └── index.ts               ← Colors, typography, spacing tokens
    ├── types/
    │   └── index.ts               ← All TypeScript interfaces
    ├── database/
    │   ├── db.ts                  ← SQLite schema, all CRUD operations
    │   └── seed.ts                ← 20 exercises with coaching cues
    ├── store/
    │   └── index.ts               ← Zustand: userStore + workoutStore
    ├── navigation/
    │   └── index.tsx              ← Stack + Tab navigators
    ├── components/
    │   ├── Button.tsx             ← Primary / ghost / destructive variants
    │   ├── SetRow.tsx             ← Core logging row with flash animation
    │   ├── RestTimer.tsx          ← Sticky countdown bar
    │   └── ExerciseCard.tsx       ← Library list item
    └── screens/
        ├── Onboarding.tsx         ← Carousel + quick setup
        ├── Home.tsx               ← Dashboard with sessions + templates
        ├── ActiveWorkout.tsx      ← Core logging screen ← CENTREPIECE
        ├── ExerciseLibrary.tsx    ← Search + muscle filter
        ├── ExerciseDetail.tsx     ← YouTube search + cues + history
        ├── ProgramBuilder.tsx     ← Template creator
        ├── Progress.tsx           ← Charts, PRs, bodyweight
        ├── WorkoutHistory.tsx     ← Past sessions list
        └── Profile.tsx            ← Settings, units, targets
```

---

## Key Architecture Decisions

### Offline-first
All workout data writes to SQLite immediately via `expo-sqlite`. No network call ever blocks the logging flow. The `synced` flag marks rows for future cloud sync when you add Supabase auth.

### State management
- **Zustand `userStore`**: persistent user preferences (unit, goal mode, rest timer)
- **Zustand `workoutStore`**: in-memory active workout state (exercises, sets, timer)
- **SQLite**: persisted history, library, PRs, templates

### Navigation
- Root Stack: Onboarding → Main (tabs) → ActiveWorkout (full-screen modal) → ExerciseDetail
- Bottom tabs: Home · Workout · Progress · Library · Profile
- `ExerciseLibraryModal` accepts an `onSelect` callback so it works both standalone and as an exercise picker during active workout

### Set completion flow
1. User taps ✓ on `SetRow`
2. Flash animation fires (80ms lime → dark)
3. `completeSet` updates Zustand store
4. `startRestTimer` triggers `RestTimer` component
5. PR check runs against SQLite
6. If PR beaten: `addPR` → toast fires via `useEffect`

---

## Adding Cloud Sync (Next Step)

1. Create a Supabase project at supabase.com
2. Run the SQL schema from Prompt 6 (backend plan)
3. Add `@supabase/supabase-js` to dependencies
4. In `db.ts`, add a `syncUnsynced()` function that:
   - Queries `WHERE synced = 0`
   - Batch upserts to Supabase
   - Sets `synced = 1` on success
5. Call `syncUnsynced()` in `App.tsx` on `AppState` change to 'active'

## Adding RevenueCat Payments (Next Step)

```bash
npx expo install react-native-purchases
```

1. Create products in App Store Connect + Google Play Console
2. Configure entitlements in RevenueCat dashboard
3. Gate Pro features with `Purchases.getCustomerInfo().entitlements.active['pro']`

---

## Common Issues

| Problem | Fix |
|---|---|
| `expo-sqlite` crashes on startup | Ensure `"expo-sqlite"` is in `app.json` plugins array |
| WebView blank in ExerciseDetail | Add `NSAllowsArbitraryLoads` to `app.json` for iOS dev builds |
| Navigation type errors | Run `npx tsc --noEmit` and ensure all screen params match `RootStackParamList` |
| Rest timer stops on lock screen | `expo-task-manager` + `expo-background-fetch` needed for background tasks in production |
| Keyboard covers set inputs | `KeyboardAvoidingView` is already added to `ActiveWorkout.tsx` |
