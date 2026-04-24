import { Particles } from "./Particles";

export function CinematicBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 animate-slow-zoom"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, oklch(0.35 0.18 25 / 0.5), transparent 50%), radial-gradient(ellipse at 80% 100%, oklch(0.35 0.18 25 / 0.35), transparent 55%), radial-gradient(ellipse at 50% 50%, oklch(0.18 0.06 30) 0%, oklch(0.05 0.01 30) 100%)",
        }}
      />
      <div className="spotlight animate-spotlight" />
      <Particles count={40} />
      <div className="film-grain" />
      <div className="vignette" />
    </div>
  );
}
