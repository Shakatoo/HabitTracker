import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PURPLE = '#6C47FF';

export default function CelebrationModal({ visible, title, subtitle, cta, onDismiss }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 14 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.7);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          <TouchableOpacity style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>{cta ?? 'Awesome!'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 28,
    padding: 36, margin: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', textAlign: 'center', marginBottom: 10 },
  sub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  btn: {
    backgroundColor: PURPLE, paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
