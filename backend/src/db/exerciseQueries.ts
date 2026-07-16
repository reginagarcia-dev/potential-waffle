import { and, eq, isNull, or } from 'drizzle-orm';
import { exerciseDefinitions } from './schema.js';

// Global exercises (createdBy is null) or the given user's own custom
// exercises, excluding soft-deleted rows. Used everywhere exerciseDefinitions
// is queried so a soft-deleted or non-owned custom exercise can't resurface.
export function visibleExerciseCondition(userId: string) {
  return and(
    or(
      isNull(exerciseDefinitions.createdBy),
      eq(exerciseDefinitions.createdBy, userId),
    ),
    isNull(exerciseDefinitions.deletedAt),
  );
}

// A specific custom exercise owned by this user and not already soft-deleted.
// Used to scope both the read-before-mutate check and the mutating
// UPDATE/DELETE query itself, so a concurrent delete can't leave a window
// where the mutation applies to a row that's already gone.
export function ownedCustomExerciseCondition(exerciseId: string, userId: string) {
  return and(
    eq(exerciseDefinitions.id, exerciseId),
    eq(exerciseDefinitions.createdBy, userId),
    eq(exerciseDefinitions.isCustom, true),
    isNull(exerciseDefinitions.deletedAt),
  );
}
