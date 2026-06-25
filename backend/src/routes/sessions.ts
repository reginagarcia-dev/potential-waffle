import { Router, Request, Response, NextFunction } from 'express';
import { eq, and, desc, asc, max, not } from 'drizzle-orm';
import { db } from '../db/index.js';
import { workoutSessions, sessionExercises, sets, exerciseDefinitions } from '../db/schema.js';
import { sessionMutationSchema } from 'shared';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { convertWeight } from 'shared';

export const sessionsRouter = Router();

sessionsRouter.use(authenticateToken);

// 1. GET /sessions/active (Retrieve current active session, if any)
sessionsRouter.get('/active', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const activeSession = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'active')
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
});

// 2. GET /sessions (Paginated completed workout sessions list)
sessionsRouter.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const offset = (page - 1) * limit;

    const list = await db.query.workoutSessions.findMany({
      where: and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'completed')
      ),
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
});

// 3. GET /sessions/:id (Details of a specific session)
sessionsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const userId = req.userId!;

    const session = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
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
      return res.status(404).json({ error: 'Workout session not found' });
    }

    return res.json(session);
  } catch (error) {
    next(error);
  }
});

// 4. POST /sessions (Creates database record immediately, status: active)
sessionsRouter.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { name, unit } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: 'Name and unit are required' });
    }

    // Check if there is already an active session
    const existingActive = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, 'active')
      ),
    });

    if (existingActive) {
      return res.status(400).json({ error: 'An active session is already in progress. Finish or abandon it first.' });
    }

    const [newSession] = await db
      .insert(workoutSessions)
      .values({
        userId,
        name: name.trim(),
        unit,
        status: 'active',
      })
      .returning();

    return res.status(201).json({
      ...newSession,
      exercises: [],
    });
  } catch (error) {
    next(error);
  }
});

// 5. POST /sessions/:id/finish (Complete session)
sessionsRouter.post('/:id/finish', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const userId = req.userId!;
    const { notes } = req.body;

    const session = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Only active workouts can be finished' });
    }

    // Mark pending sets as completed if they have values, or delete them if empty?
    // Usually, we transition all pending sets with weights/reps to completed.
    // In this app, we'll mark any sets that have values as completed.
    const exerciseRows = await db
      .select({ id: sessionExercises.id })
      .from(sessionExercises)
      .where(eq(sessionExercises.sessionId, sessionId));

    for (const ex of exerciseRows) {
      // Auto-complete sets with filled values
      await db
        .update(sets)
        .set({ status: 'completed', completedAt: new Date() })
        .where(
          and(
            eq(sets.exerciseId, ex.id),
            eq(sets.status, 'pending'),
            not(eq(sets.weight, null as any)),
            not(eq(sets.reps, null as any))
          )
        );
    }

    const [finishedSession] = await db
      .update(workoutSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        notes: notes || null,
      })
      .where(eq(workoutSessions.id, sessionId))
      .returning();

    // Re-fetch finished session with populated values
    const fullSession = await db.query.workoutSessions.findFirst({
      where: eq(workoutSessions.id, finishedSession.id),
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
});

// 6. POST /sessions/:id/abandon (Abandon session)
sessionsRouter.post('/:id/abandon', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const userId = req.userId!;

    const [abandonedSession] = await db
      .update(workoutSessions)
      .set({
        status: 'abandoned',
        completedAt: new Date(),
      })
      .where(and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      ))
      .returning();

    if (!abandonedSession) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    return res.json(abandonedSession);
  } catch (error) {
    next(error);
  }
});

// 7. PATCH /sessions/:id (The single endpoint managing active session updates)
sessionsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const userId = req.userId!;

    const session = await db.query.workoutSessions.findFirst({
      where: and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Cannot mutate a completed or abandoned session' });
    }

    const parseResult = sessionMutationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const mutation = parseResult.data;

    switch (mutation.type) {
      case 'rename_session': {
        const [updated] = await db
          .update(workoutSessions)
          .set({ name: mutation.name.trim() })
          .where(eq(workoutSessions.id, sessionId))
          .returning();
        break;
      }

      case 'add_exercise': {
        const exerciseDefId = mutation.exerciseDefinitionId;

        // Fetch definition
        const definition = await db.query.exerciseDefinitions.findFirst({
          where: eq(exerciseDefinitions.id, exerciseDefId),
        });

        if (!definition) {
          return res.status(404).json({ error: 'Exercise definition not found' });
        }

        // Get max order
        const exerciseList = await db
          .select({ order: sessionExercises.order })
          .from(sessionExercises)
          .where(eq(sessionExercises.sessionId, sessionId));

        const maxOrder = exerciseList.reduce((maxVal, item) => Math.max(maxVal, item.order), 0);

        // Create session exercise
        const [sessionEx] = await db
          .insert(sessionExercises)
          .values({
            sessionId,
            exerciseDefinitionId: exerciseDefId,
            nameSnapshot: definition.name,
            order: maxOrder + 1,
          })
          .returning();

        // Check for historical performance from last completed session to pre-fill sets
        const lastPerformance = await db
          .select({
            sessionExerciseId: sessionExercises.id,
            completedAt: workoutSessions.completedAt,
          })
          .from(sessionExercises)
          .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
          .where(
            and(
              eq(sessionExercises.exerciseDefinitionId, exerciseDefId),
              eq(workoutSessions.userId, userId),
              eq(workoutSessions.status, 'completed')
            )
          )
          .orderBy(desc(workoutSessions.completedAt))
          .limit(1);

        if (lastPerformance.length > 0) {
          // Fetch previous sets
          const prevSets = await db
            .select()
            .from(sets)
            .where(eq(sets.exerciseId, lastPerformance[0].sessionExerciseId))
            .orderBy(asc(sets.setNumber));

          // Insert prefilled sets (all pending, weight/reps prepopulated but flagged with reference fields)
          if (prevSets.length > 0) {
            for (const prev of prevSets) {
              const weightVal = convertWeight(prev.weight ?? 0, session.unit, session.unit); // Normalize unit if session unit changed
              await db.insert(sets).values({
                exerciseId: sessionEx.id,
                setNumber: prev.setNumber,
                type: prev.type,
                status: 'pending',
                weight: prev.weight, // Prepopulate input
                weightKg: prev.weightKg,
                reps: prev.reps, // Prepopulate input
                rpe: prev.rpe,
                previousWeight: prev.weight,
                previousReps: prev.reps,
              });
            }
          }
        } else {
          // No history: insert a single empty pending working set
          await db.insert(sets).values({
            exerciseId: sessionEx.id,
            setNumber: 1,
            type: 'working',
            status: 'pending',
          });
        }
        break;
      }

      case 'delete_exercise': {
        await db
          .delete(sessionExercises)
          .where(and(
            eq(sessionExercises.id, mutation.exerciseId),
            eq(sessionExercises.sessionId, sessionId)
          ));
        break;
      }

      case 'add_set': {
        const { exerciseId, setType } = mutation;

        const maxSetRow = await db
          .select({ setNumber: sets.setNumber })
          .from(sets)
          .where(eq(sets.exerciseId, exerciseId));

        const maxNum = maxSetRow.reduce((maxVal, s) => Math.max(maxVal, s.setNumber), 0);

        // Inherit values from the previous set if exists for convenience
        const lastSet = await db.query.sets.findFirst({
          where: eq(sets.exerciseId, exerciseId),
          orderBy: [desc(sets.setNumber)],
        });

        await db.insert(sets).values({
          exerciseId,
          setNumber: maxNum + 1,
          type: setType || 'working',
          status: 'pending',
          weight: lastSet?.weight ?? null,
          weightKg: lastSet?.weightKg ?? null,
          reps: lastSet?.reps ?? null,
        });
        break;
      }

      case 'update_set': {
        const { setId, weight, reps, rpe, status, setType } = mutation;

        const currentSet = await db.query.sets.findFirst({
          where: eq(sets.id, setId),
          with: {
            exercise: true,
          },
        });

        if (!currentSet || currentSet.exercise.sessionId !== sessionId) {
          return res.status(404).json({ error: 'Set not found or unauthorized' });
        }

        // Prepare updates
        const updateData: any = {};
        if (weight !== undefined) {
          updateData.weight = weight;
          updateData.weightKg = weight === null ? null : (session.unit === 'kg' ? weight : convertWeight(weight, 'lbs', 'kg'));
        }
        if (reps !== undefined) updateData.reps = reps;
        if (rpe !== undefined) updateData.rpe = rpe;
        if (setType !== undefined) updateData.type = setType;

        if (status !== undefined) {
          updateData.status = status;
          if (status === 'completed') {
            updateData.completedAt = new Date();
          } else {
            updateData.completedAt = null;
          }
        }

        // PR Detection
        // Run PR check only when marking a working set as completed
        const finalStatus = status ?? currentSet.status;
        const finalType = setType ?? currentSet.type;
        const finalWeight = weight !== undefined ? weight : currentSet.weight;
        const finalWeightKg = weight !== undefined ? updateData.weightKg : currentSet.weightKg;

        if (finalStatus === 'completed' && finalType === 'working' && finalWeightKg > 0) {
          // Check if this weight beats all time high
          const exerciseDefinitionId = currentSet.exercise.exerciseDefinitionId;

          const maxWeightResult = await db
            .select({ maxWeightKg: max(sets.weightKg) })
            .from(sets)
            .innerJoin(sessionExercises, eq(sets.exerciseId, sessionExercises.id))
            .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
            .where(
              and(
                eq(sessionExercises.exerciseDefinitionId, exerciseDefinitionId),
                eq(workoutSessions.userId, userId),
                eq(sets.type, 'working'),
                eq(sets.status, 'completed'),
                not(eq(sets.id, setId)) // exclude this set itself
              )
            );

          const maxWeightKg = maxWeightResult[0]?.maxWeightKg ?? 0;
          if (finalWeightKg > maxWeightKg) {
            updateData.isPr = true;
          } else {
            updateData.isPr = false;
          }
        }

        await db
          .update(sets)
          .set(updateData)
          .where(eq(sets.id, setId));
        break;
      }

      case 'delete_set': {
        const setRow = await db.query.sets.findFirst({
          where: eq(sets.id, mutation.setId),
          with: { exercise: true },
        });

        if (!setRow || setRow.exercise.sessionId !== sessionId) {
          return res.status(404).json({ error: 'Set not found or unauthorized' });
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

      case 'prefill_sets': {
        const { exerciseId, sets: newSets } = mutation;

        // Clear existing sets
        await db.delete(sets).where(eq(sets.exerciseId, exerciseId));

        // Insert new sets
        for (let i = 0; i < newSets.length; i++) {
          const s = newSets[i];
          const weightKg = session.unit === 'kg' ? s.weight : convertWeight(s.weight, 'lbs', 'kg');
          await db.insert(sets).values({
            exerciseId,
            setNumber: i + 1,
            type: s.setType,
            status: 'pending',
            weight: s.weight,
            weightKg,
            reps: s.reps,
            rpe: s.rpe || null,
          });
        }
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
});

// 8. DELETE /sessions/:id
sessionsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id;
    const userId = req.userId!;

    const [deleted] = await db
      .delete(workoutSessions)
      .where(and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    return res.json({ message: 'Workout session deleted successfully', id: deleted.id });
  } catch (error) {
    next(error);
  }
});

