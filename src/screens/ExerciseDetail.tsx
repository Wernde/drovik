import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import { getExerciseById, getExerciseHistory } from '../database/db';
import { Exercise, LoggedSet, RootStackParamList } from '../types';
import { useUserStore } from '../store';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = (width - spacing.lg * 2) * (9 / 16);

type Route = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { prefs } = useUserStore();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<LoggedSet[]>([]);

  useEffect(() => {
    const ex = getExerciseById(route.params.exerciseId);
    setExercise(ex);
    if (ex) {
      setHistory(getExerciseHistory(ex.id, 10));
    }
  }, [route.params.exerciseId]);

  if (!exercise) return null;

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeQuery)}`;

  function groupBySession(sets: LoggedSet[]) {
    const groups: Record<string, LoggedSet[]> = {};
    for (const s of sets) {
      if (!groups[s.sessionId]) groups[s.sessionId] = [];
      groups[s.sessionId].push(s);
    }
    return Object.values(groups).slice(0, 3);
  }

  const historyGroups = groupBySession(history);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exercise.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video */}
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: searchUrl }}
            style={styles.video}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            startInLoadingState
            javaScriptEnabled
          />
        </View>

        {/* Muscle tags */}
        <View style={styles.tagRow}>
          <View style={styles.primaryTag}>
            <Text style={styles.primaryTagText}>{exercise.primaryMuscle}</Text>
          </View>
          {exercise.secondaryMuscles.map(m => (
            <View key={m} style={styles.secTag}>
              <Text style={styles.secTagText}>{m}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {exercise.description ? (
          <Text style={styles.description}>{exercise.description}</Text>
        ) : null}

        {/* Coaching cues */}
        {exercise.coachingCues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COACHING CUES</Text>
            {exercise.coachingCues.map((cue, i) => (
              <View key={i} style={styles.cueRow}>
                <View style={styles.cueDot} />
                <Text style={styles.cueText}>{cue}</Text>
              </View>
            ))}
          </View>
        )}

        {/* History */}
        {historyGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MY HISTORY</Text>
            {historyGroups.map((group, gi) => (
              <View key={gi} style={styles.historyGroup}>
                {group.map((s, i) => (
                  <View key={s.id} style={styles.historyRow}>
                    {i === 0 && <Text style={styles.historyDate}>
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </Text>}
                    {i > 0 && <Text style={styles.historyDate} />}
                    <Text style={styles.historySet}>
                      Set {s.setNumber}  ·  {s.weight} {prefs.unitPreference}  ×  {s.reps} reps
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {historyGroups.length === 0 && (
          <View style={styles.noHistory}>
            <Text style={styles.noHistoryText}>No history yet. Log this exercise to see your data.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  videoContainer: { height: VIDEO_HEIGHT, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bgCard },
  video: { flex: 1, backgroundColor: colors.bgCard },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryTag: {
    backgroundColor: colors.accent, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  primaryTagText: { ...typography.label, color: colors.bg, fontWeight: '700' },
  secTag: {
    backgroundColor: colors.bgInput, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.border,
  },
  secTagText: { ...typography.label, color: colors.textSecondary },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1 },
  cueRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  cueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7 },
  cueText: { ...typography.body, color: colors.textPrimary, flex: 1, lineHeight: 22 },
  historyGroup: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.xs,
  },
  historyRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  historyDate: { ...typography.caption, color: colors.textSecondary, width: 48 },
  historySet: { ...typography.label, color: colors.textPrimary },
  noHistory: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  noHistoryText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
