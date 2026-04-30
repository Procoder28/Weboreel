import type { Scores } from "./types";

interface Props {
  scores: Scores;
  target?: number | null;
}

const Stat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl arena-card flex-1 min-w-[90px]">
    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
      {label}
    </span>
    <span
      className="font-display text-3xl md:text-4xl font-extrabold tabular-nums"
      style={{ color: `hsl(var(--${color}))` }}
    >
      {value}
    </span>
  </div>
);

export const Scoreboard = ({ scores, target }: Props) => {
  return (
    <div className="w-full">
      <div className="flex gap-2 md:gap-3">
        <Stat label="You" value={scores.player} color="win" />
        <Stat label="Draws" value={scores.draws} color="draw" />
        <Stat label="CPU" value={scores.computer} color="lose" />
      </div>
      {target ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          First to <span className="text-accent font-semibold">{target}</span> wins the match
        </p>
      ) : null}
    </div>
  );
};