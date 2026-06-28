import { Router, Response, NextFunction } from 'express';
import { eq, and, asc, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { exerciseDefinitions, workoutSessions, sessionExercises, sets } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

export const progressRouter = Router();

progressRouter.use(authenticateToken);

// GET /progress/recent-prs — all-time PRs ordered by most recent, for the Today dashboard
progressRouter.get('/recent-prs', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const prSets = await db
      .select({
        exerciseName: sessionExercises.nameSnapshot,
        weight: sets.weight,
        reps: sets.reps,
        unit: workoutSessions.unit,
        completedAt: workoutSessions.completedAt,
      })
      .from(sets)
      .innerJoin(sessionExercises, eq(sets.exerciseId, sessionExercises.id))
      .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'completed'),
          eq(sets.type, 'working'),
          eq(sets.status, 'completed'),
          eq(sets.isPr, true)
        )
      )
      .orderBy(desc(workoutSessions.completedAt))
      .limit(20);

    return res.json(
      prSets.map((p) => ({
        exerciseName: p.exerciseName,
        weight: p.weight,
        reps: p.reps,
        unit: p.unit,
        date: p.completedAt ? p.completedAt.toISOString() : null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

// GET /progress/:exerciseDefinitionId
progressRouter.get('/:exerciseDefinitionId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const exerciseDefId = req.params.exerciseDefinitionId;
    const userId = req.userId!;

    // Fetch exercise name
    const exerciseDef = await db.query.exerciseDefinitions.findFirst({
      where: eq(exerciseDefinitions.id, exerciseDefId),
    });

    if (!exerciseDef) {
      return res.status(404).json({ error: 'Exercise definition not found' });
    }

    // Fetch completed sets in completed sessions for this exercise and user
    const performanceData = await db
      .select({
        sessionId: workoutSessions.id,
        completedAt: workoutSessions.completedAt,
        weight: sets.weight,
        reps: sets.reps,
      })
      .from(sets)
      .innerJoin(sessionExercises, eq(sets.exerciseId, sessionExercises.id))
      .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
      .where(
        and(
          eq(sessionExercises.exerciseDefinitionId, exerciseDefId),
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.status, 'completed'),
          eq(sets.type, 'working'),
          eq(sets.status, 'completed')
        )
      )
      .orderBy(asc(workoutSessions.completedAt));

    // Aggregate stats
    let allTimeBestWeight = 0;
    let allTimeBestReps = 0;

    const groupedBySession: {
      [sessionId: string]: {
        date: string;
        bestWeight: number;
        bestReps: number;
        volume: number;
      };
    } = {};

    performanceData.forEach((row) => {
      const weight = row.weight || 0;
      const reps = row.reps || 0;
      const volume = weight * reps;
      const dateStr = row.completedAt ? row.completedAt.toISOString() : new Date().toISOString();
      const sessionId = row.sessionId;

      if (weight > allTimeBestWeight) allTimeBestWeight = weight;
      if (reps > allTimeBestReps) allTimeBestReps = reps;

      if (!groupedBySession[sessionId]) {
        groupedBySession[sessionId] = {
          date: dateStr,
          bestWeight: weight,
          bestReps: reps,
          volume,
        };
      } else {
        const current = groupedBySession[sessionId];
        current.bestWeight = Math.max(current.bestWeight, weight);
        current.bestReps = Math.max(current.bestReps, reps);
        current.volume += volume;
      }
    });

    const history = Object.values(groupedBySession).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return res.json({
      exerciseName: exerciseDef.name,
      bestWeight: allTimeBestWeight > 0 ? allTimeBestWeight : null,
      bestReps: allTimeBestReps > 0 ? allTimeBestReps : null,
      history,
    });
  } catch (error) {
    next(error);
  }
});
