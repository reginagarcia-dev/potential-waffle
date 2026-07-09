import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updatePreferencesSchema = z.object({
  preferredUnit: z.enum(["lbs", "kg"]),
  defaultRestSeconds: z.number().int().min(0),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const createSessionSchema = z.object({
  name: z.string().trim().min(1, "Workout name is required"),
  unit: z.enum(["lbs", "kg"]),
  // Copy the exercise/set structure of one of the user's completed sessions
  sourceSessionId: z.string().uuid().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// Session update discriminated commands
export const renameSessionSchema = z.object({
  type: z.literal("rename_session"),
  name: z.string().trim().min(1, "Session name cannot be empty"),
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
  notes: z.string(),
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

export type SessionMutationInput = z.infer<typeof sessionMutationSchema>;

export const measurementSchema = z.object({
  date: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  type: z.string().min(1, "Measurement type is required"),
  value: z.number().positive("Value must be positive"),
  unit: z.enum(["lbs", "kg", "cm", "in"]),
});

export type MeasurementInput = z.infer<typeof measurementSchema>;

export const customExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  muscleGroup: z.enum(["legs", "push", "pull", "core", "cardio"]),
});

export type CustomExerciseInput = z.infer<typeof customExerciseSchema>;
