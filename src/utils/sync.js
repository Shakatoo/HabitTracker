import { supabase } from './supabase';

// ─── Individual mutation pushes (fire-and-forget from context) ───────────────

export async function pushHabit(userId, habit) {
  if (!userId) return;
  const { error } = await supabase.from('habits').upsert({
    id: habit.id,
    user_id: userId,
    name: habit.name,
    icon: habit.icon,
    type: habit.type,
    target: habit.target ?? 1,
    created_at: habit.createdAt,
  }, { onConflict: 'id' });
  if (error) console.warn('[sync] pushHabit:', error.message);
}

export async function pushCompletion(userId, habitId, date, count) {
  if (!userId) return;
  const id = `${habitId}_${date}`;
  if (count === 0) {
    await supabase.from('completions').delete().eq('id', id).eq('user_id', userId);
    return;
  }
  const { error } = await supabase.from('completions').upsert({
    id,
    user_id: userId,
    habit_id: habitId,
    date,
    count,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.warn('[sync] pushCompletion:', error.message);
}

export async function pushChallenge(userId, challenge) {
  if (!userId || !challenge) return;
  const { error } = await supabase.from('challenges').upsert({
    id: challenge.id,
    user_id: userId,
    name: challenge.name,
    habit_ids: challenge.habitIds,
    duration_days: challenge.durationDays,
    start_date: challenge.startDate,
    status: challenge.status,
    completed_at: challenge.completedAt ?? null,
  }, { onConflict: 'id' });
  if (error) console.warn('[sync] pushChallenge:', error.message);
}

export async function deleteHabitRemote(userId, habitId) {
  if (!userId) return;
  const { error } = await supabase.from('habits').delete()
    .eq('id', habitId).eq('user_id', userId);
  if (error) console.warn('[sync] deleteHabit:', error.message);
}

// ─── Full pull on login (merge remote into local) ────────────────────────────

export async function pullAll(userId, localHabits, localCompletions, localChallenge) {
  if (!userId) return null;

  const [habitsRes, completionsRes, challengeRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId).is('deleted_at', null),
    supabase.from('completions').select('*').eq('user_id', userId),
    supabase.from('challenges').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1),
  ]);

  if (habitsRes.error) { console.warn('[sync] pull habits:', habitsRes.error.message); return null; }
  if (completionsRes.error) { console.warn('[sync] pull completions:', completionsRes.error.message); return null; }

  // Merge habits — union of local + remote, remote fills in missing ones
  const remoteHabits = (habitsRes.data ?? []).map(h => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    type: h.type,
    target: h.target,
    createdAt: h.created_at,
  }));
  const localIdSet = new Set(localHabits.map(h => h.id));
  const mergedHabits = [
    ...localHabits,
    ...remoteHabits.filter(h => !localIdSet.has(h.id)),
  ];

  // Merge completions — remote values overwrite local on conflict
  const mergedCompletions = { ...localCompletions };
  for (const row of (completionsRes.data ?? [])) {
    if (!mergedCompletions[row.date]) mergedCompletions[row.date] = {};
    mergedCompletions[row.date][row.habit_id] = row.count;
  }

  // Challenge — prefer remote if it exists
  let mergedChallenge = localChallenge;
  if (challengeRes.data?.length > 0) {
    const r = challengeRes.data[0];
    mergedChallenge = {
      id: r.id,
      name: r.name,
      habitIds: r.habit_ids,
      durationDays: r.duration_days,
      startDate: r.start_date,
      status: r.status,
      completedAt: r.completed_at ?? undefined,
    };
  }

  return { habits: mergedHabits, completions: mergedCompletions, challenge: mergedChallenge };
}

// ─── Full push (used after merge to backfill remote with local-only data) ────

export async function pushAll(userId, habits, completions) {
  if (!userId) return;

  if (habits.length > 0) {
    await supabase.from('habits').upsert(
      habits.map(h => ({
        id: h.id,
        user_id: userId,
        name: h.name,
        icon: h.icon,
        type: h.type,
        target: h.target ?? 1,
        created_at: h.createdAt,
      })),
      { onConflict: 'id' }
    );
  }

  const rows = [];
  for (const [date, dayData] of Object.entries(completions)) {
    for (const [habitId, count] of Object.entries(dayData)) {
      if (count > 0) {
        rows.push({
          id: `${habitId}_${date}`,
          user_id: userId,
          habit_id: habitId,
          date,
          count,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }
  if (rows.length > 0) {
    await supabase.from('completions').upsert(rows, { onConflict: 'id' });
  }
}
