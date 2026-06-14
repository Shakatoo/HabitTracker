import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { todayKey } from '../utils/storage';

const PURPLE = '#6C47FF';
const GREEN = '#22C55E';

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function shortDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function ConsistencyBar({ label, pct }) {
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={barStyles.pct}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  label: { fontSize: 13, color: '#374151', width: 90 },
  track: { flex: 1, height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: PURPLE, borderRadius: 5 },
  pct: { fontSize: 12, color: '#6B7280', width: 34, textAlign: 'right' },
});

export default function HistoryScreen() {
  const app = useApp();
  const last7 = getLast7Days();
  const today = todayKey();

  function getHabitConsistency(habitId) {
    let total = 0;
    let done = 0;
    const habit = app.habits.find(h => h.id === habitId);
    if (!habit) return 0;
    const created = habit.createdAt?.slice(0, 10) ?? today;
    for (const date of last7) {
      if (date < created) continue;
      total++;
      if ((app.completions[date]?.[habitId] ?? 0) > 0) done++;
    }
    return total > 0 ? done / total : 0;
  }

  function overallConsistency() {
    if (app.habits.length === 0) return 0;
    const pcts = app.habits.map(h => getHabitConsistency(h.id));
    return pcts.reduce((a, b) => a + b, 0) / pcts.length;
  }

  // Build weekly summary: for each of last 7 days, how many habits were done
  const weekGrid = last7.map(date => {
    const done = app.habits.filter(h => (app.completions[date]?.[h.id] ?? 0) > 0).length;
    return { date, done, total: app.habits.length };
  });

  // Recent log: last 30 days of completions, most recent first
  const logDays = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entries = app.habits
      .filter(h => (app.completions[key]?.[h.id] ?? 0) > 0)
      .map(h => ({ habit: h, count: app.completions[key]?.[h.id] ?? 0 }));
    if (entries.length > 0) logDays.push({ date: key, entries });
  }

  function formatLogDate(dateStr) {
    if (dateStr === today) return 'Today';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* This week */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.card}>
          <View style={styles.weekRow}>
            {weekGrid.map(({ date, done, total }) => {
              const pct = total > 0 ? done / total : 0;
              const isToday = date === today;
              return (
                <View key={date} style={styles.weekCol}>
                  <View style={styles.weekBarBg}>
                    <View style={[styles.weekBarFill, { height: `${Math.max(4, pct * 100)}%`, backgroundColor: isToday ? PURPLE : (pct >= 1 ? GREEN : '#C4B5FD') }]} />
                  </View>
                  <Text style={[styles.weekDay, isToday && styles.weekDayToday]}>{shortDate(date)}</Text>
                  <Text style={styles.weekCount}>{done}/{total}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.overallPct}>
            Last 7 days: <Text style={{ fontWeight: '700', color: PURPLE }}>{Math.round(overallConsistency() * 100)}% overall</Text>
          </Text>
        </View>

        {/* Per-habit consistency */}
        {app.habits.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Habit Consistency</Text>
            <View style={styles.card}>
              {app.habits.map(h => (
                <View key={h.id} style={styles.habitConsistRow}>
                  <Text style={styles.habitConsistIcon}>{h.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitConsistName}>{h.name}</Text>
                    <ConsistencyBar label="" pct={getHabitConsistency(h.id)} />
                  </View>
                  <Text style={styles.streakBadge}>🔥 {app.getStreak(h.id)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Activity log */}
        {logDays.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Activity Log</Text>
            {logDays.map(({ date, entries }) => (
              <View key={date} style={styles.logDay}>
                <Text style={styles.logDate}>{formatLogDate(date)}</Text>
                {entries.map(({ habit, count }) => (
                  <View key={habit.id} style={styles.logEntry}>
                    <Text style={styles.logIcon}>{habit.icon}</Text>
                    <Text style={styles.logName}>{habit.name}</Text>
                    {habit.type === 'count' && (
                      <Text style={styles.logCount}>{count}×</Text>
                    )}
                    <Text style={styles.logCheck}>✓</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {app.habits.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>Your history will appear here{'\n'}once you start tracking habits.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3FF' },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekCol: { alignItems: 'center', flex: 1 },
  weekBarBg: {
    width: 28, height: 64, backgroundColor: '#F3F4F6', borderRadius: 6,
    justifyContent: 'flex-end', overflow: 'hidden', marginBottom: 6,
  },
  weekBarFill: { width: '100%', borderRadius: 6 },
  weekDay: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  weekDayToday: { color: PURPLE, fontWeight: '700' },
  weekCount: { fontSize: 10, color: '#D1D5DB', marginTop: 2 },
  overallPct: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  habitConsistRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  habitConsistIcon: { fontSize: 22, marginRight: 10 },
  habitConsistName: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  streakBadge: { fontSize: 13, fontWeight: '700', color: '#F97316', marginLeft: 8 },
  logDay: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  logDate: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 10 },
  logEntry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  logIcon: { fontSize: 18, marginRight: 8 },
  logName: { flex: 1, fontSize: 14, color: '#1A1A2E', fontWeight: '500' },
  logCount: { fontSize: 13, color: '#6B7280', marginRight: 8 },
  logCheck: { fontSize: 14, color: GREEN, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
