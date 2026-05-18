import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, radius, typography, TAP_TARGET } from '../theme';

type Variant = 'primary' | 'ghost' | 'destructive';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const containerStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'ghost' && styles.ghost,
    variant === 'destructive' && styles.destructive,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'primary' && styles.textPrimary,
    variant === 'ghost' && styles.textGhost,
    variant === 'destructive' && styles.textDestructive,
    disabled && styles.textDisabled,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.accent} />
        : <Text style={textStyle}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: TAP_TARGET + 4,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  destructive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    ...typography.body,
    fontWeight: '600',
  },
  textPrimary: {
    color: colors.bg,
  },
  textGhost: {
    color: colors.textPrimary,
  },
  textDestructive: {
    color: colors.error,
  },
  textDisabled: {
    color: colors.textDisabled,
  },
});
