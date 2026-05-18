import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../theme';
import { Button } from '../components/Button';
import { getRecentSessions, getSetsForSession } from '../database/db';
import { Session, LoggedSet, RootStackParamList } from '../types';
import { useUserStore, useWorkoutStore } from '../store';

export function WorkoutHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { prefs } = useUserStore();
  const { isActive } = useWorkoutStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<LoggedSet[]>([]);

  useFocusEffect(useCallback(() => {
    setSessions(getRecentSessions(50));
  }, []));

  function handleExpand(s: Session) {
    if (expanded === s.id) {
      setExpanded(null);
      setExpandedSets([]);
    } else {
      setExpanded(s.id);
      setExpandedSets(getSetsForSession(s.id));
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }

  function formatDuration(secs?: number) {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    return `${m} min`;
  }

  function groupSetsByExercise(sets: LoggedSet[]) {
    const map: Record<string, LoggedSet[]> = {};
    for (const s of sets) {
      if (!map[s.exerciseId]) map[s.exerciseId] = [];
      map[s.exerciseId].push(s);
    }
    return Object.entries(map);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Button
          label="+ Start"
          onPress={() => navigation.navigate('ActiveWorkout', {})}
          style={styles.startBtn}
        />
      </View>

      {isActive && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => navigation.navigate('ActiveWorkout', {})}
          activeOpacity={0.85}
        >
          <View style={styles.activeDot} />
          <Text style={styles.activeBannerText}>Workout in progress — tap to return</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>Your logged sessions will appear here.</Text>
            <Button label="Start first workout" onPress={() => navigation.navigate('ActiveWorkout', {})} style={styles.emptyCta} />
          </View>
        }
        renderItem={({ item: s }) => {
          const isExpanded = expanded === s.id;
          const grouped = isExpanded ? groupSetsByExercise(expandedSets) : [];

          return (
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => handleExpand(s)}
              activeOpacity={0.85}
            >
              <View style={styles.sessionRow}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionName}>{s.name}</Text>
                  <Text style={styles.sessionDate}>{formatDate(s.startedAt)}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionDuration}>{formatDuration(s.durationSeconds)}</Text>
                  {s.totalVolume ? (
                    <Text style={styles.sessionVol}>
                      {(s.totalVolume / 1000).toFixed(1)}k {prefs.unitPreference}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>{isExpanded ? '∨' : '›'}</Text>
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />
                  {grouped.map(([exId, sets]) => (
                    <View key={exId} style={styles.exGroup}>
                      <Text style={styles.exName}>{sets[0]?.exerciseId}</Text>
                      {sets.filter(s => s.completed).map(s => (
                        <Text key={s.id} style={styles.setLine}>
                          Set {s.setNumber}  ·  {s.weight} {prefs.unitPreference}  ×  {s.reps}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  startBtn: { paddingHorizontal: spacing.md },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, marginHorizontal: spacing.lg,
    borderRadius: radius.lg, padding: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.accent, marginBottom: spacing.sm,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  activeBannerText: { ...typography.label, color: colors.textPrimary, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 48 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyTitle: { ...typography.h2, color: colors.textSecondary },
  emptySubtitle: { ...typography.body, color: colors.textDisabled },
  emptyCta: { marginTop: spacing.md },
  sessionCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, overflow: 'hidden',
  },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sessionLeft: { flex: 1, gap: 2 },
  sessionName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  sessionDate: { ...typography.caption, color: colors.textSecondary },
  sessionRight: { alignItems: 'flex-end', gap: 2 },
  sessionDuration: { ...typography.label, color: colors.textPrimary },
  sessionVol: { ...typography.caption, color: colors.textSecondary },
  chevron: { fontSize: 20, color: colors.textDisabled, width: 16, textAlign: 'center' },
  expandedContent: { marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  exGroup: { marginBottom: spacing.sm },
  exName: { ...typography.label, color: colors.accent, marginBottom: 4 },
  setLine: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
});
