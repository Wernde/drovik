export const colors = {
  bg: '#0D0D0D',
  bgCard: '#1A1A1A',
  bgInput: '#242424',
  border: '#2E2E2E',

  accent: '#C8F135',
  accentMuted: '#3A3A3A',

  textPrimary: '#F2F2F2',
  textSecondary: '#8A8A8A',
  textDisabled: '#444444',

  success: '#4CAF50',
  warning: '#F5A623',
  error: '#E53935',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 36, fontWeight: '700' as const },
  h1: { fontSize: 24, fontWeight: '600' as const },
  h2: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 11, fontWeight: '400' as const },
} as const;

export const TAP_TARGET = 48;
