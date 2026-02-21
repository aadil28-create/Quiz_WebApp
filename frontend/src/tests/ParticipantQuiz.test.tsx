import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import ParticipantQuiz from "../pages/ParticipantQuiz";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

vi.mock("@/hooks/useQuizState", () => ({
  useQuizState: () => ({
    state: {
      participants: [],
      currentQuestionIndex: 0,
      questions: [
        { id: "1", text: "Q1?", options: ["A", "B"], correctIndex: 0, timeLimit: 30 },
      ],
      status: "LIVE",
      timeRemaining: 30,
      linkExpiry: null,
    },
    startQuiz: vi.fn(),
    nextQuestion: vi.fn(),
    updateParticipantScore: vi.fn(),
  }),
}));

vi.mock("@/components/quiz/Timer", () => ({
  default: ({ onTimeout }: { onTimeout?: () => void }) => (
    <div data-testid="timer">
      Time Left
      <button data-testid="simulate-timeout" onClick={() => onTimeout?.()} />
    </div>
  ),
}));

vi.mock("@/components/quiz/OptionButton", () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button data-testid={`option-${label}`} onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock("@/components/quiz/LoginPanel", () => ({
  default: ({ onLogin }: { role: string; onLogin: (name: string) => void }) => (
    <div data-testid="login-panel">
      <input
        data-testid="name-input"
        onChange={(e) => onLogin((e.target as HTMLInputElement).value)}
      />
    </div>
  ),
}));

async function joinQuiz() {
  fireEvent.change(screen.getByTestId("name-input"), {
    target: { value: "Test Player" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Khuddam" }));
  fireEvent.click(screen.getByRole("button", { name: "Join Quiz" }));

  await act(async () => {
    vi.advanceTimersByTime(1);
  });

  return screen.findByTestId("timer");
}

describe("ParticipantQuiz - Lifecycle", () => {
  it("renders login panel initially", () => {
    render(<ParticipantQuiz />);
    expect(screen.getByTestId("login-panel")).toBeInTheDocument();
  });

  it("joins quiz and shows timer", async () => {
    render(<ParticipantQuiz />);
    const timer = await joinQuiz();
    expect(timer).toBeInTheDocument();
  });

  it("handles answer submission", async () => {
    render(<ParticipantQuiz />);
    await joinQuiz();

    fireEvent.click(screen.getByTestId("option-A"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Answer" }));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("timer")).toBeInTheDocument();
  });

  it("handles timeout progression", async () => {
    render(<ParticipantQuiz />);
    await joinQuiz();

    fireEvent.click(screen.getByTestId("simulate-timeout"));

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId("timer")).toBeInTheDocument();
  });
});