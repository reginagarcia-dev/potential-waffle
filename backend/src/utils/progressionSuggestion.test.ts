import { describe, expect, it } from "vitest";
import {
  computeProgressionSuggestion,
  WEIGHT_INCREMENT_LBS,
  WEIGHT_INCREMENT_KG,
  ROUNDING_INCREMENT_LBS,
  ROUNDING_INCREMENT_KG,
} from "./progressionSuggestion.js";
import { MuscleGroup } from "shared";

const BASE = {
  muscleGroup: "push" as MuscleGroup,
  lastWeight: 135,
  lastReps: 8,
  targetUnit: "lbs" as const,
};

describe("computeProgressionSuggestion", () => {
  it("returns null for cardio regardless of RPE", () => {
    expect(
      computeProgressionSuggestion({ ...BASE, muscleGroup: "cardio", lastRpe: 6 }),
    ).toBeNull();
    expect(
      computeProgressionSuggestion({ ...BASE, muscleGroup: "cardio", lastRpe: null }),
    ).toBeNull();
    expect(
      computeProgressionSuggestion({ ...BASE, muscleGroup: "cardio", lastRpe: 10 }),
    ).toBeNull();
  });

  it("repeats exactly and never invents a number when RPE is null", () => {
    const result = computeProgressionSuggestion({ ...BASE, lastRpe: null });
    expect(result).toEqual({ weight: 135, reps: 8, basis: "repeat_no_rpe" });
  });

  it("increases weight when RPE is at or below the low threshold (6, boundary 7)", () => {
    const rpe6 = computeProgressionSuggestion({ ...BASE, lastRpe: 6 });
    expect(rpe6).toEqual({
      weight: 135 + WEIGHT_INCREMENT_LBS.push,
      reps: 8,
      basis: "increase",
    });

    const rpe7 = computeProgressionSuggestion({ ...BASE, lastRpe: 7 });
    expect(rpe7).toEqual({
      weight: 135 + WEIGHT_INCREMENT_LBS.push,
      reps: 8,
      basis: "increase",
    });
  });

  it("holds weight and adds a rep for moderate RPE (7.5, 8)", () => {
    const rpe75 = computeProgressionSuggestion({ ...BASE, lastRpe: 7.5 });
    expect(rpe75).toEqual({ weight: 135, reps: 9, basis: "hold_reps_up" });

    const rpe8 = computeProgressionSuggestion({ ...BASE, lastRpe: 8 });
    expect(rpe8).toEqual({ weight: 135, reps: 9, basis: "hold_reps_up" });
  });

  it("repeats exactly for near-maximal RPE (boundary 9, and 10)", () => {
    const rpe9 = computeProgressionSuggestion({ ...BASE, lastRpe: 9 });
    expect(rpe9).toEqual({ weight: 135, reps: 8, basis: "repeat_high_rpe" });

    const rpe10 = computeProgressionSuggestion({ ...BASE, lastRpe: 10 });
    expect(rpe10).toEqual({ weight: 135, reps: 8, basis: "repeat_high_rpe" });
  });

  it("rounds a non-clean weight to the nearest loadable increment on every branch", () => {
    const dirtyWeight = 137.62;

    const increase = computeProgressionSuggestion({
      ...BASE,
      lastWeight: dirtyWeight,
      lastRpe: 6,
    })!;
    expect(increase.weight % ROUNDING_INCREMENT_LBS).toBeCloseTo(0);

    const hold = computeProgressionSuggestion({
      ...BASE,
      lastWeight: dirtyWeight,
      lastRpe: 8,
    })!;
    expect(hold.weight % ROUNDING_INCREMENT_LBS).toBeCloseTo(0);

    const repeatHigh = computeProgressionSuggestion({
      ...BASE,
      lastWeight: dirtyWeight,
      lastRpe: 9,
    })!;
    expect(repeatHigh.weight % ROUNDING_INCREMENT_LBS).toBeCloseTo(0);

    const repeatNoRpe = computeProgressionSuggestion({
      ...BASE,
      lastWeight: dirtyWeight,
      lastRpe: null,
    })!;
    expect(repeatNoRpe.weight % ROUNDING_INCREMENT_LBS).toBeCloseTo(0);
  });

  it("rounds to the kg increment when targetUnit is kg", () => {
    const result = computeProgressionSuggestion({
      ...BASE,
      targetUnit: "kg",
      lastWeight: 61.3,
      lastRpe: 6,
    })!;
    expect(result.weight % ROUNDING_INCREMENT_KG).toBeCloseTo(0);
  });

  const muscleGroups: MuscleGroup[] = ["legs", "push", "pull", "core"];

  it.each(muscleGroups)(
    "uses the configured lbs increment for %s on the increase branch",
    (muscleGroup) => {
      const result = computeProgressionSuggestion({
        ...BASE,
        muscleGroup,
        lastRpe: 6,
      })!;
      expect(result.weight).toBe(135 + WEIGHT_INCREMENT_LBS[muscleGroup]);
    },
  );

  it.each(muscleGroups)(
    "uses the configured kg increment for %s on the increase branch",
    (muscleGroup) => {
      const result = computeProgressionSuggestion({
        ...BASE,
        muscleGroup,
        targetUnit: "kg",
        lastWeight: 60,
        lastRpe: 6,
      })!;
      const expected = Math.round(
        (60 + WEIGHT_INCREMENT_KG[muscleGroup]) / ROUNDING_INCREMENT_KG,
      ) * ROUNDING_INCREMENT_KG;
      expect(result.weight).toBe(expected);
    },
  );
});
