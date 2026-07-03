# Changelog

All notable changes to this project will be documented in this file.

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
