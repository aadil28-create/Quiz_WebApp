import { useState, useCallback, useMemo } from "react";
import { useQuizState } from "@/hooks/useQuizState";
import LoginPanel from "@/components/quiz/LoginPanel";
import Timer from "@/components/quiz/Timer";
import OptionButton from "@/components/quiz/OptionButton";
import type { AnswerFeedback, Participant } from "@/types/quiz";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";

// Type-safe groups
const GROUPS: Participant["group"][] = ["Khuddam", "Ansar", "Lajna"];

const ParticipantQuiz = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Participant["group"] | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);

  const { state, startQuiz, nextQuestion, updateParticipantScore } = useQuizState();

  // --- Handle participant login ---
  const handleLogin = useCallback(() => {
    if (!playerName.trim() || !selectedGroup) return;
    setLoggedIn(true);

    const exists = state.participants.some(
      (p) => p.name === playerName && p.group === selectedGroup
    );

    if (!exists) {
      updateParticipantScore({
        id: crypto.randomUUID(),
        name: playerName,
        group: selectedGroup,
        score: 0,
        answers: 0,
        correct: 0,
      });
    }

    startQuiz();
  }, [playerName, selectedGroup, state.participants, startQuiz, updateParticipantScore]);

  const currentQ = state.questions[state.currentQuestionIndex];

  // --- Submit answer ---
  const handleSubmit = useCallback(() => {
    if (selectedOption === null || !currentQ || !selectedGroup) return;

    const isCorrect = selectedOption === currentQ.correctIndex;
    setFeedback({ isCorrect, correctIndex: currentQ.correctIndex, selectedIndex: selectedOption });

    const points = isCorrect ? Math.max(50, state.timeRemaining * 10) : 0;

    updateParticipantScore({
      name: playerName,
      group: selectedGroup,
      score: points,
      answers: 1,
      correct: isCorrect ? 1 : 0,
    });

    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      nextQuestion();
    }, 2000);
  }, [selectedOption, currentQ, state.timeRemaining, nextQuestion, playerName, selectedGroup, updateParticipantScore]);

  // --- Handle timeout ---
  const handleTimeout = useCallback(() => {
    if (!currentQ || feedback || !selectedGroup) return;

    setFeedback({ isCorrect: false, correctIndex: currentQ.correctIndex, selectedIndex: selectedOption ?? -1 });

    updateParticipantScore({
      name: playerName,
      group: selectedGroup,
      score: 0,
      answers: 1,
      correct: 0,
    });

    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      nextQuestion();
    }, 2000);
  }, [currentQ, feedback, selectedOption, nextQuestion, playerName, selectedGroup, updateParticipantScore]);

  // --- Leaderboard filtered by group ---
  const groupParticipants = useMemo(
    () =>
      state.participants
        .filter((p) => p.group === selectedGroup)
        .sort((a, b) => b.score - a.score),
    [state.participants, selectedGroup]
  );

  // --- Login view ---
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm animate-fade-in space-y-4">
          <LoginPanel role="participant" onLogin={setPlayerName} />
          <div className="flex flex-col gap-2 mt-2">
            {GROUPS.map((grp) => (
              <button
                key={grp}
                onClick={() => !selectedGroup && setSelectedGroup(grp)}
                disabled={!!selectedGroup}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-foreground border ${
                  selectedGroup === grp
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
          <button
            onClick={handleLogin}
            disabled={!playerName.trim() || !selectedGroup}
            className="mt-4 w-full py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Quiz
          </button>
        </div>
      </div>
    );
  }

  // --- Quiz finished ---
  if (state.status === "FINISHED") {
    const participantScore = groupParticipants.find(
      (p) => p.name === playerName && p.group === selectedGroup
    )?.score ?? 0;

    return (
      <div className="min-h-screen flex flex-col items-center justify-start bg-background p-4 space-y-6">
        <h1 className="text-3xl font-display font-bold text-foreground animate-scale-in mt-6">
          Quiz Complete!
        </h1>
        <p className="text-muted-foreground text-sm">Well done, {playerName}!</p>

        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-3xl">
          <div className="flex-1 bg-card rounded-xl shadow-elevated p-6 text-center">
            <p className="text-sm text-muted-foreground">Your Score</p>
            <p className="text-4xl font-display font-bold text-secondary mt-1">{participantScore}</p>
            <p className="text-xs text-muted-foreground mt-1">points</p>
          </div>

          <div className="flex-1 bg-card rounded-xl shadow-elevated p-6">
            <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" /> Leaderboard ({selectedGroup})
            </h2>
            <div className="divide-y divide-border">
              {groupParticipants.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-4 py-2 ${i === 0 ? "bg-accent/5" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-accent text-accent-foreground"
                          : i === 1
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground">{p.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{p.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Active quiz ---
  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">No quiz available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-display font-bold text-primary-foreground">Q</span>
          </div>
          <span className="font-medium text-sm text-foreground">{playerName} ({selectedGroup})</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Score</span>
          <p className="text-lg font-display font-bold text-secondary leading-tight">
            {groupParticipants.find((p) => p.name === playerName)?.score ?? 0}
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        <Timer
          data-testid="timer"
          seconds={state.timeRemaining}
          maxSeconds={currentQ.timeLimit}
          onTimeout={handleTimeout}
        />

        <div className="mt-6 flex-1 flex flex-col animate-slide-up" key={state.currentQuestionIndex}>
          <div className="mb-6">
            <span className="text-xs font-medium text-muted-foreground">
              Question {state.currentQuestionIndex + 1} of {state.questions.length}
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mt-1">
              {currentQ.text}
            </h2>
          </div>

          <div className="space-y-3 flex-1">
            {currentQ.options.map((opt, i) => (
              <OptionButton
                key={i}
                label={opt}
                index={i}
                selected={selectedOption === i}
                disabled={feedback !== null}
                state={
                  feedback
                    ? i === feedback.correctIndex
                      ? "correct"
                      : i === feedback.selectedIndex
                      ? "incorrect"
                      : "neutral"
                    : "neutral"
                }
                onClick={() => setSelectedOption(i)}
              />
            ))}
          </div>

          {feedback && (
            <div className={`mt-4 flex items-center gap-3 p-4 rounded-lg animate-scale-in ${
              feedback.isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}>
              {feedback.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-medium text-sm">
                {feedback.isCorrect
                  ? "Correct! Well done!"
                  : `Wrong! The answer was ${currentQ.options[feedback.correctIndex]}`}
              </span>
            </div>
          )}

          {!feedback && (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="mt-6 w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-glow-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantQuiz;
