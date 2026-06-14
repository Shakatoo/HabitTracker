import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import CelebrationModal from '../components/CelebrationModal';
import { light, medium, success } from '../utils/haptics';
import { playDing, playCelebrate } from '../utils/sounds';
import { todayKey } from '../utils/storage';

const PURPLE = '#6C47FF';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function TodayScreen({ navigation }) {
  const app = useApp();
  const { syncing, signOut } = app;
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [allDoneModal, setAllDoneModal] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const prevAllDone = useRef(false);

  const today = todayKey();
  const total = app.habits.length;
  const completed = app.habits.filter(h => app.isHabitDoneToday(h.id)).length;
  const progress = total > 0 ? completed / total : 0;
  const allDone = total > 0 && completed === total;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (!prevAllDone.current && allDone) {
      success();
      playCelebrate();
      setAllDoneModal(true);
    }
    prevAllDone.current = allDone;
  }, [allDone]);

  async function handleToggle(habitId) {
    const nowDone = app.toggleHabit(habitId);
    if (nowDone) {
      await light();
      await playDing();
    } else {
      await light();
    }
  }

  async function handleIncrement(habitId, target) {
    const newCount = app.incrementHabit(habitId, target);
    await medium();
    if (newCount >= target) await playDing();
  }

  function handleLongPress(habit) {
    Alert.alert(habit.name, 'What would you like to do?', [
      { text: 'Edit', onPress: () => { setEditingHabit(habit); setShowAdd(true); } },
      { text: 'Delete', style: 'destructive', onPress: () => app.deleteHabit(habit.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleSaveHabit(data) {
    if (editingHabit) {
      app.updateHabit(editingHabit.id, data);
    } else {
      app.addHabit({ ...data, streak: 0 });
    }
    setShowAdd(false);
    setEditingHabit(null);
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const challengeDaysLeft = app.challenge?.status === 'active'
    ? (() => {
        const start = new Date(app.challenge.startDate + 'T00:00:00');
        const end = new Date(start);
        end.setDate(end.getDate() + app.challenge.durationDays);
        const now = new Date();
        const diff = Math.ceil((end - now) / 86400000);
        return Math.max(0, diff);
      })()
    : null;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>{allDone ? '🎉 All done!' : greeting()}</Text>
          <TouchableOpacity onPress={signOut} activeOpacity={0.7}>
            <Text style={styles.signOutBtn}>Sign out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.date}>
          {TODAY}{syncing ? '  ·  syncing…' : ''}
        </Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{completed} / {total} habits</Text>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: progressWidth }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollBg} contentContainerStyle={styles.scroll}>
        {/* Challenge banner */}
        {app.challenge?.status === 'active' && (
          <TouchableOpacity
            style={styles.challengeBanner}
            onPress={() => navigation.navigate('Challenge')}
            activeOpacity={0.82}
          >
            <Text style={styles.challengeIcon}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.challengeName}>{app.challenge.name}</Text>
              <Text style={styles.challengeSub}>
                {challengeDaysLeft > 0 ? `${challengeDaysLeft} day${challengeDaysLeft !== 1 ? 's' : ''} remaining` : 'Final day — finish strong!'}
              </Text>
            </View>
            <Text style={styles.challengeArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Habit list */}
        {app.habits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyText}>No habits yet.{'\n'}Tap + to add your first one.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {app.habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={{ ...habit, streak: app.getStreak(habit.id) }}
                completion={app.getCompletion(habit.id)}
                onToggle={handleToggle}
                onIncrement={handleIncrement}
                onLongPress={handleLongPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setEditingHabit(null); setShowAdd(true); }} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddHabitModal
        visible={showAdd}
        existing={editingHabit}
        onSave={handleSaveHabit}
        onClose={() => { setShowAdd(false); setEditingHabit(null); }}
      />

      <CelebrationModal
        visible={allDoneModal}
        title="All done today!"
        subtitle={`You completed all ${total} habits.\nKeep the streak alive tomorrow!`}
        onDismiss={() => setAllDoneModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PURPLE },
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  greeting: { color: '#fff', fontSize: 26, fontWeight: '700' },
  signOutBtn: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  date: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  progressPct: { color: '#fff', fontSize: 13, fontWeight: '700' },
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  scrollBg: { flex: 1, backgroundColor: '#F5F3FF' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 12 },
  challengeBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    padding: 14, borderWidth: 1.5, borderColor: '#DDD6FE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  challengeIcon: { fontSize: 28, marginRight: 12 },
  challengeName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  challengeSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  challengeArrow: { fontSize: 24, color: '#9CA3AF', marginLeft: 8 },
  list: { gap: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', lineHeight: 24 },
  fab: {
    position: 'absolute', right: 20, bottom: 32,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
