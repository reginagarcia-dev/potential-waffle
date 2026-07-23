import { MuscleGroup, Unit } from "shared";

export const RPE_LOW_MAX = 7;
export const RPE_HIGH_MIN = 9;

export const WEIGHT_INCREMENT_LBS: Record<MuscleGroup, number> = {
  legs: 10,
  push: 5,
  pull: 5,
  core: 5,
  cardio: 0,
};

export const WEIGHT_INCREMENT_KG: Record<MuscleGroup, number> = {
  legs: 5,
  push: 2.5,
  pull: 2.5,
  core: 2.5,
  cardio: 0,
};

export const ROUNDING_INCREMENT_LBS = 2.5;
export const ROUNDING_INCREMENT_KG = 1;

export type SuggestionBasis =
  | "increase"
  | "hold_reps_up"
  | "repeat_no_rpe"
  | "repeat_high_rpe";

export interface ProgressionInput {
  muscleGroup: MuscleGroup;
  lastWeight: number;
  lastReps: number;
  lastRpe: number | null;
  targetUnit: Unit;
}

export interface ProgressionSuggestion {
  weight: number;
  reps: number;
  basis: SuggestionBasis;
}

function roundToIncrement(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment;
}

export function computeProgressionSuggestion(
  input: ProgressionInput,
): ProgressionSuggestion | null {
  const { muscleGroup, lastWeight, lastReps, lastRpe, targetUnit } = input;

  if (muscleGroup === "cardio") {
    return null;
  }

  const roundingIncrement =
    targetUnit === "kg" ? ROUNDING_INCREMENT_KG : ROUNDING_INCREMENT_LBS;

  let weight: number;
  let reps: number;
  let basis: SuggestionBasis;

  if (lastRpe == null) {
    weight = lastWeight;
    reps = lastReps;
    basis = "repeat_no_rpe";
  } else if (lastRpe <= RPE_LOW_MAX) {
    const weightIncrement =
      targetUnit === "kg"
        ? WEIGHT_INCREMENT_KG[muscleGroup]
        : WEIGHT_INCREMENT_LBS[muscleGroup];
    weight = lastWeight + weightIncrement;
    reps = lastReps;
    basis = "increase";
  } else if (lastRpe >= RPE_HIGH_MIN) {
    weight = lastWeight;
    reps = lastReps;
    basis = "repeat_high_rpe";
  } else {
    weight = lastWeight;
    reps = lastReps + 1;
    basis = "hold_reps_up";
  }

  return {
    weight: roundToIncrement(weight, roundingIncrement),
    reps,
    basis,
  };
}
