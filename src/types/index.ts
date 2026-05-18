export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  description: string;
  coachingCues: string[];
  youtubeQuery: string;
  isCustom: boolean;
}

export interface LoggedSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
  completed: boolean;
  completedAt?: string;
}

export interface Session {
  id: string;
  name: string;
  templateId?: string;
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  notes?: string;
  totalVolume?: number;
  synced: boolean;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  achievedAt: string;
  sessionId: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  targetSets: number;
  targetReps: string;
}

export interface BodyMeasurement {
  id: string;
  loggedAt: string;
  bodyweight?: number;
  bodyweightUnit: 'lbs' | 'kg';
}

export interface UserPrefs {
  unitPreference: 'lbs' | 'kg';
  goalMode: 'bulk' | 'cut' | 'maintain';
  restTimerSecs: number;
  proteinTarget: number;
  calorieTarget: number;
  onboardingComplete: boolean;
}

// Active workout types (in-memory, not persisted until finish)
export interface ActiveSet {
  id: string;
  weight: string;
  reps: string;
  rpe?: string;
  completed: boolean;
  isWarmup: boolean;
}

export interface ActiveExercise {
  exercise: Exercise;
  sets: ActiveSet[];
}

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  ActiveWorkout: { templateId?: string; templateName?: string };
  ExerciseDetail: { exerciseId: string };
  ExerciseLibraryModal: { onSelect?: (exercise: Exercise) => void };
};

export type TabParamList = {
  Home: undefined;
  Workout: undefined;
  Progress: undefined;
  Library: undefined;
  Profile: undefined;
};
