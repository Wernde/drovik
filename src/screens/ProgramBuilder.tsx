import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, TAP_TARGET } from '../theme';
import { Button } from '../components/Button';
import { insertTemplate, generateId } from '../database/db';
import { Template, TemplateExercise, Exercise, RootStackParamList } from '../types';

interface DraftExercise {
  exercise: Exercise;
  targetSets: string;
  targetReps: string;
}

export function ProgramBuilderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>([]);

  function handleAddExercise() {
    navigation.navigate('ExerciseLibraryModal', {
      onSelect: (exercise: Exercise) => {
        setDraftExercises(prev => [
          ...prev,
          { exercise, targetSets: '3', targetReps: '8-12' },
        ]);
        navigation.goBack();
      },
    });
  }

  function updateSets(index: number, value: string) {
    setDraftExercises(prev => prev.map((e, i) => i === index ? { ...e, targetSets: value } : e));
  }

  function updateReps(index: number, value: string) {
    setDraftExercises(prev => prev.map((e, i) => i === index ? { ...e, targetReps: value } : e));
  }

  function removeExercise(index: number) {
    setDraftExercises(prev => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give your template a name.');
      return;
    }
    if (draftExercises.length === 0) {
      Alert.alert('Add exercises', 'Add at least one exercise to your template.');
      return;
    }

    const templateId = generateId();
    const exercises: TemplateExercise[] = draftExercises.map((de, i) => ({
      id: generateId(),
      templateId,
      exerciseId: de.exercise.id,
      exerciseName: de.exercise.name,
      position: i,
      targetSets: parseInt(de.targetSets, 10) || 3,
      targetReps: de.targetReps || '8-12',
    }));

    const template: Template = {
      id: templateId,
      name: name.trim(),
      description: description.trim() || undefined,
      exercises,
    };

    insertTemplate(template);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Template</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TEMPLATE NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push Day A"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="Notes about this template..."
            placeholderTextColor={colors.textDisabled}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Exercise list */}
        <Text style={styles.sectionLabel}>EXERCISES</Text>

        {draftExercises.map((de, i) => (
          <View key={de.exercise.id + i} style={styles.exerciseRow}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName} numberOfLines={1}>{de.exercise.name}</Text>
              <Text style={styles.exerciseMuscle}>{de.exercise.primaryMuscle}</Text>
            </View>

            <View style={styles.targetInputs}>
              <View style={styles.miniField}>
                <Text style={styles.miniLabel}>Sets</Text>
                <TextInput
                  style={styles.miniInput}
                  value={de.targetSets}
                  onChangeText={v => updateSets(i, v)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
              </View>
              <Text style={styles.x}>×</Text>
              <View style={styles.miniField}>
                <Text style={styles.miniLabel}>Reps</Text>
                <TextInput
                  style={styles.miniInput}
                  value={de.targetReps}
                  onChangeText={v => updateReps(i, v)}
                  selectTextOnFocus
                />
              </View>
            </View>

            <TouchableOpacity onPress={() => removeExercise(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add exercise */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAddExercise} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.addText}>Add Exercise</Text>
        </TouchableOpacity>

        <View style={styles.gap} />
        <Button label="Save Template" onPress={handleSave} />
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
  title: { ...typography.h2, color: colors.textPrimary },
  saveBtn: { ...typography.body, color: colors.accent, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1 },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, ...typography.body, color: colors.textPrimary,
    height: TAP_TARGET,
  },
  inputMulti: { height: undefined, minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.md },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.label, color: colors.textPrimary, fontWeight: '600' },
  exerciseMuscle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  targetInputs: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  miniField: { alignItems: 'center', gap: 2 },
  miniLabel: { ...typography.caption, color: colors.textDisabled },
  miniInput: {
    width: 44, height: 40, backgroundColor: colors.bgInput,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    color: colors.textPrimary, textAlign: 'center',
    ...typography.label, fontWeight: '700',
  },
  x: { ...typography.body, color: colors.textDisabled },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.lg,
  },
  addText: { ...typography.body, color: colors.textSecondary },
  gap: { height: spacing.md },
});
