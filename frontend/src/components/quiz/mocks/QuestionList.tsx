// /components/quiz/mocks/QuestionList.tsx

import type { Question } from "@/types/quiz";

interface QuestionListProps {
  questions?: Question[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const QuestionList = ({
  questions = [],
  onEdit,
  onDelete,
}: QuestionListProps) => {
  return (
    <div data-testid="mock-question-list">

      <div data-testid="question-count">
        Questions: {questions.length}
      </div>

      {questions.length === 0 && (
        <div data-testid="empty-state">
          No questions
        </div>
      )}

      {questions.map((q, index) => (
        <div
          key={q.id}
          data-testid={`mock-question-${q.id}`}
        >
          <span data-testid={`question-text-${q.id}`}>
            {index + 1}. {q.text}
          </span>

          <button
            data-testid={`edit-${q.id}`}
            onClick={() => onEdit(q.id)}
          >
            Edit
          </button>

          <button
            data-testid={`delete-${q.id}`}
            onClick={() => {
              // simulate confirmation behavior
              const confirmed = true;
              if (confirmed) {
                onDelete(q.id);
              }
            }}
          >
            Delete
          </button>
        </div>
      ))}

    </div>
  );
};

export default QuestionList;
