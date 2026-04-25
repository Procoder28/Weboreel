type Props = {
  level: number;
  total: number;
  message: string;
  onSkip?: () => void;
};

export function Hud({ level, total, message, onSkip }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 sm:p-6 font-mono text-xs uppercase tracking-[0.2em]">
      <div className="rounded border border-border/60 bg-background/40 px-3 py-1.5 backdrop-blur-md">
        <span className="text-muted-foreground">Lvl</span>{" "}
        <span className="text-primary">{String(level).padStart(2, "0")}</span>
        <span className="text-muted-foreground"> / {String(total).padStart(2, "0")}</span>
      </div>
      <div className="hidden sm:block max-w-[60%] text-right text-muted-foreground">
        <span className="glitch" data-text={message}>{message}</span>
      </div>
      {onSkip && (
        <button
          onClick={onSkip}
          className="pointer-events-auto rounded border border-border/60 bg-background/40 px-3 py-1.5 text-muted-foreground backdrop-blur-md transition hover:text-primary hover:border-primary/60"
        >
          skip →
        </button>
      )}
    </div>
  );
}
