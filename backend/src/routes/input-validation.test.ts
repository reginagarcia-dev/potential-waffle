import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-secret";

const findWorkoutSessionMock = vi.fn();
const findExerciseDefinitionMock = vi.fn();

vi.mock("../db/index.js", () => ({
  db: {
    query: {
      workoutSessions: {
        findFirst: findWorkoutSessionMock,
      },
      exerciseDefinitions: {
        findFirst: findExerciseDefinitionMock,
      },
    },
  },
}));

const { sessionsRouter } = await import("./sessions.js");
const { exercisesRouter } = await import("./exercises.js");

function authToken() {
  return jwt.sign(
    { userId: "00000000-0000-0000-0000-000000000001" },
    "test-secret",
    {
      expiresIn: "15m",
    },
  );
}

describe("route validation guards", () => {
  beforeEach(() => {
    findWorkoutSessionMock.mockReset();
    findExerciseDefinitionMock.mockReset();
  });

  it("rejects non-string notes in POST /sessions/:id/finish before DB read", async () => {
    const app = express();
    app.use(express.json());
    app.use("/sessions", sessionsRouter);

    const res = await request(app)
      .post("/sessions/11111111-1111-1111-1111-111111111111/finish")
      .set("Authorization", `Bearer ${authToken()}`)
      .send({ notes: { text: "not-a-string" } });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Notes must be a string" });
    expect(findWorkoutSessionMock).not.toHaveBeenCalled();
  });

  it("rejects overlong exercise name in POST /exercises before DB read", async () => {
    const app = express();
    app.use(express.json());
    app.use("/exercises", exercisesRouter);

    const longName = "x".repeat(121);

    const res = await request(app)
      .post("/exercises")
      .set("Authorization", `Bearer ${authToken()}`)
      .send({ name: longName, muscleGroup: "legs" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Exercise name must be at most 120 characters",
    });
    expect(findExerciseDefinitionMock).not.toHaveBeenCalled();
  });
});
