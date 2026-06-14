import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import CelebrationModal from '../components/CelebrationModal';
import { success } from '../utils/haptics';
import { playCelebrate } from '../utils/sounds';
import { todayKey } from '../utils/storage';

const PURPLE = '#6C47FF';
const GREEN = '#22C55E';

export default function ChallengeScreen() {
  const app = useApp();
  const [showCelebration, setShowCelebration] = useState(false);

  const challenge = app.challenge;
  const days = challenge ? app.getChallengeDays() : [];
  const today = todayKey();

  useEffect(() => {
    if (challenge?.status === 'active' && app.isChallengeComplete()) {
      app.finishChallenge();
      success();
      playCelebrate();
      setShowCelebration(true);
    }
  }, [app.completions]);

  if (!challenge) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>No active challenge</Text>
          <Text style={styles.emptyBody}>
            Complete the onboarding to start your first challenge, or restart the app to set one up.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedDays = days.filter(d => d.done === d.total && d.total > 0).length;
  const isComplete = challenge.status === 'completed';
  const totalDays = challenge.durationDays;
  const startDate = new Date(challenge.startDate + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays - 1);

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function dayStatus(day) {
    if (day.date > today) return 'future';
    if (day.done === day.total && day.total > 0) return 'complete';
    if (day.date < today) return 'missed';
    return 'today';
  }

  const STATUS_COLORS = {
    complete: GREEN,
    missed: '#F87171',
    today: PURPLE,
    future: '#E5E7EB',
  };
  const STATUS_TEXT = {
    complete: '#fff',
    missed: '#fff',
    today: '#fff',
    future: '#9CA3AF',
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.trophyIcon}>{isComplete ? '🏆' : '⚡'}</Text>
          <Text style={styles.challengeName}>{challenge.name}</Text>
          <Text style={styles.challengeDates}>
            {formatDate(challenge.startDate)} – {formatDate(endDate.toISOString().slice(0, 10))}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${(completedDays / totalDays) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedDays}/{totalDays} days</Text>
          </View>
          {isComplete && (
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeText}>✓ Challenge Complete!</Text>
            </View>
          )}
        </View>

        {/* Days grid */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.daysGrid}>
          {days.map((day, i) => {
            const status = dayStatus(day);
            const isToday = day.date === today;
            return (
              <View key={day.date} style={styles.dayCell}>
                <View style={[
                  styles.dayCircle,
                  { backgroundColor: STATUS_COLORS[status] },
                  isToday && styles.dayCircleToday,
                ]}>
                  {status === 'complete' && <Text style={styles.dayCircleText}>✓</Text>}
                  {status === 'missed' && <Text style={styles.dayCircleText}>✗</Text>}
                  {status === 'today' && <Text style={[styles.dayCircleText, { fontSize: 12 }]}>Today</Text>}
                  {status === 'future' && <Text style={[styles.dayNum, { color: STATUS_TEXT[status] }]}>{i + 1}</Text>}
                </View>
                <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                {day.total > 0 && (
                  <Text style={styles.dayScore}>
                    {day.done}/{day.total}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Habits in challenge */}
        <Text style={styles.sectionTitle}>Habits in this challenge</Text>
        {challenge.habitIds.map(id => {
          const habit = app.habits.find(h => h.id === id);
          if (!habit) return null;
          const streak = app.getStreak(id);
          return (
            <View key={id} style={styles.habitRow}>
              <Text style={styles.habitIcon}>{habit.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitStreak}>🔥 {streak} day streak</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <CelebrationModal
        visible={showCelebration}
        title={`${totalDays}-Day Challenge Complete!`}
        subtitle={`You built a habit streak!\nNew challenges await you.`}
        cta="Claim your reward 🏆"
        onDismiss={() => setShowCelebration(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3FF' },
  scroll: { padding: 16, paddingBottom: 48, gap: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 10, textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  headerCard: {
    backgroundColor: PURPLE, borderRadius: 24, padding: 24, alignItems: 'center',
  },
  trophyIcon: { fontSize: 40, marginBottom: 8 },
  challengeName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4, textAlign: 'center' },
  challengeDates: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  progressRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressText: { color: '#fff', fontSize: 13, fontWeight: '700', minWidth: 52, textAlign: 'right' },
  completeBadge: {
    marginTop: 16, backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20,
  },
  completeBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dayCell: { alignItems: 'center', minWidth: 64 },
  dayCircle: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  dayCircleToday: { shadowColor: PURPLE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  dayCircleText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  dayNum: { fontWeight: '700', fontSize: 18 },
  dayDate: { fontSize: 11, color: '#6B7280' },
  dayScore: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  habitRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  habitIcon: { fontSize: 26, marginRight: 12 },
  habitName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  habitStreak: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
