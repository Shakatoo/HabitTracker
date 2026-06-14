import AsyncStorage from '@react-native-async-storage/async-storage';

export const Keys = {
  HABITS: '@habits',
  COMPLETIONS: '@completions',
  CHALLENGE: '@challenge',
  ONBOARDED: '@onboarded',
};

export async function load(key) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function save(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(date) {
  if (typeof date === 'string') return date;
  return date.toISOString().slice(0, 10);
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
