import { useState, useEffect } from "react";

interface SessionTimerProps {
  startedAt: string;
}

export function SessionTimer({ startedAt }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const mStr = m.toString().padStart(2, "0");
  const sStr = s.toString().padStart(2, "0");
  const formatted = h > 0 ? `${h}:${mStr}:${sStr}` : `${mStr}:${sStr}`;

  return (
    <span className="text-sm font-semibold tabular-nums text-foreground">
      {formatted}
    </span>
  );
}
