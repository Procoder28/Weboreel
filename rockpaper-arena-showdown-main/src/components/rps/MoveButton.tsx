import { Hand, Scissors } from "lucide-react";
import type { Move } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  move: Move;
  onClick: (m: Move) => void;
  disabled?: boolean;
}

const RockIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M7 11V8a2 2 0 0 1 4 0v3" />
    <path d="M11 11V7a2 2 0 0 1 4 0v4" />
    <path d="M15 11V9a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-2a2 2 0 0 1 4 0" />
  </svg>
);

const ICONS: Record<Move, React.ComponentType<{ className?: string }>> = {
  rock: RockIcon,
  paper: ({ className }) => <Hand className={className} strokeWidth={1.8} />,
  scissors: ({ className }) => <Scissors className={className} strokeWidth={1.8} />,
};

const LABELS: Record<Move, string> = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
};

export const MoveButton = ({ move, onClick, disabled }: Props) => {
  const Icon = ICONS[move];
  return (
    <button
      type="button"
      onClick={() => onClick(move)}
      disabled={disabled}
      aria-label={`Play ${LABELS[move]}`}
      className={cn(
        "group relative flex flex-col items-center gap-2 p-4 sm:p-6 rounded-3xl arena-card",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-2 hover:border-primary hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)]",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
      )}
    >
      <div
        className={cn(
          "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-secondary to-background border border-border",
          "transition-all duration-300 group-hover:from-primary/30 group-hover:to-accent/20 group-hover:border-primary",
        )}
      >
        <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary-glow" />
      </div>
      <span className="font-display font-bold text-sm sm:text-base uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
        {LABELS[move]}
      </span>
    </button>
  );
};