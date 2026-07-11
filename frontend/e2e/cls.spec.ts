import { test, expect, type Route } from "@playwright/test";
import { CLS_BUDGET, readCLS, trackCLS } from "./utils/cls";

// This app is mobile-first (max-w-md layout, bottom nav, safe-area insets).
// CLS is normalized by viewport area, so the same pixel shift reads as a much
// larger score on a real phone screen than on the default desktop viewport —
// test at a representative mobile size so this doesn't understate real CLS.
test.use({ viewport: { width: 390, height: 844 } });

const AUTH_USER = {
  id: "user-uuid-1234",
  email: "trainer@example.com",
  preferredUnit: "lbs",
  defaultRestSeconds: 90,
  createdAt: new Date().toISOString(),
};

// Delaying mocked responses matters here: if data resolves instantly, React
// can swap loading -> loaded before the browser's first paint, and the test
// never actually exercises the transition it's meant to guard against.
const NETWORK_DELAY_MS = 300;

async function delayedJson(route: Route, body: unknown) {
  await new Promise((resolve) => setTimeout(resolve, NETWORK_DELAY_MS));
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

test.describe("Cumulative Layout Shift", () => {
  test.beforeEach(async ({ page }) => {
    await trackCLS(page);

    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "mocked-jwt-token",
          user: AUTH_USER,
        }),
      });
    });

    await page.route("**/sessions/active", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    });
  });

  test("login page has no layout shift (harness sanity check)", async ({
    page,
  }) => {
    // A real logged-out visitor gets a fast 401 (no refresh cookie) — mock
    // that explicitly. Leaving /auth/refresh unmocked instead makes the
    // request fail as a network error, which triggers this app's
    // refreshSessionWithRetry backoff (~9s) and just makes the test slow
    // and flaky, not a faithful "logged out" scenario.
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Refresh token missing" }),
      });
    });

    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();

    const cls = await readCLS(page);
    expect(cls).toBeLessThan(CLS_BUDGET);
  });

  // The two sections' queries are tested in isolation (one delayed, the
  // other resolved instantly) rather than both delayed together — racing two
  // simultaneously-delayed responses makes the measured shift depend on
  // which one React happens to batch first, which is noisy and can mask a
  // real per-section regression.
  //
  // Note on the fixed data below: the skeleton always renders 3 placeholder
  // rows (it can't know the real count in advance), so a real result with
  // fewer than 3 items will always measure some non-zero CLS as the extra
  // skeleton rows collapse away — that's an accepted skeleton-UI trade-off,
  // not a regression, and it's usually still smaller than rendering nothing
  // during the loading state would be. CLS_BUDGET (the standard "good"
  // threshold) is the right bar here, not a stricter one — a stricter bound
  // would fail on this normal variance rather than on an actual regression.
  const RECENT_SESSION = {
    id: "session-past-1",
    userId: AUTH_USER.id,
    name: "Push Day",
    status: "completed",
    unit: "lbs",
    notes: null,
    startedAt: "2026-07-08T17:00:00.000Z",
    completedAt: "2026-07-08T18:00:00.000Z",
    exercises: [
      {
        id: "se-1",
        sessionId: "session-past-1",
        exerciseDefinitionId: "ex-1",
        nameSnapshot: "Bench Press",
        order: 1,
        notes: null,
        createdAt: "2026-07-08T17:00:00.000Z",
        sets: [
          {
            id: "s-1",
            exerciseId: "se-1",
            setNumber: 1,
            type: "working",
            status: "completed",
            weight: 185,
            weightKg: 83.9,
            reps: 5,
            rpe: null,
            previousWeight: null,
            previousReps: null,
            isPr: false,
            completedAt: "2026-07-08T17:10:00.000Z",
          },
        ],
      },
    ],
  };

  const RECENT_PRS = [
    {
      exerciseName: "Barbell Squat",
      weight: 225,
      reps: 5,
      unit: "lbs",
      date: new Date().toISOString(),
    },
    {
      exerciseName: "Bench Press",
      weight: 185,
      reps: 5,
      unit: "lbs",
      date: new Date().toISOString(),
    },
  ];

  test("Today page: Recent PRs loading into place does not shift layout", async ({
    page,
  }) => {
    await page.route("**/progress/recent-prs", (route) =>
      delayedJson(route, RECENT_PRS),
    );
    await page.route("**/sessions?page=1&limit=5", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );

    await page.goto("/");

    await expect(page.getByText("Barbell Squat")).toBeVisible();
    await page.waitForTimeout(200);

    const cls = await readCLS(page);
    expect(cls).toBeLessThan(CLS_BUDGET);
  });

  test("Today page: Recent Workouts loading into place does not shift layout", async ({
    page,
  }) => {
    await page.route("**/progress/recent-prs", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      }),
    );
    await page.route("**/sessions?page=1&limit=5", (route) =>
      delayedJson(route, [RECENT_SESSION]),
    );

    await page.goto("/");

    await expect(page.getByText("Push Day")).toBeVisible();
    await page.waitForTimeout(200);

    const cls = await readCLS(page);
    expect(cls).toBeLessThan(CLS_BUDGET);
  });

  test("Today page: empty state (no PRs, no workouts yet) does not shift layout", async ({
    page,
  }) => {
    await page.route("**/progress/recent-prs", (route) => delayedJson(route, []));
    await page.route("**/sessions?page=1&limit=5", (route) => delayedJson(route, []));

    await page.goto("/");

    await expect(page.getByText("No recent PRs yet")).toBeVisible();
    await expect(page.getByText("No workouts recorded yet.")).toBeVisible();

    await page.waitForTimeout(200);

    const cls = await readCLS(page);
    expect(cls).toBeLessThan(CLS_BUDGET);
  });

  test("History page: calendar and monthly workout list load without layout shift", async ({
    page,
  }) => {
    const now = new Date();
    const completedSession = {
      id: "session-past-2",
      userId: AUTH_USER.id,
      name: "Leg Day",
      status: "completed",
      unit: "lbs",
      notes: null,
      startedAt: new Date(now.getFullYear(), now.getMonth(), 10, 17).toISOString(),
      completedAt: new Date(now.getFullYear(), now.getMonth(), 10, 18).toISOString(),
      exercises: [
        {
          id: "se-2",
          sessionId: "session-past-2",
          exerciseDefinitionId: "ex-2",
          nameSnapshot: "Barbell Squat",
          order: 1,
          notes: null,
          createdAt: new Date(now.getFullYear(), now.getMonth(), 10, 17).toISOString(),
          sets: [
            {
              id: "s-2",
              exerciseId: "se-2",
              setNumber: 1,
              type: "working",
              status: "completed",
              weight: 225,
              weightKg: 102.06,
              reps: 5,
              rpe: null,
              previousWeight: null,
              previousReps: null,
              isPr: false,
              completedAt: new Date(now.getFullYear(), now.getMonth(), 10, 17, 10).toISOString(),
            },
          ],
        },
      ],
    };

    await page.route("**/sessions?page=1&limit=50*", (route) =>
      delayedJson(route, [completedSession]),
    );
    await page.route("**/sessions?page=1&limit=1", (route) =>
      delayedJson(route, [completedSession]),
    );

    await page.goto("/history");

    await expect(page.getByText("Leg Day")).toBeVisible();

    await page.waitForTimeout(200);

    const cls = await readCLS(page);
    expect(cls).toBeLessThan(CLS_BUDGET);
  });
});
