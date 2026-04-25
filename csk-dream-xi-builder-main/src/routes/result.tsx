import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useTeam } from "@/state/team";
import { Share2, RotateCcw, Trophy, Crown } from "lucide-react";
import { playCheer, playSad, playHype, boostAmbient } from "@/lib/audio";
import { toast } from "sonner";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [{ title: "Your CSK XI Verdict" }],
  }),
  component: Result,
});

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 50 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: ["#FDB913", "#FFFFFF", "#1B2444", "#FFD93D"][Math.floor(Math.random() * 4)],
      key: i,
    })),
    []
  );
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.key}
          className="absolute w-2 h-3 rounded-sm"
          style={{
            left: `${p.left}%`,
            top: 0,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
          }}
        />
      ))}
    </div>
  );
}

function Result() {
  const nav = useNavigate();
  const { result, slots, captainId, reset } = useTeam();
  const captain = slots.find((p) => p?.id === captainId) ?? slots[0];

  useEffect(() => {
    if (!result) { nav({ to: "/builder" }); return; }
    if (result.overall >= 85) { playCheer("big"); boostAmbient(); }
    else if (result.overall >= 70) playHype();
    else playSad();
  }, [result, nav]);

  if (!result) return null;

  const high = result.overall >= 85;

  const handleShare = async () => {
    const text = `🏏 My Dream CSK XI scored ${result.overall}/100 — "${result.teamTag}"!\n\nCaptain: ${captain?.name}\n${result.verdict}\n\nBuild yours:`;
    if (navigator.share) {
      try { await navigator.share({ title: "My CSK Dream XI", text, url: window.location.origin }); return; }
      catch {}
    }
    try { await navigator.clipboard.writeText(`${text} ${window.location.origin}`); toast.success("Copied to clipboard!"); }
    catch { toast.error("Couldn't share. Try again."); }
  };

  return (
    <main className="min-h-screen px-4 py-8 pb-24">
      {high && <Confetti />}

      <div className="max-w-2xl mx-auto space-y-6 animate-float-up">
        {/* Big rating */}
        <div className="csk-card rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-csk-yellow/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-csk-yellow/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-csk-yellow/15 border border-csk-yellow/30 text-csk-yellow text-xs font-bold tracking-widest uppercase mb-4">
              <Trophy className="w-3 h-3" /> {result.teamTag}
            </div>

            <div className="font-display text-7xl sm:text-8xl font-bold text-shimmer leading-none">
              {result.overall}
            </div>
            <div className="text-muted-foreground text-sm mt-1">/ 100</div>

            <p className="mt-6 text-base sm:text-lg text-foreground/90 italic">
              "{result.verdict}"
            </p>
          </div>
        </div>

        {/* Stat bars */}
        <div className="csk-card rounded-2xl p-5 space-y-4">
          <StatBar label="Batting Strength" value={result.batting} />
          <StatBar label="Bowling Strength" value={result.bowling} />
          <StatBar label="Experience Level" value={result.experience} />
        </div>

        {/* Captain */}
        {captain && (
          <div className="csk-card rounded-2xl p-4 flex items-center gap-4">
            <img src={captain.img} alt={captain.name} width={64} height={64} className="w-16 h-16 rounded-xl object-cover" loading="lazy" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground tracking-widest">CAPTAIN</div>
              <div className="font-display font-bold text-lg flex items-center gap-2">
                <Crown className="w-4 h-4 text-csk-yellow" /> {captain.name}
              </div>
            </div>
          </div>
        )}

        {/* Reactions */}
        <div className="space-y-2">
          <h3 className="text-sm font-display font-bold tracking-wider text-muted-foreground">FAN REACTIONS</h3>
          {result.reactions.map((r, i) => (
            <div
              key={i}
              className="csk-card rounded-xl p-4 text-sm animate-float-up"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {r}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleShare}
            className="py-4 rounded-xl bg-csk-yellow text-csk-navy-deep font-display font-bold tracking-wider hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> SHARE MY XI
          </button>
          <Link
            to="/builder"
            onClick={() => { reset(); }}
            className="py-4 rounded-xl bg-secondary text-foreground font-display font-bold tracking-wider hover:bg-secondary/70 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> BUILD AGAIN
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground font-bold tracking-wider uppercase">{label}</span>
        <span className="text-csk-yellow font-bold">{value}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-csk-yellow to-csk-yellow-bright rounded-full transition-all duration-1000"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
