import { pgTable, uuid, text, timestamp, integer, boolean, real, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const unitEnum = pgEnum('unit', ['lbs', 'kg']);
export const muscleGroupEnum = pgEnum('muscle_group', ['legs', 'push', 'pull', 'core', 'cardio']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed', 'abandoned']);
export const setTypeEnum = pgEnum('set_type', ['warmup', 'working']);
export const setStatusEnum = pgEnum('set_status', ['pending', 'completed']);
export const measurementUnitEnum = pgEnum('measurement_unit', ['lbs', 'kg', 'cm', 'in']);

// Tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  preferredUnit: unitEnum('preferred_unit').default('lbs').notNull(),
  defaultRestSeconds: integer('default_rest_seconds').default(180).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exerciseDefinitions = pgTable('exercise_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  muscleGroup: muscleGroupEnum('muscle_group').notNull(),
  isCustom: boolean('is_custom').default(false).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    nameIdx: index('exercise_definitions_name_idx').on(table.name),
  };
});

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  status: sessionStatusEnum('status').default('active').notNull(),
  unit: unitEnum('unit').notNull(),
  notes: text('notes'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => {
  return {
    userStatusIdx: index('workout_sessions_user_status_idx').on(table.userId, table.status),
    userStartedIdx: index('workout_sessions_user_started_idx').on(table.userId, table.startedAt),
  };
});

export const sessionExercises = pgTable('session_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => workoutSessions.id, { onDelete: 'cascade' }).notNull(),
  exerciseDefinitionId: uuid('exercise_definition_id').references(() => exerciseDefinitions.id).notNull(),
  nameSnapshot: text('name_snapshot').notNull(),
  order: integer('order').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    sessionIdx: index('session_exercises_session_idx').on(table.sessionId),
  };
});

export const sets = pgTable('sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  exerciseId: uuid('exercise_id').references(() => sessionExercises.id, { onDelete: 'cascade' }).notNull(),
  setNumber: integer('set_number').notNull(),
  type: setTypeEnum('type').default('working').notNull(),
  status: setStatusEnum('status').default('pending').notNull(),
  weight: real('weight'),
  weightKg: real('weight_kg'),
  reps: integer('reps'),
  rpe: real('rpe'),
  previousWeight: real('previous_weight'),
  previousReps: integer('previous_reps'),
  isPr: boolean('is_pr').default(false).notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => {
  return {
    exerciseIdx: index('sets_exercise_idx').on(table.exerciseId),
  };
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').defaultNow().notNull(),
  type: text('type').notNull(),
  value: real('value').notNull(),
  unit: measurementUnitEnum('unit').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userDateIdx: index('measurements_user_date_idx').on(table.userId, table.date),
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(workoutSessions),
  measurements: many(measurements),
  customExercises: many(exerciseDefinitions),
}));

export const exerciseDefinitionsRelations = relations(exerciseDefinitions, ({ one, many }) => ({
  creator: one(users, {
    fields: [exerciseDefinitions.createdBy],
    references: [users.id],
  }),
  sessionExercises: many(sessionExercises),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutSessions.userId],
    references: [users.id],
  }),
  exercises: many(sessionExercises),
}));

export const sessionExercisesRelations = relations(sessionExercises, ({ one, many }) => ({
  session: one(workoutSessions, {
    fields: [sessionExercises.sessionId],
    references: [workoutSessions.id],
  }),
  definition: one(exerciseDefinitions, {
    fields: [sessionExercises.exerciseDefinitionId],
    references: [exerciseDefinitions.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  exercise: one(sessionExercises, {
    fields: [sets.exerciseId],
    references: [sessionExercises.id],
  }),
}));

export const measurementsRelations = relations(measurements, ({ one }) => ({
  user: one(users, {
    fields: [measurements.userId],
    references: [users.id],
  }),
}));
