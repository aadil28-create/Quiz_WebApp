// hooks/mocks/useQuizState.test.ts
import { renderHook, act } from "@testing-library/react";
import { useQuizState } from "@/hooks/_mocks_/useQuizState";
import type { Question, Participant } from "@/types/quiz";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sampleQuestion: Question = {
  id: "q-test",
  text: "Sample?",
  options: ["A", "B"],
  correctIndex: 0,
  timeLimit: 5,
};

describe("useQuizState (production-grade)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ----------------------------
  // Initialization
  // ----------------------------
  it("initializes with WAITING status and correct defaults", () => {
    const { result } = renderHook(() => useQuizState());
    expect(result.current.state.status).toBe("WAITING");
    expect(result.current.state.currentQuestionIndex).toBe(-1);
    expect(result.current.state.timeRemaining).toBe(0);
    expect(result.current.state.linkExpiry).toBeNull();
  });

  // ----------------------------
  // Quiz start
  // ----------------------------
  it("starts quiz correctly with LIVE status", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => result.current.startQuiz(null));

    expect(result.current.state.status).toBe("LIVE");
    expect(result.current.state.currentQuestionIndex).toBe(0);
    expect(result.current.state.timeRemaining).toBe(
      result.current.state.questions[0].timeLimit
    );
    expect(result.current.state.linkExpiry).toBeNull();
  });

  it("starts quiz with linkExpiry timestamp", () => {
    const { result } = renderHook(() => useQuizState());
    const expiry = Date.now() + 1000 * 60;
    act(() => result.current.startQuiz(expiry));

    expect(result.current.state.linkExpiry).toBe(expiry);
  });

  // ----------------------------
  // Question navigation
  // ----------------------------
  it("advances questions correctly", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => {
      result.current.addQuestion(sampleQuestion);
      result.current.startQuiz(null);
    });

    const initialIndex = result.current.state.currentQuestionIndex;
    act(() => result.current.nextQuestion());

    expect(result.current.state.currentQuestionIndex).toBe(initialIndex + 1);
    expect(result.current.state.status).toBe("LIVE");
  });

  it("finishes quiz when last question is reached", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => result.current.startQuiz(null));

    const totalQuestions = result.current.state.questions.length;
    act(() => {
      for (let i = 0; i < totalQuestions; i++) {
        result.current.nextQuestion();
      }
    });

    expect(result.current.state.status).toBe("FINISHED");
    expect(result.current.state.timeRemaining).toBe(0);
  });

  it("resets quiz correctly to WAITING status", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => {
      result.current.startQuiz(null);
      result.current.resetQuiz();
    });

    expect(result.current.state.status).toBe("WAITING");
    expect(result.current.state.currentQuestionIndex).toBe(-1);
    expect(result.current.state.timeRemaining).toBe(0);
    expect(result.current.state.linkExpiry).toBeNull();
  });

  // ----------------------------
  // Question management
  // ----------------------------
  it("adds question correctly", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => result.current.addQuestion(sampleQuestion));

    const found = result.current.state.questions.find(q => q.id === sampleQuestion.id);
    expect(found).toBeDefined();
    expect(found?.text).toBe("Sample?");
  });

  it("updates question correctly", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => result.current.addQuestion(sampleQuestion));

    const updated: Question = { ...sampleQuestion, text: "Updated?" };
    act(() => result.current.updateQuestion(updated));

    const found = result.current.state.questions.find(q => q.id === updated.id);
    expect(found?.text).toBe("Updated?");
  });

  it("deletes question correctly", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => {
      result.current.addQuestion(sampleQuestion);
      result.current.deleteQuestion(sampleQuestion.id);
    });

    const found = result.current.state.questions.find(q => q.id === sampleQuestion.id);
    expect(found).toBeUndefined();
  });

  it("does nothing when deleting non-existent question", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => result.current.deleteQuestion("non-existent"));
    expect(result.current.state.questions.length).toBeGreaterThan(0);
  });

  // ----------------------------
  // Participant management
  // ----------------------------
  it("adds new participant by name+group", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => {
      result.current.updateParticipantScore({
        name: "Alice",
        group: "Khuddam",
        score: 10,
        answers: 1,
        correct: 1,
      });
    });

    const p = result.current.state.participants.find(p => p.name === "Alice");
    expect(p).toBeDefined();
    expect(p?.score).toBe(10);
  });

  it("updates existing participant by name+group", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => {
      result.current.updateParticipantScore({
        name: "Alice",
        group: "Khuddam",
        score: 10,
        answers: 1,
        correct: 1,
      });
      result.current.updateParticipantScore({
        name: "Alice",
        group: "Khuddam",
        score: 5,
        answers: 1,
        correct: 0,
      });
    });

    const p = result.current.state.participants.find(p => p.name === "Alice");
    expect(p?.score).toBe(15);
    expect(p?.answers).toBe(2);
    expect(p?.correct).toBe(1);
  });

  it("updates participant using explicit id", () => {
    const { result } = renderHook(() => useQuizState());
    const id = crypto.randomUUID();

    act(() => result.current.updateParticipantScore({
      id,
      name: "Bob",
      group: "Ansar",
      score: 10,
      answers: 1,
      correct: 1,
    }));
    act(() => result.current.updateParticipantScore({
      id,
      name: "Bob",
      group: "Ansar",
      score: 5,
      answers: 1,
      correct: 0,
    }));

    const p = result.current.state.participants.find(p => p.id === id);
    expect(p?.score).toBe(15);
    expect(p?.answers).toBe(2);
    expect(p?.correct).toBe(1);
  });

  // ----------------------------
  // Timer behavior (static in mock)
  // ----------------------------
  it("timeRemaining does not decrement automatically", () => {
    const { result } = renderHook(() => useQuizState());
    act(() => result.current.startQuiz(null));

    const initial = result.current.state.timeRemaining;
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.state.timeRemaining).toBe(initial);
  });

  // ----------------------------
  // Link expiry edge case
  // ----------------------------
  it("quiz finishes automatically if linkExpiry has passed", () => {
    const { result } = renderHook(() => useQuizState());
    const past = Date.now() - 1000;

    act(() => result.current.startQuiz(past));
    act(() => result.current.nextQuestion());

    expect(result.current.state.status).toBe("FINISHED");
    expect(result.current.state.timeRemaining).toBe(0);
  });

});
