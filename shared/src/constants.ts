export const KG_TO_LBS = 2.20462262185;

export type Unit = 'lbs' | 'kg';
export type MuscleGroup = 'legs' | 'push' | 'pull' | 'core' | 'cardio';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type SetType = 'warmup' | 'working';
export type SetStatus = 'pending' | 'completed';
export type MeasurementUnit = 'lbs' | 'kg' | 'cm' | 'in';

export const UNITS: Unit[] = ['lbs', 'kg'];
export const MUSCLE_GROUPS: MuscleGroup[] = ['legs', 'push', 'pull', 'core', 'cardio'];
export const SESSION_STATUSES: SessionStatus[] = ['active', 'completed', 'abandoned'];
export const SET_TYPES: SetType[] = ['warmup', 'working'];
export const SET_STATUSES: SetStatus[] = ['pending', 'completed'];
export const MEASUREMENT_UNITS: MeasurementUnit[] = ['lbs', 'kg', 'cm', 'in'];

export const DEFAULT_REST_SECONDS = 180;
export const REST_DURATION_OPTIONS_SECONDS: number[] = [
  60, 90, 120, 150, 180, 240, 300,
];

export type MilestoneKind = 'workout_count' | 'pr_count';

export const WORKOUT_COUNT_MILESTONES: number[] = [1, 10, 25, 50, 100];
export const PR_COUNT_MILESTONES: number[] = [1, 5, 10, 25];

// Every threshold in (before, after] — a range check, not `after === threshold`,
// so this stays correct even if a single event pushes the count up by more than 1.
export function crossedMilestones(
  before: number,
  after: number,
  thresholds: number[],
): number[] {
  return thresholds.filter((threshold) => before < threshold && threshold <= after);
}

export function convertWeight(weight: number, from: Unit, to: Unit): number {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lbs') {
    return Math.round((weight * KG_TO_LBS) * 100) / 100;
  }
  if (from === 'lbs' && to === 'kg') {
    return Math.round((weight / KG_TO_LBS) * 100) / 100;
  }
  return weight;
}
