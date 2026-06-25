import { Unit, MuscleGroup, SessionStatus, SetType, SetStatus, MeasurementUnit } from './constants.js';

export interface User {
  id: string;
  email: string;
  preferredUnit: Unit;
  defaultRestSeconds: number;
  createdAt: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  name: string;
  status: SessionStatus;
  unit: Unit;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseDefinitionId: string;
  nameSnapshot: string;
  order: number;
  notes: string | null;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  type: SetType;
  status: SetStatus;
  weight: number | null;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  previousWeight: number | null;
  previousReps: number | null;
  isPr: boolean;
  completedAt: string | null;
}

export interface Measurement {
  id: string;
  userId: string;
  date: string;
  type: string;
  value: number;
  unit: MeasurementUnit;
  createdAt: string;
}

// Composite / API-Specific Interfaces
export interface WorkoutSetResponse extends WorkoutSet {}

export interface SessionExerciseResponse extends SessionExercise {
  sets: WorkoutSetResponse[];
}

export interface WorkoutSessionResponse extends WorkoutSession {
  exercises: SessionExerciseResponse[];
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ProgressSummary {
  exerciseName: string;
  bestWeight: number | null;
  bestReps: number | null;
  history: Array<{
    date: string;
    bestWeight: number;
    bestReps: number;
    volume: number;
  }>;
}

export interface LastPerformanceResponse {
  lastWeight: number | null;
  lastReps: number | null;
  lastRpe: number | null;
  lastSetsCount: number;
  lastSets: Array<{
    weight: number;
    reps: number;
    rpe: number | null;
    type: SetType;
  }>;
}
