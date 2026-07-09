import { test, expect } from "@playwright/test";

test.describe("Workout Tracker E2E Flows", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock silent token login to start as an authenticated user
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "mocked-jwt-token",
          user: {
            id: "user-uuid-1234",
            email: "trainer@example.com",
            preferredUnit: "lbs",
            defaultRestSeconds: 90,
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    // 2. Mock fetching the active session on app load (start with none)
    await page.route("**/sessions/active", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });

    // 3. Mock fetching recent workout history list
    await page.route("**/sessions?page=1&limit=5", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    // 4. Mock fetching exercise library search
    await page.route("**/exercises?q=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "ex-squat-id",
            name: "Barbell Squat",
            muscleGroup: "legs",
            isCustom: false,
            createdBy: null,
          },
          {
            id: "ex-bench-id",
            name: "Bench Press",
            muscleGroup: "push",
            isCustom: false,
            createdBy: null,
          },
        ]),
      });
    });

    // 5. Mock starting a workout session
    await page.route("**/sessions", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "session-active-uuid",
          userId: "user-uuid-1234",
          name: "Tuesday Workout",
          status: "active",
          unit: "lbs",
          notes: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
          exercises: [],
        }),
      });
    });

    // 6. Mock active session fetching by ID
    await page.route("**/sessions/session-active-uuid", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "session-active-uuid",
          userId: "user-uuid-1234",
          name: "Tuesday Workout",
          status: "active",
          unit: "lbs",
          notes: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
          exercises: [],
        }),
      });
    });
  });

  test("should load dashboard and successfully start a new workout", async ({
    page,
  }) => {
    // Navigate to homepage dashboard
    await page.goto("/");

    // Verify page title and user greeting are shown
    await expect(page.locator("h1")).toContainText("Today");
    await expect(
      page.getByText("Trainer", { exact: false }).first(),
    ).toBeVisible();

    // Verify Start Workout button is present
    const startBtn = page
      .getByRole("button", { name: "Start Workout" })
      .first();
    await expect(startBtn).toBeVisible();

    // Click Start Workout to configure a session
    await startBtn.click();
    await expect(page).toHaveURL(/\/session\/new$/);

    // Verify default workout name input is prepopulated
    const nameInput = page.locator("#workout-name");
    await expect(nameInput).toHaveValue(/.+/); // matches weekday workout

    // Start workout session
    const launchBtn = page
      .getByRole("button", { name: "Start Workout" })
      .last();
    await launchBtn.click();

    // Verify redirect to active session logger workspace
    await expect(page).toHaveURL(/\/session\/session-active-uuid$/);
    await expect(page.locator("h1")).toContainText("Tuesday Workout");
  });

  test("should allow active workout interactions like adding exercises", async ({
    page,
  }) => {
    // Navigate directly to active workout screen
    await page.goto("/session/session-active-uuid");

    // Verify empty state is displayed
    await expect(page.locator("text=Workout is empty")).toBeVisible();

    // Mock exercise card insertion mutation
    await page.route("**/sessions/session-active-uuid", async (route) => {
      if (route.request().method() === "PATCH") {
        // Return updated session containing Squat exercise
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "session-active-uuid",
            userId: "user-uuid-1234",
            name: "Tuesday Workout",
            status: "active",
            unit: "lbs",
            notes: null,
            startedAt: new Date().toISOString(),
            completedAt: null,
            exercises: [
              {
                id: "session-exercise-squat",
                sessionId: "session-active-uuid",
                exerciseDefinitionId: "ex-squat-id",
                nameSnapshot: "Barbell Squat",
                order: 1,
                notes: null,
                createdAt: new Date().toISOString(),
                sets: [
                  {
                    id: "set-id-1",
                    exerciseId: "session-exercise-squat",
                    setNumber: 1,
                    type: "working",
                    status: "pending",
                    weight: 135,
                    weightKg: 61.23,
                    reps: 8,
                    rpe: null,
                    previousWeight: 135,
                    previousReps: 8,
                    isPr: false,
                    completedAt: null,
                  },
                ],
              },
            ],
          }),
        });
      } else {
        // GET requests after addition return session containing Squat exercise
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "session-active-uuid",
            userId: "user-uuid-1234",
            name: "Tuesday Workout",
            status: "active",
            unit: "lbs",
            notes: null,
            startedAt: new Date().toISOString(),
            completedAt: null,
            exercises: [
              {
                id: "session-exercise-squat",
                sessionId: "session-active-uuid",
                exerciseDefinitionId: "ex-squat-id",
                nameSnapshot: "Barbell Squat",
                order: 1,
                notes: null,
                createdAt: new Date().toISOString(),
                sets: [
                  {
                    id: "set-id-1",
                    exerciseId: "session-exercise-squat",
                    setNumber: 1,
                    type: "working",
                    status: "pending",
                    weight: 135,
                    weightKg: 61.23,
                    reps: 8,
                    rpe: null,
                    previousWeight: 135,
                    previousReps: 8,
                    isPr: false,
                    completedAt: null,
                  },
                ],
              },
            ],
          }),
        });
      }
    });

    // Tap Add Exercise
    const addExerciseBtn = page.getByRole("button", { name: "Add Exercise" });
    await addExerciseBtn.click();

    // Select Barbell Squat from library list
    const squatBtn = page.getByRole("button", { name: "Barbell Squat" });
    await squatBtn.click();

    // Verify Squat card is now visible with prefilled sets
    await expect(
      page.getByRole("heading", { name: "Barbell Squat" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "135" }).first(),
    ).toBeVisible();
  });

  test("should redirect to login when refresh token is invalid", async ({
    page,
  }) => {
    await page.unroute("**/auth/refresh");
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid or expired refresh token" }),
      });
    });

    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email Address")).toBeVisible();
  });

  test("should copy a previous workout as a new session with rename", async ({
    page,
  }) => {
    const pastWorkout = {
      id: "session-past-uuid",
      userId: "user-uuid-1234",
      name: "Push Day",
      status: "completed",
      unit: "lbs",
      notes: null,
      startedAt: "2026-07-01T17:00:00.000Z",
      completedAt: "2026-07-01T18:00:00.000Z",
      exercises: [
        {
          id: "se-bench-past",
          sessionId: "session-past-uuid",
          exerciseDefinitionId: "ex-bench-id",
          nameSnapshot: "Bench Press",
          order: 1,
          notes: null,
          createdAt: "2026-07-01T17:00:00.000Z",
          sets: [
            {
              id: "set-past-1",
              exerciseId: "se-bench-past",
              setNumber: 1,
              type: "working",
              status: "completed",
              weight: 135,
              weightKg: 61.23,
              reps: 8,
              rpe: null,
              previousWeight: null,
              previousReps: null,
              isPr: false,
              completedAt: "2026-07-01T17:10:00.000Z",
            },
          ],
        },
      ],
    };

    const copiedSession = {
      id: "session-copied-uuid",
      userId: "user-uuid-1234",
      name: "Push Day v2",
      status: "active",
      unit: "lbs",
      notes: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      exercises: [
        {
          ...pastWorkout.exercises[0],
          id: "se-bench-copy",
          sessionId: "session-copied-uuid",
          sets: [
            {
              id: "set-copy-1",
              exerciseId: "se-bench-copy",
              setNumber: 1,
              type: "working",
              status: "completed",
              weight: 135,
              weightKg: 61.23,
              reps: 8,
              rpe: null,
              previousWeight: 135,
              previousReps: 8,
              isPr: false,
              completedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    };

    // Recent completed workouts for the Start-from dropdown
    await page.route("**/sessions?page=1&limit=10", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([pastWorkout]),
      });
    });

    // Capture the create payload and return the copied session
    let createBody: Record<string, unknown> | null = null;
    await page.route("**/sessions", async (route) => {
      createBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(copiedSession),
      });
    });

    await page.route("**/sessions/session-copied-uuid", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(copiedSession),
      });
    });

    await page.goto("/session/new");

    // Pick the past workout — the name field pre-fills for optional rename
    await page.locator("#start-from").selectOption("session-past-uuid");
    const nameInput = page.locator("#workout-name");
    await expect(nameInput).toHaveValue("Push Day");

    await nameInput.fill("Push Day v2");

    await page.getByRole("button", { name: "Start Workout" }).last().click();

    // Lands in the new active session with the copied exercise structure
    await expect(page).toHaveURL(/\/session\/session-copied-uuid$/);
    await expect(page.locator("h1")).toContainText("Push Day v2");
    await expect(
      page.getByRole("heading", { name: "Bench Press" }),
    ).toBeVisible();

    // Copied weight is a real pre-filled value, not a gray placeholder
    await expect(
      page.locator("button", { hasText: "135" }).first(),
    ).toBeVisible();

    expect(createBody).toMatchObject({
      name: "Push Day v2",
      unit: "lbs",
      sourceSessionId: "session-past-uuid",
    });
  });

  test("should preserve copied sets when finishing immediately", async ({
    page,
  }) => {
    const nowIso = new Date().toISOString();
    let didFinishSession = false;

    const pastWorkout = {
      id: "session-past-template-uuid",
      userId: "user-uuid-1234",
      name: "Upper A",
      status: "completed",
      unit: "lbs",
      notes: null,
      startedAt: "2026-07-02T17:00:00.000Z",
      completedAt: "2026-07-02T17:50:00.000Z",
      exercises: [
        {
          id: "se-upper-past",
          sessionId: "session-past-template-uuid",
          exerciseDefinitionId: "ex-bench-id",
          nameSnapshot: "Bench Press",
          order: 1,
          notes: null,
          createdAt: "2026-07-02T17:00:00.000Z",
          sets: [
            {
              id: "set-upper-past-1",
              exerciseId: "se-upper-past",
              setNumber: 1,
              type: "working",
              status: "completed",
              weight: 155,
              weightKg: 70.31,
              reps: 6,
              rpe: null,
              previousWeight: null,
              previousReps: null,
              isPr: false,
              completedAt: "2026-07-02T17:10:00.000Z",
            },
          ],
        },
      ],
    };

    const copiedSessionActive = {
      id: "session-copied-finish-uuid",
      userId: "user-uuid-1234",
      name: "Upper A Copy",
      status: "active",
      unit: "lbs",
      notes: null,
      startedAt: nowIso,
      completedAt: null,
      exercises: [
        {
          ...pastWorkout.exercises[0],
          id: "se-upper-copy",
          sessionId: "session-copied-finish-uuid",
          sets: [
            {
              id: "set-upper-copy-1",
              exerciseId: "se-upper-copy",
              setNumber: 1,
              type: "working",
              status: "completed",
              weight: 155,
              weightKg: 70.31,
              reps: 6,
              rpe: null,
              previousWeight: 155,
              previousReps: 6,
              isPr: false,
              completedAt: nowIso,
            },
          ],
        },
      ],
    };

    const copiedSessionCompleted = {
      ...copiedSessionActive,
      status: "completed",
      completedAt: nowIso,
    };

    await page.route("**/sessions?page=1&limit=10", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([pastWorkout]),
      });
    });

    await page.route("**/sessions?page=1&limit=1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([copiedSessionCompleted]),
      });
    });

    await page.route("**/sessions?page=1&limit=50*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([copiedSessionCompleted]),
      });
    });

    await page.route("**/sessions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(copiedSessionActive),
        });
        return;
      }

      await route.fallback();
    });

    await page.route(
      "**/sessions/session-copied-finish-uuid/finish",
      async (route) => {
        didFinishSession = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(copiedSessionCompleted),
        });
      },
    );

    await page.route(
      "**/sessions/session-copied-finish-uuid",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            didFinishSession ? copiedSessionCompleted : copiedSessionActive,
          ),
        });
      },
    );

    await page.goto("/session/new");

    await page
      .locator("#start-from")
      .selectOption("session-past-template-uuid");
    await page.locator("#workout-name").fill("Upper A Copy");
    await page.getByRole("button", { name: "Start Workout" }).last().click();

    await expect(page).toHaveURL(/\/session\/session-copied-finish-uuid$/);
    await expect(
      page.getByRole("heading", { name: "Bench Press" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Finish Workout" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Finish Workout" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Finish Workout" }).last().click();

    await expect(page).toHaveURL(
      /\/session\/session-copied-finish-uuid\/summary$/,
    );
    await expect(page.getByText("155 × 6", { exact: false })).toBeVisible();

    await page.goto("/history");
    await expect(page.getByText("Upper A Copy")).toBeVisible();
  });
});
