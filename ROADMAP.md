# Product Roadmap

Engagement/retention/frictionless-UX roadmap, ordered **highest ROI → lowest LOE first** within each tier. Check items off as they ship; add a line to `CHANGELOG.md` as normal when a release goes out.

**How to use this doc:** work top to bottom inside Tier 1 before moving to Tier 2 — the ordering already accounts for both impact and cost. If scope changes while building something, edit its checklist in place rather than opening a separate doc.

Legend: `[ ]` not started · `[~]` in progress · `[x]` shipped

---

## Tier 1 — Quick wins (days each)

### 1. [x] Body measurements UI
**Why first:** backend is 100% done and unused — `backend/src/routes/measurements.ts` has full GET/POST/DELETE, and the `measurements` table (`backend/src/db/schema.ts:102`) already stores `date`, `type`, `value`, `unit` (lbs/kg/cm/in). This is a full feature for frontend-only effort.
- [x] `frontend/src/pages/Measurements/MeasurementsPage.tsx` — list entries grouped by `type`, newest first, with a chart per type (`frontend/src/components/Measurements/MeasurementChart.tsx`, mirrors `ExerciseProgressChart`)
- [x] `frontend/src/components/Measurements/AddMeasurementSheet.tsx` — type (quick-select chips + freeform), value, unit (lbs/kg/cm/in), date
- [x] Delete entry via `EllipsisMenu` + `ConfirmDestructiveSheet`
- [x] TanStack Query hooks: `frontend/src/hooks/useMeasurements.ts` (`useMeasurements`, `useCreateMeasurement`, `useDeleteMeasurement`)
- [x] Route `measurements` in `frontend/src/App.tsx`, nav entry in `BottomNav.tsx` (labeled "Body", grid expanded to 5 columns)
- **Bug found and fixed during verification:** `GET /measurements` only sorted by `date` (date-only granularity, no time-of-day picker in the UI), so two entries logged the same day had no deterministic order — "Latest" could show either one. Fixed with a `createdAt` secondary sort in `measurements.ts`. Verified via a scripted Playwright run (register → add two same-day entries → confirm the most-recently-created one shows as Latest).
**Effort:** ~1 day incl. the tie-break fix. No backend endpoint changes needed, one backend query-ordering fix.

---

### 2. [ ] Current streak counter
**Why:** you already compute `crossedMilestones()` off `completedLocalDate` for one-time banners (`shared/src/constants.ts:29`, `frontend/src/components/workout/MilestoneBanner.tsx`), but there's no persistent "current streak" a user sees every time they open the app — the single most-proven retention mechanic in fitness apps.
- [ ] Backend: add a lightweight endpoint (or extend `progress.ts`) returning `{ currentStreakDays, longestStreakDays }`, computed from distinct `completedLocalDate` values per user in `workoutSessions` (consecutive-day gap check, allow the streak to still show if today hasn't been logged yet but yesterday was)
- [ ] Frontend: streak badge/pill on `frontend/src/pages/Today/TodayPage.tsx`, near the existing Start/Resume CTA (🔥 N-day streak)
- [ ] Add a small "streak" stat card on `WorkoutSummaryPage.tsx` next to the PR badges, so finishing a workout reinforces the streak visually
- [ ] Decide and document the grace rule (e.g., streak breaks only after a full missed calendar day, using the user's local date already tracked via `completedLocalDate`)
**Effort:** ~1–2 days. Small backend query + straightforward frontend display.

---

### 3. [ ] Rest-timer completion alert upgrade
**Why:** partially built — `frontend/src/stores/restTimerStore.ts` already calls `navigator.vibrate([200, 100, 200])` on completion. Missing: audible alert and a signal that reaches the user if the tab/app isn't focused, which is the actual friction moment (user walks away from phone, misses rest window).
- [ ] Add a short chime (Web Audio API, respect a mute toggle) fired from the same `tick()` completion branch in `restTimerStore.ts`
- [ ] Flash `document.title` (e.g., "⏱ Rest done!") when `document.visibilityState !== 'visible'` at completion, reset on focus
- [ ] Request Notification permission opportunistically (first time a user starts a rest timer) and fire a `Notification` on completion if permission granted and tab hidden — no backend/push infra needed, this is local-only
- [ ] Add a mute/sound toggle to `frontend/src/pages/Settings/SettingsPage.tsx` next to the existing rest-duration setting
**Effort:** ~1 day. Frontend-only, builds on existing store.

---

### 4. [ ] Dark/light theme toggle
**Why:** dark theme CSS custom properties already exist in the Tailwind v4 token setup; there's simply no UI switch, so it's pure UI wiring.
- [ ] Add a theme toggle (system / light / dark) to `frontend/src/pages/Settings/SettingsPage.tsx`, styled like the existing unit toggle (`grid grid-cols-2` pattern already in that file)
- [ ] Persist choice to `localStorage` and apply via a `data-theme` attribute on `<html>` (check root CSS token file for how dark values are currently scoped, e.g. media query vs. class — align the toggle mechanism to whatever's already there)
- [ ] Default to `system` (respect `prefers-color-scheme`) so nothing changes for users who don't touch the setting
**Effort:** ~0.5–1 day.

---

### 5. [ ] Shareable PR / workout-summary card
**Why:** cheapest organic-growth loop available. All the data already exists on `WorkoutSummaryPage.tsx` (`isPr` flags, `MilestoneBanner`, `PRBadge`, `WorkoutSummaryCard.tsx`) — this just needs to be rendered as an image and pushed through the Web Share API.
- [ ] Build a shareable card layout (can literally reuse/restyle `frontend/src/components/workout/WorkoutSummaryCard.tsx`) sized for social (e.g., 1080×1080 or 1080×1920)
- [ ] Render to image client-side (e.g., `html-to-image` or canvas) — no backend involved
- [ ] "Share" button on `WorkoutSummaryPage.tsx` using `navigator.share()` with an image attachment, falling back to "Save image" / clipboard copy on unsupported browsers
- [ ] Trigger prominently when the session includes a PR or crosses a milestone (highest-value share moment), not on every plain session
**Effort:** ~1–2 days.

---

### 6. [ ] Fix History PR-pagination TODO
**Why:** known correctness bug (`frontend/src/pages/History/HistoryPage.tsx:67`) — PR-only history view silently misses PRs beyond the first 50 sessions. Hits your most active (highest-value) users first as they accumulate history. Cheap to fix now before it's cheap to ignore.
- [ ] Backend: add a dedicated endpoint, e.g. `GET /progress/prs?page=&limit=`, or extend `progress.ts` `recent-prs` to support pagination properly instead of relying on `sessions?limit=50`
- [ ] Frontend: replace the hardcoded `limit=50` fetch in `HistoryPage.tsx:58/67` with paginated loading (infinite scroll or "load more") when the PR filter is active
**Effort:** ~0.5–1 day.

---

## Tier 2 — Medium bets (roughly 1–2 weeks each)

### 7. [ ] Offline resilience for the active-session flow
**Why:** gyms have unreliable wifi; losing an in-progress set is the single worst friction moment in the app, and there's currently no service worker or offline queue despite the PWA manifest (`frontend/public/manifest.json`) implying installability.
- [ ] Register a service worker (e.g. via `vite-plugin-pwa`) scoped initially to static asset caching only — don't attempt full offline app-shell on day one
- [ ] For the active-session screens (`ActiveSessionPage.tsx`), add an optimistic local queue: writes (set completed, weight/reps changed) apply to local state immediately and queue mutations if the API call fails due to network error
- [ ] Retry queued mutations on `online` event / reconnect, in original order, with conflict-safe idempotent requests (check whether `sessions.ts` PATCH endpoints already tolerate resubmission)
- [ ] Surface a small "offline — will sync" indicator during the queue state so it's not silent
**Effort:** ~1.5–2 weeks. Highest-risk item in this tier — scope tightly to the active-session screens only, not the whole app.

---

### 8. [ ] Streak-at-risk push notification
**Why:** pairs directly with #2. A reminder sent generically every day trains users to ignore it; one sent only when a streak is about to lapse is the mechanism that actually recovers users who would otherwise churn.
- [ ] Backend: web push subscription storage (new table: `userId`, endpoint, keys) + `web-push` library integration
- [ ] Frontend: request notification permission + register subscription at an appropriate low-friction moment (e.g., after the 2nd or 3rd completed workout, not on first launch)
- [ ] Backend: scheduled job (e.g., daily cron via existing infra or a simple `node-cron`) that checks users whose `currentStreakDays` (from #2) would lapse if they don't log a workout today, and sends one push in the evening
- [ ] Respect a notification opt-out in `SettingsPage.tsx`
**Effort:** ~2 weeks — new infra (push subscriptions + scheduler), do this after #2 exists to reuse its streak calculation.

---

### 9. [ ] First-run onboarding
**Why:** new users land directly on an empty `TodayPage.tsx` with no context on PRs, milestones, or how to start — no onboarding flow exists today.
- [ ] 3-screen intro flow after registration (or first login): what a PR is, how milestones work, set default unit/rest duration inline (reuses existing `updateUserPreferences` call from `SettingsPage.tsx`)
- [ ] Route gate: show once per account (flag on `users` table or `localStorage`, backend flag preferred so it doesn't repeat across devices)
- [ ] End on the existing "Start Workout" CTA to get them into the core loop immediately
**Effort:** ~1 week.

---

### 10. [ ] Weekly recap email
**Why:** reuses existing Resend integration (`backend/src/services/email.ts`) already used for password reset — no new email infra, just a new template + a scheduled send. Engagement loop that doesn't require push permission friction.
- [ ] Backend: weekly scheduled job aggregating each user's past 7 days: workouts logged, PRs hit, streak status, biggest lift improvement
- [ ] New `sendWeeklyRecapEmail()` in `email.ts` following the existing HTML template style (see `sendPasswordResetEmail`)
- [ ] Settings toggle to opt out (`SettingsPage.tsx`)
- [ ] Skip sending to users with zero activity that week (avoid guilt-driven unsubscribes — or send a distinct "we miss you" variant instead, TBD)
**Effort:** ~1 week.

---

### 11. [ ] Account settings completeness (delete account + data export)
**Why:** backend `DELETE /auth/me` (`backend/src/routes/auth.ts:208`) already exists and is unused by any frontend page. Mostly a trust/compliance win rather than a growth lever, so it's ranked behind the engagement items above.
- [ ] "Delete account" flow in `SettingsPage.tsx` with a confirmation step (reuse the destructive-action confirmation pattern already used for discarding workouts)
- [ ] Basic data export (JSON or CSV of sessions/sets/measurements) — new backend endpoint, straightforward query + serialize
**Effort:** ~3–5 days.

---

## Tier 3 — Big bets (multi-week projects, sequence after Tier 1–2 land)

### 12. [ ] Smart progression suggestions
Extend the existing "previous weight/reps" prefill (already shown when starting a set) into an actual recommendation engine (e.g., "last time you hit RPE 9 at 135×8 — try 140×6"). Needs a defined progression algorithm and enough historical RPE data to be useful — validate data density before committing. Attempted and reverted once already: the algorithm and banner shipped fine, but there is currently no RPE input anywhere in the set-editing UI (`SetEditSheet.tsx` has the state/plumbing but never renders the field), so `lastRpe` can never be anything but null and every suggestion degenerates to "repeat exactly." Add the RPE input first and confirm it's actually being logged before rebuilding the suggestion layer on top of it.

### 13. [ ] Structured multi-week programs
New `Program`/`ProgramWeek` entities beyond the current ad-hoc session + copy-as-template model. Real schema work in `backend/src/db/schema.ts` and session-creation flow changes.

### 14. [ ] Exercise instructions/media
Images/video/cues per exercise definition. Primarily a content-sourcing problem (52 seeded exercises today, `backend/src/db/seed.ts`) rather than an engineering one — scope content acquisition before scheduling engineering time.

### 15. [ ] Supersets/circuits in the session model
Requires reworking `sessionExercises`/`sets` ordering semantics (`schema.ts:59,73`) to support grouped exercises — moderate schema + `ActiveSessionPage.tsx` UI rework.

### 16. [ ] Native health integrations (Apple Health / Google Fit)
`frontend/android` and `frontend/ios` exist as committed Capacitor build artifacts but the project has no active `@capacitor/core` dependency wiring them into the current build — this would need re-establishing the native bridge before any health-data plugin work starts.

### 17. [ ] Social (friends/leaderboards)
Deferred indefinitely in favor of #5 (share card), which gets most of the social/viral value without a friend graph or privacy model to build and maintain.

---

## Explicitly out of scope for now
- Full offline-first app (beyond the active-session queue in #7) — too much surface area for the value until #7 proves the pattern works
- Wearable/voice input — no signal yet that this is a blocker for adoption
