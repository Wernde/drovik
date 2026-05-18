import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../theme';
import { Button } from '../components/Button';
import { useUserStore } from '../store';
import { RootStackParamList } from '../types';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'log',
    headline: 'Log a set\nin 2 taps.',
    sub: 'No typing between sets. Just tap and go.',
    icon: '✓',
  },
  {
    key: 'program',
    headline: 'Follow a program.\nStop guessing.',
    sub: 'Built-in programs and a custom builder so every session has a plan.',
    icon: '📅',
  },
  {
    key: 'progress',
    headline: 'See that you\'re\ngetting stronger.',
    sub: 'Progress charts and PR tracking show the trend, not just today.',
    icon: '📈',
  },
];

type Goal = 'bulk' | 'cut' | 'maintain';
type Unit = 'lbs' | 'kg';

export function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setPrefs } = useUserStore();

  const [step, setStep] = useState<'slides' | 'setup'>('slides');
  const [slideIndex, setSlideIndex] = useState(0);
  const [unit, setUnit] = useState<Unit>('lbs');
  const [goal, setGoal] = useState<Goal>('maintain');
  const listRef = useRef<FlatList>(null);

  function handleNext() {
    if (slideIndex < SLIDES.length - 1) {
      const next = slideIndex + 1;
      setSlideIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      setStep('setup');
    }
  }

  function finish() {
    setPrefs({ unitPreference: unit, goalMode: goal, onboardingComplete: true });
    navigation.replace('Main');
  }

  if (step === 'setup') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.setupContent}>
          <Text style={styles.setupHeadline}>Quick setup</Text>
          <Text style={styles.setupSub}>Takes 20 seconds.</Text>

          <Text style={styles.sectionLabel}>UNITS</Text>
          <View style={styles.pillRow}>
            {(['lbs', 'kg'] as Unit[]).map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.pill, unit === u && styles.pillActive]}
                onPress={() => setUnit(u)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, unit === u && styles.pillTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>GOAL</Text>
          {([['bulk', 'Build Muscle'], ['cut', 'Lose Fat'], ['maintain', 'Stay Consistent']] as [Goal, string][]).map(([g, label]) => (
            <TouchableOpacity
              key={g}
              style={[styles.goalRow, goal === g && styles.goalRowActive]}
              onPress={() => setGoal(g)}
              activeOpacity={0.8}
            >
              <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>{label}</Text>
              {goal === g && <Text style={styles.goalCheck}>✓</Text>}
            </TouchableOpacity>
          ))}

          <View style={styles.setupActions}>
            <Button label="Let's go →" onPress={finish} style={styles.ctaBtn} />
            <TouchableOpacity onPress={finish} style={styles.skipLink}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipTopRight} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.slideIcon}>{item.icon}</Text>
            <Text style={styles.slideHeadline}>{item.headline}</Text>
            <Text style={styles.slideSub}>{item.sub}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
          ))}
        </View>
        <Button
          label={slideIndex < SLIDES.length - 1 ? 'Next →' : 'Get started →'}
          onPress={handleNext}
          style={styles.ctaBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  skipTopRight: { alignSelf: 'flex-end', padding: spacing.md },
  skipText: { ...typography.label, color: colors.textSecondary },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  slideIcon: { fontSize: 72 },
  slideHeadline: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', fontSize: 28, lineHeight: 36 },
  slideSub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { padding: spacing.lg, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent, width: 18 },
  ctaBtn: { width: '100%' },
  setupContent: { flex: 1, padding: spacing.lg, gap: spacing.md },
  setupHeadline: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xl },
  setupSub: { ...typography.body, color: colors.textSecondary },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1, marginTop: spacing.md },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: colors.bg },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  goalRowActive: { borderColor: colors.accent },
  goalText: { ...typography.body, color: colors.textPrimary },
  goalTextActive: { color: colors.accent, fontWeight: '600' },
  goalCheck: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  setupActions: { marginTop: 'auto', gap: spacing.sm },
  skipLink: { alignSelf: 'center', padding: spacing.sm },
});
