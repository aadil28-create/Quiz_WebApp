// hooks/useQuizState.ts
import type { Question, QuizState, Participant } from "@/types/quiz";
import { useState, useCallback } from "react";

// -----------------------
// Sample questions
// -----------------------
const sampleQuestions: Question[] = [
  { id: "1", text: "Q1?", options: ["A", "B", "C"], correctIndex: 0, timeLimit: 15 },
  { id: "2", text: "Q2?", options: ["A", "B", "C"], correctIndex: 1, timeLimit: 20 },
];

// -----------------------
// Hook
// -----------------------
export function useQuizState() {
  const [state, setState] = useState<QuizState>({
    status: "WAITING",
    currentQuestionIndex: -1,
    questions: sampleQuestions,
    participants: [],
    timeRemaining: 0,
    linkExpiry: null,
  });

  // -----------------------
  // Quiz controls
  // -----------------------
  const startQuiz = useCallback((linkExpiry: number | null = null) => {
    setState((prev) => {
      if (!prev.questions.length) return prev;

      return {
        ...prev,
        status: "LIVE",
        currentQuestionIndex: 0,
        timeRemaining: prev.questions[0].timeLimit,
        linkExpiry,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      // Block next if link expired
      if (prev.linkExpiry && Date.now() > prev.linkExpiry) {
        return { ...prev, status: "FINISHED", timeRemaining: 0 };
      }

      const nextIdx = prev.currentQuestionIndex + 1;
      if (nextIdx >= prev.questions.length) {
        return { ...prev, status: "FINISHED", timeRemaining: 0 };
      }

      return {
        ...prev,
        currentQuestionIndex: nextIdx,
        timeRemaining: prev.questions[nextIdx].timeLimit,
      };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "WAITING",
      currentQuestionIndex: -1,
      timeRemaining: 0,
      linkExpiry: null,
    }));
  }, []);

  const addQuestion = useCallback((q: Question) => {
    if (!q.id) q.id = crypto.randomUUID();
    setState((prev) => ({ ...prev, questions: [...prev.questions, q] }));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  }, []);

  const updateQuestion = useCallback((updated: Question) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)),
    }));
  }, []);

  // -----------------------
  // Participant score updates
  // -----------------------
  const updateParticipantScore = useCallback(
    (data: {
      id?: string;
      name: string;
      group: Participant["group"];
      score: number;
      answers: number;
      correct: number;
    }) => {
      setState((prev) => {
        const idx = prev.participants.findIndex(
          (p) =>
            data.id ? p.id === data.id : p.name === data.name && p.group === data.group
        );

        if (idx >= 0) {
          const updated = [...prev.participants];
          updated[idx] = {
            ...updated[idx],
            score: updated[idx].score + data.score,
            answers: updated[idx].answers + data.answers,
            correct: updated[idx].correct + data.correct,
          };
          return { ...prev, participants: updated };
        }

        return {
          ...prev,
          participants: [
            ...prev.participants,
            {
              id: data.id ?? crypto.randomUUID(),
              name: data.name.trim().slice(0, 50),
              group: data.group,
              score: data.score,
              answers: data.answers,
              correct: data.correct,
            },
          ],
        };
      });
    },
    []
  );

  return {
    state,
    startQuiz,
    nextQuestion,
    resetQuiz,
    addQuestion,
    deleteQuestion,
    updateQuestion,
    updateParticipantScore,
  };
}
