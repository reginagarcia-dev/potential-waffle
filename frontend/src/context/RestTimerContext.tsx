import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface RestTimerContextType {
  timeRemaining: number;
  duration: number;
  isRunning: boolean;
  isComplete: boolean;
  nextLabel: string | null;
  startTimer: (seconds: number, label?: string | undefined) => void;
  addThirtySeconds: () => void;
  skipTimer: () => void;
}

const RestTimerContext = createContext<RestTimerContextType | undefined>(
  undefined,
);

export const RestTimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [duration, setDuration] = useState(0);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [nextLabel, setNextLabel] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const completeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRunning = endsAt !== null && timeRemaining > 0;

  useEffect(() => {
    if (!endsAt) {
      setTimeRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setEndsAt(null);
        setNextLabel(null);
        setIsComplete(true);

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = setTimeout(() => setIsComplete(false), 3000);
      }
    };

    updateRemaining();

    const intervalId = window.setInterval(updateRemaining, 250);
    document.addEventListener("visibilitychange", updateRemaining);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", updateRemaining);
    };
  }, [endsAt]);

  const startTimer = (seconds: number, label?: string | undefined) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));

    if (safeSeconds <= 0) {
      setDuration(0);
      setEndsAt(null);
      setTimeRemaining(0);
      setNextLabel(null);
      return;
    }

    if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
    setIsComplete(false);
    setDuration(safeSeconds);
    setTimeRemaining(safeSeconds);
    setEndsAt(Date.now() + safeSeconds * 1000);
    setNextLabel(label ?? null);
  };

  const addThirtySeconds = () => {
    setDuration((current) => current + 30);

    setEndsAt((currentEndsAt) => {
      if (!currentEndsAt) {
        return Date.now() + 30_000;
      }

      return currentEndsAt + 30_000;
    });
  };

  const skipTimer = () => {
    setEndsAt(null);
    setTimeRemaining(0);
    setNextLabel(null);
  };

  const value = useMemo(
    () => ({
      timeRemaining,
      duration,
      isRunning,
      isComplete,
      nextLabel,
      startTimer,
      addThirtySeconds,
      skipTimer,
    }),
    [timeRemaining, duration, isRunning, isComplete, nextLabel],
  );

  return (
    <RestTimerContext.Provider value={value}>
      {children}
    </RestTimerContext.Provider>
  );
};

export const useRestTimer = () => {
  const context = useContext(RestTimerContext);

  if (!context) {
    throw new Error("useRestTimer must be used within a RestTimerProvider");
  }

  return context;
};
