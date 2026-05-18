import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, TAP_TARGET } from '../theme';
import { SetRow } from '../components/SetRow';
import { RestTimer } from '../components/RestTimer';
import { Button } from '../components/Button';
import { ExerciseCard } from '../components/ExerciseCard';
import { useWorkoutStore, useUserStore } from '../store';
import {
  insertSession, insertLoggedSets, finalizeSession,
  getPRForExercise, upsertPR, generateId, estimate1RM,
  getAllTemplates,
} from '../database/db';
import { RootStackParamList, ActiveExercise, LoggedSet, PersonalRecord } from '../types';

type Route = RouteProp<RootStackParamList, 'ActiveWorkout'>;

export function ActiveWorkoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { prefs } = useUserStore();
  const {
    isActive, sessionId, sessionName, startedAt, exercises,
    startSession, endSession, addExercise, addSet, removeSet,
    updateSet, completeSet, startRestTimer, newPRs, addPR, clearPRs,
  } = useWorkoutStore();

  const [elapsedStr, setElapsedStr] = useState('0:00:00');
  const [prToast, setPrToast] = useState<string | null>(null);
  const prToastAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize session
  useEffect(() => {
    if (!isActive) {
      const id = generateId();
      const name = route.params?.templateName ?? 'Workout';
      startSession(name, id);

      // Pre-load template exercises if provided
      if (route.params?.templateId) {
        const templates = getAllTemplates();
        const tpl = templates.find(t => t.id === route.params!.templateId);
        if (tpl) {
          // Template exercises are added via addExercise — load exercise objects
          // In production, resolve from exercise IDs
        }
      }
    }
  }, []);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!startedAt) return;
      const secs = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setElapsedStr(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startedAt]);

  // PR toast
  useEffect(() => {
    if (newPRs.length > 0) {
      const latest = newPRs[newPRs.length - 1];
      setPrToast(latest);
      Animated.sequence([
        Animated.timing(prToastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(prToastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => { setPrToast(null); clearPRs(); });
    }
  }, [newPRs.length]);

  function handleCompleteSet(ex: ActiveExercise, setIndex: number) {
    const s = ex.sets[setIndex];
    const weight = parseFloat(s.weight);
    const reps = parseInt(s.reps, 10);
    if (isNaN(weight) || isNaN(reps) || reps < 1) return;

    completeSet(ex.exercise.id, setIndex);
    startRestTimer(prefs.restTimerSecs);

    // PR check
    const e1rm = estimate1RM(weight, reps);
    const existing = getPRForExercise(ex.exercise.id);
    if (!existing || e1rm > existing.estimated1RM) {
      addPR(ex.exercise.name);
    }
  }

  function openLibrary() {
    navigation.navigate('ExerciseLibraryModal', {
      onSelect: (exercise) => {
        addExercise(exercise);
        navigation.goBack();
      },
    });
  }

  function handleFinish() {
    Alert.alert('Finish Workout?', 'Your session will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Finish', style: 'default', onPress: saveAndFinish },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All logged sets will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard', style: 'destructive', onPress: () => {
          if (timerRef.current) clearInterval(timerRef.current);
          endSession();
          navigation.goBack();
        },
      },
    ]);
  }

  async function saveAndFinish() {
    if (!sessionId || !startedAt) return;

    const finishedAt = new Date().toISOString();
    const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    const allSets: LoggedSet[] = [];
    let totalVolume = 0;

    for (const ex of exercises) {
      ex.sets.forEach((s, i) => {
        const weight = parseFloat(s.weight) || 0;
        const reps = parseInt(s.reps, 10) || 0;
        if (s.completed && weight > 0 && reps > 0) {
          totalVolume += weight * reps;
          allSets.push({
            id: generateId(),
            sessionId: sessionId!,
            exerciseId: ex.exercise.id,
            setNumber: i + 1,
            weight,
            reps,
            isWarmup: s.isWarmup,
            completed: true,
            completedAt: finishedAt,
          });
        }
      });
    }

    insertSession({
      id: sessionId,
      name: sessionName,
      startedAt: startedAt.toISOString(),
      finishedAt,
      durationSeconds,
      totalVolume,
      synced: false,
    });

    if (allSets.length > 0) {
      insertLoggedSets(allSets);
    }

    finalizeSession(sessionId, finishedAt, durationSeconds, totalVolume);

    // Upsert PRs
    for (const ex of exercises) {
      const completedSets = ex.sets.filter(s => s.completed);
      if (completedSets.length === 0) continue;
      const bestSet = completedSets.reduce((best, s) => {
        const e = estimate1RM(parseFloat(s.weight) || 0, parseInt(s.reps, 10) || 0);
        const bE = estimate1RM(parseFloat(best.weight) || 0, parseInt(best.reps, 10) || 0);
        return e > bE ? s : best;
      });
      const weight = parseFloat(bestSet.weight) || 0;
      const reps = parseInt(bestSet.reps, 10) || 0;
      if (weight > 0 && reps > 0) {
        upsertPR({
          id: generateId(),
          exerciseId: ex.exercise.id,
          exerciseName: ex.exercise.name,
          weight,
          reps,
          estimated1RM: estimate1RM(weight, reps),
          achievedAt: finishedAt,
          sessionId: sessionId,
        });
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    endSession();
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleDiscard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.sessionName}>{sessionName}</Text>
          <Text style={styles.timer}>{elapsedStr}</Text>
        </View>

        {/* PR Toast */}
        {prToast && (
          <Animated.View style={[styles.prToast, { opacity: prToastAnim }]}>
            <Text style={styles.prToastText}>🏆 New PR — {prToast}</Text>
          </Animated.View>
        )}

        {/* Exercises */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptySubtitle}>Tap below to add your first exercise</Text>
            </View>
          )}

          {exercises.map(ex => (
            <View key={ex.exercise.id} style={styles.exerciseBlock}>
              {/* Exercise header */}
              <View style={styles.exerciseHeader}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.exercise.id })}
                  style={styles.exerciseNameRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                  <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.muscleLabel}>{ex.exercise.primaryMuscle}</Text>
              </View>

              {/* Set column headers */}
              <View style={styles.setHeaders}>
                <Text style={[styles.setHeaderText, { width: 20 }]}>#</Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>WEIGHT</Text>
                <Text style={[styles.setHeaderText, { width: 24 }]}></Text>
                <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                <Text style={[styles.setHeaderText, { width: TAP_TARGET + 4 }]}></Text>
              </View>

              {/* Sets */}
              {ex.sets.map((s, i) => (
                <SetRow
                  key={s.id}
                  set={s}
                  setNumber={i + 1}
                  unit={prefs.unitPreference}
                  onChangeWeight={v => updateSet(ex.exercise.id, i, 'weight', v)}
                  onChangeReps={v => updateSet(ex.exercise.id, i, 'reps', v)}
                  onComplete={() => handleCompleteSet(ex, i)}
                  onLongPress={() => removeSet(ex.exercise.id, i)}
                />
              ))}

              {/* Add set */}
              <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(ex.exercise.id)} activeOpacity={0.7}>
                <Text style={styles.addSetText}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add exercise */}
          <TouchableOpacity style={styles.addExerciseBtn} onPress={openLibrary} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Rest timer */}
        <RestTimer />

        {/* Finish button */}
        <View style={styles.finishRow}>
          <Button label="Finish Workout" onPress={handleFinish} variant="ghost" style={styles.finishBtn} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sessionName: { ...typography.h2, color: colors.textPrimary },
  timer: { ...typography.label, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  prToast: {
    position: 'absolute', top: 80, alignSelf: 'center', zIndex: 99,
    backgroundColor: colors.bgCard, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.accent,
  },
  prToastText: { ...typography.label, color: colors.accent, fontWeight: '700' },
  scrollContent: { padding: spacing.md, gap: spacing.md, paddingBottom: 24 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { ...typography.h2, color: colors.textSecondary },
  emptySubtitle: { ...typography.body, color: colors.textDisabled },
  exerciseBlock: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  exerciseHeader: { marginBottom: spacing.xs },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exerciseName: { ...typography.h2, color: colors.textPrimary, flex: 1 },
  muscleLabel: { ...typography.caption, color: colors.textSecondary },
  setHeaders: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: 2,
  },
  setHeaderText: { ...typography.caption, color: colors.textDisabled, letterSpacing: 0.5 },
  addSetBtn: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs },
  addSetText: { ...typography.label, color: colors.textSecondary },
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.lg,
  },
  addExerciseText: { ...typography.body, color: colors.textSecondary },
  finishRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  finishBtn: {},
});
