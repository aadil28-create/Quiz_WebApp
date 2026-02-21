import { useState, useCallback } from "react";
import { useQuizState } from "@/hooks/useQuizState";
import QuestionList from "@/components/quiz/QuestionList";
import QuestionForm from "@/components/quiz/QuestionForm";
import ScoreTable from "@/components/quiz/ScoreTable";
import LoginPanel from "@/components/quiz/LoginPanel";
import Timer from "@/components/quiz/Timer";
import type { Question } from "@/types/quiz";
import { Play, RotateCcw, Plus, LogOut, Radio } from "lucide-react";

const HostDashboard = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [hostName, setHostName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryValue, setExpiryValue] = useState("");

  const { state, startQuiz, nextQuestion, resetQuiz, addQuestion, deleteQuestion, updateQuestion } =
    useQuizState();

  // --- Handle host login ---
  const handleLogin = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 50);
    setHostName(trimmed);
    setLoggedIn(true);
  }, []);

  // --- Save or update a question ---
  const handleSaveQuestion = useCallback(
    (q: Question) => {
      q.text = q.text.trim().slice(0, 200);
      q.options = q.options.map((opt) => opt.trim().slice(0, 100));

      if (editingQuestion) {
        updateQuestion(q);
      } else {
        addQuestion(q);
      }

      setShowForm(false);
      setEditingQuestion(null);
    },
    [editingQuestion, addQuestion, updateQuestion]
  );

  // --- Edit a question ---
  const handleEdit = useCallback(
    (id: string) => {
      if (state.status === "LIVE") return;
      const q = state.questions.find((q) => q.id === id);
      if (q) {
        setEditingQuestion(q);
        setShowForm(true);
      }
    },
    [state.questions, state.status]
  );

  // --- Delete question with confirmation ---
  const handleDelete = useCallback(
    (id: string) => {
      if (state.status === "LIVE") return;
      if (window.confirm("Are you sure you want to delete this question?")) {
        deleteQuestion(id);
      }
    },
    [deleteQuestion, state.status]
  );

  if (!loggedIn) return <LoginPanel onLogin={handleLogin} role="host" />;

  const currentQ = state.questions[state.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-display font-bold text-primary-foreground">Q</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-tight">Quiz Host</h1>
              <p className="text-xs text-muted-foreground">Welcome, {hostName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state.status === "LIVE" && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                <Radio className="w-3 h-3" />
                Live
              </span>
            )}
            <button
              onClick={() => {
                setLoggedIn(false);
                resetQuiz();
              }}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {state.status === "WAITING" && (
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={expiryEnabled}
                  onChange={() => setExpiryEnabled((prev) => !prev)}
                  className="w-4 h-4 accent-primary"
                />
                Set link expiry
              </label>
              {expiryEnabled && (
                <input
                  type="datetime-local"
                  data-testid="quiz-expiry-input"
                  value={expiryValue}
                  onChange={(e) => setExpiryValue(e.target.value)}
                  className="px-2 py-1 border border-border rounded-lg text-sm"
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>
          )}

          {state.status === "WAITING" && (
            <>
              <button
                onClick={() => {
                  let expiryTimestamp: number | null = null;
                  if (expiryEnabled && expiryValue) {
                    const ts = Date.parse(expiryValue);
                    if (isNaN(ts) || ts < Date.now()) {
                      alert("Invalid expiry date/time");
                      return;
                    }
                    expiryTimestamp = ts;
                  }
                  startQuiz(expiryTimestamp);
                }}
                disabled={state.questions.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-glow-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Start Quiz
              </button>

              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </>
          )}

          {state.status === "LIVE" && (
            <button
              onClick={nextQuestion}
              disabled={state.linkExpiry && Date.now() > state.linkExpiry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Question →
            </button>
          )}

          {state.status === "FINISHED" && (
            <button
            data-testid="reset-quiz-btn"  
            onClick={resetQuiz}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Quiz
            </button>
          )}
        </div>

        {/* Active quiz state */}
        {state.status === "LIVE" && currentQ && (
          <div className="bg-card rounded-lg shadow-elevated p-6 animate-fade-in">
            <Timer
              seconds={state.timeRemaining}
              maxSeconds={currentQ.timeLimit}
              onTimeout={nextQuestion}
            />
            <div className="mt-4">
              <span className="text-xs font-medium text-muted-foreground">
                Question {state.currentQuestionIndex + 1} of {state.questions.length}
              </span>
              <h2 className="text-xl font-display font-bold text-foreground mt-1">
                {currentQ.text}
              </h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentQ.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium ${
                      i === currentQ.correctIndex
                        ? "border-success bg-success/10 text-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Finished state */}
        {state.status === "FINISHED" && (
          <div className="bg-card rounded-lg shadow-elevated p-6 text-center animate-fade-in">
            <h2 className="text-2xl font-display font-bold text-foreground">Quiz Complete! 🎉</h2>
            <p className="text-muted-foreground mt-1">See the final standings below</p>
          </div>
        )}

        {/* Question Form */}
        {showForm && (
          <QuestionForm
            initial={editingQuestion ?? undefined}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setShowForm(false);
              setEditingQuestion(null);
            }}
          />
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuestionList questions={state.questions} onEdit={handleEdit} onDelete={handleDelete} />
          <ScoreTable participants={state.participants} />
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
