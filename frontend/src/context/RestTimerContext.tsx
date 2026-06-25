import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface RestTimerContextType {
  timeRemaining: number;
  duration: number;
  isActive: boolean;
  nextInfo: string | null;
  startTimer: (seconds: number, info?: string) => void;
  add30Seconds: () => void;
  skip: () => void;
}

const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

export const RestTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [nextInfo, setNextInfo] = useState<string | null>(null);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            triggerCompletionFeedback();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  const triggerCompletionFeedback = () => {
    // Vibrate device if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const startTimer = (seconds: number, info?: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setDuration(seconds);
    setTimeRemaining(seconds);
    setIsActive(true);
    setNextInfo(info || null);
  };

  const add30Seconds = () => {
    if (isActive) {
      setTimeRemaining((prev) => prev + 30);
      setDuration((prev) => prev + 30);
    }
  };

  const skip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeRemaining(0);
    setIsActive(false);
    setNextInfo(null);
  };

  return (
    <RestTimerContext.Provider value={{ timeRemaining, duration, isActive, nextInfo, startTimer, add30Seconds, skip }}>
      {children}
    </RestTimerContext.Provider>
  );
};

export const useRestTimer = () => {
  const context = useContext(RestTimerContext);
  if (context === undefined) {
    throw new Error('useRestTimer must be used within a RestTimerProvider');
  }
  return context;
};
