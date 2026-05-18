import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography, TAP_TARGET } from '../theme';
import { ActiveSet } from '../types';

interface Props {
  set: ActiveSet;
  setNumber: number;
  unit: string;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onComplete: () => void;
  onLongPress?: () => void;
}

export function SetRow({ set, setNumber, unit, onChangeWeight, onChangeReps, onComplete, onLongPress }: Props) {
  const flashAnim = useRef(new Animated.Value(0)).current;

  function handleComplete() {
    if (set.completed) return;
    if (!set.weight || !set.reps) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Flash animation
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();

    onComplete();
  }

  const bgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [set.completed ? colors.bgCard : colors.bgInput, colors.accent],
  });

  return (
    <Animated.View style={[styles.row, { backgroundColor: bgColor },
      !set.completed && styles.rowActive]}>

      <Text style={styles.setNum}>{setNumber}</Text>

      <TextInput
        style={[styles.input, set.completed && styles.inputDone]}
        value={set.weight}
        onChangeText={onChangeWeight}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textDisabled}
        editable={!set.completed}
        returnKeyType="next"
        selectTextOnFocus
      />

      <Text style={styles.unitLabel}>{unit}</Text>

      <TextInput
        style={[styles.input, set.completed && styles.inputDone]}
        value={set.reps}
        onChangeText={onChangeReps}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.textDisabled}
        editable={!set.completed}
        returnKeyType="done"
        selectTextOnFocus
      />

      <TouchableOpacity
        style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
        onPress={handleComplete}
        onLongPress={onLongPress}
        disabled={set.completed}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.checkMark, set.completed && styles.checkMarkDone]}>✓</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: 2,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  rowActive: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  setNum: {
    ...typography.label,
    color: colors.textSecondary,
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    height: TAP_TARGET,
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputDone: {
    color: colors.textSecondary,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  unitLabel: {
    ...typography.caption,
    color: colors.textDisabled,
    width: 24,
    textAlign: 'center',
  },
  checkBtn: {
    width: TAP_TARGET + 4,
    height: TAP_TARGET + 4,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInput,
  },
  checkBtnDone: {
    borderColor: colors.success,
    backgroundColor: 'transparent',
  },
  checkMark: {
    fontSize: 18,
    color: colors.textDisabled,
    fontWeight: '700',
  },
  checkMarkDone: {
    color: colors.success,
  },
});
