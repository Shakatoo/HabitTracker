import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

const PURPLE = '#6C47FF';
const EMOJIS = [
  '💪', '🏃', '🚴', '🧘', '🏊', '🤸',
  '💧', '🥗', '🍎', '☕', '🥤', '🍵',
  '📚', '✍️', '🎨', '🎵', '🎯', '📝',
  '😴', '🛁', '🌅', '🌙', '🧹', '💊',
  '💰', '🚫', '📵', '🙏', '❤️', '⚡',
];

export default function AddHabitModal({ visible, onSave, onClose, existing }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? '💪');
  const [type, setType] = useState(existing?.type ?? 'binary');
  const [target, setTarget] = useState(String(existing?.target ?? 3));

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      icon,
      type,
      target: type === 'count' ? Math.max(1, parseInt(target, 10) || 1) : 1,
    });
    setName(''); setIcon('💪'); setType('binary'); setTarget('3');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{existing ? 'Edit Habit' : 'New Habit'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Habit name…"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            maxLength={48}
          />

          <Text style={styles.label}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
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
          </ScrollView>

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {[['binary', '☑️ Once a day'], ['count', '🔢 Volume target']].map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.typeBtn, type === val && styles.typeBtnActive]}
                onPress={() => setType(val)}
              >
                <Text style={[styles.typeBtnText, type === val && styles.typeBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'count' && (
            <View style={styles.targetRow}>
              <Text style={styles.label}>Times per day</Text>
              <View style={styles.counter}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTarget(t => String(Math.max(1, (parseInt(t, 10) || 1) - 1)))}>
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterVal}>{target}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => setTarget(t => String(Math.min(20, (parseInt(t, 10) || 1) + 1)))}>
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 20 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#1A1A2E', marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  emojiScroll: { marginBottom: 20, marginHorizontal: -4 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 330 },
  emojiBtn: {
    width: 46, height: 46, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', margin: 3,
    backgroundColor: '#F9FAFB',
  },
  emojiBtnActive: { backgroundColor: '#EDE9FF', borderWidth: 2, borderColor: PURPLE },
  emojiText: { fontSize: 22 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#EDE9FF', borderColor: PURPLE },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeBtnTextActive: { color: PURPLE },
  targetRow: { marginBottom: 20 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  counterBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 22, fontWeight: '600', color: '#1A1A2E' },
  counterVal: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', minWidth: 32, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: PURPLE, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
