// /components/quiz/mocks/ScoreTable.tsx

import type { Participant } from "@/types/quiz";

interface ScoreTableProps {
  participants?: Participant[];
}

const ScoreTable = ({
  participants = [],
}: ScoreTableProps) => {
  const sorted = [...participants].sort(
    (a, b) => b.score - a.score
  );

  return (
    <div data-testid="mock-score-table">

      <div data-testid="participant-count">
        Participants: {sorted.length}
      </div>

      {sorted.length === 0 && (
        <div data-testid="empty-leaderboard">
          No participants yet
        </div>
      )}

      {sorted.map((p, index) => (
        <div
          key={p.id}
          data-testid={`participant-row-${index}`}
        >

          <span data-testid={`participant-id-${p.id}`}>
            {p.id}
          </span>

          <span data-testid={`participant-rank-${p.id}`}>
            {index + 1}
          </span>

          <span data-testid={`participant-name-${p.id}`}>
            {p.name}
          </span>

          <span data-testid={`participant-score-${p.id}`}>
            {p.score}
          </span>

          <span data-testid={`participant-correct-${p.id}`}>
            {p.correct}
          </span>

          <span data-testid={`participant-answers-${p.id}`}>
            {p.answers}
          </span>

        </div>
      ))}

    </div>
  );
};

export default ScoreTable;
