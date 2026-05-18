import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../theme';
import { Button } from '../components/Button';
import { useUserStore, useWorkoutStore } from '../store';
import { getRecentSessions, getAllTemplates } from '../database/db';
import { Session, Template, RootStackParamList } from '../types';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { prefs } = useUserStore();
  const { isActive } = useWorkoutStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setSessions(getRecentSessions(5));
    setTemplates(getAllTemplates());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    load();
    setRefreshing(false);
  }

  function startBlankWorkout() {
    navigation.navigate('ActiveWorkout', {});
  }

  function startFromTemplate(template: Template) {
    navigation.navigate('ActiveWorkout', { templateId: template.id, templateName: template.name });
  }

  const goalColors: Record<string, string> = {
    bulk: '#FF6B35', cut: '#5B8BDF', maintain: colors.accent,
  };
  const goalLabel: Record<string, string> = {
    bulk: 'Building Muscle', cut: 'Cutting', maintain: 'Maintaining',
  };

  function formatDuration(secs?: number) {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    return `${m} min`;
  }

  function formatVolume(vol?: number) {
    if (!vol) return '—';
    return `${(vol / 1000).toFixed(1)}k ${prefs.unitPreference}`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
            </Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={[styles.goalBadge, { borderColor: goalColors[prefs.goalMode] }]}>
            <Text style={[styles.goalBadgeText, { color: goalColors[prefs.goalMode] }]}>
              {goalLabel[prefs.goalMode]}
            </Text>
          </View>
        </View>

        {/* Active workout banner */}
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

        {/* Quick start */}
        <Button label="+ Start Workout" onPress={startBlankWorkout} style={styles.startBtn} />

        {/* Templates */}
        {templates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUICK START</Text>
            {templates.slice(0, 4).map(t => (
              <TouchableOpacity key={t.id} style={styles.templateCard} onPress={() => startFromTemplate(t)} activeOpacity={0.8}>
                <View>
                  <Text style={styles.templateName}>{t.name}</Text>
                  <Text style={styles.templateSub}>{t.exercises.length} exercises</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Your first workout is one tap away.</Text>
            </View>
          ) : (
            sessions.map(s => (
              <View key={s.id} style={styles.sessionCard}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionName}>{s.name}</Text>
                  <Text style={styles.sessionMeta}>{formatDate(s.startedAt)}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionStat}>{formatDuration(s.durationSeconds)}</Text>
                  <Text style={styles.sessionVol}>{formatVolume(s.totalVolume)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { ...typography.h2, color: colors.textSecondary },
  date: { ...typography.caption, color: colors.textDisabled, marginTop: 2 },
  goalBadge: {
    borderWidth: 1, borderRadius: radius.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  goalBadgeText: { ...typography.caption, fontWeight: '600' },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.accent,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  activeBannerText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  startBtn: {},
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1 },
  templateCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md,
  },
  templateName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  templateSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textDisabled },
  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center',
  },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  sessionCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md,
  },
  sessionLeft: { gap: 2 },
  sessionName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  sessionMeta: { ...typography.caption, color: colors.textSecondary },
  sessionRight: { alignItems: 'flex-end', gap: 2 },
  sessionStat: { ...typography.label, color: colors.textPrimary },
  sessionVol: { ...typography.caption, color: colors.textSecondary },
});
