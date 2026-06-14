import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function run(fn) {
  if (Platform.OS === 'web') return;
  try { await fn(); } catch {}
}

export const light = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const medium = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const heavy = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
export const success = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warning = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
