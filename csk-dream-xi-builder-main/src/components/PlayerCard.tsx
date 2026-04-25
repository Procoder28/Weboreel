import { Player, ROLE_LABEL } from "@/data/players";
import { Star } from "lucide-react";

interface Props {
  player: Player;
  selected?: boolean;
  onDragStart?: () => void;
  onClick?: () => void;
  compact?: boolean;
  isCaptain?: boolean;
}

const ROLE_COLOR: Record<Player["role"], string> = {
  BAT: "bg-blue-500/80 text-white",
  BOWL: "bg-red-500/80 text-white",
  AR: "bg-purple-500/80 text-white",
  WK: "bg-emerald-500/80 text-white",
};

export function PlayerCard({ player, selected, onDragStart, onClick, compact, isCaptain }: Props) {
  return (
    <div
      draggable={!selected}
      onDragStart={(e) => {
        if (selected) { e.preventDefault(); return; }
        e.dataTransfer.setData("playerId", player.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onClick={onClick}
      className={[
        "csk-card relative rounded-xl overflow-hidden cursor-pointer select-none",
        "transition-all duration-200 active:scale-95",
        compact ? "p-2" : "p-3",
        selected ? "opacity-40 grayscale pointer-events-none" : "hover:scale-[1.03] hover:shadow-glow-yellow",
      ].join(" ")}
    >
      {isCaptain && (
        <div className="absolute top-1 right-1 z-10 bg-csk-yellow text-csk-navy-deep rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
          C
        </div>
      )}
      <div className="aspect-square overflow-hidden rounded-lg bg-csk-navy-deep mb-2">
        <img
          src={player.img}
          alt={player.name}
          loading="lazy"
          width={512}
          height={512}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="space-y-1">
        <div className={`font-display font-bold leading-tight ${compact ? "text-xs" : "text-sm"} text-foreground line-clamp-1`}>
          {player.name}
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ROLE_COLOR[player.role]}`}>
            {compact ? player.role : ROLE_LABEL[player.role]}
          </span>
          <span className="flex items-center gap-0.5 text-csk-yellow text-xs font-bold">
            <Star className="w-3 h-3 fill-csk-yellow" />
            {player.rating}
          </span>
        </div>
      </div>
    </div>
  );
}
