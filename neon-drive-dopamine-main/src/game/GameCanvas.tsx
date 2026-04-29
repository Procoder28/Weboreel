import { useEffect, useRef } from "react";
import {
  sfxLaneSwitch, sfxNearMiss, sfxCrash, sfxBoost, setMusicIntensity,
} from "./audio";

export type GameStats = {
  distance: number;
  speed: number;
  maxSpeed: number;
  nearMisses: number;
  score: number;
};

type Props = {
  onGameOver: (stats: GameStats) => void;
  onStatsUpdate?: (stats: GameStats) => void;
  paused?: boolean;
};

const LANE_COUNT = 4;

type Obstacle = {
  lane: number;
  y: number;
  type: "car" | "barrier" | "glitch";
  passed: boolean;
  nearCounted: boolean;
  color: string;
};

export function GameCanvas({ onGameOver, onStatsUpdate, paused }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({
    lane: 1,
    targetLane: 1,
    laneX: 0,
    obstacles: [] as Obstacle[],
    spawnTimer: 0,
    distance: 0,
    speed: 6,
    maxSpeed: 6,
    roadOffset: 0,
    nearMisses: 0,
    score: 0,
    shake: 0,
    flash: 0,
    glitch: 0,
    over: false,
    last: 0,
    elapsed: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const switchLane = (dir: -1 | 1) => {
      const s = stateRef.current;
      if (s.over) return;
      const next = Math.max(0, Math.min(LANE_COUNT - 1, s.targetLane + dir));
      if (next !== s.targetLane) {
        s.targetLane = next;
        sfxLaneSwitch();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") switchLane(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") switchLane(1);
    };
    window.addEventListener("keydown", onKey);

    let touchStartX = 0;
    let touchStartY = 0;
    let touchHandled = false;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchHandled = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchHandled) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy)) {
        switchLane(dx > 0 ? 1 : -1);
        touchHandled = true;
      }
    };
    const onTap = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      switchLane(x < rect.width / 2 ? -1 : 1);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("click", onTap);

    const COLORS = ["#ff2bd6", "#00f0ff", "#b14bff", "#ff5500"];

    const spawn = () => {
      const s = stateRef.current;
      const types: Obstacle["type"][] = ["car", "car", "barrier", "glitch"];
      const type = types[Math.floor(Math.random() * types.length)];
      const lane = Math.floor(Math.random() * LANE_COUNT);
      // avoid impossible walls: don't spawn obstacles in 3 adjacent lanes within proximity
      const recent = s.obstacles.filter(o => o.y < 80);
      if (recent.length >= 2) return;
      s.obstacles.push({
        lane, y: -120, type, passed: false, nearCounted: false,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    };

    const tick = (ts: number) => {
      const s = stateRef.current;
      if (!s.last) s.last = ts;
      const dt = Math.min(0.05, (ts - s.last) / 1000);
      s.last = ts;
      if (paused || s.over) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      s.elapsed += dt;

      // difficulty scaling
      s.speed = Math.min(22, 6 + s.elapsed * 0.25);
      s.maxSpeed = Math.max(s.maxSpeed, s.speed);
      const intensity = Math.min(1, (s.speed - 6) / 16);
      setMusicIntensity(intensity);

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const roadW = Math.min(w * 0.9, 520);
      const roadX = (w - roadW) / 2;
      const laneW = roadW / LANE_COUNT;

      // smooth lane interpolation
      const targetX = roadX + s.targetLane * laneW + laneW / 2;
      s.laneX += (targetX - s.laneX) * Math.min(1, dt * 14);

      // scroll
      s.roadOffset = (s.roadOffset + s.speed * dt * 60) % 80;
      s.distance += s.speed * dt * 10;
      s.score = Math.floor(s.distance) + s.nearMisses * 50;

      // spawn
      s.spawnTimer -= dt;
      const spawnRate = Math.max(0.35, 1.1 - s.elapsed * 0.015);
      if (s.spawnTimer <= 0) {
        spawn();
        s.spawnTimer = spawnRate;
      }

      // car position
      const carY = h - 120;
      const carW = laneW * 0.55;
      const carH = 80;

      // update obstacles + collision
      for (const o of s.obstacles) {
        o.y += s.speed * dt * 80;
        const ox = roadX + o.lane * laneW + laneW / 2;
        const ow = laneW * 0.6;
        const oh = 70;
        // collision
        if (
          Math.abs(o.y - carY) < (oh + carH) / 2 - 8 &&
          Math.abs(ox - s.laneX) < (ow + carW) / 2 - 8
        ) {
          s.over = true;
          s.shake = 30;
          s.flash = 1;
          s.glitch = 1;
          sfxCrash();
          setTimeout(() => {
            onGameOver({
              distance: Math.floor(s.distance),
              speed: s.speed,
              maxSpeed: s.maxSpeed,
              nearMisses: s.nearMisses,
              score: s.score,
            });
          }, 900);
        }
        // near miss: passed within close lateral distance
        if (!o.passed && o.y > carY + 20) {
          o.passed = true;
          if (!o.nearCounted && Math.abs(ox - s.laneX) < laneW * 1.05) {
            s.nearMisses++;
            s.flash = 0.4;
            sfxNearMiss();
            o.nearCounted = true;
          }
        }
      }
      s.obstacles = s.obstacles.filter(o => o.y < h + 100);

      // decay effects
      s.shake *= Math.pow(0.001, dt);
      s.flash = Math.max(0, s.flash - dt * 2);
      s.glitch = Math.max(0, s.glitch - dt * 1.2);

      // ----- DRAW -----
      ctx.save();
      const sx = (Math.random() - 0.5) * s.shake;
      const sy = (Math.random() - 0.5) * s.shake;
      ctx.translate(sx, sy);

      // background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#08010f");
      bg.addColorStop(0.5, "#13002a");
      bg.addColorStop(1, "#1a0030");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // distant skyline
      ctx.fillStyle = "rgba(120, 0, 200, 0.35)";
      const skyY = h * 0.45;
      for (let i = 0; i < 18; i++) {
        const bx = (i * 60 + (s.roadOffset * 0.1)) % (w + 60) - 30;
        const bh = 40 + ((i * 37) % 80);
        ctx.fillRect(bx, skyY - bh, 38, bh);
      }
      // horizon glow
      const horizon = ctx.createLinearGradient(0, skyY - 4, 0, skyY + 30);
      horizon.addColorStop(0, "rgba(255, 0, 200, 0.6)");
      horizon.addColorStop(1, "rgba(255, 0, 200, 0)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, skyY - 4, w, 30);

      // sun
      const sunR = 90;
      const sunY = skyY - 20;
      const sunGrad = ctx.createRadialGradient(w / 2, sunY, 10, w / 2, sunY, sunR);
      sunGrad.addColorStop(0, "rgba(255,80,200,0.9)");
      sunGrad.addColorStop(0.6, "rgba(180,0,255,0.4)");
      sunGrad.addColorStop(1, "rgba(180,0,255,0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath(); ctx.arc(w / 2, sunY, sunR, 0, Math.PI * 2); ctx.fill();

      // road
      ctx.fillStyle = "#0a0015";
      ctx.fillRect(roadX, skyY, roadW, h - skyY);

      // road edge glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00f0ff";
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roadX, skyY); ctx.lineTo(roadX, h);
      ctx.moveTo(roadX + roadW, skyY); ctx.lineTo(roadX + roadW, h);
      ctx.stroke();

      // lane markers (perspective-ish: just dashed)
      ctx.shadowColor = "#ff2bd6";
      ctx.strokeStyle = "rgba(255,43,214,0.9)";
      ctx.lineWidth = 2;
      for (let i = 1; i < LANE_COUNT; i++) {
        const lx = roadX + i * laneW;
        ctx.beginPath();
        ctx.setLineDash([24, 24]);
        ctx.lineDashOffset = -s.roadOffset;
        ctx.moveTo(lx, skyY); ctx.lineTo(lx, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // obstacles
      for (const o of s.obstacles) {
        const ox = roadX + o.lane * laneW + laneW / 2;
        const ow = laneW * 0.6;
        const oh = 70;
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = o.color;
        if (o.type === "barrier") {
          ctx.fillStyle = "#ff3b3b";
          ctx.shadowColor = "#ff3b3b";
          ctx.fillRect(ox - ow / 2, o.y - 10, ow, 20);
          ctx.fillStyle = "#ffe600";
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(ox - ow / 2 + i * (ow / 4), o.y - 10, ow / 8, 20);
          }
        } else if (o.type === "glitch") {
          ctx.fillStyle = o.color;
          for (let i = 0; i < 4; i++) {
            const gx = ox - ow / 2 + Math.random() * ow * 0.1;
            ctx.fillRect(gx - ow / 2, o.y - oh / 2 + i * (oh / 4), ow, oh / 5);
          }
        } else {
          // car
          ctx.fillStyle = o.color;
          roundRect(ctx, ox - ow / 2, o.y - oh / 2, ow, oh, 8);
          ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(ox - ow / 2 + 6, o.y - oh / 2 + 12, ow - 12, 18);
          // taillights (toward player)
          ctx.fillStyle = "#ff0044";
          ctx.fillRect(ox - ow / 2 + 4, o.y + oh / 2 - 6, 10, 4);
          ctx.fillRect(ox + ow / 2 - 14, o.y + oh / 2 - 6, 10, 4);
        }
        ctx.restore();
      }

      // player car with motion trail
      const trailAlpha = Math.min(0.5, intensity * 0.6);
      for (let i = 1; i <= 6; i++) {
        ctx.fillStyle = `rgba(0, 240, 255, ${trailAlpha / i})`;
        ctx.fillRect(s.laneX - carW / 2 + 6, carY - carH / 2 + i * 6, carW - 12, 4);
      }
      ctx.save();
      const tilt = (s.laneX - targetX) * -0.005;
      ctx.translate(s.laneX, carY);
      ctx.rotate(tilt);
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#00f0ff";
      ctx.fillStyle = "#00f0ff";
      roundRect(ctx, -carW / 2, -carH / 2, carW, carH, 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0a0015";
      ctx.fillRect(-carW / 2 + 6, -carH / 2 + 14, carW - 12, 22);
      // headlights
      ctx.fillStyle = "#fffbe6";
      ctx.fillRect(-carW / 2 + 6, -carH / 2 + 4, 10, 5);
      ctx.fillRect(carW / 2 - 16, -carH / 2 + 4, 10, 5);
      // rear glow
      ctx.fillStyle = "#ff2bd6";
      ctx.fillRect(-carW / 2 + 8, carH / 2 - 8, carW - 16, 4);
      ctx.restore();

      // flash overlay (near miss / crash)
      if (s.flash > 0) {
        ctx.fillStyle = s.over
          ? `rgba(255, 0, 60, ${s.flash * 0.6})`
          : `rgba(255, 240, 0, ${s.flash * 0.25})`;
        ctx.fillRect(0, 0, w, h);
      }
      // glitch lines
      if (s.glitch > 0) {
        for (let i = 0; i < 8; i++) {
          const y = Math.random() * h;
          ctx.fillStyle = `rgba(0,255,255,${0.2 * s.glitch})`;
          ctx.fillRect(0, y, w, 2);
        }
      }

      // speed lines
      if (intensity > 0.1) {
        ctx.strokeStyle = `rgba(255,255,255,${0.1 + intensity * 0.2})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const lx = roadX + Math.random() * roadW;
          const ly = (Math.random() * h + s.roadOffset * 4) % h;
          ctx.beginPath();
          ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 20 + intensity * 30);
          ctx.stroke();
        }
      }

      ctx.restore();

      onStatsUpdate?.({
        distance: Math.floor(s.distance),
        speed: s.speed,
        maxSpeed: s.maxSpeed,
        nearMisses: s.nearMisses,
        score: s.score,
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("click", onTap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // unused for now; reserved for future boost sfx hook
  void sfxBoost;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
    />
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}