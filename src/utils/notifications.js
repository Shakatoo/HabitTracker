import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermission() {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDaily(habits) {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Morning check-in at 8am
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good morning! 🌅',
        body: 'Ready to build your habits today?',
      },
      trigger: { hour: 8, minute: 0, repeats: true },
    });

    // Evening nudge at 8pm
    const firstHabit = habits?.[0]?.name ?? 'your habits';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Don't break your streak! 🔥",
        body: `Have you done ${firstHabit} yet today?`,
      },
      trigger: { hour: 20, minute: 0, repeats: true },
    });
  } catch {}
}

export async function scheduleChallengeReminder(daysLeft) {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your challenge! 💪`,
        body: "Complete your habits today to keep the streak alive.",
      },
      trigger: { seconds: 60 },
    });
  } catch {}
}
