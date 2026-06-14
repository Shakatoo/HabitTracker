import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { load, save, Keys, todayKey } from '../utils/storage';
import { loadSounds } from '../utils/sounds';
import { supabase } from '../utils/supabase';
import {
  pushHabit, pushCompletion, pushChallenge,
  deleteHabitRemote, pullAll, pushAll,
} from '../utils/sync';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [challenge, setChallenge] = useState(null);
  const [user, setUser] = useState(null);
  const [onboarded, setOnboarded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isReady = useRef(false);

  useEffect(() => {
    // Bootstrap: load local data and check existing auth session in parallel
    async function bootstrap() {
      const [h, c, ch, ob, sessionResult] = await Promise.all([
        load(Keys.HABITS),
        load(Keys.COMPLETIONS),
        load(Keys.CHALLENGE),
        load(Keys.ONBOARDED),
        supabase.auth.getSession(),
      ]);

      const localHabits = h ?? [];
      const localCompletions = c ?? {};
      const localChallenge = ch ?? null;

      setHabits(localHabits);
      setCompletions(localCompletions);
      setChallenge(localChallenge);
      if (ob) setOnboarded(true);

      const currentUser = sessionResult.data.session?.user ?? null;
      setUser(currentUser);

      isReady.current = true;
      setLoaded(true);
      loadSounds();

      // Background sync if already logged in
      if (currentUser) {
        runSync(currentUser, localHabits, localCompletions, localChallenge);
      }
    }

    bootstrap();

    // Listen for auth events that happen during the session (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const u = session.user;
        setUser(u);
        const [localH, localC, localCh] = await Promise.all([
          load(Keys.HABITS),
          load(Keys.COMPLETIONS),
          load(Keys.CHALLENGE),
        ]);
        runSync(u, localH ?? [], localC ?? {}, localCh);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setHabits([]);
        setCompletions({});
        setChallenge(null);
        setOnboarded(false);
        await Promise.all([
          save(Keys.HABITS, []),
          save(Keys.COMPLETIONS, {}),
          save(Keys.CHALLENGE, null),
          save(Keys.ONBOARDED, false),
        ]);
      } else if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function runSync(u, localHabits, localCompletions, localChallenge) {
    setSyncing(true);
    try {
      const merged = await pullAll(u.id, localHabits, localCompletions, localChallenge);
      if (!merged) return;

      setHabits(merged.habits);
      setCompletions(merged.completions);
      if (merged.challenge) setChallenge(merged.challenge);

      // Auto-mark onboarded if remote habits exist (handles reinstall / new device)
      if (merged.habits.length > 0) {
        setOnboarded(true);
        await save(Keys.ONBOARDED, true);
      }

      await Promise.all([
        save(Keys.HABITS, merged.habits),
        save(Keys.COMPLETIONS, merged.completions),
        save(Keys.CHALLENGE, merged.challenge),
      ]);

      // Push any local-only data back to remote
      await pushAll(u.id, merged.habits, merged.completions);
    } finally {
      setSyncing(false);
    }
  }

  // Auto-persist to AsyncStorage whenever state changes
  useEffect(() => { if (isReady.current) save(Keys.HABITS, habits); }, [habits]);
  useEffect(() => { if (isReady.current) save(Keys.COMPLETIONS, completions); }, [completions]);
  useEffect(() => { if (isReady.current) save(Keys.CHALLENGE, challenge); }, [challenge]);
  useEffect(() => { if (isReady.current) save(Keys.ONBOARDED, onboarded); }, [onboarded]);

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async function signOut() {
    await supabase.auth.signOut();
    // State clearing handled by onAuthStateChange SIGNED_OUT
  }

  // ─── Habits ────────────────────────────────────────────────────────────────

  function addHabit(habit) {
    const newHabit = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...habit,
    };
    setHabits(prev => [...prev, newHabit]);
    if (user) pushHabit(user.id, newHabit).catch(() => {});
    return newHabit;
  }

  function updateHabit(id, updates) {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const updated = { ...h, ...updates };
      if (user) pushHabit(user.id, updated).catch(() => {});
      return updated;
    }));
  }

  function deleteHabit(id) {
    setHabits(prev => prev.filter(h => h.id !== id));
    if (challenge?.habitIds?.includes(id)) {
      setChallenge(prev => prev
        ? { ...prev, habitIds: prev.habitIds.filter(hid => hid !== id) }
        : null
      );
    }
    if (user) deleteHabitRemote(user.id, id).catch(() => {});
  }

  // ─── Completions ───────────────────────────────────────────────────────────

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
    if (user) pushCompletion(user.id, habitId, key, count).catch(() => {});
  }

  function toggleHabit(habitId) {
    const current = getCompletion(habitId);
    setCompletion(habitId, current > 0 ? 0 : 1);
    return current === 0;
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
    return getCompletion(habitId) >= (h.target ?? 1);
  }

  // ─── Challenge ─────────────────────────────────────────────────────────────

  function createChallenge(ch) {
    const newCh = { id: Date.now().toString(), status: 'active', ...ch };
    setChallenge(newCh);
    if (user) pushChallenge(user.id, newCh).catch(() => {});
    return newCh;
  }

  function finishChallenge() {
    setChallenge(prev => {
      if (!prev) return null;
      const updated = { ...prev, status: 'completed', completedAt: new Date().toISOString() };
      if (user) pushChallenge(user.id, updated).catch(() => {});
      return updated;
    });
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
    return days.slice(0, todayIndex + 1).every(d => d.done === d.total && d.total > 0);
  }

  function isChallengeFailed() {
    if (!challenge || challenge.status !== 'active') return false;
    const end = new Date(challenge.startDate + 'T00:00:00');
    end.setDate(end.getDate() + challenge.durationDays);
    return todayKey() > end.toISOString().slice(0, 10);
  }

  return (
    <Ctx.Provider value={{
      habits, completions, challenge, user, onboarded, loaded, syncing,
      signOut, setOnboarded,
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
