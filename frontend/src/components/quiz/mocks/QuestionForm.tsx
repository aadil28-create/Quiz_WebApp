// /components/quiz/mocks/QuestionForm.tsx

import { useState } from "react";
import type { Question } from "@/types/quiz";

interface QuestionFormProps {
  initial?: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}

const QuestionForm = ({
  initial,
  onSave,
  onCancel,
}: QuestionFormProps) => {

  const [text, setText] = useState(
    initial?.text ?? "Mock Question?"
  );

  const [timeLimit, setTimeLimit] = useState(
    initial?.timeLimit ?? 20
  );

  const mockId =
    initial?.id ??
    "mock-" + Math.random().toString(36).slice(2);

  const question: Question = {
    id: mockId,
    text,
    options: [
      "Option A",
      "Option B",
      "Option C",
      "Option D",
    ],
    correctIndex: 0,
    timeLimit,
  };

  return (
    <div data-testid="mock-question-form">

      <div data-testid="form-mode">
        {initial ? "edit-mode" : "create-mode"}
      </div>

      <input
        data-testid="input-text"
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
      />

      <input
        data-testid="input-time"
        type="number"
        value={timeLimit}
        onChange={(e) =>
          setTimeLimit(Number(e.target.value))
        }
      />

      <button
        data-testid="form-save"
        onClick={() =>
          onSave(question)
        }
      >
        Save Question
      </button>

      <button
        data-testid="form-save-invalid"
        onClick={() =>
          onSave({
            ...question,
            text: "",
          })
        }
      >
        Save Invalid
      </button>

      <button
        data-testid="form-cancel"
        onClick={onCancel}
      >
        Cancel
      </button>

      <div data-testid="saved-preview">
        {JSON.stringify(question)}
      </div>

    </div>
  );
};

export default QuestionForm;
