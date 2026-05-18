import { Exercise } from '../types';

export const SEED_EXERCISES: Omit<Exercise, 'isCustom'>[] = [
  // Chest
  {
    id: 'bench-press', name: 'Bench Press', primaryMuscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Barbell',
    description: 'The foundational horizontal push movement for chest strength.',
    coachingCues: ['Retract scapula before unracking', 'Bar over mid-chest at bottom', 'Elbows 45–75° from torso', 'Drive feet into floor', 'Full lockout at top'],
    youtubeQuery: 'bench press proper form tutorial',
  },
  {
    id: 'incline-bench', name: 'Incline Bench Press', primaryMuscle: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Barbell',
    description: 'Upper chest focused press on a 30–45° incline.',
    coachingCues: ['Set bench to 30–45°', 'Bar touches upper chest', 'Control the descent', 'Avoid excessive arch'],
    youtubeQuery: 'incline bench press form tutorial',
  },
  {
    id: 'dumbbell-fly', name: 'Dumbbell Fly', primaryMuscle: 'Chest',
    secondaryMuscles: [], equipment: 'Dumbbell',
    description: 'Chest isolation movement with peak stretch at the bottom.',
    coachingCues: ['Slight bend in elbows throughout', 'Lower until stretch, not pain', 'Squeeze chest at top', 'Control the descent'],
    youtubeQuery: 'dumbbell fly chest form tutorial',
  },
  // Back
  {
    id: 'barbell-row', name: 'Barbell Row', primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'], equipment: 'Barbell',
    description: 'Primary horizontal pull for back thickness.',
    coachingCues: ['Hinge to 45°', 'Pull to lower chest/upper abs', 'Squeeze shoulder blades', 'Control the eccentric'],
    youtubeQuery: 'barbell row proper form tutorial',
  },
  {
    id: 'pull-up', name: 'Pull-Up', primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'], equipment: 'Bodyweight',
    description: 'Vertical pull — best back builder requiring only a bar.',
    coachingCues: ['Dead hang start', 'Depress scapula before pulling', 'Pull elbows to hips', 'Full ROM top and bottom'],
    youtubeQuery: 'pull up perfect form tutorial',
  },
  {
    id: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps'], equipment: 'Cable',
    description: 'Vertical pull machine substitute for pull-ups.',
    coachingCues: ['Slight lean back', 'Pull to upper chest', 'Elbows to hips', 'Full stretch at top'],
    youtubeQuery: 'lat pulldown form tutorial',
  },
  {
    id: 'deadlift', name: 'Deadlift', primaryMuscle: 'Back',
    secondaryMuscles: ['Hamstrings', 'Glutes', 'Traps'], equipment: 'Barbell',
    description: 'The ultimate posterior chain movement.',
    coachingCues: ['Bar over mid-foot', 'Hips higher than knees at start', 'Neutral spine throughout', 'Push floor away, then hips through', 'Lock out glutes at top'],
    youtubeQuery: 'deadlift perfect form tutorial',
  },
  // Legs
  {
    id: 'squat', name: 'Back Squat', primaryMuscle: 'Legs',
    secondaryMuscles: ['Glutes', 'Core'], equipment: 'Barbell',
    description: 'The king of lower body movements.',
    coachingCues: ['Bar on traps, not neck', 'Brace core before descent', 'Break hips and knees together', 'Knees track over toes', 'Drive through full foot'],
    youtubeQuery: 'back squat perfect form tutorial',
  },
  {
    id: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'Legs',
    secondaryMuscles: ['Glutes', 'Back'], equipment: 'Barbell',
    description: 'Hamstring and glute hinge with continuous tension.',
    coachingCues: ['Soft knee bend throughout', 'Hinge at hips, not waist', 'Bar drags down thighs', 'Feel stretch in hamstrings', 'Drive hips to stand'],
    youtubeQuery: 'romanian deadlift form tutorial',
  },
  {
    id: 'leg-press', name: 'Leg Press', primaryMuscle: 'Legs',
    secondaryMuscles: ['Glutes'], equipment: 'Machine',
    description: 'Quad-dominant lower body press with spinal loading removed.',
    coachingCues: ['Feet hip-width, mid-platform', 'Do not lock out knees', 'Control descent', 'Do not let lower back round'],
    youtubeQuery: 'leg press form tutorial',
  },
  {
    id: 'leg-curl', name: 'Leg Curl', primaryMuscle: 'Legs',
    secondaryMuscles: [], equipment: 'Machine',
    description: 'Isolated hamstring curl.',
    coachingCues: ['Full ROM', 'Slow eccentric', 'Keep hips down', 'Squeeze at top'],
    youtubeQuery: 'leg curl machine form tutorial',
  },
  {
    id: 'calf-raise', name: 'Calf Raise', primaryMuscle: 'Legs',
    secondaryMuscles: [], equipment: 'Machine',
    description: 'Gastroc and soleus isolation.',
    coachingCues: ['Full stretch at bottom', 'Pause at top', 'Single-leg for strength imbalances'],
    youtubeQuery: 'calf raise form tutorial',
  },
  // Shoulders
  {
    id: 'ohp', name: 'Overhead Press', primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest'], equipment: 'Barbell',
    description: 'Standing vertical press — the upper body squat.',
    coachingCues: ['Grip just outside shoulders', 'Bar rests on upper chest', 'Press in slight back arc', 'Lock out overhead', 'Squeeze glutes throughout'],
    youtubeQuery: 'overhead press form tutorial',
  },
  {
    id: 'lateral-raise', name: 'Lateral Raise', primaryMuscle: 'Shoulders',
    secondaryMuscles: [], equipment: 'Dumbbell',
    description: 'Lateral delt isolation for shoulder width.',
    coachingCues: ['Slight bend in elbows', 'Lead with elbows, not hands', 'Slow eccentric (3–4 sec)', 'No momentum'],
    youtubeQuery: 'lateral raise form tutorial',
  },
  {
    id: 'face-pull', name: 'Face Pull', primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Rear Delts', 'Traps'], equipment: 'Cable',
    description: 'Rear delt and external rotation exercise.',
    coachingCues: ['Pull to forehead level', 'Elbows high and wide', 'External rotate at end', 'Slow and controlled'],
    youtubeQuery: 'face pull form tutorial',
  },
  // Arms
  {
    id: 'barbell-curl', name: 'Barbell Curl', primaryMuscle: 'Arms',
    secondaryMuscles: ['Forearms'], equipment: 'Barbell',
    description: 'Foundational bicep mass builder.',
    coachingCues: ['Elbows stay at sides', 'Supinate at top', 'Full extension at bottom', 'No body english'],
    youtubeQuery: 'barbell curl form tutorial',
  },
  {
    id: 'tricep-pushdown', name: 'Tricep Pushdown', primaryMuscle: 'Arms',
    secondaryMuscles: [], equipment: 'Cable',
    description: 'Cable tricep isolation.',
    coachingCues: ['Elbows at sides', 'Full extension at bottom', 'Slow eccentric', 'Squeeze at bottom'],
    youtubeQuery: 'tricep pushdown form tutorial',
  },
  {
    id: 'hammer-curl', name: 'Hammer Curl', primaryMuscle: 'Arms',
    secondaryMuscles: ['Forearms'], equipment: 'Dumbbell',
    description: 'Neutral grip curl targeting brachialis.',
    coachingCues: ['Neutral grip throughout', 'No rotation', 'Elbows stay at sides'],
    youtubeQuery: 'hammer curl form tutorial',
  },
  // Core
  {
    id: 'plank', name: 'Plank', primaryMuscle: 'Core',
    secondaryMuscles: ['Shoulders'], equipment: 'Bodyweight',
    description: 'Anti-extension core stability.',
    coachingCues: ['Straight line head to heel', 'Squeeze glutes', 'Breathe normally', 'Do not let hips sag'],
    youtubeQuery: 'plank form tutorial',
  },
  {
    id: 'ab-wheel', name: 'Ab Wheel Rollout', primaryMuscle: 'Core',
    secondaryMuscles: ['Shoulders', 'Back'], equipment: 'Other',
    description: 'Advanced anti-extension core exercise.',
    coachingCues: ['Neutral spine', 'Do not let hips sag', 'Pull from abs to return', 'Kneel for regression'],
    youtubeQuery: 'ab wheel rollout form tutorial',
  },
];
