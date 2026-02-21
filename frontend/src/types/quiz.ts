// types/quiz.ts

// ------------------------
// Quiz status aligned with backend
// ------------------------
export type QuizStatus = "WAITING" | "LIVE" | "FINISHED";
// ------------------------

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex?: number;
  timeLimit: number; // seconds
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  answers: number;
  correct: number;
  group?: "Khuddam" | "Ansar" | "Lajna";
}

export interface QuizState {
  status: QuizStatus;
  currentQuestionIndex: number;
  questions: Question[];
  participants: Participant[];
  timeRemaining: number;
  linkExpiry?: number | null;
}

export interface AnswerFeedback {
  isCorrect: boolean;
  correctIndex: number;
  selectedIndex: number;
}
