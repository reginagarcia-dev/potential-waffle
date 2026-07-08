import { create } from "zustand";

// Side-effect handles live outside the store — they don't need to trigger re-renders
let intervalId: ReturnType<typeof setInterval> | null = null;

function clearHandles() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

interface RestTimerState {
  duration: number;
  endsAt: number | null;
  timeRemaining: number;
  nextLabel: string | null;
  isComplete: boolean;

  startTimer: (seconds: number, label?: string) => void;
  addThirtySeconds: () => void;
  skipTimer: () => void;
  dismissComplete: () => void;
}

export const useRestTimerStore = create<RestTimerState>((set, get) => {
  function tick() {
    const { endsAt } = get();
    if (!endsAt) return;

    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    set({ timeRemaining: remaining });

    if (remaining <= 0) {
      clearHandles();
      set({ endsAt: null, nextLabel: null, isComplete: true });

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }

  // Re-tick whenever the tab becomes visible again (mobile resume)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });

  return {
    duration: 0,
    endsAt: null,
    timeRemaining: 0,
    nextLabel: null,
    isComplete: false,

    startTimer(seconds, label) {
      const safeSeconds = Math.max(0, Math.floor(seconds));
      clearHandles();

      if (safeSeconds <= 0) {
        set({
          duration: 0,
          endsAt: null,
          timeRemaining: 0,
          nextLabel: null,
          isComplete: false,
        });
        return;
      }

      set({
        isComplete: false,
        duration: safeSeconds,
        timeRemaining: safeSeconds,
        endsAt: Date.now() + safeSeconds * 1000,
        nextLabel: label ?? null,
      });

      tick();
      intervalId = setInterval(tick, 250);
    },

    addThirtySeconds() {
      const { endsAt, duration } = get();
      // Only meaningful while running — the tick interval is gone once the
      // timer ends, so setting endsAt here would strand a live deadline.
      if (endsAt === null) return;
      set({
        duration: duration + 30,
        endsAt: endsAt + 30_000,
      });
    },

    skipTimer() {
      clearHandles();
      set({
        endsAt: null,
        timeRemaining: 0,
        nextLabel: null,
        isComplete: false,
      });
    },

    dismissComplete() {
      set({ isComplete: false });
    },
  };
});

// `isRunning` is derived — compute it in a selector rather than storing redundant state.
// Components that only need `isRunning` won't re-render when `timeRemaining` ticks.
export const selectIsRunning = (s: RestTimerState) =>
  s.endsAt !== null && s.timeRemaining > 0;
