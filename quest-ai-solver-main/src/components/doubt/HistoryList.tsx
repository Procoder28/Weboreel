import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DoubtRecord } from "./types";

type Props = {
  items: DoubtRecord[];
  onSelect: (item: DoubtRecord) => void;
  onClear: () => void;
};

export const HistoryList = ({ items, onSelect, onClear }: Props) => {
  if (items.length === 0) return null;
  return (
    <aside className="glass rounded-2xl p-5 shadow-card animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <History className="h-4 w-4 text-accent" /> Recent doubts
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id}>
            <button
              onClick={() => onSelect(it)}
              className="w-full text-left p-3 rounded-lg bg-background/40 border border-border hover:border-primary/60 hover:bg-background/70 transition-colors"
            >
              <p className="text-sm font-medium line-clamp-2">{it.question}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {it.subject} · {it.level}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};
