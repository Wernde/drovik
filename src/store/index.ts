import { create } from 'zustand';
import { ActiveExercise, ActiveSet, Exercise, UserPrefs } from '../types';
import { getUserPrefs, updateUserPrefs, generateId } from '../database/db';

// ─── User Store ────────────────────────────────────────────────────────────

interface UserState {
  prefs: UserPrefs;
  loadPrefs: () => void;
  setPrefs: (prefs: Partial<UserPrefs>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  prefs: {
    unitPreference: 'lbs',
    goalMode: 'maintain',
    restTimerSecs: 90,
    proteinTarget: 150,
    calorieTarget: 2500,
    onboardingComplete: false,
  },
  loadPrefs: () => {
    const prefs = getUserPrefs();
    set({ prefs });
  },
  setPrefs: (partial) => {
    updateUserPrefs(partial);
    set(state => ({ prefs: { ...state.prefs, ...partial } }));
  },
}));

// ─── Active Workout Store ──────────────────────────────────────────────────

interface WorkoutState {
  isActive: boolean;
  sessionId: string | null;
  sessionName: string;
  startedAt: Date | null;
  exercises: ActiveExercise[];
  restTimerSecs: number;
  restTimerActive: boolean;
  restTimerRemaining: number;
  newPRs: string[];

  startSession: (name: string, sessionId: string) => void;
  endSession: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSet: (exerciseId: string, setIndex: number, field: 'weight' | 'reps' | 'rpe', value: string) => void;
  completeSet: (exerciseId: string, setIndex: number) => void;
  startRestTimer: (secs: number) => void;
  tickRestTimer: () => void;
  skipRestTimer: () => void;
  addPR: (exerciseName: string) => void;
  clearPRs: () => void;
}

function makeEmptySet(setNumber: number): ActiveSet {
  return {
    id: generateId(),
    weight: '',
    reps: '',
    completed: false,
    isWarmup: false,
  };
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  isActive: false,
  sessionId: null,
  sessionName: 'Workout',
  startedAt: null,
  exercises: [],
  restTimerSecs: 90,
  restTimerActive: false,
  restTimerRemaining: 0,
  newPRs: [],

  startSession: (name, sessionId) => set({
    isActive: true,
    sessionId,
    sessionName: name,
    startedAt: new Date(),
    exercises: [],
    restTimerActive: false,
    newPRs: [],
  }),

  endSession: () => set({
    isActive: false,
    sessionId: null,
    sessionName: 'Workout',
    startedAt: null,
    exercises: [],
    restTimerActive: false,
    restTimerRemaining: 0,
    newPRs: [],
  }),

  addExercise: (exercise) => set(state => ({
    exercises: [
      ...state.exercises,
      { exercise, sets: [makeEmptySet(1)] },
    ],
  })),

  removeExercise: (exerciseId) => set(state => ({
    exercises: state.exercises.filter(e => e.exercise.id !== exerciseId),
  })),

  addSet: (exerciseId) => set(state => ({
    exercises: state.exercises.map(e => {
      if (e.exercise.id !== exerciseId) return e;
      const last = e.sets[e.sets.length - 1];
      const newSet: ActiveSet = {
        id: generateId(),
        weight: last?.weight ?? '',
        reps: last?.reps ?? '',
        completed: false,
        isWarmup: false,
      };
      return { ...e, sets: [...e.sets, newSet] };
    }),
  })),

  removeSet: (exerciseId, setIndex) => set(state => ({
    exercises: state.exercises.map(e => {
      if (e.exercise.id !== exerciseId) return e;
      const sets = [...e.sets];
      sets.splice(setIndex, 1);
      return { ...e, sets };
    }),
  })),

  updateSet: (exerciseId, setIndex, field, value) => set(state => ({
    exercises: state.exercises.map(e => {
      if (e.exercise.id !== exerciseId) return e;
      const sets = e.sets.map((s, i) =>
        i === setIndex ? { ...s, [field]: value } : s
      );
      return { ...e, sets };
    }),
  })),

  completeSet: (exerciseId, setIndex) => set(state => ({
    exercises: state.exercises.map(e => {
      if (e.exercise.id !== exerciseId) return e;
      const sets = e.sets.map((s, i) =>
        i === setIndex ? { ...s, completed: true } : s
      );
      return { ...e, sets };
    }),
  })),

  startRestTimer: (secs) => set({
    restTimerActive: true,
    restTimerRemaining: secs,
    restTimerSecs: secs,
  }),

  tickRestTimer: () => {
    const { restTimerRemaining } = get();
    if (restTimerRemaining <= 1) {
      set({ restTimerActive: false, restTimerRemaining: 0 });
    } else {
      set({ restTimerRemaining: restTimerRemaining - 1 });
    }
  },

  skipRestTimer: () => set({ restTimerActive: false, restTimerRemaining: 0 }),

  addPR: (exerciseName) => set(state => ({
    newPRs: [...state.newPRs, exerciseName],
  })),

  clearPRs: () => set({ newPRs: [] }),
}));
