import * as SQLite from 'expo-sqlite';
import { Exercise, Session, LoggedSet, PersonalRecord, Template, BodyMeasurement, UserPrefs } from '../types';
import { SEED_EXERCISES } from './seed';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('drovik.db');
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();

  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      secondary_muscles TEXT NOT NULL DEFAULT '[]',
      equipment TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      coaching_cues TEXT NOT NULL DEFAULT '[]',
      youtube_query TEXT NOT NULL DEFAULT '',
      is_custom INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template_id TEXT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      duration_seconds INTEGER,
      notes TEXT,
      total_volume REAL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS logged_sets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      rpe REAL,
      is_warmup INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      estimated_1rm REAL NOT NULL,
      achieved_at TEXT NOT NULL,
      session_id TEXT NOT NULL,
      UNIQUE(exercise_id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      position INTEGER NOT NULL,
      target_sets INTEGER NOT NULL DEFAULT 3,
      target_reps TEXT NOT NULL DEFAULT '8-12',
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY,
      logged_at TEXT NOT NULL,
      bodyweight REAL,
      bodyweight_unit TEXT NOT NULL DEFAULT 'lbs',
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_prefs (
      id INTEGER PRIMARY KEY DEFAULT 1,
      unit_preference TEXT NOT NULL DEFAULT 'lbs',
      goal_mode TEXT NOT NULL DEFAULT 'maintain',
      rest_timer_secs INTEGER NOT NULL DEFAULT 90,
      protein_target INTEGER NOT NULL DEFAULT 150,
      calorie_target INTEGER NOT NULL DEFAULT 2500,
      onboarding_complete INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_logged_sets_session ON logged_sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_logged_sets_exercise ON logged_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
  `);

  // Seed exercises if empty
  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  if (count?.count === 0) {
    seedExercises(db);
  }

  // Ensure user_prefs row exists
  db.execSync(`INSERT OR IGNORE INTO user_prefs (id) VALUES (1)`);
}

function seedExercises(db: SQLite.SQLiteDatabase): void {
  const stmt = db.prepareSync(`
    INSERT OR IGNORE INTO exercises (id, name, primary_muscle, secondary_muscles, equipment, description, coaching_cues, youtube_query, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);
  for (const ex of SEED_EXERCISES) {
    stmt.executeSync([
      ex.id, ex.name, ex.primaryMuscle,
      JSON.stringify(ex.secondaryMuscles), ex.equipment,
      ex.description, JSON.stringify(ex.coachingCues), ex.youtubeQuery,
    ]);
  }
  stmt.finalizeSync();
}

// ─── User Prefs ────────────────────────────────────────────────────────────

export function getUserPrefs(): UserPrefs {
  const db = getDb();
  const row = db.getFirstSync<any>('SELECT * FROM user_prefs WHERE id = 1');
  return {
    unitPreference: row?.unit_preference ?? 'lbs',
    goalMode: row?.goal_mode ?? 'maintain',
    restTimerSecs: row?.rest_timer_secs ?? 90,
    proteinTarget: row?.protein_target ?? 150,
    calorieTarget: row?.calorie_target ?? 2500,
    onboardingComplete: Boolean(row?.onboarding_complete),
  };
}

export function updateUserPrefs(prefs: Partial<UserPrefs>): void {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (prefs.unitPreference !== undefined) { fields.push('unit_preference = ?'); values.push(prefs.unitPreference); }
  if (prefs.goalMode !== undefined) { fields.push('goal_mode = ?'); values.push(prefs.goalMode); }
  if (prefs.restTimerSecs !== undefined) { fields.push('rest_timer_secs = ?'); values.push(prefs.restTimerSecs); }
  if (prefs.proteinTarget !== undefined) { fields.push('protein_target = ?'); values.push(prefs.proteinTarget); }
  if (prefs.calorieTarget !== undefined) { fields.push('calorie_target = ?'); values.push(prefs.calorieTarget); }
  if (prefs.onboardingComplete !== undefined) { fields.push('onboarding_complete = ?'); values.push(prefs.onboardingComplete ? 1 : 0); }

  if (fields.length === 0) return;
  db.runSync(`UPDATE user_prefs SET ${fields.join(', ')} WHERE id = 1`, values);
}

// ─── Exercises ─────────────────────────────────────────────────────────────

function rowToExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    primaryMuscle: row.primary_muscle,
    secondaryMuscles: JSON.parse(row.secondary_muscles ?? '[]'),
    equipment: row.equipment,
    description: row.description,
    coachingCues: JSON.parse(row.coaching_cues ?? '[]'),
    youtubeQuery: row.youtube_query,
    isCustom: Boolean(row.is_custom),
  };
}

export function getAllExercises(): Exercise[] {
  const db = getDb();
  const rows = db.getAllSync<any>('SELECT * FROM exercises ORDER BY name ASC');
  return rows.map(rowToExercise);
}

export function searchExercises(query: string, muscle?: string): Exercise[] {
  const db = getDb();
  let sql = 'SELECT * FROM exercises WHERE name LIKE ?';
  const params: any[] = [`%${query}%`];
  if (muscle && muscle !== 'All') {
    sql += ' AND primary_muscle = ?';
    params.push(muscle);
  }
  sql += ' ORDER BY name ASC LIMIT 60';
  return db.getAllSync<any>(sql, params).map(rowToExercise);
}

export function getExerciseById(id: string): Exercise | null {
  const db = getDb();
  const row = db.getFirstSync<any>('SELECT * FROM exercises WHERE id = ?', [id]);
  return row ? rowToExercise(row) : null;
}

export function insertCustomExercise(exercise: Omit<Exercise, 'isCustom'>): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO exercises (id, name, primary_muscle, secondary_muscles, equipment, description, coaching_cues, youtube_query, is_custom)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [exercise.id, exercise.name, exercise.primaryMuscle,
     JSON.stringify(exercise.secondaryMuscles), exercise.equipment,
     exercise.description, JSON.stringify(exercise.coachingCues), exercise.youtubeQuery]
  );
}

// ─── Sessions ──────────────────────────────────────────────────────────────

export function insertSession(session: Session): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO sessions (id, name, template_id, started_at, finished_at, duration_seconds, notes, total_volume, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [session.id, session.name, session.templateId ?? null,
     session.startedAt, session.finishedAt ?? null,
     session.durationSeconds ?? null, session.notes ?? null, session.totalVolume ?? 0]
  );
}

export function finalizeSession(id: string, finishedAt: string, durationSeconds: number, totalVolume: number): void {
  const db = getDb();
  db.runSync(
    'UPDATE sessions SET finished_at = ?, duration_seconds = ?, total_volume = ? WHERE id = ?',
    [finishedAt, durationSeconds, totalVolume, id]
  );
}

export function getRecentSessions(limit = 20): Session[] {
  const db = getDb();
  const rows = db.getAllSync<any>(
    'SELECT * FROM sessions WHERE finished_at IS NOT NULL ORDER BY started_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(r => ({
    id: r.id, name: r.name, templateId: r.template_id,
    startedAt: r.started_at, finishedAt: r.finished_at,
    durationSeconds: r.duration_seconds, notes: r.notes,
    totalVolume: r.total_volume, synced: Boolean(r.synced),
  }));
}

export function getSessionById(id: string): Session | null {
  const db = getDb();
  const r = db.getFirstSync<any>('SELECT * FROM sessions WHERE id = ?', [id]);
  if (!r) return null;
  return {
    id: r.id, name: r.name, templateId: r.template_id,
    startedAt: r.started_at, finishedAt: r.finished_at,
    durationSeconds: r.duration_seconds, notes: r.notes,
    totalVolume: r.total_volume, synced: Boolean(r.synced),
  };
}

// ─── Logged Sets ───────────────────────────────────────────────────────────

export function insertLoggedSets(sets: LoggedSet[]): void {
  const db = getDb();
  const stmt = db.prepareSync(
    `INSERT INTO logged_sets (id, session_id, exercise_id, set_number, weight, reps, rpe, is_warmup, completed, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const s of sets) {
    stmt.executeSync([
      s.id, s.sessionId, s.exerciseId, s.setNumber,
      s.weight, s.reps, s.rpe ?? null, s.isWarmup ? 1 : 0,
      s.completed ? 1 : 0, s.completedAt ?? null,
    ]);
  }
  stmt.finalizeSync();
}

export function getSetsForSession(sessionId: string): LoggedSet[] {
  const db = getDb();
  const rows = db.getAllSync<any>(
    'SELECT * FROM logged_sets WHERE session_id = ? ORDER BY exercise_id, set_number',
    [sessionId]
  );
  return rows.map(r => ({
    id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id,
    setNumber: r.set_number, weight: r.weight, reps: r.reps,
    rpe: r.rpe, isWarmup: Boolean(r.is_warmup),
    completed: Boolean(r.completed), completedAt: r.completed_at,
  }));
}

export function getExerciseHistory(exerciseId: string, limit = 30): LoggedSet[] {
  const db = getDb();
  const rows = db.getAllSync<any>(
    `SELECT ls.* FROM logged_sets ls
     JOIN sessions s ON ls.session_id = s.id
     WHERE ls.exercise_id = ? AND ls.completed = 1 AND s.finished_at IS NOT NULL
     ORDER BY s.started_at DESC LIMIT ?`,
    [exerciseId, limit]
  );
  return rows.map(r => ({
    id: r.id, sessionId: r.session_id, exerciseId: r.exercise_id,
    setNumber: r.set_number, weight: r.weight, reps: r.reps,
    rpe: r.rpe, isWarmup: Boolean(r.is_warmup),
    completed: Boolean(r.completed), completedAt: r.completed_at,
  }));
}

export function getLastSetsForExercise(exerciseId: string): LoggedSet[] {
  const db = getDb();
  const lastSession = db.getFirstSync<{ session_id: string }>(
    `SELECT ls.session_id FROM logged_sets ls
     JOIN sessions s ON ls.session_id = s.id
     WHERE ls.exercise_id = ? AND ls.completed = 1 AND s.finished_at IS NOT NULL
     ORDER BY s.started_at DESC LIMIT 1`,
    [exerciseId]
  );
  if (!lastSession) return [];
  return getSetsForSession(lastSession.session_id).filter(s => s.exerciseId === exerciseId);
}

// ─── Personal Records ──────────────────────────────────────────────────────

export function getAllPRs(): PersonalRecord[] {
  const db = getDb();
  const rows = db.getAllSync<any>('SELECT * FROM personal_records ORDER BY achieved_at DESC');
  return rows.map(r => ({
    id: r.id, exerciseId: r.exercise_id, exerciseName: r.exercise_name,
    weight: r.weight, reps: r.reps, estimated1RM: r.estimated_1rm,
    achievedAt: r.achieved_at, sessionId: r.session_id,
  }));
}

export function getPRForExercise(exerciseId: string): PersonalRecord | null {
  const db = getDb();
  const r = db.getFirstSync<any>('SELECT * FROM personal_records WHERE exercise_id = ?', [exerciseId]);
  if (!r) return null;
  return {
    id: r.id, exerciseId: r.exercise_id, exerciseName: r.exercise_name,
    weight: r.weight, reps: r.reps, estimated1RM: r.estimated_1rm,
    achievedAt: r.achieved_at, sessionId: r.session_id,
  };
}

export function upsertPR(pr: PersonalRecord): boolean {
  const db = getDb();
  const existing = getPRForExercise(pr.exerciseId);
  if (existing && existing.estimated1RM >= pr.estimated1RM) return false;
  db.runSync(
    `INSERT INTO personal_records (id, exercise_id, exercise_name, weight, reps, estimated_1rm, achieved_at, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(exercise_id) DO UPDATE SET
       weight = excluded.weight, reps = excluded.reps,
       estimated_1rm = excluded.estimated_1rm, achieved_at = excluded.achieved_at,
       session_id = excluded.session_id`,
    [pr.id, pr.exerciseId, pr.exerciseName, pr.weight, pr.reps, pr.estimated1RM, pr.achievedAt, pr.sessionId]
  );
  return true;
}

// ─── Templates ─────────────────────────────────────────────────────────────

export function getAllTemplates(): Template[] {
  const db = getDb();
  const templates = db.getAllSync<any>('SELECT * FROM templates ORDER BY name ASC');
  return templates.map(t => {
    const exercises = db.getAllSync<any>(
      'SELECT * FROM template_exercises WHERE template_id = ? ORDER BY position ASC',
      [t.id]
    );
    return {
      id: t.id, name: t.name, description: t.description,
      exercises: exercises.map(e => ({
        id: e.id, templateId: e.template_id, exerciseId: e.exercise_id,
        exerciseName: e.exercise_name, position: e.position,
        targetSets: e.target_sets, targetReps: e.target_reps,
      })),
    };
  });
}

export function insertTemplate(template: Template): void {
  const db = getDb();
  db.runSync('INSERT INTO templates (id, name, description) VALUES (?, ?, ?)',
    [template.id, template.name, template.description ?? null]);
  for (const ex of template.exercises) {
    db.runSync(
      `INSERT INTO template_exercises (id, template_id, exercise_id, exercise_name, position, target_sets, target_reps)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ex.id, template.id, ex.exerciseId, ex.exerciseName, ex.position, ex.targetSets, ex.targetReps]
    );
  }
}

// ─── Body Measurements ─────────────────────────────────────────────────────

export function getBodyMeasurements(limit = 60): BodyMeasurement[] {
  const db = getDb();
  const rows = db.getAllSync<any>(
    'SELECT * FROM body_measurements ORDER BY logged_at DESC LIMIT ?', [limit]
  );
  return rows.map(r => ({
    id: r.id, loggedAt: r.logged_at,
    bodyweight: r.bodyweight, bodyweightUnit: r.bodyweight_unit,
  }));
}

export function insertBodyMeasurement(m: BodyMeasurement): void {
  const db = getDb();
  db.runSync(
    'INSERT INTO body_measurements (id, logged_at, bodyweight, bodyweight_unit) VALUES (?, ?, ?, ?)',
    [m.id, m.loggedAt, m.bodyweight ?? null, m.bodyweightUnit]
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────

export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
