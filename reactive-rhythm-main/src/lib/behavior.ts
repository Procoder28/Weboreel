// Global behavior tracker. React components subscribe.

export type Phase = 0 | 1 | 2 | 3 | 4 | 5;

export interface BehaviorState {
  phase: Phase;
  impatience: number; // 0..100
  calm: number; // 0..100
  scrollSpeed: number; // px/s smoothed
  clickBursts: number;
  idleMs: number;
  sectionsRead: number;
  sectionsSkipped: number;
  totalSectionsSeen: number;
  hoveredCarefully: number;
  startedAt: number;
  lastMessage: string | null;
  lastMessageAt: number;
  mood: "calm" | "tense" | "glitch";
}

type Listener = (s: BehaviorState) => void;

class BehaviorTracker {
  state: BehaviorState = {
    phase: 0,
    impatience: 0,
    calm: 0,
    scrollSpeed: 0,
    clickBursts: 0,
    idleMs: 0,
    sectionsRead: 0,
    sectionsSkipped: 0,
    totalSectionsSeen: 0,
    hoveredCarefully: 0,
    startedAt: 0,
    lastMessage: null,
    lastMessageAt: 0,
    mood: "calm",
  };

  private listeners = new Set<Listener>();
  private lastScrollY = 0;
  private lastScrollT = 0;
  private clickTimes: number[] = [];
  private lastInteraction = 0;
  private sectionFirstSeen = new Map<string, number>();
  private tick: number | null = null;
  private started = false;

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    this.state.startedAt = performance.now();
    this.lastInteraction = performance.now();
    this.lastScrollY = window.scrollY;
    this.lastScrollT = performance.now();

    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("click", this.onClick);
    window.addEventListener("mousemove", this.onMove);
    window.addEventListener("touchmove", this.onMove, { passive: true });

    this.tick = window.setInterval(this.loop, 250);
  }

  stop() {
    if (!this.started) return;
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("click", this.onClick);
    window.removeEventListener("mousemove", this.onMove);
    window.removeEventListener("touchmove", this.onMove);
    if (this.tick !== null) clearInterval(this.tick);
    this.started = false;
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    l(this.state);
    return () => this.listeners.delete(l);
  }

  private emit() {
    this.listeners.forEach((l) => l(this.state));
  }

  setMessage(msg: string) {
    this.state.lastMessage = msg;
    this.state.lastMessageAt = performance.now();
    this.emit();
  }

  markSectionSeen(id: string) {
    if (!this.sectionFirstSeen.has(id)) {
      this.sectionFirstSeen.set(id, performance.now());
      this.state.totalSectionsSeen += 1;
    }
  }

  markSectionLeft(id: string) {
    const seen = this.sectionFirstSeen.get(id);
    if (!seen) return;
    const dwell = performance.now() - seen;
    if (dwell < 900) this.state.sectionsSkipped += 1;
    else this.state.sectionsRead += 1;
    this.sectionFirstSeen.delete(id);
  }

  private onScroll = () => {
    const now = performance.now();
    const y = window.scrollY;
    const dy = Math.abs(y - this.lastScrollY);
    const dt = Math.max(1, now - this.lastScrollT);
    const speed = (dy / dt) * 1000;
    this.state.scrollSpeed = this.state.scrollSpeed * 0.7 + speed * 0.3;
    this.lastScrollY = y;
    this.lastScrollT = now;
    this.lastInteraction = now;
  };

  private onClick = () => {
    const now = performance.now();
    this.clickTimes.push(now);
    this.clickTimes = this.clickTimes.filter((t) => now - t < 1500);
    if (this.clickTimes.length >= 4) {
      this.state.clickBursts += 1;
      this.state.impatience = Math.min(100, this.state.impatience + 12);
      this.clickTimes = [];
    }
    this.lastInteraction = now;
  };

  private onMove = () => {
    this.lastInteraction = performance.now();
  };

  private loop = () => {
    const now = performance.now();
    const idle = now - this.lastInteraction;
    this.state.idleMs = idle;

    // Rising impatience from fast scroll
    if (this.state.scrollSpeed > 2600) {
      this.state.impatience = Math.min(100, this.state.impatience + 2.2);
    } else if (this.state.scrollSpeed > 1400) {
      this.state.impatience = Math.min(100, this.state.impatience + 0.8);
    } else if (this.state.scrollSpeed < 300 && idle < 3000) {
      this.state.impatience = Math.max(0, this.state.impatience - 0.5);
      this.state.calm = Math.min(100, this.state.calm + 0.4);
    }

    // Idle rewards calm (but not too long)
    if (idle > 2500 && idle < 15000) {
      this.state.calm = Math.min(100, this.state.calm + 0.3);
    }

    // Skipped sections push impatience up
    const skipRatio =
      this.state.totalSectionsSeen > 0
        ? this.state.sectionsSkipped / this.state.totalSectionsSeen
        : 0;
    if (skipRatio > 0.5) {
      this.state.impatience = Math.min(100, this.state.impatience + 0.4);
    }

    // Phase ladder
    const imp = this.state.impatience;
    let phase: Phase = 0;
    if (imp > 12) phase = 1;
    if (imp > 32) phase = 2;
    if (imp > 52) phase = 3;
    if (imp > 72) phase = 4;
    if (imp > 88) phase = 5;
    this.state.phase = phase;

    // Mood
    this.state.mood = imp > 72 ? "glitch" : imp > 32 ? "tense" : "calm";

    this.emit();
  };
}

export const behavior = new BehaviorTracker();
