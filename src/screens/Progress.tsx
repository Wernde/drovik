import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../theme';
import { getAllPRs, getRecentSessions, getBodyMeasurements } from '../database/db';
import { PersonalRecord, Session, BodyMeasurement, RootStackParamList } from '../types';
import { useUserStore } from '../store';

const { width } = Dimensions.get('window');

export function ProgressScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { prefs } = useUserStore();

  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bodyweights, setBodyweights] = useState<BodyMeasurement[]>([]);

  useFocusEffect(useCallback(() => {
    setPrs(getAllPRs());
    setSessions(getRecentSessions(30));
    setBodyweights(getBodyMeasurements(30));
  }, []));

  // Compute weekly volume from last 4 weeks
  function getWeeklyVolume() {
    const now = Date.now();
    const week = 7 * 24 * 3600 * 1000;
    const weeks: number[] = [0, 0, 0, 0];
    for (const s of sessions) {
      const age = now - new Date(s.startedAt).getTime();
      const weekIdx = Math.floor(age / week);
      if (weekIdx < 4 && s.totalVolume) weeks[weekIdx] += s.totalVolume;
    }
    return weeks.reverse();
  }

  const weeklyVol = getWeeklyVolume();
  const maxVol = Math.max(...weeklyVol, 1);

  // Streak
  function getStreak() {
    const days = new Set(sessions.map(s => new Date(s.startedAt).toDateString()));
    let streak = 0;
    const d = new Date();
    while (days.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  const streak = getStreak();
  const totalSessions = sessions.length;

  // Bodyweight trend (last 7)
  const bwLast7 = bodyweights.slice(0, 7).reverse();
  const bwMax = Math.max(...bwLast7.map(b => b.bodyweight ?? 0), 1);
  const bwMin = Math.min(...bwLast7.map(b => b.bodyweight ?? Infinity).filter(v => v < Infinity), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>

        {/* Stat pills */}
        <View style={styles.pillRow}>
          {[
            { label: 'Sessions', value: String(totalSessions) },
            { label: 'PRs', value: String(prs.length) },
            { label: 'Streak', value: `${streak}d 🔥` },
          ].map(s => (
            <View key={s.label} style={styles.statPill}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly volume bars */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WEEKLY VOLUME</Text>
          <View style={styles.chartCard}>
            <View style={styles.barChart}>
              {weeklyVol.map((vol, i) => {
                const h = Math.max((vol / maxVol) * 120, vol > 0 ? 4 : 0);
                const labels = ['3w ago', '2w ago', 'Last wk', 'This wk'];
                return (
                  <View key={i} style={styles.barGroup}>
                    <View style={[styles.bar, { height: h }]} />
                    <Text style={styles.barLabel}>{labels[i]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Bodyweight trend */}
        {bwLast7.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BODYWEIGHT</Text>
            <View style={styles.chartCard}>
              <View style={styles.bwRow}>
                {bwLast7.map((m, i) => {
                  const range = bwMax - bwMin || 1;
                  const pct = ((m.bodyweight ?? bwMin) - bwMin) / range;
                  const dotY = 80 - pct * 70;
                  return (
                    <View key={m.id} style={styles.bwPoint}>
                      <View style={[styles.bwDot, { marginTop: dotY }]} />
                      <Text style={styles.bwVal}>{m.bodyweight?.toFixed(1)}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.bwUnit}>{prefs.unitPreference}</Text>
            </View>
          </View>
        )}

        {/* PR Board */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
          {prs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>PRs appear after you log the same exercise twice.</Text>
            </View>
          ) : (
            prs.map(pr => (
              <TouchableOpacity
                key={pr.id}
                style={styles.prCard}
                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: pr.exerciseId })}
                activeOpacity={0.8}
              >
                <View style={styles.prLeft}>
                  <Text style={styles.trophyIcon}>🏆</Text>
                  <View>
                    <Text style={styles.prName}>{pr.exerciseName}</Text>
                    <Text style={styles.prDate}>
                      {new Date(pr.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.prRight}>
                  <Text style={styles.prWeight}>{pr.weight} {prefs.unitPreference}</Text>
                  <Text style={styles.prReps}>× {pr.reps} reps</Text>
                  <Text style={styles.pr1rm}>~{pr.estimated1RM} 1RM</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  title: { ...typography.h1, color: colors.textPrimary },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  statPill: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  statValue: { ...typography.h1, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1 },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: spacing.sm, justifyContent: 'space-around' },
  barGroup: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: 4, minHeight: 2 },
  barLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  bwRow: { flexDirection: 'row', alignItems: 'flex-start', height: 100, gap: spacing.sm },
  bwPoint: { flex: 1, alignItems: 'center' },
  bwDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  bwVal: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  bwUnit: { ...typography.caption, color: colors.textDisabled, marginTop: 4 },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  prCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.accent,
  },
  prLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  trophyIcon: { fontSize: 20 },
  prName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  prDate: { ...typography.caption, color: colors.textSecondary },
  prRight: { alignItems: 'flex-end', gap: 2 },
  prWeight: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  prReps: { ...typography.caption, color: colors.textSecondary },
  pr1rm: { ...typography.caption, color: colors.accent },
});
