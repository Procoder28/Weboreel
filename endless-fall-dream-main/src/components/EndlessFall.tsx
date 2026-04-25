import { useEffect, useRef, useState } from "react";

type Obj = {
  x: number;
  y: number;
  type: "ring" | "coin" | "rock" | "platform";
  size: number;
  rot: number;
  vrot: number;
  vx?: number;
  hit?: boolean;
  collected?: boolean;
  passed?: boolean;
  nearMissed?: boolean;
};

type Particle = {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  hue: number;
};

type Star = { x: number; y: number; r: number; tw: number };

const STAGES = [
  { name: "Sky", from: "#7ec8ff", to: "#cfe9ff", accent: "#ffffff" },
  { name: "City", from: "#ff7e5f", to: "#2b1055", accent: "#ffd166" },
  { name: "Underground", from: "#1a0a0a", to: "#3d0a0a", accent: "#ff4d4d" },
  { name: "Stratosphere", from: "#1a1a4a", to: "#000428", accent: "#9ad8ff" },
  { name: "Space", from: "#000010", to: "#0a0033", accent: "#ffffff" },
  { name: "Abstract", from: "#240046", to: "#ff006e", accent: "#8338ec" },
];

const BEST_KEY = "endlessfall_best";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function mixColor(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${Math.round(lerp(A.r, B.r, t))}, ${Math.round(
    lerp(A.g, B.g, t)
  )}, ${Math.round(lerp(A.b, B.b, t))})`;
}

export default function EndlessFall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hud, setHud] = useState({
    speed: 0,
    distance: 0,
    score: 0,
    stage: "Sky",
    health: 3,
    intense: false,
    nearMiss: "",
  });
  const [best, setBest] = useState(0);

  const stateRef = useRef({
    started: false,
    paused: false,
    over: false,
    speed: 2,
    targetSpeed: 2,
    distance: 0,
    score: 0,
    health: 3,
    shake: 0,
    flash: 0,
    flashColor: "255,255,255",
    width: 0,
    height: 0,
    objects: [] as Obj[],
    particles: [] as Particle[],
    sparks: [] as Spark[],
    stars: [] as Star[],
    nextSpawn: 0,
    playerX: 0,
    playerTargetX: 0,
    time: 0,
    timeScale: 1,
    nearMissTimer: 0,
    nearMissText: "",
    intense: false,
    iframes: 0,
    audio: null as null | {
      ctx: AudioContext;
      windGain: GainNode;
      windSrc: AudioBufferSourceNode;
      musicGain: GainNode;
      musicOsc: OscillatorNode;
      musicOsc2: OscillatorNode;
    },
  });

  useEffect(() => {
    const v = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
    if (!isNaN(v)) setBest(v);
  }, []);

  // Init audio: wind (noise), music (drone), SFX
  const initAudio = () => {
    const s = stateRef.current;
    if (s.audio) return;
    try {
      const Ctx =
        (window.AudioContext as typeof AudioContext) ||
        ((window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext as typeof AudioContext);
      const ctx = new Ctx();

      // Wind
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;
      const windGain = ctx.createGain();
      windGain.gain.value = 0;
      src.connect(filter).connect(windGain).connect(ctx.destination);
      src.start(0);

      // Music drone
      const musicGain = ctx.createGain();
      musicGain.gain.value = 0;
      const musicOsc = ctx.createOscillator();
      musicOsc.type = "sawtooth";
      musicOsc.frequency.value = 55;
      const musicOsc2 = ctx.createOscillator();
      musicOsc2.type = "sine";
      musicOsc2.frequency.value = 110;
      const musicFilter = ctx.createBiquadFilter();
      musicFilter.type = "lowpass";
      musicFilter.frequency.value = 600;
      musicOsc.connect(musicFilter);
      musicOsc2.connect(musicFilter);
      musicFilter.connect(musicGain).connect(ctx.destination);
      musicOsc.start();
      musicOsc2.start();

      s.audio = { ctx, windGain, windSrc: src, musicGain, musicOsc, musicOsc2 };
    } catch {
      // ignore
    }
  };

  const playBlip = (freq: number, type: OscillatorType = "triangle", dur = 0.25, vol = 0.18) => {
    const s = stateRef.current;
    if (!s.audio) return;
    const { ctx } = s.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = type;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  };

  const playWhoosh = () => {
    const s = stateRef.current;
    if (!s.audio) return;
    const { ctx } = s.audio;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1200, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.3);
  };

  const spawnSparks = (x: number, y: number, n: number, hue: number) => {
    const s = stateRef.current;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 5;
      s.sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: 400 + Math.random() * 400,
        hue,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.width = w;
      s.height = h;
      if (s.playerX === 0) s.playerX = w / 2;
      if (s.playerTargetX === 0) s.playerTargetX = w / 2;
      if (s.stars.length === 0) {
        for (let i = 0; i < 160; i++) {
          s.stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.5 + 0.3,
            tw: Math.random() * Math.PI * 2,
          });
        }
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const bump = (delta: number) => {
      if (!s.started || s.paused || s.over) return;
      s.targetSpeed = Math.min(50, s.targetSpeed + delta);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      bump(Math.abs(e.deltaY) * 0.025);
    };
    let lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (s.paused || s.over) return;
      const y = e.touches[0].clientY;
      const dy = lastTouchY - y;
      lastTouchY = y;
      bump(Math.abs(dy) * 0.08);
      s.playerTargetX = e.touches[0].clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (s.paused || s.over) return;
      s.playerTargetX = e.clientX;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (s.started && !s.over) {
          s.paused = !s.paused;
          setPaused(s.paused);
        }
        return;
      }
      if (s.paused || s.over) return;
      if (e.key === "ArrowDown") bump(2);
      if (e.key === "ArrowUp") s.targetSpeed = Math.max(2, s.targetSpeed - 2);
      if (e.key === "ArrowLeft") s.playerTargetX = Math.max(40, s.playerX - 60);
      if (e.key === "ArrowRight")
        s.playerTargetX = Math.min(s.width - 40, s.playerX + 60);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKey);

    const spawnObject = () => {
      const w = s.width;
      const intense = s.intense;
      const types: Obj["type"][] = intense
        ? ["ring", "coin", "rock", "rock", "platform", "platform"]
        : ["ring", "coin", "coin", "rock", "platform"];
      const type = types[Math.floor(Math.random() * types.length)];
      const size =
        type === "platform"
          ? 80 + Math.random() * 120
          : type === "ring"
          ? 60 + Math.random() * 30
          : 24 + Math.random() * 18;
      const moving = intense && Math.random() < 0.4;
      s.objects.push({
        x: 40 + Math.random() * (w - 80),
        y: -100,
        type,
        size,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.04,
        vx: moving ? (Math.random() - 0.5) * 1.5 : 0,
      });
    };

    const spawnParticle = () => {
      s.particles.push({
        x: Math.random() * s.width,
        y: -10,
        len: 20 + Math.random() * 60,
        speed: 0.5 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.5,
      });
    };

    const triggerGameOver = () => {
      if (s.over) return;
      s.over = true;
      s.paused = false;
      setGameOver(true);
      // big shake + flash + sparks
      s.shake = 30;
      s.flash = 0.7;
      s.flashColor = "255,40,40";
      spawnSparks(s.playerX, s.height / 2, 40, 0);
      playBlip(80, "sawtooth", 0.6, 0.25);
      const dist = Math.floor(s.distance);
      const cur = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
      if (dist > cur) {
        localStorage.setItem(BEST_KEY, String(dist));
        setBest(dist);
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const realDt = Math.min(50, now - last);
      last = now;
      const active = s.started && !s.paused && !s.over;
      // Smooth time scale (slow-mo on near miss)
      const targetScale = s.nearMissTimer > 0 ? 0.35 : 1;
      s.timeScale += (targetScale - s.timeScale) * 0.15;
      const dt = active ? realDt * s.timeScale : 0;
      s.time += realDt;
      if (s.nearMissTimer > 0) s.nearMissTimer -= realDt;
      if (s.iframes > 0) s.iframes -= realDt;

      s.speed += (s.targetSpeed - s.speed) * (active ? 0.06 : 0);
      const baseline = s.started ? 3 + Math.min(18, s.distance / 700) : 0;
      if (active) {
        s.targetSpeed = Math.max(baseline, s.targetSpeed - dt * 0.004);
        s.distance += s.speed * dt * 0.05;
        s.score += s.speed * dt * 0.0005;
      }

      // Intense mode trigger
      const intenseNow = s.distance > 1200;
      if (intenseNow && !s.intense) {
        s.intense = true;
        s.flash = 0.5;
        s.flashColor = "255,0,110";
        playBlip(440, "square", 0.4, 0.2);
      }

      s.playerX += (s.playerTargetX - s.playerX) * 0.12;

      const stageF = Math.min(STAGES.length - 1.0001, s.distance / 1500);
      const i0 = Math.floor(stageF);
      const i1 = Math.min(STAGES.length - 1, i0 + 1);
      const t = stageF - i0;
      const A = STAGES[i0];
      const B = STAGES[i1];
      const from = mixColor(A.from, B.from, t);
      const to = mixColor(A.to, B.to, t);

      const grad = ctx.createLinearGradient(0, 0, 0, s.height);
      grad.addColorStop(0, from);
      grad.addColorStop(1, to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s.width, s.height);

      const shakeX = (Math.random() - 0.5) * s.shake;
      const shakeY = (Math.random() - 0.5) * s.shake;
      s.shake *= 0.9;
      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Stars
      const starAlpha = Math.max(0, (stageF - 1.5) / 3);
      if (starAlpha > 0) {
        for (const st of s.stars) {
          st.tw += 0.05;
          st.y += s.speed * 0.2;
          if (st.y > s.height) {
            st.y = -2;
            st.x = Math.random() * s.width;
          }
          ctx.globalAlpha = starAlpha * (0.6 + Math.sin(st.tw) * 0.4);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Parallax cloud layers
      const layers = [
        { speed: 0.2, alpha: 0.25, size: 120 },
        { speed: 0.5, alpha: 0.4, size: 80 },
      ];
      for (let li = 0; li < layers.length; li++) {
        const L = layers[li];
        const offset = (s.distance * L.speed * 6) % 300;
        ctx.fillStyle = `rgba(255,255,255,${L.alpha * (1 - stageF / STAGES.length)})`;
        for (let row = -1; row < Math.ceil(s.height / 300) + 2; row++) {
          for (let col = 0; col < 4; col++) {
            const x = ((col * s.width) / 3 + li * 90) % s.width;
            const y = row * 300 + offset;
            ctx.beginPath();
            ctx.ellipse(x, y, L.size, L.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Wind speed lines
      const want = Math.floor(s.speed * 2.5);
      while (s.particles.length < want) spawnParticle();
      ctx.strokeStyle = s.intense ? "rgba(255,200,255,0.8)" : "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.2;
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.y += s.speed * 6 * p.speed * (active ? s.timeScale : 0);
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.len);
        ctx.stroke();
        if (p.y > s.height + 50) s.particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      // Spawn objects
      if (s.started && !s.over) {
        s.nextSpawn -= dt;
        if (s.nextSpawn <= 0) {
          spawnObject();
          s.nextSpawn = Math.max(140, 700 - s.speed * 18);
        }
      }

      // Update + draw objects
      for (let i = s.objects.length - 1; i >= 0; i--) {
        const o = s.objects[i];
        o.y += s.speed * 6 * (active ? s.timeScale : 0);
        if (o.vx) {
          o.x += o.vx * (active ? s.timeScale : 0);
          if (o.x < 30 || o.x > s.width - 30) o.vx = -o.vx;
        }
        o.rot += o.vrot;

        const dx = o.x - s.playerX;
        const dy = o.y - s.height / 2;
        const dist = Math.hypot(dx, dy);
        const hitR = o.size * 0.5 + 16;

        // Near miss detection
        if (
          !o.collected &&
          !o.hit &&
          !o.passed &&
          o.y > s.height / 2 + 30 &&
          (o.type === "rock" || o.type === "platform")
        ) {
          o.passed = true;
          if (dist < hitR + 30 && dist > hitR) {
            o.nearMissed = true;
            s.nearMissTimer = 600;
            s.nearMissText = "SO CLOSE!";
            s.score += 30;
            playBlip(1500, "sine", 0.15, 0.1);
          }
        }

        if (!o.collected && !o.hit && dist < hitR) {
          if (o.type === "coin") {
            o.collected = true;
            s.score += 50;
            s.flash = 0.3;
            s.flashColor = "255,209,102";
            spawnSparks(o.x, o.y, 12, 50);
            playBlip(880);
          } else if (o.type === "ring") {
            o.collected = true;
            s.score += 20;
            s.flash = 0.25;
            s.flashColor = "255,255,255";
            spawnSparks(o.x, o.y, 16, 200);
            playWhoosh();
          } else if (o.type === "rock" || o.type === "platform") {
            if (s.iframes <= 0) {
              o.hit = true;
              s.shake = 22;
              s.flash = 0.5;
              s.flashColor = "255,40,40";
              s.targetSpeed = Math.max(2, s.targetSpeed * 0.45);
              s.health -= 1;
              s.iframes = 1200;
              spawnSparks(o.x, o.y, 20, 0);
              playBlip(120, "sawtooth", 0.35, 0.22);
              if (s.health <= 0) triggerGameOver();
            }
          }
        }

        // Draw
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        if (o.type === "ring") {
          if (!o.collected) {
            ctx.shadowColor = A.accent;
            ctx.shadowBlur = s.intense ? 25 : 15;
            ctx.strokeStyle = A.accent;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, o.size / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        } else if (o.type === "coin") {
          if (!o.collected) {
            ctx.shadowColor = "#ffd166";
            ctx.shadowBlur = 18;
            ctx.fillStyle = "#ffd166";
            ctx.beginPath();
            ctx.arc(0, 0, o.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#fff3b0";
            ctx.beginPath();
            ctx.arc(-2, -2, o.size / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (o.type === "rock") {
          ctx.shadowColor = "#ff2222";
          ctx.shadowBlur = s.intense ? 18 : 8;
          ctx.fillStyle = o.hit ? "#882222" : "#2a2a2a";
          ctx.beginPath();
          ctx.moveTo(-o.size / 2, 0);
          ctx.lineTo(0, -o.size / 2);
          ctx.lineTo(o.size / 2, 0);
          ctx.lineTo(0, o.size / 2);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(255,80,80,0.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.shadowColor = "#ff006e";
          ctx.shadowBlur = s.intense ? 18 : 6;
          ctx.fillStyle = o.hit ? "rgba(80,20,40,0.85)" : "rgba(40,40,60,0.9)";
          ctx.fillRect(-o.size / 2, -10, o.size, 20);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(255,0,110,0.5)";
          ctx.fillRect(-o.size / 2, -10, o.size, 3);
        }
        ctx.restore();

        if (o.y > s.height + 100) s.objects.splice(i, 1);
      }

      // Sparks
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.life += realDt;
        sp.x += sp.vx;
        sp.y += sp.vy + s.speed * 0.5 * (active ? s.timeScale : 0);
        sp.vx *= 0.97;
        sp.vy *= 0.97;
        const a = 1 - sp.life / sp.max;
        if (a <= 0) {
          s.sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = `hsl(${sp.hue}, 90%, 65%)`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Player
      ctx.save();
      ctx.translate(s.playerX, s.height / 2);
      const sway = Math.sin(s.time * 0.005) * 0.1;
      ctx.rotate(sway);
      const flicker = s.iframes > 0 ? 0.4 + Math.sin(s.time * 0.05) * 0.4 : 1;
      ctx.globalAlpha = flicker;
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
      pg.addColorStop(0, s.intense ? "rgba(255,0,200,0.6)" : "rgba(255,255,255,0.5)");
      pg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = pg;
      ctx.fillRect(-60, -60, 120, 120);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(0, -18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-22, -25);
      ctx.moveTo(10, -5);
      ctx.lineTo(22, -25);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Flash
      if (s.flash > 0) {
        ctx.fillStyle = `rgba(${s.flashColor},${s.flash})`;
        ctx.fillRect(0, 0, s.width, s.height);
        s.flash *= 0.85;
      }

      // Speed vignette
      const vAlpha = Math.min(0.7, s.speed / 60);
      const vg = ctx.createRadialGradient(
        s.width / 2,
        s.height / 2,
        Math.min(s.width, s.height) * 0.2,
        s.width / 2,
        s.height / 2,
        Math.max(s.width, s.height) * 0.7
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, s.intense ? `rgba(40,0,30,${vAlpha})` : `rgba(0,0,0,${vAlpha})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, s.width, s.height);

      ctx.restore();

      // Audio
      if (s.audio) {
        const wG = s.paused || s.over ? 0 : Math.min(0.4, s.speed / 100);
        const mG = s.paused || s.over ? 0 : Math.min(0.08, s.distance / 8000 + (s.intense ? 0.04 : 0));
        s.audio.windGain.gain.setTargetAtTime(wG, s.audio.ctx.currentTime, 0.15);
        s.audio.musicGain.gain.setTargetAtTime(mG, s.audio.ctx.currentTime, 0.3);
        s.audio.musicOsc2.frequency.setTargetAtTime(
          110 + s.speed * 2,
          s.audio.ctx.currentTime,
          0.2
        );
      }

      // HUD update (throttled)
      if (Math.floor(s.time / 100) % 2 === 0) {
        setHud({
          speed: s.speed,
          distance: s.distance,
          score: Math.floor(s.score),
          stage: STAGES[i0].name,
          health: s.health,
          intense: s.intense,
          nearMiss: s.nearMissTimer > 0 ? s.nearMissText : "",
        });
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKey);
      if (s.audio) {
        try {
          s.audio.windSrc.stop();
          s.audio.musicOsc.stop();
          s.audio.musicOsc2.stop();
          s.audio.ctx.close();
        } catch {
          // ignore
        }
        s.audio = null;
      }
    };
  }, []);

  const handleStart = () => {
    const s = stateRef.current;
    s.started = true;
    s.paused = false;
    s.over = false;
    s.targetSpeed = 6;
    s.health = 3;
    initAudio();
    setPaused(false);
    setGameOver(false);
    setStarted(true);
  };

  const togglePause = () => {
    const s = stateRef.current;
    if (!s.started || s.over) return;
    s.paused = !s.paused;
    setPaused(s.paused);
  };

  const handleRestart = () => {
    const s = stateRef.current;
    s.objects = [];
    s.particles = [];
    s.sparks = [];
    s.distance = 0;
    s.score = 0;
    s.health = 3;
    s.speed = 2;
    s.targetSpeed = 6;
    s.shake = 0;
    s.flash = 0;
    s.nextSpawn = 0;
    s.intense = false;
    s.iframes = 0;
    s.nearMissTimer = 0;
    s.timeScale = 1;
    s.playerX = s.width / 2;
    s.playerTargetX = s.width / 2;
    s.started = true;
    s.paused = false;
    s.over = false;
    setPaused(false);
    setGameOver(false);
    setStarted(true);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-background select-none touch-none">
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* HUD */}
      {started && !gameOver && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 p-4 flex justify-between items-start text-foreground font-mono text-xs sm:text-sm tracking-wider animate-fade-in">
          <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 text-white">
            <div className="opacity-60">STAGE</div>
            <div className="text-base font-bold">{hud.stage}</div>
            <div className="mt-2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < hud.health ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={togglePause}
              aria-label={paused ? "Resume" : "Pause"}
              className="bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 text-white text-xs font-bold tracking-wider transition-colors"
            >
              {paused ? "▶ RESUME" : "❚❚ PAUSE"}
            </button>
            <button
              onClick={handleRestart}
              aria-label="Restart"
              className="bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 text-white text-xs font-bold tracking-wider transition-colors"
            >
              ↻ RESTART
            </button>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 text-white text-right">
            <div className="opacity-60">DISTANCE</div>
            <div className="text-base font-bold">{Math.floor(hud.distance)} m</div>
            <div className="opacity-60 mt-1 text-[10px]">BEST {best} m</div>
          </div>
        </div>
      )}

      {/* Intense mode banner */}
      {started && hud.intense && !gameOver && (
        <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 animate-fade-in">
          <div className="px-4 py-1 rounded-full bg-pink-600/30 border border-pink-400/60 backdrop-blur-md text-pink-100 font-mono text-[10px] tracking-[0.4em] shadow-[0_0_20px_rgba(255,0,110,0.5)]">
            ⚡ INTENSE MODE ⚡
          </div>
        </div>
      )}

      {/* Near miss text */}
      {started && hud.nearMiss && !gameOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-4xl sm:text-6xl font-black text-white tracking-tight animate-scale-in drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
            {hud.nearMiss}
          </div>
        </div>
      )}

      {started && !gameOver && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end text-white font-mono text-xs sm:text-sm animate-fade-in">
          <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2">
            <div className="opacity-60">SPEED</div>
            <div className="text-base font-bold">{hud.speed.toFixed(1)} x</div>
            <div className="mt-1 h-1 w-24 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hud.intense ? "bg-pink-400" : "bg-white"
                }`}
                style={{ width: `${Math.min(100, (hud.speed / 50) * 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-2 text-right">
            <div className="opacity-60">SCORE</div>
            <div className="text-base font-bold">{hud.score}</div>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {started && paused && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white text-center px-6 animate-fade-in">
          <div className="text-xs tracking-[0.4em] opacity-70 mb-3">PAUSED</div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-8">
            TAKE A BREATH
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={togglePause}
              className="px-8 py-3 rounded-full bg-white text-black font-bold tracking-widest text-sm hover-scale transition-transform"
            >
              ▶ RESUME
            </button>
            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-full bg-white/10 border border-white/30 text-white font-bold tracking-widest text-sm hover-scale transition-transform"
            >
              ↻ RESTART
            </button>
          </div>
          <div className="mt-8 text-xs opacity-50 font-mono">
            Press P or ESC to resume
          </div>
        </div>
      )}

      {/* Game over */}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white text-center px-6 animate-fade-in">
          <div className="text-xs tracking-[0.4em] text-red-400 mb-3 animate-pulse">YOU FELL TOO HARD</div>
          <h2 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 drop-shadow-[0_0_30px_rgba(255,0,80,0.6)]">
            GAME OVER
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-8 font-mono">
            <div>
              <div className="opacity-60 text-xs">DISTANCE</div>
              <div className="text-3xl font-bold">{Math.floor(hud.distance)} m</div>
            </div>
            <div>
              <div className="opacity-60 text-xs">SCORE</div>
              <div className="text-3xl font-bold">{hud.score}</div>
            </div>
          </div>
          <div className="mb-8 font-mono text-sm">
            <span className="opacity-60">BEST </span>
            <span className="font-bold text-yellow-300">{best} m</span>
            {Math.floor(hud.distance) >= best && best > 0 && (
              <div className="mt-2 text-yellow-300 animate-pulse">★ NEW RECORD ★</div>
            )}
          </div>
          <button
            onClick={handleRestart}
            className="px-10 py-4 rounded-full bg-white text-black font-bold tracking-widest text-sm hover-scale transition-transform"
          >
            ↻ PLAY AGAIN
          </button>
        </div>
      )}

      {/* Start screen */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm text-white text-center px-6 animate-fade-in">
          <div className="text-xs tracking-[0.4em] opacity-70 mb-4 animate-pulse">ENDLESS FALLING</div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            CAN YOU SURVIVE?
          </h1>
          <p className="max-w-md text-sm sm:text-base opacity-80 mb-2">
            Scroll if you dare… you won't stop falling.
          </p>
          <p className="max-w-md text-xs opacity-60 mb-8 font-mono">
            Dodge rocks · Grab rings · Survive the void
          </p>
          <button
            onClick={handleStart}
            className="group relative px-10 py-4 rounded-full bg-white text-black font-bold tracking-widest text-sm hover-scale transition-transform shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            ▼ START FALLING ▼
          </button>
          {best > 0 && (
            <div className="mt-6 text-xs font-mono opacity-70">
              BEST <span className="text-yellow-300 font-bold">{best} m</span>
            </div>
          )}
          <div className="mt-10 text-xs opacity-50 font-mono">
            P / ESC to pause · ← → to dodge
          </div>
        </div>
      )}
    </div>
  );
}
