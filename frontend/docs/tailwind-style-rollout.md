# Tailwind Style Rollout Checklist

This checklist maps the new design tokens and reusable class patterns to each app screen/component.

## Token Sources

- Theme tokens: `src/styles/theme.css`
- Reusable class recipes: `src/styles/components.css`

## Global Foundation

- [ ] Use `app-screen` on each page root container.
- [ ] Use `top-nav` and `top-title` for all top bars.
- [ ] Replace ad-hoc card containers with `ui-card` or `ui-card-tight`.
- [ ] Replace custom button variants with `btn-primary`, `btn-primary-wide`, `btn-ghost`, or `btn-outline-brand`.
- [ ] Normalize search and form controls using `field` and `stepper-box`.

## Screen-by-Screen Mapping

### 1) Today

- File: `src/pages/Today/TodayPage.tsx`
- Apply:
  - [x] Root wrapper -> `app-screen`
  - [x] Header row -> `top-nav` + `top-title`
  - [x] Hero workout state cards -> `ui-card`
  - [x] Start/Resume action -> `btn-primary-wide`
  - [x] Recent lists -> `list-row`, `list-row-title`, `list-row-sub`
  - [x] PR indicator -> `pr-badge`

### 2) Start Workout

- File: `src/pages/Session/StartWorkoutPage.tsx`
- Apply:
  - [ ] Root wrapper -> `app-screen`
  - [ ] Search input -> `field`
  - [ ] Exercise rows -> `list-row`
  - [ ] Create custom action -> `btn-outline-brand`

### 3) Active Session

- File: `src/pages/Session/ActiveSessionPage.tsx`
- File: `src/components/ActiveSession/ExerciseCard.tsx`
- File: `src/components/ActiveSession/SetRow.tsx`
- Apply:
  - [x] Root wrapper -> `app-screen`
  - [x] Exercise blocks -> `ui-card`
  - [ ] Set table rows -> `set-row`
  - [ ] Set value states -> `set-cell-muted`, `set-cell-value`, `set-cell-active`
  - [x] Finish workout action -> `btn-primary-wide`

### 4) Edit Set Bottom Sheet

- File: `src/components/ActiveSession/SetEditSheet.tsx`
- Apply:
  - [ ] Sheet container -> `sheet`
  - [ ] Optional top handle -> `sheet-handle`
  - [ ] Numeric controls -> `stepper-box` + `stepper-btn`
  - [ ] Confirm action -> `btn-primary-wide`

### 5) Add Exercise Bottom Sheet

- File: `src/components/ActiveSession/ExerciseSearchSheet.tsx`
- Apply:
  - [ ] Sheet container -> `sheet`
  - [ ] Search field -> `field`
  - [ ] Filter chips -> `filter-chip`, `filter-chip-active`
  - [ ] Result rows -> `list-row`

### 6) Rest Timer

- File: `src/components/ActiveSession/RestTimerBar.tsx`
- Apply:
  - [ ] Timer ring wrapper -> `timer-ring-wrap`
  - [ ] Center timer surface -> `timer-core`
  - [ ] Countdown value -> `timer-value`
  - [ ] Skip and +30 actions -> `btn-ghost`, `btn-outline-brand`

### 7) Finish Workout Confirmation

- File: `src/components/ActiveSession/FinishWorkoutSheet.tsx`
- Apply:
  - [ ] Sheet container -> `sheet`
  - [ ] Summary rows -> `list-row` (or `ui-card-tight` for compact rows)
  - [ ] Primary/secondary actions -> `btn-primary-wide`, `btn-ghost`

### 8) Workout Summary

- File: `src/pages/Session/WorkoutSummaryPage.tsx`
- Apply:
  - [x] Root wrapper -> `app-screen`
  - [x] Stats cards -> `ui-card` / `ui-card-tight`
  - [x] PR chips -> `pr-badge`
  - [x] Completed action -> `btn-primary-wide`

### 9) History and Past Session

- File: `src/pages/History/HistoryPage.tsx`
- File: `src/pages/History/PastSessionPage.tsx`
- Apply:
  - [ ] Root wrapper -> `app-screen`
  - [ ] Session list items -> `list-row`
  - [ ] Session detail cards -> `ui-card`

### 10) Progress and Settings

- File: `src/pages/Progress/ProgressPage.tsx`
- File: `src/pages/Settings/SettingsPage.tsx`
- Apply:
  - [ ] Root wrapper -> `app-screen`
  - [ ] Metric and options cards -> `ui-card`
  - [ ] Controls and actions -> `btn-*` and `field`

## Fast Validation

- [ ] Verify body background/typography updated from `theme.css`.
- [ ] Verify button contrast on mobile in light glare.
- [ ] Verify bottom-sheet safe area spacing on iOS.
- [ ] Verify timer digits use tabular numbers.
- [ ] Verify no legacy one-off color values remain in migrated screens.
