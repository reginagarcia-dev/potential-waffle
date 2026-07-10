import { eq } from "drizzle-orm";
import { db, pool } from "./index.js";
import {
  exerciseDefinitions,
  measurements,
  sessionExercises,
  workoutSessions,
} from "./schema.js";
import { sanitizeOptionalText, sanitizeText } from "../utils/sanitize.js";

async function runBackfill() {
  console.log("[sanitize-backfill] Starting...");

  let updatedExerciseDefinitions = 0;
  let updatedWorkoutSessionNames = 0;
  let updatedWorkoutSessionNotes = 0;
  let updatedSessionExerciseSnapshots = 0;
  let updatedMeasurementTypes = 0;

  const definitions = await db
    .select({ id: exerciseDefinitions.id, name: exerciseDefinitions.name })
    .from(exerciseDefinitions);

  for (const row of definitions) {
    const sanitizedName = sanitizeText(row.name);
    if (sanitizedName !== row.name) {
      await db
        .update(exerciseDefinitions)
        .set({ name: sanitizedName })
        .where(eq(exerciseDefinitions.id, row.id));
      updatedExerciseDefinitions++;
    }
  }

  const sessions = await db
    .select({
      id: workoutSessions.id,
      name: workoutSessions.name,
      notes: workoutSessions.notes,
    })
    .from(workoutSessions);

  for (const row of sessions) {
    const sanitizedName = sanitizeText(row.name);
    const sanitizedNotes = sanitizeOptionalText(row.notes);

    if (sanitizedName !== row.name) {
      await db
        .update(workoutSessions)
        .set({ name: sanitizedName })
        .where(eq(workoutSessions.id, row.id));
      updatedWorkoutSessionNames++;
    }

    if (sanitizedNotes !== row.notes) {
      await db
        .update(workoutSessions)
        .set({ notes: sanitizedNotes })
        .where(eq(workoutSessions.id, row.id));
      updatedWorkoutSessionNotes++;
    }
  }

  const snapshots = await db
    .select({
      id: sessionExercises.id,
      nameSnapshot: sessionExercises.nameSnapshot,
    })
    .from(sessionExercises);

  for (const row of snapshots) {
    const sanitizedSnapshot = sanitizeText(row.nameSnapshot);
    if (sanitizedSnapshot !== row.nameSnapshot) {
      await db
        .update(sessionExercises)
        .set({ nameSnapshot: sanitizedSnapshot })
        .where(eq(sessionExercises.id, row.id));
      updatedSessionExerciseSnapshots++;
    }
  }

  const measurementRows = await db
    .select({ id: measurements.id, type: measurements.type })
    .from(measurements);

  for (const row of measurementRows) {
    const sanitizedType = sanitizeText(row.type).toLowerCase();
    if (sanitizedType !== row.type) {
      await db
        .update(measurements)
        .set({ type: sanitizedType })
        .where(eq(measurements.id, row.id));
      updatedMeasurementTypes++;
    }
  }

  console.log("[sanitize-backfill] Complete.");
  console.log(
    `[sanitize-backfill] Updated: exercise_definitions=${updatedExerciseDefinitions}, workout_session_names=${updatedWorkoutSessionNames}, workout_session_notes=${updatedWorkoutSessionNotes}, session_exercise_snapshots=${updatedSessionExerciseSnapshots}, measurement_types=${updatedMeasurementTypes}`,
  );
}

// Only run (and only close the shared pool) when this file is executed
// directly via `npm run sanitize:backfill` — importing it for any other
// reason must not have the side effect of running a destructive backfill and
// tearing down the DB pool out from under whatever imported it.
const isMainModule =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runBackfill()
    .catch((error) => {
      console.error("[sanitize-backfill] Failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}
