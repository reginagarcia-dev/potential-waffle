import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// z.input (not z.infer/z.output) throughout this file: these types describe
// what callers construct *before* parsing, which matters wherever a field has
// .optional().default(...) — the output type makes it required, but callers
// can still legally omit it.
export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.input<typeof loginSchema>;

export const updatePreferencesSchema = z.object({
  preferredUnit: z.enum(["lbs", "kg"]),
  defaultRestSeconds: z.number().int().min(0),
});

export type UpdatePreferencesInput = z.input<typeof updatePreferencesSchema>;

export const createSessionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workout name is required")
    .max(120, "Workout name must be at most 120 characters"),
  unit: z.enum(["lbs", "kg"]),
  // Copy the exercise/set structure of one of the user's completed sessions
  sourceSessionId: z.string().uuid().optional(),
});

export type CreateSessionInput = z.input<typeof createSessionSchema>;

// Session update discriminated commands
export const renameSessionSchema = z.object({
  type: z.literal("rename_session"),
  name: z
    .string()
    .trim()
    .min(1, "Session name cannot be empty")
    .max(120, "Session name must be at most 120 characters"),
});

export const addExerciseSchema = z.object({
  type: z.literal("add_exercise"),
  exerciseDefinitionId: z.string().uuid(),
});

export const deleteExerciseSchema = z.object({
  type: z.literal("delete_exercise"),
  exerciseId: z.string().uuid(),
});

export const addSetSchema = z.object({
  type: z.literal("add_set"),
  exerciseId: z.string().uuid(),
  setType: z.enum(["warmup", "working"]).optional().default("working"),
});

export const updateSetSchema = z.object({
  type: z.literal("update_set"),
  setId: z.string().uuid(),
  weight: z.number().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  status: z.enum(["pending", "completed"]).optional(),
  setType: z.enum(["warmup", "working"]).optional(),
});

export const deleteSetSchema = z.object({
  type: z.literal("delete_set"),
  setId: z.string().uuid(),
});

export const prefillSetsSchema = z.object({
  type: z.literal("prefill_sets"),
  exerciseId: z.string().uuid(),
  sets: z.array(
    z.object({
      weight: z.number(),
      reps: z.number().int(),
      rpe: z.number().min(1).max(10).optional(),
      setType: z.enum(["warmup", "working"]),
    }),
  ),
});

export const updateSessionSettingsSchema = z.object({
  type: z.literal("update_session_settings"),
  unit: z.enum(["lbs", "kg"]),
  defaultRestSeconds: z.number().int().min(0),
});

export const updateSessionNotesSchema = z.object({
  type: z.literal("update_session_notes"),
  notes: z.string().max(4000, "Session notes must be at most 4000 characters"),
});

export const applyOverloadSuggestionSchema = z.object({
  type: z.literal("apply_overload_suggestion"),
  exerciseId: z.string().uuid(),
  weight: z.number().positive(),
  reps: z.number().int().positive().nullable().optional(),
});

export const sessionMutationSchema = z.discriminatedUnion("type", [
  renameSessionSchema,
  addExerciseSchema,
  deleteExerciseSchema,
  addSetSchema,
  updateSetSchema,
  deleteSetSchema,
  prefillSetsSchema,
  updateSessionSettingsSchema,
  updateSessionNotesSchema,
  applyOverloadSuggestionSchema,
]);

export type SessionMutationInput = z.input<typeof sessionMutationSchema>;

// Named per-command types so consumers can import a command directly instead
// of re-deriving it with Extract<SessionMutationInput, {type: "..."}>.
export type RenameSessionCommand = z.input<typeof renameSessionSchema>;
export type AddExerciseCommand = z.input<typeof addExerciseSchema>;
export type DeleteExerciseCommand = z.input<typeof deleteExerciseSchema>;
export type AddSetCommand = z.input<typeof addSetSchema>;
export type UpdateSetCommand = z.input<typeof updateSetSchema>;
export type DeleteSetCommand = z.input<typeof deleteSetSchema>;
export type PrefillSetsCommand = z.input<typeof prefillSetsSchema>;
export type UpdateSessionSettingsCommand = z.input<
  typeof updateSessionSettingsSchema
>;
export type UpdateSessionNotesCommand = z.input<
  typeof updateSessionNotesSchema
>;
export type ApplyOverloadSuggestionCommand = z.input<
  typeof applyOverloadSuggestionSchema
>;

export const measurementSchema = z.object({
  date: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  type: z
    .string()
    .min(1, "Measurement type is required")
    .max(80, "Measurement type must be at most 80 characters"),
  value: z.number().positive("Value must be positive"),
  unit: z.enum(["lbs", "kg", "cm", "in"]),
});

export type MeasurementInput = z.input<typeof measurementSchema>;

export const customExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Exercise name is required")
    .max(120, "Exercise name must be at most 120 characters"),
  muscleGroup: z.enum(["legs", "push", "pull", "core", "cardio"]),
});

export type CustomExerciseInput = z.input<typeof customExerciseSchema>;
