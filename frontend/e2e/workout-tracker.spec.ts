import { test, expect } from '@playwright/test';

test.describe('Workout Tracker E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock silent token login to start as an authenticated user
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mocked-jwt-token',
          user: {
            id: 'user-uuid-1234',
            email: 'trainer@example.com',
            preferredUnit: 'lbs',
            defaultRestSeconds: 90,
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });

    // 2. Mock fetching the active session on app load (start with none)
    await page.route('**/sessions/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    // 3. Mock fetching recent workout history list
    await page.route('**/sessions?page=1&limit=5', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // 4. Mock fetching exercise library search
    await page.route('**/exercises?q=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'ex-squat-id', name: 'Barbell Squat', muscleGroup: 'legs', isCustom: false, createdBy: null },
          { id: 'ex-bench-id', name: 'Bench Press', muscleGroup: 'push', isCustom: false, createdBy: null },
        ]),
      });
    });

    // 5. Mock starting a workout session
    await page.route('**/sessions', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-active-uuid',
          userId: 'user-uuid-1234',
          name: 'Tuesday Workout',
          status: 'active',
          unit: 'lbs',
          notes: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
          exercises: [],
        }),
      });
    });

    // 6. Mock active session fetching by ID
    await page.route('**/sessions/session-active-uuid', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'session-active-uuid',
          userId: 'user-uuid-1234',
          name: 'Tuesday Workout',
          status: 'active',
          unit: 'lbs',
          notes: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
          exercises: [],
        }),
      });
    });
  });

  test('should load dashboard and successfully start a new workout', async ({ page }) => {
    // Navigate to homepage dashboard
    await page.goto('/');

    // Verify authenticated user greeting is shown
    await expect(page.locator('h1')).toContainText('trainer');

    // Verify Start Workout button is present
    const startBtn = page.getByRole('button', { name: 'Start Workout' });
    await expect(startBtn).toBeVisible();

    // Click Start Workout to configure a session
    await startBtn.click();
    await expect(page).toHaveURL(/\/session\/new$/);

    // Verify default workout name input is prepopulated
    const nameInput = page.locator('#workout-name');
    await expect(nameInput).toHaveValue(/.+/); // matches weekday workout

    // Start workout session
    const launchBtn = page.getByRole('button', { name: 'Start Session' });
    await launchBtn.click();

    // Verify redirect to active session logger workspace
    await expect(page).toHaveURL(/\/session\/session-active-uuid$/);
    await expect(page.locator('h1')).toContainText('Tuesday Workout');
  });

  test('should allow active workout interactions like adding exercises', async ({ page }) => {
    // Navigate directly to active workout screen
    await page.goto('/session/session-active-uuid');

    // Verify empty state is displayed
    await expect(page.locator('text=Workout is empty')).toBeVisible();

    // Mock exercise card insertion mutation
    await page.route('**/sessions/session-active-uuid', async (route) => {
      if (route.request().method() === 'PATCH') {
        // Return updated session containing Squat exercise
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'session-active-uuid',
            userId: 'user-uuid-1234',
            name: 'Tuesday Workout',
            status: 'active',
            unit: 'lbs',
            notes: null,
            startedAt: new Date().toISOString(),
            completedAt: null,
            exercises: [
              {
                id: 'session-exercise-squat',
                sessionId: 'session-active-uuid',
                exerciseDefinitionId: 'ex-squat-id',
                nameSnapshot: 'Barbell Squat',
                order: 1,
                notes: null,
                createdAt: new Date().toISOString(),
                sets: [
                  {
                    id: 'set-id-1',
                    exerciseId: 'session-exercise-squat',
                    setNumber: 1,
                    type: 'working',
                    status: 'pending',
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
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'session-active-uuid',
            userId: 'user-uuid-1234',
            name: 'Tuesday Workout',
            status: 'active',
            unit: 'lbs',
            notes: null,
            startedAt: new Date().toISOString(),
            completedAt: null,
            exercises: [
              {
                id: 'session-exercise-squat',
                sessionId: 'session-active-uuid',
                exerciseDefinitionId: 'ex-squat-id',
                nameSnapshot: 'Barbell Squat',
                order: 1,
                notes: null,
                createdAt: new Date().toISOString(),
                sets: [
                  {
                    id: 'set-id-1',
                    exerciseId: 'session-exercise-squat',
                    setNumber: 1,
                    type: 'working',
                    status: 'pending',
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
    const addExerciseBtn = page.getByRole('button', { name: 'Add Exercise' });
    await addExerciseBtn.click();

    // Select Barbell Squat from library list
    const squatBtn = page.getByRole('button', { name: 'Barbell Squat' });
    await squatBtn.click();

    // Verify Squat card is now visible with prefilled sets
    await expect(page.getByRole('heading', { name: 'Barbell Squat' })).toBeVisible();
    await expect(page.locator('button', { hasText: '135' }).first()).toBeVisible();
  });
});
