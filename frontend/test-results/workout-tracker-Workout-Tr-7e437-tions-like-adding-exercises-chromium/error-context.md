# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workout-tracker.spec.ts >> Workout Tracker E2E Flows >> should allow active workout interactions like adding exercises
- Location: e2e/workout-tracker.spec.ts:120:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Barbell Squat' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Barbell Squat' })

```

```yaml
- main:
  - button:
    - img
  - heading "Tuesday Workout" [level=1]:
    - text: Tuesday Workout
    - button:
      - img
  - text: "Timer: 00:04"
  - button:
    - img
  - paragraph: Workout is empty. Add exercises to start logging!
  - button "Add Exercise":
    - img
    - text: Add Exercise
  - button "Finish Workout":
    - img
    - text: Finish Workout
- navigation:
  - link "Today":
    - /url: /
    - img
    - text: Today
  - link "History":
    - /url: /history
    - img
    - text: History
  - link "Progress":
    - /url: /progress
    - img
    - text: Progress
  - link "Settings":
    - /url: /settings
    - img
    - text: Settings
```

# Test source

```ts
  102 | 
  103 |     // Click Start Workout to configure a session
  104 |     await startBtn.click();
  105 |     await expect(page).toHaveURL(/\/session\/new$/);
  106 | 
  107 |     // Verify default workout name input is prepopulated
  108 |     const nameInput = page.locator('#workout-name');
  109 |     await expect(nameInput).toHaveValue(/.+/); // matches weekday workout
  110 | 
  111 |     // Start workout session
  112 |     const launchBtn = page.getByRole('button', { name: 'Start Session' });
  113 |     await launchBtn.click();
  114 | 
  115 |     // Verify redirect to active session logger workspace
  116 |     await expect(page).toHaveURL(/\/session\/session-active-uuid$/);
  117 |     await expect(page.locator('h1')).toContainText('Tuesday Workout');
  118 |   });
  119 | 
  120 |   test('should allow active workout interactions like adding exercises', async ({ page }) => {
  121 |     // Navigate directly to active workout screen
  122 |     await page.goto('/session/session-active-uuid');
  123 | 
  124 |     // Verify empty state is displayed
  125 |     await expect(page.locator('text=Workout is empty')).toBeVisible();
  126 | 
  127 |     // Mock exercise card insertion mutation
  128 |     await page.route('**/sessions/session-active-uuid', async (route) => {
  129 |       if (route.request().method() === 'PATCH') {
  130 |         // Return updated session containing Squat exercise
  131 |         await route.fulfill({
  132 |           status: 200,
  133 |           contentType: 'application/json',
  134 |           body: JSON.stringify({
  135 |             id: 'session-active-uuid',
  136 |             userId: 'user-uuid-1234',
  137 |             name: 'Tuesday Workout',
  138 |             status: 'active',
  139 |             unit: 'lbs',
  140 |             notes: null,
  141 |             startedAt: new Date().toISOString(),
  142 |             completedAt: null,
  143 |             exercises: [
  144 |               {
  145 |                 id: 'session-exercise-squat',
  146 |                 sessionId: 'session-active-uuid',
  147 |                 exerciseDefinitionId: 'ex-squat-id',
  148 |                 nameSnapshot: 'Barbell Squat',
  149 |                 order: 1,
  150 |                 notes: null,
  151 |                 createdAt: new Date().toISOString(),
  152 |                 sets: [
  153 |                   {
  154 |                     id: 'set-id-1',
  155 |                     exerciseId: 'session-exercise-squat',
  156 |                     setNumber: 1,
  157 |                     type: 'working',
  158 |                     status: 'pending',
  159 |                     weight: 135,
  160 |                     weightKg: 61.23,
  161 |                     reps: 8,
  162 |                     rpe: null,
  163 |                     previousWeight: 135,
  164 |                     previousReps: 8,
  165 |                     isPr: false,
  166 |                     completedAt: null,
  167 |                   },
  168 |                 ],
  169 |               },
  170 |             ],
  171 |           }),
  172 |         });
  173 |       } else {
  174 |         // GET requests return empty session
  175 |         await route.fulfill({
  176 |           status: 200,
  177 |           contentType: 'application/json',
  178 |           body: JSON.stringify({
  179 |             id: 'session-active-uuid',
  180 |             userId: 'user-uuid-1234',
  181 |             name: 'Tuesday Workout',
  182 |             status: 'active',
  183 |             unit: 'lbs',
  184 |             notes: null,
  185 |             startedAt: new Date().toISOString(),
  186 |             completedAt: null,
  187 |             exercises: [],
  188 |           }),
  189 |         });
  190 |       }
  191 |     });
  192 | 
  193 |     // Tap Add Exercise
  194 |     const addExerciseBtn = page.getByRole('button', { name: 'Add Exercise' });
  195 |     await addExerciseBtn.click();
  196 | 
  197 |     // Select Barbell Squat from library list
  198 |     const squatBtn = page.getByRole('button', { name: 'Barbell Squat' });
  199 |     await squatBtn.click();
  200 | 
  201 |     // Verify Squat card is now visible with prefilled sets
> 202 |     await expect(page.getByRole('heading', { name: 'Barbell Squat' })).toBeVisible();
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  203 |     await expect(page.locator('button', { hasText: '135' }).first()).toBeVisible();
  204 |   });
  205 | });
  206 | 
```