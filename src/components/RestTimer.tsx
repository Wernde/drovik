import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '../store';
import { colors, spacing, typography, radius } from '../theme';

export function RestTimer() {
  const { restTimerActive, restTimerRemaining, restTimerSecs, tickRestTimer, skipRestTimer } = useWorkoutStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (restTimerActive) {
      intervalRef.current = setInterval(tickRestTimer, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (restTimerRemaining === 0 && restTimerSecs > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        pulse();
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [restTimerActive]);

  function pulse() {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  if (!restTimerActive) return null;

  const progress = restTimerRemaining / restTimerSecs;
  const mins = Math.floor(restTimerRemaining / 60);
  const secs = restTimerRemaining % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  const isWarning = restTimerRemaining <= 10;

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {
          width: `${progress * 100}%`,
          backgroundColor: isWarning ? colors.warning : colors.accent,
        }]} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>REST</Text>
        <Animated.Text style={[styles.time, { transform: [{ scale: pulseAnim }] },
          isWarning && { color: colors.warning }]}>
          {timeStr}
        </Animated.Text>
        <TouchableOpacity onPress={skipRestTimer} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  time: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  skipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
