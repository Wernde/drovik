import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, TAP_TARGET } from '../theme';
import { ExerciseCard } from '../components/ExerciseCard';
import { searchExercises } from '../database/db';
import { Exercise, RootStackParamList } from '../types';

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

type Route = RouteProp<RootStackParamList, 'ExerciseLibraryModal'>;

export function ExerciseLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const isModal = Boolean(route.params?.onSelect);

  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const load = useCallback(() => {
    setExercises(searchExercises(query, muscle));
  }, [query, muscle]);

  useEffect(() => { load(); }, [load]);

  function handleSelect(exercise: Exercise) {
    if (isModal && route.params?.onSelect) {
      route.params.onSelect(exercise);
    } else {
      navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {isModal && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{isModal ? 'Add Exercise' : 'Library'}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textDisabled}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Muscle filter */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {MUSCLE_FILTERS.map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.filterChip, muscle === m && styles.filterChipActive]}
            onPress={() => setMuscle(m)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, muscle === m && styles.filterTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={exercises}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exercises found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ExerciseCard exercise={item} onPress={() => handleSelect(item)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  closeBtn: { padding: spacing.xs },
  title: { ...typography.h1, color: colors.textPrimary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgInput, borderRadius: radius.lg,
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    paddingHorizontal: spacing.md, height: TAP_TARGET,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: {},
  searchInput: {
    flex: 1, ...typography.body, color: colors.textPrimary,
    height: TAP_TARGET,
  },
  filterScroll: { marginTop: spacing.md },
  filterRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { ...typography.label, color: colors.textSecondary },
  filterTextActive: { color: colors.bg, fontWeight: '700' },
  list: { padding: spacing.lg, gap: spacing.xs },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
