import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography, TAP_TARGET } from '../theme';
import { useUserStore } from '../store';
import { insertBodyMeasurement, generateId } from '../database/db';
import { RootStackParamList } from '../types';
import { Button } from '../components/Button';
import { ProgramBuilderScreen } from './ProgramBuilder';

type GoalMode = 'bulk' | 'cut' | 'maintain';
type Unit = 'lbs' | 'kg';

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { prefs, setPrefs } = useUserStore();

  const [bwInput, setBwInput] = useState('');
  const [restInput, setRestInput] = useState(String(prefs.restTimerSecs));
  const [proteinInput, setProteinInput] = useState(String(prefs.proteinTarget));
  const [calorieInput, setCalorieInput] = useState(String(prefs.calorieTarget));

  function handleLogBodyweight() {
    const val = parseFloat(bwInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid', 'Enter a valid bodyweight.');
      return;
    }
    insertBodyMeasurement({
      id: generateId(),
      loggedAt: new Date().toISOString(),
      bodyweight: val,
      bodyweightUnit: prefs.unitPreference,
    });
    setBwInput('');
    Alert.alert('Logged', `${val} ${prefs.unitPreference} saved.`);
  }

  function saveNumericPref(key: 'restTimerSecs' | 'proteinTarget' | 'calorieTarget', value: string) {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0) setPrefs({ [key]: n });
  }

  const goalOptions: [GoalMode, string][] = [
    ['bulk', 'Build Muscle'],
    ['cut', 'Lose Fat'],
    ['maintain', 'Stay Consistent'],
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* Units */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>UNITS</Text>
          <View style={styles.card}>
            <View style={styles.pillRow}>
              {(['lbs', 'kg'] as Unit[]).map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pill, prefs.unitPreference === u && styles.pillActive]}
                  onPress={() => setPrefs({ unitPreference: u })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, prefs.unitPreference === u && styles.pillTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GOAL</Text>
          <View style={styles.card}>
            {goalOptions.map(([g, label]) => (
              <TouchableOpacity
                key={g}
                style={[styles.goalRow, prefs.goalMode === g && styles.goalRowActive]}
                onPress={() => setPrefs({ goalMode: g })}
                activeOpacity={0.8}
              >
                <Text style={[styles.goalText, prefs.goalMode === g && styles.goalTextActive]}>{label}</Text>
                {prefs.goalMode === g && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rest timer */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REST TIMER DEFAULT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Duration (seconds)</Text>
              <TextInput
                style={styles.inlineInput}
                value={restInput}
                onChangeText={setRestInput}
                onBlur={() => saveNumericPref('restTimerSecs', restInput)}
                keyboardType="number-pad"
                returnKeyType="done"
                selectTextOnFocus
              />
            </View>
          </View>
        </View>

        {/* Bodyweight log */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LOG BODYWEIGHT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <TextInput
                style={styles.bwInput}
                value={bwInput}
                onChangeText={setBwInput}
                placeholder={`Weight in ${prefs.unitPreference}`}
                placeholderTextColor={colors.textDisabled}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.logBtn} onPress={handleLogBodyweight} activeOpacity={0.8}>
                <Text style={styles.logBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Nutrition targets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DAILY TARGETS</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Protein (g)</Text>
              <TextInput
                style={styles.inlineInput}
                value={proteinInput}
                onChangeText={setProteinInput}
                onBlur={() => saveNumericPref('proteinTarget', proteinInput)}
                keyboardType="number-pad"
                returnKeyType="done"
                selectTextOnFocus
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Calories (kcal)</Text>
              <TextInput
                style={styles.inlineInput}
                value={calorieInput}
                onChangeText={setCalorieInput}
                onBlur={() => saveNumericPref('calorieTarget', calorieInput)}
                keyboardType="number-pad"
                returnKeyType="done"
                selectTextOnFocus
              />
            </View>
          </View>
        </View>

        {/* Program builder shortcut */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TEMPLATES</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Main' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.rowLabel}>Build a new template</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Drovik</Text>
              <Text style={styles.rowValue}>v1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 48 },
  title: { ...typography.h1, color: colors.textPrimary },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: 1 },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, overflow: 'hidden' },
  pillRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  pill: {
    flex: 1, height: TAP_TARGET, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgInput,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
  pillTextActive: { color: colors.bg },
  goalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  goalRowActive: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: spacing.md - 3 },
  goalText: { ...typography.body, color: colors.textPrimary },
  goalTextActive: { color: colors.accent, fontWeight: '600' },
  check: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, minHeight: TAP_TARGET,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  rowValue: { ...typography.body, color: colors.textSecondary },
  chevron: { fontSize: 20, color: colors.textDisabled },
  inlineInput: {
    ...typography.body, color: colors.textPrimary, fontWeight: '700',
    backgroundColor: colors.bgInput, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: TAP_TARGET - 8,
    minWidth: 80, textAlign: 'center',
  },
  divider: { height: 1, backgroundColor: colors.border },
  bwInput: {
    flex: 1, height: TAP_TARGET, backgroundColor: colors.bgInput,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, ...typography.body, color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  logBtn: {
    height: TAP_TARGET, paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  logBtnText: { ...typography.body, color: colors.bg, fontWeight: '700' },
});
