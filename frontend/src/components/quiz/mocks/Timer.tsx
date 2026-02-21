// /components/quiz/mocks/Timer.tsx

interface TimerProps {
  seconds: number;
  maxSeconds: number;
  onTimeout?: () => void;
}

const Timer = ({ seconds, maxSeconds, onTimeout }: TimerProps) => {
  const percentage =
    maxSeconds > 0 ? Math.round((seconds / maxSeconds) * 100) : 0;

  return (
    <div data-testid="mock-timer">
      <div>Seconds: {seconds}</div>
      <div>Max: {maxSeconds}</div>
      <div>Progress: {percentage}%</div>

      {onTimeout && (
        <button
          data-testid="mock-timeout"
          onClick={onTimeout}
        >
          Trigger Timeout
        </button>
      )}
    </div>
  );
};

export default Timer;
