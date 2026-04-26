// SVG track silhouette with an animated car traveling around it.
interface Props { progress?: number; animated?: boolean; }

// Simple stylized circuit path
const TRACK_D = "M 60 200 C 60 80, 200 60, 320 80 S 540 100, 540 200 S 460 340, 320 320 S 60 340, 60 200 Z";

export function MiniTrack({ progress = 0, animated = false }: Props) {
  return (
    <div className="relative w-full aspect-[3/2] hud-panel hud-corner tele-grid p-3 overflow-hidden">
      <svg viewBox="0 0 600 400" className="w-full h-full">
        <defs>
          <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.18 235)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.65 0.27 25)" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track outer */}
        <path d={TRACK_D} fill="none" stroke="oklch(0.25 0.02 250)" strokeWidth="36" strokeLinejoin="round" />
        {/* Track inner */}
        <path d={TRACK_D} fill="none" stroke="oklch(0.13 0.012 260)" strokeWidth="28" strokeLinejoin="round" />
        {/* Center dashed */}
        <path
          d={TRACK_D}
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="2"
          strokeDasharray="8 12"
          className={animated ? "animate-dash" : ""}
        />
        {/* Start line */}
        <line x1="60" y1="180" x2="60" y2="220" stroke="oklch(0.97 0.01 240)" strokeWidth="3" strokeDasharray="4 4" />

        {/* Car marker */}
        <CarMarker progress={progress} />
      </svg>
    </div>
  );
}

function CarMarker({ progress }: { progress: number }) {
  // Approximate the track as an ellipse for car position
  const cx = 300, cy = 200, rx = 240, ry = 140;
  const angle = progress * Math.PI * 2 - Math.PI;
  const x = cx + rx * Math.cos(angle);
  const y = cy + ry * Math.sin(angle);
  const rot = (angle * 180) / Math.PI + 90;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} filter="url(#glow)">
      <rect x="-8" y="-14" width="16" height="28" rx="3" fill="oklch(0.65 0.27 25)" />
      <rect x="-10" y="-6" width="20" height="6" fill="oklch(0.97 0.01 240)" opacity="0.9" />
      <circle cx="0" cy="-14" r="3" fill="oklch(0.97 0.01 240)" />
    </g>
  );
}
