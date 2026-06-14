# Habit Tracker

A mobile habit tracking app built with Expo and React Native.

## Features

- **Create habits** — binary (once/day) or volume-based (e.g. drink water 3×/day)
- **Daily tracking** — check off habits with haptic feedback and animated rewards
- **Challenges** — commit to a 3, 7, or 21-day streak challenge starting from onboarding
- **History & stats** — weekly bar chart, per-habit consistency, activity log
- **Push notifications** — morning and evening reminders to keep streaks alive

## Stack

- Expo SDK 54 / React Native 0.81.5
- React Navigation v7 (native-stack + bottom-tabs)
- AsyncStorage for persistence
- expo-haptics, expo-av, expo-notifications

## Running the app

```bash
npm install

# On a physical Android device via Expo Go:
node node_modules/expo/bin/cli start

# In browser (web preview):
node node_modules/expo/bin/cli start --web
```

> Requires Expo Go v54 on your Android device. Scan the QR code shown in the terminal.

## Adding sounds

Drop `ding.mp3` and `celebrate.mp3` into `assets/sounds/` to enable audio feedback. The app runs in haptics-only mode without them.
