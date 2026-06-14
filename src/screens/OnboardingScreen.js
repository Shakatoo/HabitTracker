import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { save, Keys } from '../utils/storage';
import { requestPermission, scheduleDaily } from '../utils/notifications';

const PURPLE = '#6C47FF';
const EMOJIS = [
  '💪', '🏃', '🚴', '🧘', '🏊', '🤸',
  '💧', '🥗', '🍎', '☕', '📚', '✍️',
  '🎨', '🎵', '🎯', '😴', '🌅', '💊',
];

export default function OnboardingScreen({ navigation }) {
  const { addHabit, createChallenge } = useApp();
  const [step, setStep] = useState(0); // 0=welcome, 1=habit, 2=challenge
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [type, setType] = useState('binary');
  const [target, setTarget] = useState(3);
  const [duration, setDuration] = useState(3);

  async function finish() {
    const habit = addHabit({ name: name.trim(), icon, type, target: type === 'count' ? target : 1, streak: 0 });
    createChallenge({
      name: `${duration}-Day Challenge`,
      habitIds: [habit.id],
      durationDays: duration,
      startDate: new Date().toISOString().slice(0, 10),
    });
    await save(Keys.ONBOARDED, true);
    const granted = await requestPermission();
    if (granted) await scheduleDaily([habit]);
    navigation.replace('Main');
  }

  if (step === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>🌱</Text>
          <Text style={styles.headline}>Build habits{'\n'}that stick.</Text>
          <Text style={styles.body}>
            Track daily habits, complete challenges,{'\n'}and watch your streaks grow.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={() => setStep(1)}>
            <Text style={styles.ctaText}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 1) {
    return (
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.stepLabel}>Step 1 of 2</Text>
            <Text style={styles.stepTitle}>Your first habit</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Morning Workout"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              maxLength={48}
            />

            <Text style={styles.label}>Pick an icon</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, icon === e && styles.emojiBtnActive]}
                  onPress={() => setIcon(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Habit type</Text>
            <View style={styles.typeRow}>
              {[['binary', '☑️ Once a day'], ['count', '🔢 Volume']].map(([val, lbl]) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.typeBtn, type === val && styles.typeBtnActive]}
                  onPress={() => setType(val)}
                >
                  <Text style={[styles.typeBtnText, type === val && styles.typeBtnTextActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {type === 'count' && (
              <View style={styles.targetRow}>
                <Text style={styles.label}>Times per day</Text>
                <View style={styles.counter}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setTarget(t => Math.max(1, t - 1))}>
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{target}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setTarget(t => Math.min(20, t + 1))}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.cta, !name.trim() && styles.ctaDisabled]}
              onPress={() => name.trim() && setStep(2)}
            >
              <Text style={styles.ctaText}>Next →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // step 2: challenge
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🏆</Text>
        <Text style={styles.stepLabel}>Step 2 of 2</Text>
        <Text style={styles.stepTitle}>Start a challenge</Text>
        <Text style={styles.body}>
          Commit to tracking{'\n'}
          <Text style={{ fontWeight: '700', color: PURPLE }}>{icon} {name}</Text>
          {'\n'}for how many days?
        </Text>

        <View style={styles.durationRow}>
          {[3, 7, 21].map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.durBtn, duration === d && styles.durBtnActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durNum, duration === d && styles.durNumActive]}>{d}</Text>
              <Text style={[styles.durLabel, duration === d && styles.durLabelActive]}>days</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={finish}>
          <Text style={styles.ctaText}>Let's go! 🚀</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3FF' },
  scroll: { padding: 28, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bigEmoji: { fontSize: 80, marginBottom: 16 },
  headline: {
    fontSize: 36, fontWeight: '800', color: '#1A1A2E',
    textAlign: 'center', lineHeight: 44, marginBottom: 14,
  },
  body: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  cta: {
    backgroundColor: PURPLE, paddingHorizontal: 48, paddingVertical: 16,
    borderRadius: 16, marginTop: 8, alignSelf: 'stretch', alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  stepLabel: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', marginBottom: 20 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#1A1A2E', marginBottom: 24,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  emojiBtn: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB',
  },
  emojiBtnActive: { backgroundColor: '#EDE9FF', borderWidth: 2, borderColor: PURPLE },
  emojiText: { fontSize: 24 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#EDE9FF', borderColor: PURPLE },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeBtnTextActive: { color: PURPLE },
  targetRow: { marginBottom: 24 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 22, fontWeight: '600', color: '#1A1A2E' },
  counterVal: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', minWidth: 32, textAlign: 'center' },
  durationRow: { flexDirection: 'row', gap: 16, marginBottom: 40, marginTop: 16 },
  durBtn: {
    width: 88, height: 88, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  durBtnActive: { backgroundColor: '#EDE9FF', borderColor: PURPLE },
  durNum: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
  durNumActive: { color: PURPLE },
  durLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  durLabelActive: { color: PURPLE },
});
