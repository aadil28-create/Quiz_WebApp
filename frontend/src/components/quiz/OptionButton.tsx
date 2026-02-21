import type { FC } from "react";

interface OptionButtonProps {
  label: string;
  index: number;
  selected: boolean;
  disabled: boolean;
  state?: "correct" | "incorrect" | "neutral";
  onClick: () => void;
}

const optionColors: Record<NonNullable<OptionButtonProps["state"]> | "selected", string> = {
  neutral: "border-border hover:border-secondary hover:shadow-glow-secondary",
  selected: "border-secondary bg-secondary/10 shadow-glow-secondary",
  correct: "border-success bg-success/10",
  incorrect: "border-destructive bg-destructive/10",
};

const OptionButton: FC<OptionButtonProps> = ({
  label,
  index,
  selected,
  disabled,
  state = "neutral",
  onClick,
}) => {
  // Resolve final state for styling
  const resolvedState = selected && state === "neutral" ? "selected" : state;

  const letter = index < 26 ? String.fromCharCode(65 + index) : `#${index + 1}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="button"
      aria-pressed={selected}
      aria-disabled={disabled}
      aria-label={`Option ${letter}: ${label}`}
      className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left group ${
        optionColors[resolvedState]
      } ${disabled ? "cursor-not-allowed opacity-70 pointer-events-none" : "cursor-pointer active:scale-[0.98]"}`}
    >
      <span
        className={`flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center font-display font-bold text-sm ${
          resolvedState === "correct"
            ? "bg-success text-success-foreground"
            : resolvedState === "incorrect"
            ? "bg-destructive text-destructive-foreground"
            : resolvedState === "selected"
            ? "bg-secondary text-secondary-foreground"
            : "bg-muted text-muted-foreground group-hover:bg-secondary group-hover:text-secondary-foreground"
        } transition-colors duration-200`}
        title={`Option ${letter}`}
      >
        {letter}
      </span>
      <span className="text-base font-medium text-foreground">{label}</span>
    </button>
  );
};

export default OptionButton;
