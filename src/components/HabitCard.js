import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PURPLE = '#6C47FF';
const GREEN = '#22C55E';

export default function HabitCard({ habit, completion, onToggle, onIncrement, onLongPress }) {
  const target = habit.target ?? 1;
  const isCount = habit.type === 'count';
  const isDone = completion >= target;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevDone = useRef(isDone);

  useEffect(() => {
    if (!prevDone.current && isDone) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.06, useNativeDriver: true, speed: 40, bounciness: 12 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }),
      ]).start();
    }
    prevDone.current = isDone;
  }, [isDone]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.card, isDone && styles.cardDone]}
        onPress={isCount ? () => onIncrement(habit.id, target) : () => onToggle(habit.id)}
        onLongPress={() => onLongPress?.(habit)}
        activeOpacity={0.78}
      >
        <Text style={styles.icon}>{habit.icon}</Text>
        <View style={styles.body}>
          <Text style={[styles.name, isDone && styles.nameDone]}>{habit.name}</Text>
          <Text style={styles.sub}>
            {isCount
              ? `${completion}/${target} times · `
              : ''}
            🔥 {habit.streak ?? 0} day streak
          </Text>
        </View>

        {isCount ? (
          <View style={[styles.countBadge, isDone && styles.countBadgeDone]}>
            <Text style={[styles.countText, isDone && styles.countTextDone]}>
              {isDone ? '✓' : `${completion}/${target}`}
            </Text>
          </View>
        ) : (
          <View style={[styles.check, isDone && styles.checkDone]}>
            {isDone && <Text style={styles.checkMark}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDone: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  icon: { fontSize: 28, marginRight: 14 },
  body: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 3 },
  nameDone: { color: '#166534', textDecorationLine: 'line-through' },
  sub: { fontSize: 12, color: '#6B7280' },
  check: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  checkDone: { backgroundColor: GREEN, borderColor: GREEN },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  countBadge: {
    minWidth: 52, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: PURPLE,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8, marginLeft: 8,
  },
  countBadgeDone: { backgroundColor: GREEN, borderColor: GREEN },
  countText: { fontSize: 12, fontWeight: '700', color: PURPLE },
  countTextDone: { color: '#fff' },
});
