import { Router, Request, Response, NextFunction } from "express";
import {
  eq,
  and,
  desc,
  asc,
  max,
  not,
  inArray,
  sql,
  isNotNull,
  gte,
  lt,
} from "drizzle-orm";
import { db } from "../db/index.js";
import {
  workoutSessions,
  sessionExercises,
  sets,
  exerciseDefinitions,
  users,
} from "../db/schema.js";
import { sessionMutationSchema } from "shared";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.js";
import { convertWeight } from "shared";

export const sessionsRouter = Router();

sessionsRouter.use(authenticateToken);

// 1. GET /sessions/active (Retrieve current active session, if any)
sessionsRouter.get(
  "/active",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const activeSession = await db.query.workoutSessions.findFirst({
        where: and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, "active"),
        ),
        with: {
          exercises: {
            orderBy: (exercises, { asc }) => [asc(exercises.order)],
            with: {
              sets: {
                orderBy: (sets, { asc }) => [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      if (!activeSession) {
        return res.json(null);
      }

      return res.json(activeSession);
    } catch (error) {
      next(error);
    }
  },
);

// 2. GET /sessions (Paginated completed workout sessions list)
sessionsRouter.get(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const page = parseInt((req.query.page as string) || "1");
      const limit = Math.min(
        parseInt((req.query.limit as string) || "10"),
        100,
      );
      const offset = (page - 1) * limit;
      const startDateRaw = req.query.startDate as string | undefined;
      const endDateRaw = req.query.endDate as string | undefined;

      const startDate = startDateRaw ? new Date(startDateRaw) : null;
      const endDate = endDateRaw ? new Date(endDateRaw) : null;

      if (startDate && Number.isNaN(startDate.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid startDate query parameter" });
      }

      if (endDate && Number.isNaN(endDate.getTime())) {
        return res
          .status(400)
          .json({ error: "Invalid endDate query parameter" });
      }

      const whereConditions = [
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
      ];

      if (startDate) {
        whereConditions.push(gte(workoutSessions.completedAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lt(workoutSessions.completedAt, endDate));
      }

      const list = await db.query.workoutSessions.findMany({
        where: and(...whereConditions),
        orderBy: [desc(workoutSessions.completedAt)],
        limit,
        offset,
        with: {
          exercises: {
            orderBy: (exercises, { asc }) => [asc(exercises.order)],
            with: {
              sets: {
                orderBy: (sets, { asc }) => [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      return res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

// 3. GET /sessions/:id (Details of a specific session)
sessionsRouter.get(
  "/:id",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;
      const userId = req.userId!;

      const session = await db.query.workoutSessions.findFirst({
        where: and(
          eq(workoutSessions.id, sessionId),
          eq(workoutSessions.userId, userId),
        ),
        with: {
          exercises: {
            orderBy: (exercises, { asc }) => [asc(exercises.order)],
            with: {
              sets: {
                orderBy: (sets, { asc }) => [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ error: "Workout session not found" });
      }

      return res.json(session);
    } catch (error) {
      next(error);
    }
  },
);

// 4. POST /sessions (Creates database record immediately, status: active)
sessionsRouter.post(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { name, unit } = req.body;

      if (!name || !unit) {
        return res.status(400).json({ error: "Name and unit are required" });
      }

      // Check if there is already an active session
      const existingActive = await db.query.workoutSessions.findFirst({
        where: and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, "active"),
        ),
      });

      if (existingActive) {
        return res
          .status(400)
          .json({
            error:
              "An active session is already in progress. Finish or abandon it first.",
          });
      }

      const [newSession] = await db
        .insert(workoutSessions)
        .values({
          userId,
          name: name.trim(),
          unit,
          status: "active",
        })
        .returning();

      return res.status(201).json({
        ...newSession,
        exercises: [],
      });
    } catch (error) {
      next(error);
    }
  },
);

// 5. POST /sessions/:id/finish (Complete session)
sessionsRouter.post(
  "/:id/finish",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;
      const userId = req.userId!;
      const { notes } = req.body;

      const session = await db.query.workoutSessions.findFirst({
        where: and(
          eq(workoutSessions.id, sessionId),
          eq(workoutSessions.userId, userId),
        ),
      });

      if (!session) {
        return res.status(404).json({ error: "Workout session not found" });
      }

      if (session.status !== "active") {
        return res
          .status(400)
          .json({ error: "Only active workouts can be finished" });
      }

      await db.transaction(async (tx) => {
        const exerciseRows = await tx
          .select({ id: sessionExercises.id })
          .from(sessionExercises)
          .where(eq(sessionExercises.sessionId, sessionId));

        // Auto-complete all pending sets that have values in one query
        if (exerciseRows.length > 0) {
          await tx
            .update(sets)
            .set({ status: "completed", completedAt: new Date() })
            .where(
              and(
                inArray(
                  sets.exerciseId,
                  exerciseRows.map((e) => e.id),
                ),
                eq(sets.status, "pending"),
                isNotNull(sets.weight),
                isNotNull(sets.reps),
              ),
            );
        }

        await tx
          .update(workoutSessions)
          .set({
            status: "completed",
            completedAt: new Date(),
            notes: notes || null,
          })
          .where(eq(workoutSessions.id, sessionId));
      });

      const fullSession = await db.query.workoutSessions.findFirst({
        where: eq(workoutSessions.id, sessionId),
        with: {
          exercises: {
            orderBy: (exercises, { asc }) => [asc(exercises.order)],
            with: {
              sets: {
                orderBy: (sets, { asc }) => [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      return res.json(fullSession);
    } catch (error) {
      next(error);
    }
  },
);

// 6. POST /sessions/:id/abandon (Abandon session)
sessionsRouter.post(
  "/:id/abandon",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;
      const userId = req.userId!;

      const [abandonedSession] = await db
        .update(workoutSessions)
        .set({
          status: "abandoned",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(workoutSessions.id, sessionId),
            eq(workoutSessions.userId, userId),
          ),
        )
        .returning();

      if (!abandonedSession) {
        return res.status(404).json({ error: "Workout session not found" });
      }

      return res.json(abandonedSession);
    } catch (error) {
      next(error);
    }
  },
);

// 7. PATCH /sessions/:id (The single endpoint managing active session updates)
sessionsRouter.patch(
  "/:id",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;
      const userId = req.userId!;

      const session = await db.query.workoutSessions.findFirst({
        where: and(
          eq(workoutSessions.id, sessionId),
          eq(workoutSessions.userId, userId),
        ),
      });

      if (!session) {
        return res.status(404).json({ error: "Workout session not found" });
      }

      if (session.status !== "active") {
        return res
          .status(400)
          .json({ error: "Cannot mutate a completed or abandoned session" });
      }

      const parseResult = sessionMutationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res
          .status(400)
          .json({ error: parseResult.error.errors[0].message });
      }

      const mutation = parseResult.data;

      switch (mutation.type) {
        case "rename_session": {
          const [updated] = await db
            .update(workoutSessions)
            .set({ name: mutation.name.trim() })
            .where(eq(workoutSessions.id, sessionId))
            .returning();
          break;
        }

        case "add_exercise": {
          const exerciseDefId = mutation.exerciseDefinitionId;

          const definition = await db.query.exerciseDefinitions.findFirst({
            where: eq(exerciseDefinitions.id, exerciseDefId),
          });

          if (!definition) {
            return res
              .status(404)
              .json({ error: "Exercise definition not found" });
          }

          const exerciseList = await db
            .select({ order: sessionExercises.order })
            .from(sessionExercises)
            .where(eq(sessionExercises.sessionId, sessionId));

          const maxOrder = exerciseList.reduce(
            (maxVal, item) => Math.max(maxVal, item.order),
            0,
          );

          // Fetch previous performance before opening the transaction
          const lastPerformance = await db
            .select({ sessionExerciseId: sessionExercises.id })
            .from(sessionExercises)
            .innerJoin(
              workoutSessions,
              eq(sessionExercises.sessionId, workoutSessions.id),
            )
            .where(
              and(
                eq(sessionExercises.exerciseDefinitionId, exerciseDefId),
                eq(workoutSessions.userId, userId),
                eq(workoutSessions.status, "completed"),
              ),
            )
            .orderBy(desc(workoutSessions.completedAt))
            .limit(1);

          const prevSets =
            lastPerformance.length > 0
              ? await db
                  .select()
                  .from(sets)
                  .where(
                    eq(sets.exerciseId, lastPerformance[0].sessionExerciseId),
                  )
                  .orderBy(asc(sets.setNumber))
              : [];

          // Insert session exercise + all sets atomically
          await db.transaction(async (tx) => {
            const [sessionEx] = await tx
              .insert(sessionExercises)
              .values({
                sessionId,
                exerciseDefinitionId: exerciseDefId,
                nameSnapshot: definition.name,
                order: maxOrder + 1,
              })
              .returning();

            if (prevSets.length > 0) {
              // Mirror set structure from last session in one bulk insert.
              // Leave weight/reps blank — previous values stored as UI hints only.
              await tx.insert(sets).values(
                prevSets.map((prev) => ({
                  exerciseId: sessionEx.id,
                  setNumber: prev.setNumber,
                  type: prev.type,
                  status: "pending" as const,
                  weight: null,
                  weightKg: null,
                  reps: null,
                  previousWeight: prev.weight,
                  previousReps: prev.reps,
                })),
              );
            }
          });
          break;
        }

        case "delete_exercise": {
          await db
            .delete(sessionExercises)
            .where(
              and(
                eq(sessionExercises.id, mutation.exerciseId),
                eq(sessionExercises.sessionId, sessionId),
              ),
            );
          break;
        }

        case "add_set": {
          const { exerciseId, setType } = mutation;

          const maxSetRow = await db
            .select({ setNumber: sets.setNumber })
            .from(sets)
            .where(eq(sets.exerciseId, exerciseId));

          const maxNum = maxSetRow.reduce(
            (maxVal, s) => Math.max(maxVal, s.setNumber),
            0,
          );

          // Use the last set's values as ghost hints only — never pre-fill actual weight/reps
          const lastSet = await db.query.sets.findFirst({
            where: eq(sets.exerciseId, exerciseId),
            orderBy: [desc(sets.setNumber)],
          });

          await db.insert(sets).values({
            exerciseId,
            setNumber: maxNum + 1,
            type: setType || "working",
            status: "pending",
            weight: null,
            weightKg: null,
            reps: null,
            previousWeight: lastSet?.weight ?? null,
            previousReps: lastSet?.reps ?? null,
          });
          break;
        }

        case "update_set": {
          const { setId, weight, reps, rpe, status, setType } = mutation;

          const currentSet = await db.query.sets.findFirst({
            where: eq(sets.id, setId),
            with: { exercise: true },
          });

          if (!currentSet || currentSet.exercise.sessionId !== sessionId) {
            return res
              .status(404)
              .json({ error: "Set not found or unauthorized" });
          }

          await db.transaction(async (tx) => {
            const updateData: any = {};
            if (weight !== undefined) {
              updateData.weight = weight;
              updateData.weightKg =
                weight === null
                  ? null
                  : session.unit === "kg"
                    ? weight
                    : convertWeight(weight, "lbs", "kg");
            }
            if (reps !== undefined) updateData.reps = reps;
            if (rpe !== undefined) updateData.rpe = rpe;
            if (setType !== undefined) updateData.type = setType;

            if (status !== undefined) {
              updateData.status = status;
              updateData.completedAt =
                status === "completed" ? new Date() : null;
            }

            const finalStatus = status ?? currentSet.status;
            const finalType = setType ?? currentSet.type;
            const finalWeightKg =
              weight !== undefined ? updateData.weightKg : currentSet.weightKg;

            if (
              finalStatus === "completed" &&
              finalType === "working" &&
              finalWeightKg > 0
            ) {
              const exerciseDefinitionId =
                currentSet.exercise.exerciseDefinitionId;

              const maxWeightResult = await tx
                .select({ maxWeightKg: max(sets.weightKg) })
                .from(sets)
                .innerJoin(
                  sessionExercises,
                  eq(sets.exerciseId, sessionExercises.id),
                )
                .innerJoin(
                  workoutSessions,
                  eq(sessionExercises.sessionId, workoutSessions.id),
                )
                .where(
                  and(
                    eq(
                      sessionExercises.exerciseDefinitionId,
                      exerciseDefinitionId,
                    ),
                    eq(workoutSessions.userId, userId),
                    eq(sets.type, "working"),
                    eq(sets.status, "completed"),
                    not(eq(sets.id, setId)),
                  ),
                );

              const maxWeightKg = maxWeightResult[0]?.maxWeightKg ?? 0;
              if (finalWeightKg > maxWeightKg) {
                updateData.isPr = true;

                const oldPrSets = await tx
                  .select({ id: sets.id })
                  .from(sets)
                  .innerJoin(
                    sessionExercises,
                    eq(sets.exerciseId, sessionExercises.id),
                  )
                  .innerJoin(
                    workoutSessions,
                    eq(sessionExercises.sessionId, workoutSessions.id),
                  )
                  .where(
                    and(
                      eq(
                        sessionExercises.exerciseDefinitionId,
                        exerciseDefinitionId,
                      ),
                      eq(workoutSessions.userId, userId),
                      eq(sets.type, "working"),
                      eq(sets.status, "completed"),
                      eq(sets.isPr, true),
                      not(eq(sets.id, setId)),
                    ),
                  );

                if (oldPrSets.length > 0) {
                  await tx
                    .update(sets)
                    .set({ isPr: false })
                    .where(
                      inArray(
                        sets.id,
                        oldPrSets.map((s) => s.id),
                      ),
                    );
                }
              } else {
                updateData.isPr = false;
              }
            }

            await tx.update(sets).set(updateData).where(eq(sets.id, setId));
          });
          break;
        }

        case "delete_set": {
          const setRow = await db.query.sets.findFirst({
            where: eq(sets.id, mutation.setId),
            with: { exercise: true },
          });

          if (!setRow || setRow.exercise.sessionId !== sessionId) {
            return res
              .status(404)
              .json({ error: "Set not found or unauthorized" });
          }

          const exerciseId = setRow.exerciseId;
          await db.delete(sets).where(eq(sets.id, mutation.setId));

          // Re-number remaining sets sequentially
          const remainingSets = await db
            .select()
            .from(sets)
            .where(eq(sets.exerciseId, exerciseId))
            .orderBy(asc(sets.setNumber));

          for (let i = 0; i < remainingSets.length; i++) {
            await db
              .update(sets)
              .set({ setNumber: i + 1 })
              .where(eq(sets.id, remainingSets[i].id));
          }
          break;
        }

        case "prefill_sets": {
          const { exerciseId, sets: newSets } = mutation;

          await db.transaction(async (tx) => {
            await tx.delete(sets).where(eq(sets.exerciseId, exerciseId));

            if (newSets.length > 0) {
              await tx.insert(sets).values(
                newSets.map((s, i) => ({
                  exerciseId,
                  setNumber: i + 1,
                  type: s.setType,
                  status: "pending" as const,
                  weight: s.weight,
                  weightKg:
                    s.weight == null
                      ? null
                      : session.unit === "kg"
                        ? s.weight
                        : convertWeight(s.weight, "lbs", "kg"),
                  reps: s.reps,
                  rpe: s.rpe || null,
                })),
              );
            }
          });
          break;
        }

        case "update_session_settings": {
          await db.transaction(async (tx) => {
            await tx
              .update(workoutSessions)
              .set({ unit: mutation.unit })
              .where(eq(workoutSessions.id, sessionId));

            await tx
              .update(users)
              .set({
                defaultRestSeconds: mutation.defaultRestSeconds,
                preferredUnit: mutation.unit,
              })
              .where(eq(users.id, userId));

            // Recalculate stored display weight when unit changes so values
            // don't appear with the wrong magnitude after switching.
            if (session.unit !== mutation.unit) {
              const exIds = await tx
                .select({ id: sessionExercises.id })
                .from(sessionExercises)
                .where(eq(sessionExercises.sessionId, sessionId));

              if (exIds.length > 0) {
                await tx
                  .update(sets)
                  .set({
                    weight:
                      mutation.unit === "kg"
                        ? sql`${sets.weightKg}`
                        : sql`${sets.weightKg} * 2.20462`,
                  })
                  .where(
                    and(
                      inArray(
                        sets.exerciseId,
                        exIds.map((e) => e.id),
                      ),
                      isNotNull(sets.weightKg),
                    ),
                  );
              }
            }
          });
          break;
        }

        case "update_session_notes": {
          await db
            .update(workoutSessions)
            .set({ notes: mutation.notes.trim() || null })
            .where(eq(workoutSessions.id, sessionId));
          break;
        }

        case "apply_overload_suggestion": {
          const { exerciseId, weight, reps } = mutation;

          const exercise = await db.query.sessionExercises.findFirst({
            where: and(
              eq(sessionExercises.id, exerciseId),
              eq(sessionExercises.sessionId, sessionId),
            ),
          });

          if (!exercise) {
            return res.status(404).json({ error: "Exercise not found" });
          }

          const updateData: any = {
            weight,
            weightKg:
              session.unit === "kg"
                ? weight
                : convertWeight(weight, "lbs", "kg"),
          };
          if (reps != null) updateData.reps = reps;

          await db
            .update(sets)
            .set(updateData)
            .where(
              and(
                eq(sets.exerciseId, exerciseId),
                eq(sets.status, "pending"),
                eq(sets.type, "working"),
              ),
            );
          break;
        }
      }

      // Return the full updated session
      const fullSession = await db.query.workoutSessions.findFirst({
        where: eq(workoutSessions.id, sessionId),
        with: {
          exercises: {
            orderBy: (exercises, { asc }) => [asc(exercises.order)],
            with: {
              sets: {
                orderBy: (sets, { asc }) => [asc(sets.setNumber)],
              },
            },
          },
        },
      });

      return res.json(fullSession);
    } catch (error) {
      next(error);
    }
  },
);

// 8. DELETE /sessions/:id
sessionsRouter.delete(
  "/:id",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;
      const userId = req.userId!;

      const [deleted] = await db
        .delete(workoutSessions)
        .where(
          and(
            eq(workoutSessions.id, sessionId),
            eq(workoutSessions.userId, userId),
          ),
        )
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Workout session not found" });
      }

      return res.json({
        message: "Workout session deleted successfully",
        id: deleted.id,
      });
    } catch (error) {
      next(error);
    }
  },
);
