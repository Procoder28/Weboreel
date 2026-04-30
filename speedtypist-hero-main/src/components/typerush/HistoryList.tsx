import { Attempt } from "@/lib/storage";

type Props = { attempts: Attempt[] };

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryList({ attempts }: Props) {
  const last5 = attempts.slice(0, 5);
  if (last5.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Your last 5 attempts will appear here.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/70 shadow-card">
      {last5.map((a) => (
        <li key={a.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
          <span className="col-span-4 text-muted-foreground">{formatDate(a.date)}</span>
          <span className="col-span-2 font-mono text-primary">{a.wpm} wpm</span>
          <span className="col-span-2 font-mono">{a.accuracy.toFixed(0)}%</span>
          <span className="col-span-2 font-mono text-muted-foreground">{a.charsTyped} ch</span>
          <span className="col-span-2 text-right text-muted-foreground">{a.duration}s</span>
        </li>
      ))}
    </ul>
  );
}
