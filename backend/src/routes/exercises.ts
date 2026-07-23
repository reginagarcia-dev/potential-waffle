import { Router, Response, NextFunction } from "express";
import { eq, and, ilike, desc, asc, not } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  exerciseDefinitions,
  sessionExercises,
  workoutSessions,
  sets,
} from "../db/schema.js";
import {
  visibleExerciseCondition,
  ownedCustomExerciseCondition,
} from "../db/exerciseQueries.js";
import { customExerciseSchema } from "shared";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.js";
import { sanitizeText } from "../utils/sanitize.js";

export const exercisesRouter = Router();

// Apply auth middleware to all exercise routes
exercisesRouter.use(authenticateToken);

// 1. GET /exercises?q=&muscleGroup=
exercisesRouter.get(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q as string | undefined;
      const muscleGroup = req.query.muscleGroup as any | undefined;
      const userId = req.userId!;

      const conditions = [visibleExerciseCondition(userId)];

      if (q && q.trim().length > 0) {
        conditions.push(ilike(exerciseDefinitions.name, `%${q.trim()}%`));
      }

      if (muscleGroup && muscleGroup.trim().length > 0) {
        conditions.push(eq(exerciseDefinitions.muscleGroup, muscleGroup));
      }

      const list = await db
        .select()
        .from(exerciseDefinitions)
        .where(and(...conditions))
        .orderBy(asc(exerciseDefinitions.name));

      return res.json(list);
    } catch (error) {
      next(error);
    }
  },
);

// 2. POST /exercises (create custom exercise)
exercisesRouter.post(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parseResult = customExerciseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res
          .status(400)
          .json({ error: parseResult.error.errors[0].message });
      }

      const { name, muscleGroup } = parseResult.data;
      const sanitizedName = sanitizeText(name);
      const userId = req.userId!;

      if (!sanitizedName) {
        return res.status(400).json({ error: "Exercise name is required" });
      }

      // Check duplicate custom exercises for this user
      const existing = await db.query.exerciseDefinitions.findFirst({
        where: and(
          ilike(exerciseDefinitions.name, sanitizedName),
          visibleExerciseCondition(userId),
        ),
      });

      if (existing) {
        return res.status(400).json({
          error: "An exercise with this name already exists in your library",
        });
      }

      const [newExercise] = await db
        .insert(exerciseDefinitions)
        .values({
          name: sanitizedName,
          muscleGroup,
          isCustom: true,
          createdBy: userId,
        })
        .returning();

      return res.status(201).json(newExercise);
    } catch (error) {
      next(error);
    }
  },
);

// 3. PATCH /exercises/:id (rename / recategorize a custom exercise)
exercisesRouter.patch(
  "/:id",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const exerciseId = req.params.id;
      const userId = req.userId!;

      const parseResult = customExerciseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res
          .status(400)
          .json({ error: parseResult.error.errors[0].message });
      }

      const { name, muscleGroup } = parseResult.data;
      const sanitizedName = sanitizeText(name);

      if (!sanitizedName) {
        return res.status(400).json({ error: "Exercise name is required" });
      }

      // Only custom exercises owned by this user can be edited
      const exercise = await db.query.exerciseDefinitions.findFirst({
        where: ownedCustomExerciseCondition(exerciseId, userId),
      });

      if (!exercise) {
        return res
          .status(404)
          .json({ error: "Exercise not found or cannot be edited" });
      }

      // Reject if the new name conflicts with an existing exercise in this user's library
      const duplicate = await db.query.exerciseDefinitions.findFirst({
        where: and(
          ilike(exerciseDefinitions.name, sanitizedName),
          visibleExerciseCondition(userId),
          not(eq(exerciseDefinitions.id, exerciseId)),
        ),
      });

      if (duplicate) {
        return res.status(400).json({
          error: "An exercise with this name already exists in your library",
        });
      }

      // Re-apply the ownership/not-deleted guard on the mutating query itself
      // (not just the pre-check above) so a concurrent delete can't leave a
      // window where this update still lands on a since-deleted row.
      const [updated] = await db
        .update(exerciseDefinitions)
        .set({ name: sanitizedName, muscleGroup })
        .where(ownedCustomExerciseCondition(exerciseId, userId))
        .returning();

      if (!updated) {
        return res
          .status(404)
          .json({ error: "Exercise not found or cannot be edited" });
      }

      return res.json(updated);
    } catch (error) {
      next(error);
    }
  },
);

// 4. DELETE /exercises/:id (remove a custom exercise)
exercisesRouter.delete(
  "/:id",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const exerciseId = req.params.id;
      const userId = req.userId!;

      const [deleted] = await db
        .update(exerciseDefinitions)
        .set({ deletedAt: new Date() })
        .where(ownedCustomExerciseCondition(exerciseId, userId))
        .returning();

      if (!deleted) {
        return res
          .status(404)
          .json({ error: "Exercise not found or cannot be deleted" });
      }

      return res.json({
        message: "Exercise deleted successfully",
        id: deleted.id,
      });
    } catch (error) {
      next(error);
    }
  },
);

// 5. GET /exercises/:id/last-performance
exercisesRouter.get(
  "/:id/last-performance",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const exerciseDefId = req.params.id;
      const userId = req.userId!;

      // Find the most recent completed workout session containing this exercise
      const recentExerciseRow = await db
        .select({
          sessionExerciseId: sessionExercises.id,
          completedAt: workoutSessions.completedAt,
        })
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

      if (recentExerciseRow.length === 0) {
        return res.json({
          lastWeight: null,
          lastReps: null,
          lastRpe: null,
          lastSetsCount: 0,
          lastSets: [],
        });
      }

      const exerciseId = recentExerciseRow[0].sessionExerciseId;

      // Fetch sets for that performance
      const performanceSets = await db
        .select()
        .from(sets)
        .where(eq(sets.exerciseId, exerciseId))
        .orderBy(asc(sets.setNumber));

      // Calculate representatives (e.g. from the first working set or average)
      // We'll return the values from the first completed working set, or just the first set.
      const workingSets = performanceSets.filter(
        (s) => s.type === "working" && s.status === "completed",
      );
      const representativeSet =
        workingSets.length > 0 ? workingSets[0] : performanceSets[0];

      return res.json({
        lastWeight: representativeSet?.weight ?? null,
        lastReps: representativeSet?.reps ?? null,
        lastRpe: representativeSet?.rpe ?? null,
        lastSetsCount: performanceSets.length,
        lastSets: performanceSets.map((s) => ({
          weight: s.weight ?? 0,
          reps: s.reps ?? 0,
          rpe: s.rpe ?? null,
          type: s.type,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);
