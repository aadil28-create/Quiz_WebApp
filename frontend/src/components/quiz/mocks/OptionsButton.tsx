// components/quiz/mocks/OptionsButton.tsx
import type { ReactNode } from "react";

interface OptionButtonProps {
  label: string;
  index: number;
  selected: boolean;
  disabled: boolean;
  state?: "correct" | "incorrect" | "neutral";
  onClick: () => void;
}

const OptionButton = ({
  label,
  index,
  selected,
  disabled,
  state = "neutral",
  onClick,
}: OptionButtonProps) => {
  const resolvedState = selected && state === "neutral" ? "selected" : state;

  return (
    <button
      data-testid={`mock-option-${index}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-disabled={disabled}
      className={`mock-option ${resolvedState} ${selected ? "selected" : ""} ${
        disabled ? "disabled" : ""
      }`}
    >
      <span data-testid={`mock-option-letter-${index}`}>
        {String.fromCharCode(65 + index)}
      </span>
      <span data-testid={`mock-option-label-${index}`}>
        {label}
      </span>
      <span data-testid={`mock-option-state-${index}`}>
        ({resolvedState})
      </span>
    </button>
  );
};

export default OptionButton;
