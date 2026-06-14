# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

Read the exact versioned Expo docs before writing any code: https://docs.expo.dev/versions/v54.0.0/

## Stack

- Expo SDK **54** — must stay pinned to 54.x to match the user's Expo Go client (Android v54.0.8)
- React 19.1.0, React Native 0.81.5
- No TypeScript — plain JavaScript (`.js`)
- Navigation: React Navigation v7 (native-stack + bottom-tabs)
- State: React Context only (`src/context/AppContext.js`) — no Redux/Zustand

## Dev commands

```bash
# `npx` is not in PATH — use node directly:
node node_modules/expo/bin/cli start          # LAN mode for Expo Go (Android device)
node node_modules/expo/bin/cli start --tunnel # tunnel mode when LAN fails
node node_modules/expo/bin/cli start --web    # web preview in browser (http://localhost:8081)

# Install new packages — MUST use expo CLI to resolve SDK-54-compatible versions:
node node_modules/expo/bin/cli install <package>
```

The user previews on a physical Android device via **Expo Go**. No simulator/emulator is set up. Web mode (`--web`) is used for quick visual testing in Chrome.

## Architecture

### Navigation tree
```
App.js
└── AppProvider (context)
    └── NavigationContainer
        └── RootNavigator (Stack)
            ├── OnboardingScreen   ← shown only on first launch
            └── MainTabs (BottomTab)
                ├── TodayScreen    ☀️
                ├── ChallengeScreen 🏆
                └── HistoryScreen  📊
```

`RootNavigator` reads `@onboarded` from AsyncStorage after `AppContext` finishes loading. If not set, Onboarding is first in the stack. `OnboardingScreen` calls `navigation.replace('Main')` and saves `@onboarded = true` when done.

### State management — `src/context/AppContext.js`

Single context (`useApp()`) holds all app state. Three pieces of state, each auto-persisted to AsyncStorage via `useEffect`:

| State | AsyncStorage key | Shape |
|-------|-----------------|-------|
| `habits` | `@habits` | `Habit[]` |
| `completions` | `@completions` | `{ 'YYYY-MM-DD': { [habitId]: count } }` |
| `challenge` | `@challenge` | `Challenge \| null` |

`isReady` ref guards the auto-save effects so they don't fire during initial load from storage.

### Data models

```js
// Habit
{ id: string, name: string, icon: string, type: 'binary'|'count', target: number, createdAt: ISO }

// Challenge
{ id: string, name: string, habitIds: string[], durationDays: number, startDate: 'YYYY-MM-DD', status: 'active'|'completed', completedAt?: ISO }

// Completion entry — stored as count (binary habits use 1/0, count habits use actual count)
completions['2025-01-15']['habit-id'] = 2
```

### Platform guards

`expo-haptics` and `expo-notifications` are no-ops on web — all utils in `src/utils/haptics.js` and `src/utils/notifications.js` gate on `Platform.OS === 'web'`. `expo-av` has web support but requires sound files to exist.

### Sound files

`src/utils/sounds.js` loads from `assets/sounds/ding.mp3` and `assets/sounds/celebrate.mp3` with a silent try/catch. Drop valid MP3s there to enable sound; app works haptics-only without them.

## Upgrading SDK

Do **not** upgrade `expo` beyond `~54.0.0` without also updating the Expo Go client on the device. React Navigation v7 requires `react-native-screens ~4.16.0` — do not upgrade screens independently.
