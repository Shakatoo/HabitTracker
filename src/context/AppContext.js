import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { load, save, Keys, todayKey } from '../utils/storage';
import { loadSounds } from '../utils/sounds';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [challenge, setChallenge] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const isReady = useRef(false);

  useEffect(() => {
    async function bootstrap() {
      const [h, c, ch] = await Promise.all([
        load(Keys.HABITS),
        load(Keys.COMPLETIONS),
        load(Keys.CHALLENGE),
      ]);
      if (h) setHabits(h);
      if (c) setCompletions(c);
      if (ch) setChallenge(ch);
      setLoaded(true);
      isReady.current = true;
      loadSounds();
    }
    bootstrap();
  }, []);

  useEffect(() => { if (isReady.current) save(Keys.HABITS, habits); }, [habits]);
  useEffect(() => { if (isReady.current) save(Keys.COMPLETIONS, completions); }, [completions]);
  useEffect(() => { if (isReady.current) save(Keys.CHALLENGE, challenge); }, [challenge]);

  function addHabit(habit) {
    const newHabit = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...habit,
    };
    setHabits(prev => [...prev, newHabit]);
    return newHabit;
  }

  function updateHabit(id, updates) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }

  function deleteHabit(id) {
    setHabits(prev => prev.filter(h => h.id !== id));
    if (challenge?.habitIds?.includes(id)) {
      setChallenge(prev => prev ? {
        ...prev,
        habitIds: prev.habitIds.filter(hid => hid !== id),
      } : null);
    }
  }

  function getCompletion(habitId, date) {
    const key = date ?? todayKey();
    return completions[key]?.[habitId] ?? 0;
  }

  function setCompletion(habitId, count, date) {
    const key = date ?? todayKey();
    setCompletions(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [habitId]: count },
    }));
  }

  function toggleHabit(habitId) {
    const current = getCompletion(habitId);
    setCompletion(habitId, current > 0 ? 0 : 1);
    return current === 0; // returns true if now completed
  }

  function incrementHabit(habitId, target) {
    const current = getCompletion(habitId);
    if (current < target) {
      setCompletion(habitId, current + 1);
      return current + 1;
    }
    return current;
  }

  function getStreak(habitId) {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().slice(0, 10);
      if ((completions[key]?.[habitId] ?? 0) > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function getTodayCompletedCount() {
    const today = todayKey();
    return habits.filter(h => (completions[today]?.[h.id] ?? 0) > 0).length;
  }

  function isHabitDoneToday(habitId) {
    const h = habits.find(x => x.id === habitId);
    if (!h) return false;
    const count = getCompletion(habitId);
    return count >= (h.target ?? 1);
  }

  function createChallenge(ch) {
    const newCh = {
      id: Date.now().toString(),
      status: 'active',
      ...ch,
    };
    setChallenge(newCh);
    return newCh;
  }

  function finishChallenge() {
    setChallenge(prev => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : null);
  }

  function clearChallenge() {
    setChallenge(null);
  }

  function getChallengeDays() {
    if (!challenge) return [];
    const days = [];
    for (let i = 0; i < challenge.durationDays; i++) {
      const date = new Date(challenge.startDate + 'T00:00:00');
      date.setDate(date.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      const total = challenge.habitIds.length;
      const done = total > 0
        ? challenge.habitIds.filter(id => (completions[key]?.[id] ?? 0) > 0).length
        : 0;
      days.push({ date: key, total, done, index: i });
    }
    return days;
  }

  function isChallengeComplete() {
    if (!challenge || challenge.status !== 'active') return false;
    const days = getChallengeDays();
    const today = todayKey();
    const todayIndex = days.findIndex(d => d.date === today);
    if (todayIndex < 0) return false;
    // All days up to and including today must be fully complete
    return days.slice(0, todayIndex + 1).every(d => d.done === d.total && d.total > 0);
  }

  function isChallengeFailed() {
    if (!challenge || challenge.status !== 'active') return false;
    const today = todayKey();
    const start = challenge.startDate;
    const end = new Date(start + 'T00:00:00');
    end.setDate(end.getDate() + challenge.durationDays);
    return today > end.toISOString().slice(0, 10);
  }

  return (
    <Ctx.Provider value={{
      habits, completions, challenge, loaded,
      addHabit, updateHabit, deleteHabit,
      getCompletion, setCompletion, toggleHabit, incrementHabit,
      getStreak, getTodayCompletedCount, isHabitDoneToday,
      createChallenge, finishChallenge, clearChallenge,
      getChallengeDays, isChallengeComplete, isChallengeFailed,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  return useContext(Ctx);
}
