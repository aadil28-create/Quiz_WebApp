import { useEffect, useState, useMemo } from "react";

interface TimerProps {
  seconds: number;
  maxSeconds: number;
  onTimeout?: () => void;
}

const Timer = ({ seconds, maxSeconds, onTimeout }: TimerProps) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Sanitize values
  const safeMax = Math.max(maxSeconds, 1);
  const safeSeconds = Math.max(seconds, 0);
  const percentage = useMemo(() => Math.min((safeSeconds / safeMax) * 100, 100), [safeSeconds, safeMax]);
  const isUrgent = safeSeconds <= 5;

  useEffect(() => {
    if (safeSeconds <= 0 && !hasTimedOut) {
      setHasTimedOut(true);
      onTimeout?.();
    } else if (safeSeconds > 0 && hasTimedOut) {
      setHasTimedOut(false);
    }
  }, [safeSeconds, hasTimedOut, onTimeout]);

  return (
    <div className="w-full" role="timer" aria-live="polite" aria-label={`Time remaining: ${safeSeconds} seconds`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Time remaining</span>
        <span
          className={`text-2xl font-display font-bold tabular-nums ${isUrgent ? "text-accent animate-timer-tick" : "text-secondary"}`}
        >
          {safeSeconds}s
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeSeconds}
        aria-label={`Time remaining: ${safeSeconds} seconds`}
      >
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${isUrgent ? "bg-accent" : "bg-secondary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Timer;
