# Changelog

All notable changes to this project will be documented in this file.

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
