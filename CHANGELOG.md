# Changelog

All notable changes to this project will be documented in this file.

## [1.0.17] - 2026-07-12

### Added

- Milestone celebrations: finishing your 1st, 10th, 25th, 50th, or 100th workout now shows a banner on the workout summary page.

### Fixed

- Finishing a workout no longer risks a duplicate or lost result under a fast double-tap or slow connection: the Finish button now disables while the request is in flight, and the server only completes a session once even if it receives the request twice.
- The workout summary page no longer re-shows a milestone banner if you navigate back to it with the browser's back button.

## [1.0.16] - 2026-07-11

### Fixed

- Finishing a workout without editing the note field no longer overwrites a previously saved session note.

### Changed

- Consolidated the seven active-session sheet dialogs (rename, note, settings, set-edit, exercise search, discard workout, delete exercise) onto a single shared `Sheet` shell component.
- Extracted a shared `ConfirmDestructiveSheet` component for the Discard Workout and Delete Exercise confirmations, removing the duplicated markup between them.
- Moved `ActiveSessionPage`'s mutation logic (rename, set updates, finish, abandon) into a dedicated `useSessionMutations` hook.
- Removed a dead unreachable "Discard Workout" menu and leftover commented-out JSX from `ActiveSessionPage`.

### Added

- Playwright tests measuring Cumulative Layout Shift on the Today and History pages to guard against future loading-state regressions.

## [1.0.15] - 2026-07-11

### Fixed

- Removed unused dead code (`xxExerciseCard`, `xxExerciseSearchSheet`, `xxSetRow`, `EditSetSheet`) left over from an earlier component draft.
- Fixed a build issue where importing a single constant from the shared package pulled the entire `zod` library into the Settings/Start Workout bundle; the shared package is now correctly tree-shaken.

### Changed

- Consolidated duplicated UI across pages into shared components: `Spinner` (6+ call sites), `MetricCard` (now supports an icon), `PRListCard` (Today/History PR lists), and `MonthCalendar` (extracted from the History page).
- Extracted the warmup/working set-numbering logic and the History calendar-grid math into standalone, reusable utilities (`lib/setLabels.ts`, `lib/calendar.ts`).
- Extracted a shared auth page shell (`AuthCardShell`, `AuthTextField`, `AuthErrorBanner`) used by Login, Register, Forgot Password, and Reset Password, removing near-duplicate markup across all four.
- Rest-duration options are now defined once in the shared package (`REST_DURATION_OPTIONS_SECONDS`) instead of being hardcoded separately in Settings and Start Workout.

## [1.0.14] - 2026-07-11

### Fixed

- Today page's Recent PRs and Recent Workouts sections now show loading skeletons instead of popping in at full height once data arrives, eliminating a layout shift (CLS) on load.
- Route-level loading states now only affect the page content area — the bottom navigation no longer disappears behind a full-screen spinner when navigating to a not-yet-loaded page.

### Changed

- Route-level code splitting: each page (and its dependencies, e.g. `recharts` for the Progress page) now loads on demand instead of being bundled into the initial page load.
- Added manual vendor chunking (`charts`, `query`, `router`, `react-vendor`, `icons`) for more effective long-term browser caching.
- Shortened "History" and "Progress" page headers for a cleaner mobile title bar.

### Added

- Client-side Web Vitals collection (CLS, FCP, INP, LCP, TTFB) for local performance inspection during development.

## [1.0.13] - 2026-07-10

### Fixed

- Resolved random logout caused by the refresh-token cookie being blocked as a cross-site cookie in production; API requests now proxy through the frontend's own origin so the cookie is first-party.
- Session refresh now retries with backoff on network/cold-start failures instead of treating them as an invalid session, so a slow-to-wake backend no longer looks like a logout.
- Fixed exercise/workout/measurement text sanitization silently deleting bracketed input (e.g. `<b>`) and leaving raw HTML entities in stored names and notes.

### Changed

- Frontend auth and session-mutation payloads are now typed directly from the shared zod schemas instead of hand-duplicated TypeScript types, keeping client and server validation in sync.

### Added

- Backend test coverage (vitest + supertest) for the sanitize utility and route-level input validation guards.

## [1.0.12] - 2026-07-08

### Changed

- Past workout details now use the same 3-dot actions menu as active workouts, with options to Rename Workout, Add Workout Note, and Discard Workout.
- Completed workouts now allow safe metadata edits (`rename_session`, `update_session_notes`) while keeping structural workout mutations blocked unless the session is active.
- Copied workouts now create pre-filled sets as pending (not completed), so users must explicitly mark sets done.

### Fixed

- Renaming a workout now rejects whitespace-only names via trimmed schema validation.
- Auth refresh now retries once on transient 401/403 responses before invalidating the session, reducing random logout events from intermittent failures.
- Added e2e regression coverage for copied-workout finish persistence flow.

## [1.0.11] - 2026-07-08

### Fixed

- Workout complete summary now excludes warm-up sets from the total set count.
- Set labels on workout summary details now keep working-set numbering sequential when warmups are present (`W`, `1`, `2`, ... instead of `W`, `2`, `3`, ...).
- Active session bottom action stack now sits above the global footer/safe-area with extra scroll clearance so the set `Done` control is no longer covered.

## [1.0.10] - 2026-07-08

### Fixed

- Discarding a workout now immediately clears the active-session state shown on Today; the stale `Resume Workout` CTA no longer appears after redirect.
- Active workout page now uses a session-specific React Query key (`["session", id]`) instead of sharing `activeSession`, preventing cache collisions between `/sessions/:id` and `/sessions/active`.
- History page sticky header no longer introduces horizontal overflow from negative margins, preventing the bottom footer/nav from visually lifting when the workout list is long.

## [1.0.9] - 2026-07-08

### Added

- Start Workout now supports creating a session from a completed workout template (`sourceSessionId`), copying exercise/set structure with optional rename before launch.
- New backend `createSessionSchema` validation for session creation payloads, including optional template source session IDs.
- New shared `useModalDialog` hook for native `<dialog>` components to centralize open/close syncing and backdrop behavior.

### Changed

- Finishing a workout no longer auto-completes pending sets with values; only sets explicitly marked done are recorded as completed.
- Adding a new set in active workouts now pre-fills weight/reps from the last same-type set (safe after removing finish-time auto-complete).
- Rest-complete modal visuals were refined (larger progress ring and updated actions/icon sizing).

### Fixed

- Modal unmount cleanup now closes the currently mounted dialog instance, preventing document-inert/frozen-screen states when sheets unmount while open.
- Active session and history delete/rename/settings/note/search/edit sheets now share consistent modal lifecycle behavior through the dialog hook.

## [1.0.8] - 2026-07-08

### Added

- Rest timer migrated from React Context to a Zustand store, fixing a stale-closure bug where "+30s" could strand a live countdown after the timer ended.
- Rest-complete state now shows a full-screen modal with an animated progress ring (drawn in the app's primary colour) instead of the old auto-dismissing banner.
- User is now signed out and redirected to `/login` immediately when the refresh token is confirmed invalid or expired, instead of silently keeping stale session state until the next failed request.

### Fixed

- Adding a new set no longer pre-fills real weight/reps from the previous set — values now stay blank (shown only as placeholder hints) so the "auto-complete on finish" logic can't record sets the user never entered.
- `add_set` and `prefill_sets` mutations now verify the exercise belongs to the caller's session, matching every other session mutation.
- `GET /sessions` no longer 500s on non-numeric `page`/`limit` query params — invalid values now fall back to sane defaults.
- Concurrent token refresh calls (mount, tab-resume, and 401 retry) now share a single in-flight request instead of racing each other.
- History page day selection no longer issues a redundant network request — it now filters the already-fetched month data client-side.

## [1.0.7] - 2026-07-03

### Changed

- PR badge standardised to `PRBadge` (gold ring) across all pages — active session set rows, past session detail, and progress drill-down now all use the same component.
- Past session summary card icons (Duration, Exercises, Sets Logged) updated to teal to match the app's primary colour.
- PRs count on past session detail page now uses default foreground colour instead of teal.
- Progress "All-Time Max Weight" stat card uses `PRBadge` instead of the plain Award icon.

## [1.0.6] - 2026-07-03

### Changed

- History "PRs only" mode now shows individual exercise PR entries (exercise name, weight × reps, date, PR badge) instead of workout session cards — matching the Today page format.
- Past session detail "Sets Logged" summary count now excludes warmup sets; warmup rows still appear in the workout details table.
- Progress page session volume trend chart and "Vol:" column removed from the history log.

### Fixed

- PR list empty-state guard now checks `prEntries` directly rather than `prSessions` for correctness.
- PR entries now use stable set IDs as React keys instead of array indices.

## [1.0.5] - 2026-07-03

### Added

- PR badge shown next to set label on past session detail page.
- Progress drill-down header now shows the exercise name and muscle group instead of the generic page title; redundant exercise card in the body removed.
- Back arrow on Progress drill-down replaces the "Change" text link.

### Fixed

- Mobile re-auth on app resume no longer clears the user session on transient network errors — only clears on explicit auth failure.
- Rest timer "complete" banner timeout now properly cancelled if a new timer starts before the 3-second auto-dismiss fires, preventing a stale state update on unmount.
- Optimistic set toggle no longer redundantly calls `setQueryData` before immediately invalidating — reduces an unnecessary render cycle.

## [1.0.4] - 2026-07-03

### Added

- Refresh button in the active session header to manually re-sync workout data from the server.
- Visual "Rest complete!" banner appears for 3 seconds when the rest timer reaches zero, with haptic feedback on supported devices.
- New set automatically pre-fills weight and reps from the previous set of the same type, reducing manual entry.
- Next exercise or set name shown in the rest timer bar label (e.g. "Squat — Set 3" or the name of the next exercise).

### Changed

- Removed progressive overload suggestion banner from active workout (will be revisited later).
- Removed estimated 1RM from workout summary PR list — PRs now show actual logged weight and reps only.
- Removed total volume metric from all pages (workout summary, past session, history cards, today page, and finish workout sheet).
- PR card layout on workout summary page tidied: badge is right-aligned, no extraneous calculated fields.

### Fixed

- Set "Done" button now applies optimistically — UI updates instantly without waiting for the server, with automatic rollback on error.
- Warmup pill border and background colors now render correctly (Tailwind purge-safe class strings).
- "Del" column header removed from active session exercise card set table.
- Focus ring on warmup set inputs and checkmark button now uses the warmup color instead of the default blue.
- PR badge moved to the set number column to prevent misalignment in the Done column.
- PR badge now shown on past session detail page next to the set label.

## [1.0.3] - 2026-07-02

### Fixed

- Workout summary no longer shows "null × null" for sets completed without weight or reps entered — displays "—" instead.
- Today page now shows all recent completed workouts, including when there is only one.

## [1.0.2] - 2026-07-02

### Added

- Progressive overload suggestions on active workout exercise cards — shows the suggested weight (+5 lbs / +2.5 kg) and rep target based on the heaviest set from the previous session, with a one-tap Apply button and a dismiss option. Banner auto-hides once sets have values entered.

### Fixed

- Auth token refresh mid-session now correctly sends the refresh token cookie, preventing silent logout after 15 minutes of continuous use.

## [1.0.1] - 2026-07-02

### Added

- History page calendar view with month navigation and workout day indicators.
- Date-range filtering support on the backend sessions list endpoint via `startDate` and `endDate` query params.

### Changed

- History page filtering logic now applies `limit` within the selected month/day range.
- PR-only history mode now shows a flat list and hides the calendar.
- Removed the non-functional notification bell from the Today page header.
- Removed the Last Workout block from the Today page.

### Fixed

- Reduced month-switch flicker on History page by preserving query data between transitions.
