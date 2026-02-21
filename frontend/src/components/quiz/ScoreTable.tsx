import type { Participant } from "@/types/quiz";
import { Trophy } from "lucide-react";
import { useMemo } from "react";

interface ScoreTableProps {
  participants?: Participant[];
}

const ScoreTable = ({ participants = [] }: ScoreTableProps) => {
  // Memoize sorted array for performance
  const sorted = useMemo(() => {
    return [...participants].sort((a, b) =>
      b.score !== a.score ? b.score - a.score : a.name.localeCompare(b.name)
    );
  }, [participants]);

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Leaderboard
        </h3>
      </div>
      <ul className="divide-y divide-border" role="list">
        {sorted.length === 0 && (
          <li className="px-5 py-8 text-center text-muted-foreground">
            No participants yet.
          </li>
        )}

        {sorted.map((p, i) => (
          <li
            key={p.id}
            role="listitem"
            aria-label={`Rank ${i + 1}, ${p.name}, ${p.score} points, ${p.correct} correct answers out of ${p.answers}`}
            className={`flex items-center justify-between px-5 py-3 transition-colors ${
              i === 0 ? "bg-accent/5" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0
                    ? "bg-accent text-accent-foreground"
                    : i === 1
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="font-medium text-foreground truncate">{p.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {p.correct}/{p.answers}
              </span>
              <span className="font-display font-bold text-foreground min-w-[60px] text-right">
                {p.score} pts
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScoreTable;
