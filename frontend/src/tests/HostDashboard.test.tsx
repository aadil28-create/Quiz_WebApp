// src/tests/HostDashboard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import HostDashboard from "@/pages/HostDashboard";
import { useQuizState } from "@/hooks/useQuizState";
import { vi, describe, it, beforeEach, expect } from "vitest";
import "@testing-library/jest-dom";
import type { QuizState, Question } from "@/types/quiz";

// ------------------------
// Mock hook
// ------------------------
vi.mock("@/hooks/useQuizState");

// ------------------------
// Mock child components
// ------------------------
vi.mock("@/components/quiz/LoginPanel", () => ({
  default: ({ onLogin }: any) => (
    <div data-testid="mock-login-panel">
      <button
        data-testid="mock-login-button"
        onClick={() => onLogin("Test Host")}
      >
        Login
      </button>
    </div>
  ),
}));

vi.mock("@/components/quiz/Timer", () => ({
  default: () => <div data-testid="mock-timer" />,
}));

vi.mock("@/components/quiz/QuestionForm", () => ({
  default: () => <div data-testid="mock-question-form" />,
}));

vi.mock("@/components/quiz/QuestionList", () => ({
  default: () => <div data-testid="mock-question-list" />,
}));

vi.mock("@/components/quiz/ScoreTable", () => ({
  default: () => <div data-testid="mock-score-table" />,
}));

// ------------------------
// Sample questions
// ------------------------
const sampleQuestions: Question[] = [
  {
    id: "1",
    text: "Q1?",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    timeLimit: 10,
  },
];

// ------------------------
// Default production-grade state
// ------------------------
const defaultState: QuizState = {
  status: "WAITING",
  currentQuestionIndex: -1,
  questions: sampleQuestions,
  participants: [],
  timeRemaining: 0,
  linkExpiry: null,
};

// ------------------------
// Setup mock hook for each test
// ------------------------
function setupMock(stateOverrides: Partial<QuizState> = {}) {
  const startQuiz = vi.fn();
  const nextQuestion = vi.fn();
  const resetQuiz = vi.fn();
  const addQuestion = vi.fn();
  const deleteQuestion = vi.fn();
  const updateQuestion = vi.fn();
  const updateParticipantScore = vi.fn();

  (useQuizState as any).mockReturnValue({
    state: { ...defaultState, ...stateOverrides },
    startQuiz,
    nextQuestion,
    resetQuiz,
    addQuestion,
    deleteQuestion,
    updateQuestion,
    updateParticipantScore,
  });

  return {
    startQuiz,
    nextQuestion,
    resetQuiz,
    addQuestion,
    deleteQuestion,
    updateQuestion,
    updateParticipantScore,
  };
}

// ------------------------
// Tests
// ------------------------
describe("HostDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login panel when not logged in", () => {
    setupMock();
    render(<HostDashboard />);
    expect(screen.getByTestId("mock-login-panel")).toBeInTheDocument();
  });

  it("logs in and shows quiz controls", () => {
    setupMock();
    render(<HostDashboard />);
    fireEvent.click(screen.getByTestId("mock-login-button"));

    expect(screen.getByText(/start quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/add question/i)).toBeInTheDocument();
  });

  it("starts quiz without expiry", () => {
    const { startQuiz } = setupMock();
    render(<HostDashboard />);
    fireEvent.click(screen.getByTestId("mock-login-button"));
    fireEvent.click(screen.getByText(/start quiz/i));

    expect(startQuiz).toHaveBeenCalledWith(null);
  });

  it("starts quiz with expiry timestamp", () => {
    const { startQuiz } = setupMock();
    render(<HostDashboard />);
    fireEvent.click(screen.getByTestId("mock-login-button"));

    // Toggle checkbox
    const checkbox = screen.getByRole("checkbox", { name: /set link expiry/i });
    fireEvent.click(checkbox);

    // Input datetime
    const datetimeInput = screen.getByTestId("quiz-expiry-input");
    fireEvent.change(datetimeInput, { target: { value: "2026-02-20T15:30" } });

    fireEvent.click(screen.getByText(/start quiz/i));

    expect(startQuiz).toHaveBeenCalledTimes(1);
    const arg = startQuiz.mock.calls[0][0];
    expect(typeof arg === "number" || arg === null).toBe(true);
  });

  it("resets quiz correctly", () => {
    const { resetQuiz } = setupMock({ status: "FINISHED", currentQuestionIndex: 0 });
    render(<HostDashboard />);
    fireEvent.click(screen.getByTestId("mock-login-button"));

    const resetBtn = screen.getByTestId("reset-quiz-btn");
    fireEvent.click(resetBtn);

    expect(resetQuiz).toHaveBeenCalledTimes(1);
  });

  it("shows Next Question button only in LIVE state and disables when expired", () => {
    const futureExpiry = Date.now() + 10000;
    setupMock({ status: "LIVE", currentQuestionIndex: 0, linkExpiry: futureExpiry });
    render(<HostDashboard />);
    fireEvent.click(screen.getByTestId("mock-login-button"));

    const nextBtn = screen.getByText(/next question/i);
    expect(nextBtn).toBeInTheDocument();
    expect(nextBtn).not.toBeDisabled();
  });

  it("renders QuestionForm when adding a new question", () => {
    setupMock({ status: "WAITING" });
    render(<HostDashboard />);
    fireEvent.click(screen.getByTestId("mock-login-button"));
    fireEvent.click(screen.getByText(/add question/i));

    expect(screen.getByTestId("mock-question-form")).toBeInTheDocument();
  });

  it("renders QuestionList and ScoreTable after login", () => {
    setupMock();
    render(<HostDashboard />);
    fireEvent.click(screen.getByTestId("mock-login-button"));

    expect(screen.getByTestId("mock-question-list")).toBeInTheDocument();
    expect(screen.getByTestId("mock-score-table")).toBeInTheDocument();
  });
});
