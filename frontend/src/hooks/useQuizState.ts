import { useState, useCallback, useEffect, useRef } from "react";
import type { Question, Participant, QuizState } from "@/types/quiz";

// Sample questions and participants for dev/testing
const sampleQuestions: Question[] = [
  { id: "1", text: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctIndex: 2, timeLimit: 20 },
  { id: "2", text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1, timeLimit: 15 },
  { id: "3", text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3, timeLimit: 15 },
  { id: "4", text: "Who painted the Mona Lisa?", options: ["Michelangelo", "Da Vinci", "Raphael", "Picasso"], correctIndex: 1, timeLimit: 20 },
];

const sampleParticipants: Participant[] = [
  { id: "p1", name: "Alice", score: 300, answers: 3, correct: 2, group: "Lajna" },
  { id: "p2", name: "Bob", score: 450, answers: 3, correct: 3, group: "Khuddam" },
  { id: "p3", name: "Charlie", score: 150, answers: 3, correct: 1, group: "Ansar" },
  { id: "p4", name: "Diana", score: 400, answers: 3, correct: 2, group: "Lajna" },
];

export function useQuizState() {
  const [state, setState] = useState<QuizState>({
    status: "WAITING",  // backend-aligned
    currentQuestionIndex: -1, // backend-aligned
    questions: sampleQuestions,
    participants: sampleParticipants,
    timeRemaining: 0,
    linkExpiry: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startQuiz = useCallback((linkExpiry: number | null = null) => {
    setState((s) => {
      if (!s.questions.length) return s;
      return {
        ...s,
        status: "LIVE",
        currentQuestionIndex: 0,
        timeRemaining: s.questions[0].timeLimit,
        linkExpiry,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState((s) => {
      const nextIndex = s.currentQuestionIndex + 1;
      if (s.linkExpiry && Date.now() > s.linkExpiry) {
        clearTimer();
        return { ...s, status: "FINISHED" };
      }
      if (nextIndex >= s.questions.length) {
        clearTimer();
        return { ...s, status: "FINISHED" };
      }
      return { ...s, currentQuestionIndex: nextIndex, timeRemaining: s.questions[nextIndex].timeLimit };
    });
  }, [clearTimer]);

  const resetQuiz = useCallback(() => {
    clearTimer();
    setState((s) => ({
      ...s,
      status: "WAITING",
      currentQuestionIndex: -1,
      timeRemaining: 0,
      linkExpiry: null,
    }));
  }, [clearTimer]);

  const addQuestion = useCallback((q: Question) => {
    setState((s) => ({ ...s, questions: [...s.questions, q] }));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setState((s) => ({ ...s, questions: s.questions.filter((q) => q.id !== id) }));
  }, []);

  const updateQuestion = useCallback((updated: Question) => {
    setState((s) => ({
      ...s,
      questions: s.questions.map((q) => (q.id === updated.id ? updated : q)),
    }));
  }, []);

  // --- Participant management ---
  const updateParticipantScore = useCallback(
    (data: {
      id?: string;
      name: string;
      group: Participant["group"];
      score: number;
      answers: number;
      correct: number;
    }) => {
      setState((s) => {
        const idx = s.participants.findIndex(
          (p) =>
            data.id
              ? p.id === data.id
              : p.name === data.name && p.group === data.group
        );

        if (idx >= 0) {
          const updated = [...s.participants];
          updated[idx] = {
            ...updated[idx],
            score: updated[idx].score + data.score,
            answers: updated[idx].answers + data.answers,
            correct: updated[idx].correct + data.correct,
          };
          return { ...s, participants: updated };
        }

        const newParticipant: Participant = {
          id: data.id ?? crypto.randomUUID(),
          name: data.name,
          group: data.group,
          score: data.score,
          answers: data.answers,
          correct: data.correct,
        };
        return { ...s, participants: [...s.participants, newParticipant] };
      });
    },
    []
  );

  // --- Timer effect ---
  useEffect(() => {
    if (state.status !== "LIVE") {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setState((s) => {
        if (s.linkExpiry && Date.now() > s.linkExpiry) {
          clearTimer();
          return { ...s, status: "FINISHED" };
        }

        if (s.timeRemaining <= 1) {
          clearTimer();
          const nextIndex = s.currentQuestionIndex + 1;
          if (nextIndex >= s.questions.length) {
            return { ...s, timeRemaining: 0, status: "FINISHED" };
          }
          return { ...s, currentQuestionIndex: nextIndex, timeRemaining: s.questions[nextIndex].timeLimit };
        }

        return { ...s, timeRemaining: s.timeRemaining - 1 };
      });
    }, 1000);

    return clearTimer;
  }, [state.status, state.linkExpiry, clearTimer]);

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
