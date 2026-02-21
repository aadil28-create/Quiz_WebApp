import { useState } from "react";
import type { Question } from "@/types/quiz";
import { Plus, X } from "lucide-react";

interface QuestionFormProps {
  initial?: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}

const QuestionForm = ({ initial, onSave, onCancel }: QuestionFormProps) => {
  const [text, setText] = useState(initial?.text ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(initial?.correctIndex ?? 0);
  const [timeLimit, setTimeLimit] = useState(initial?.timeLimit ?? 20);
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    const trimmedOptions = options.map((o) => o.trim());

    if (!trimmedText) return setError("Question cannot be empty");
    if (trimmedOptions.some((o) => !o)) return setError("All options must be filled");
    if (correctIndex < 0 || correctIndex >= trimmedOptions.length)
      return setError("Select a valid correct answer");
    if (timeLimit < 5 || timeLimit > 120) return setError("Time limit must be between 5 and 120 seconds");

    setError("");

    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      text: trimmedText,
      options: trimmedOptions,
      correctIndex,
      timeLimit,
    });
  };

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-lg shadow-elevated p-6 animate-scale-in space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-foreground">
          {initial ? "Edit Question" : "New Question"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div>
        <label htmlFor="question-text" className="text-sm font-medium text-muted-foreground mb-1.5 block">
          Question
        </label>
        <input
          id="question-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          placeholder="Enter your question..."
          required
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
          Options (click to mark correct)
        </label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorrectIndex(i)}
              aria-pressed={correctIndex === i}
              className={`flex-shrink-0 w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                correctIndex === i
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`}
              title={`Mark option ${String.fromCharCode(65 + i)} as correct`}
            >
              {String.fromCharCode(65 + i)}
            </button>
            <input
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              required
              maxLength={100}
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="time-limit" className="text-sm font-medium text-muted-foreground mb-1.5 block">
          Time Limit (seconds)
        </label>
        <input
          id="time-limit"
          type="number"
          min={5}
          max={120}
          step={1}
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          aria-valuemin={5}
          aria-valuemax={120}
          aria-valuenow={timeLimit}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity shadow-glow-secondary"
        >
          {initial ? "Save Changes" : "Add Question"}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm;
