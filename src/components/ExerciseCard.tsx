import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, radius, typography, TAP_TARGET } from '../theme';
import { Exercise } from '../types';

interface Props {
  exercise: Exercise;
  onPress: () => void;
  onLongPress?: () => void;
  subtitle?: string;
  accessory?: React.ReactNode;
}

export function ExerciseCard({ exercise, onPress, onLongPress, subtitle, accessory }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      <View style={styles.muscleTag}>
        <Text style={styles.muscleText}>{exercise.primaryMuscle[0]}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{exercise.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {subtitle ?? `${exercise.primaryMuscle} · ${exercise.equipment}`}
        </Text>
      </View>

      {accessory}

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: TAP_TARGET + 16,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  muscleTag: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleText: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: colors.textDisabled,
  },
});
