import type { Question } from "@/types/quiz";
import { Pencil, Trash2 } from "lucide-react";

interface QuestionListProps {
  questions?: Question[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const QuestionList = ({ questions = [], onEdit, onDelete }: QuestionListProps) => {
  const handleDelete = (id: string) => {
    // Replace with custom modal in production
    if (window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-display font-bold text-lg text-foreground">
          Questions ({questions.length})
        </h3>
      </div>
      <ul className="divide-y divide-border" role="list">
        {questions.length === 0 && (
          <li className="px-5 py-8 text-center text-muted-foreground">
            No questions yet. Add your first question!
          </li>
        )}

        {questions.map((q, i) => (
          <li
            key={q.id}
            className="flex items-center justify-between px-5 py-3 group hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex-shrink-0 w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-foreground truncate">{q.text}</span>
            </div>
            <div className="flex items-center gap-1 transition-opacity opacity-100 focus-within:opacity-100">
              <button
                onClick={() => onEdit(q.id)}
                className="p-2 rounded-md hover:bg-secondary/20 text-muted-foreground hover:text-secondary transition-colors"
                aria-label={`Edit question ${i + 1}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(q.id)}
                className="p-2 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Delete question ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionList;
