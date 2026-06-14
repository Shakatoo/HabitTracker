import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';

const PURPLE = '#6C47FF';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function switchMode(m) {
    setMode(m);
    setError('');
  }

  async function handleSubmit() {
    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: e } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (e) throw e;
        // onAuthStateChange in AppContext handles the rest
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (e) throw e;
      }
    } catch (e) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <Text style={styles.logo}>🌱</Text>
        <Text style={styles.title}>HabitTracker</Text>
        <Text style={styles.subtitle}>Build habits that stick.</Text>

        {/* Sign In / Sign Up toggle */}
        <View style={styles.toggle}>
          {[['signin', 'Sign In'], ['signup', 'Sign Up']].map(([val, label]) => (
            <TouchableOpacity
              key={val}
              style={[styles.toggleBtn, mode === val && styles.toggleBtnActive]}
              onPress={() => switchMode(val)}
            >
              <Text style={[styles.toggleText, mode === val && styles.toggleTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (6+ characters)"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Text>
          }
        </TouchableOpacity>

        {mode === 'signup' && (
          <Text style={styles.hint}>
            Your habits and streaks are saved to your account and sync across devices.
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3FF' },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A2E', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 40 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#1A1A2E' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#1A1A2E',
    marginBottom: 14, backgroundColor: '#fff',
  },
  error: { color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: {
    backgroundColor: PURPLE, paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: {
    fontSize: 12, color: '#9CA3AF', textAlign: 'center',
    marginTop: 20, lineHeight: 18,
  },
});
