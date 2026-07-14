import { Router, Response, NextFunction } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { measurements } from "../db/schema.js";
import { measurementSchema } from "shared";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.js";
import { sanitizeText } from "../utils/sanitize.js";

export const measurementsRouter = Router();

measurementsRouter.use(authenticateToken);

// 1. GET /measurements
measurementsRouter.get(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rawType = req.query.type as string | undefined;
      const type = rawType ? sanitizeText(rawType).toLowerCase() : undefined;
      const userId = req.userId!;

      const conditions = [eq(measurements.userId, userId)];
      if (type && type.trim().length > 0) {
        conditions.push(eq(measurements.type, type.toLowerCase().trim()));
      }

      const logs = await db
        .select()
        .from(measurements)
        .where(and(...conditions))
        .orderBy(desc(measurements.date), desc(measurements.createdAt));

      return res.json(logs);
    } catch (error) {
      next(error);
    }
  },
);

// 2. POST /measurements
measurementsRouter.post(
  "/",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parseResult = measurementSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res
          .status(400)
          .json({ error: parseResult.error.errors[0].message });
      }

      const { date, type, value, unit } = parseResult.data;
      const sanitizedType = sanitizeText(type).toLowerCase();
      const userId = req.userId!;

      if (!sanitizedType) {
        return res.status(400).json({ error: "Measurement type is required" });
      }

      const [newLog] = await db
        .insert(measurements)
        .values({
          userId,
          date: date ? new Date(date) : new Date(),
          type: sanitizedType,
          value,
          unit,
        })
        .returning();

      return res.status(201).json(newLog);
    } catch (error) {
      next(error);
    }
  },
);

// 3. DELETE /measurements/:id
measurementsRouter.delete(
  "/:id",
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const measurementId = req.params.id;
      const userId = req.userId!;

      const [deleted] = await db
        .delete(measurements)
        .where(
          and(
            eq(measurements.id, measurementId),
            eq(measurements.userId, userId),
          ),
        )
        .returning();

      if (!deleted) {
        return res
          .status(404)
          .json({ error: "Measurement not found or unauthorized" });
      }

      return res.json({
        message: "Measurement deleted successfully",
        id: deleted.id,
      });
    } catch (error) {
      next(error);
    }
  },
);
