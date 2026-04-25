import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PLAYERS, type Player, ROLE_LABEL, type Role } from "@/data/players";
import { useTeam } from "@/state/team";
import { PlayerCard } from "@/components/PlayerCard";
import { Shuffle, Sparkles, RotateCcw, X, Crown } from "lucide-react";
import { playClick, playWhoosh, playPop, playCheer, startAmbient } from "@/lib/audio";
import { toast } from "sonner";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Build Your XI — CSK Dream Team Builder" },
      { name: "description", content: "Drag & drop legendary CSK players into your playing XI." },
      { property: "og:title", content: "Build Your XI" },
      { property: "og:description", content: "Drag & drop legendary CSK players into your playing XI." },
    ],
  }),
  component: Builder,
});

const ROLE_FILTERS: { key: Role | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "BAT", label: "Bat" },
  { key: "BOWL", label: "Bowl" },
  { key: "AR", label: "AR" },
  { key: "WK", label: "WK" },
];

function Builder() {
  const nav = useNavigate();
  const team = useTeam();
  const [filter, setFilter] = useState<Role | "ALL">("ALL");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  useEffect(() => { startAmbient(); }, []);

  const filtered = useMemo(
    () => PLAYERS.filter((p) => filter === "ALL" || p.role === filter),
    [filter]
  );

  const hasWK = team.slots.some((p) => p?.role === "WK");
  const canSubmit = team.selectedCount === 11 && hasWK;

  const handleDrop = (slotIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    setActiveSlot(null);
    const id = e.dataTransfer.getData("playerId");
    const player = PLAYERS.find((p) => p.id === id);
    if (!player) return;
    if (team.isInTeam(player.id)) {
      toast.error(`${player.name} already in your XI`);
      return;
    }
    const ok = team.addPlayerToSlot(player, slotIndex);
    if (ok) {
      playClick();
      if (team.selectedCount + 1 === 11) {
        setTimeout(() => playCheer("small"), 200);
      }
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!hasWK) toast.error("You need at least 1 wicket-keeper.");
      else toast.error(`Pick ${11 - team.selectedCount} more player(s).`);
      return;
    }
    playCheer("big");
    nav({ to: "/analyzing" });
  };

  return (
    <main className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-csk-navy-deep/85 border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" onClick={() => playClick()} className="text-xs text-muted-foreground hover:text-csk-yellow font-bold tracking-widest">
            ← HOME
          </Link>
          <div className="text-center">
            <h1 className="text-base sm:text-lg font-display font-bold leading-none">SELECT YOUR XI</h1>
            <div className="text-xs text-csk-yellow font-bold mt-0.5">
              {team.selectedCount}/11 SELECTED {!hasWK && team.selectedCount > 0 ? "· need WK" : ""}
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => { team.randomize(); playWhoosh(); }} title="Randomize"
              className="w-9 h-9 rounded-md bg-secondary text-foreground hover:bg-csk-yellow hover:text-csk-navy-deep transition-colors flex items-center justify-center">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={() => { team.suggestXI(); playPop(); }} title="AI Suggest"
              className="w-9 h-9 rounded-md bg-secondary text-foreground hover:bg-csk-yellow hover:text-csk-navy-deep transition-colors flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </button>
            <button onClick={() => { team.reset(); playClick(); }} title="Reset"
              className="w-9 h-9 rounded-md bg-secondary text-foreground hover:bg-destructive transition-colors flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-gradient-to-r from-csk-yellow to-csk-yellow-bright transition-all duration-300"
            style={{ width: `${(team.selectedCount / 11) * 100}%` }}
          />
        </div>
      </header>

      <div className="px-4 pt-4 max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* Team grid */}
        <section>
          <h2 className="text-sm font-display font-bold tracking-wider text-muted-foreground mb-3">YOUR PLAYING XI</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-3">
            {team.slots.map((p, i) => (
              <Slot
                key={i}
                index={i}
                player={p}
                active={activeSlot === i}
                isCaptain={p ? team.captainId === p.id : false}
                onDragOver={(e) => { e.preventDefault(); setActiveSlot(i); }}
                onDragLeave={() => setActiveSlot(null)}
                onDrop={(e) => handleDrop(i, e)}
                onRemove={() => { team.removeFromSlot(i); playClick(); }}
                onSetCaptain={() => { if (p) { team.setCaptain(p.id); playPop(); toast.success(`${p.name} is your Captain ⭐`); } }}
              />
            ))}
          </div>

          {/* Submit */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={[
                "w-full py-4 rounded-xl font-display font-bold tracking-wider text-lg transition-all",
                canSubmit
                  ? "bg-csk-yellow text-csk-navy-deep hover:scale-[1.02] active:scale-95 animate-glow-pulse shadow-glow-yellow"
                  : "bg-secondary text-muted-foreground cursor-not-allowed",
              ].join(" ")}
            >
              ANALYZE MY TEAM →
            </button>
          </div>
        </section>

        {/* Player pool */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-display font-bold tracking-wider text-muted-foreground">PLAYER POOL</h2>
            <div className="flex gap-1">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setFilter(f.key); playClick(); }}
                  className={[
                    "px-2.5 py-1 rounded text-xs font-bold transition-colors",
                    filter === f.key
                      ? "bg-csk-yellow text-csk-navy-deep"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {filtered.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                selected={team.isInTeam(p.id)}
                compact
                onDragStart={() => playWhoosh()}
                onClick={() => {
                  if (team.isInTeam(p.id)) return;
                  // tap to add: find first empty slot
                  const idx = team.slots.findIndex((s) => s === null);
                  if (idx === -1) { toast.error("Team is full!"); return; }
                  team.addPlayerToSlot(p, idx);
                  playClick();
                  if (team.selectedCount + 1 === 11) setTimeout(() => playCheer("small"), 200);
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

interface SlotProps {
  index: number;
  player: Player | null;
  active: boolean;
  isCaptain: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: () => void;
  onSetCaptain: () => void;
}

function Slot({ index, player, active, isCaptain, onDragOver, onDragLeave, onDrop, onRemove, onSetCaptain }: SlotProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        "relative rounded-xl aspect-[3/4] transition-all duration-200",
        player
          ? ""
          : "border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center text-muted-foreground text-xs font-bold",
        active ? "drop-active" : "",
      ].join(" ")}
    >
      {player ? (
        <div className="relative h-full animate-float-up">
          <PlayerCard player={player} compact isCaptain={isCaptain} />
          <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1">
            <button
              onClick={onSetCaptain}
              className="flex-1 bg-csk-navy-deep/80 backdrop-blur text-csk-yellow rounded text-[10px] py-1 font-bold hover:bg-csk-yellow hover:text-csk-navy-deep transition-colors flex items-center justify-center gap-1"
            >
              <Crown className="w-3 h-3" /> {isCaptain ? "C" : "Cap"}
            </button>
            <button
              onClick={onRemove}
              className="bg-destructive/80 backdrop-blur text-white rounded p-1 hover:bg-destructive transition-colors"
              aria-label="Remove player"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <span>#{index + 1}</span>
      )}
    </div>
  );
}
