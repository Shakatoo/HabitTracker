import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let dingSound = null;
let celebSound = null;

export async function loadSounds() {
  if (Platform.OS === 'web') return;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound: d } = await Audio.Sound.createAsync(
      require('../../assets/sounds/ding.mp3'),
      { shouldPlay: false }
    );
    dingSound = d;
    const { sound: c } = await Audio.Sound.createAsync(
      require('../../assets/sounds/celebrate.mp3'),
      { shouldPlay: false }
    );
    celebSound = c;
  } catch {
    // sound files not present — haptics-only mode
  }
}

export async function playDing() {
  try { await dingSound?.replayAsync(); } catch {}
}

export async function playCelebrate() {
  try { await celebSound?.replayAsync(); } catch {}
}
