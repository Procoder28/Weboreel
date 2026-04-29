import { useEffect, useRef, useState } from "react";

/**
 * The Reverse Story
 * Index 0 = true beginning (top), last index = ending (bottom, shown first).
 * Page initially scrolls to bottom; scrolling UP reveals the past.
 */

type Segment = {
  text: string;
  hint?: string;
  tone: number; // 0 = ending mood, 1 = beginning mood
};

const SEGMENTS: Segment[] = [
  {
    text: "On her first day, she planted a single seed by the window and whispered, \u201CGrow with me.\u201D",
    hint: "spring, 1962",
    tone: 1.0,
  },
  {
    text: "Years passed. The vine climbed the glass, and every morning she opened the curtains just to say hello.",
    tone: 0.85,
  },
  {
    text: "When her hands grew tired, her granddaughter began watering it for her, never asking why it mattered so much.",
    tone: 0.65,
  },
  {
    text: "The day she moved away, she left only one instruction taped to the pot: \u201CKeep the curtains open.\u201D",
    tone: 0.45,
  },
  {
    text: "Now the room is quiet. The window is open. The vine still leans toward the morning light.",
    tone: 0.25,
  },
  {
    text: "She is gone, and yet something in this room is still reaching for the sun.",
    tone: 0.0,
  },
];

const FINAL_LINE = "The story never changed. Only your understanding did.";
const MIDPOINT = Math.floor(SEGMENTS.length / 2); // wow moment trigger

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function toneToBackground(tone: number, parallax: number) {
  // tone 0 (ending): cold, dim indigo. tone 1 (beginning): warm amber dawn.
  const l1 = lerp(0.1, 0.34, tone);
  const l2 = lerp(0.05, 0.14, tone);
  const c1 = lerp(0.02, 0.11, tone);
  const c2 = lerp(0.015, 0.06, tone);
  const h1 = lerp(265, 55, tone);
  const h2 = lerp(280, 30, tone);
  // parallax shifts the focal point of the radial gradient slightly
  const cx = 50;
  const cy = 30 + parallax * 12;
  return `radial-gradient(ellipse at ${cx}% ${cy.toFixed(1)}%, oklch(${l1.toFixed(
    3,
  )} ${c1.toFixed(3)} ${h1.toFixed(1)}) 0%, oklch(${l2.toFixed(3)} ${c2.toFixed(
    3,
  )} ${h2.toFixed(1)}) 70%)`;
}

function toneToGlow(tone: number) {
  // warmer + brighter glow as we approach the beginning
  const l = lerp(0.7, 0.9, tone);
  const c = lerp(0.04, 0.14, tone);
  const h = lerp(260, 60, tone);
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

export default function ReverseStory() {
  const segmentRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState<number>(SEGMENTS.length - 1);
  const [reachedBeginning, setReachedBeginning] = useState(false);
  const [parallax, setParallax] = useState(0); // 0..1 across the page
  const [wow, setWow] = useState(false);

  // Start at the ending (bottom).
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "auto" });
    });
  }, []);

  // Track which segment is centered.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = activeIndex;
        let bestRatio = 0;
        entries.forEach((entry) => {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = idx;
          }
        });
        if (bestRatio > 0) {
          setActiveIndex(bestIdx);
          if (bestIdx === 0) setReachedBeginning(true);
          // Wow moment: when crossing the midpoint upward
          setWow(bestIdx <= MIDPOINT);
        }
      },
      {
        threshold: [0.25, 0.5, 0.75],
        rootMargin: "-30% 0px -30% 0px",
      },
    );
    segmentRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parallax: track scroll progress (0 at bottom = ending, 1 at top = beginning)
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;
        const progressDown = max > 0 ? y / max : 0; // 0 top, 1 bottom
        setParallax(1 - progressDown); // 0 ending → 1 beginning
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const activeTone = SEGMENTS[activeIndex]?.tone ?? 0;
  const glow = toneToGlow(activeTone);

  return (
    <div
      className="relative w-full"
      style={{
        background: toneToBackground(activeTone, parallax),
        transition: "background 1400ms cubic-bezier(0.22, 1, 0.36, 1)",
        color: "var(--story-fg)",
      }}
    >
      {/* Parallax background layer — moves slower than the text */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04), transparent 45%)",
          transform: `translate3d(0, ${(parallax - 0.5) * -40}px, 0) scale(1.05)`,
          transition: "transform 200ms linear",
        }}
      />

      {/* Wow-moment color wash — appears at the midpoint */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.55 0.14 60 / 0.18), transparent 60%)",
          opacity: wow ? 1 : 0,
          transition: "opacity 1800ms ease",
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Scroll-up hint */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-6 left-0 right-0 z-20 flex justify-center"
        style={{
          opacity: activeIndex === SEGMENTS.length - 1 ? 0.7 : 0,
          transition: "opacity 800ms ease",
        }}
      >
        <div
          className="flex flex-col items-center gap-2 text-xs uppercase tracking-[0.3em]"
          style={{ color: "var(--story-muted)" }}
        >
          <span>scroll up</span>
          <span className="animate-bounce">↑</span>
        </div>
      </div>

      {/* Segments */}
      <div className="relative z-10 flex flex-col">
        {SEGMENTS.map((seg, i) => {
          const isActive = i === activeIndex;
          const distance = Math.abs(i - activeIndex);
          // Text parallax: active segment moves a touch with scroll progress
          const textParallaxY = isActive ? (parallax - 0.5) * 18 : 0;
          return (
            <section
              key={i}
              ref={(el) => {
                segmentRefs.current[i] = el;
              }}
              data-index={i}
              className="flex min-h-screen w-full items-center justify-center px-6 sm:px-10"
              style={{
                // subtle layout shift after the wow moment
                paddingTop: wow && i <= MIDPOINT ? "2rem" : "0rem",
                transition: "padding 1400ms ease",
              }}
            >
              <div
                className="max-w-3xl text-center"
                style={{
                  opacity: isActive ? 1 : Math.max(0.12, 1 - distance * 0.4),
                  filter: isActive
                    ? "blur(0px)"
                    : `blur(${Math.min(distance * 1.8, 5)}px)`,
                  transform: isActive
                    ? `translate3d(0, ${textParallaxY}px, 0) scale(1.04)`
                    : `translate3d(0, ${distance * 8}px, 0) scale(1)`,
                  transition:
                    "opacity 1100ms cubic-bezier(0.22,1,0.36,1) 120ms, filter 1100ms ease 120ms, transform 1100ms cubic-bezier(0.22,1,0.36,1) 120ms",
                  textShadow: isActive
                    ? `0 0 32px ${glow}, 0 0 8px ${glow}`
                    : "none",
                  willChange: "opacity, transform, filter",
                }}
              >
                {seg.hint && (
                  <p
                    className="mb-6 text-xs uppercase tracking-[0.4em]"
                    style={{
                      color: "var(--story-muted)",
                      opacity: isActive ? 0.9 : 0.4,
                      transition: "opacity 1100ms ease",
                    }}
                  >
                    {seg.hint}
                  </p>
                )}
                <p
                  className="font-serif text-3xl leading-relaxed sm:text-5xl sm:leading-[1.25]"
                  style={{
                    color: "var(--story-fg)",
                    textWrap: "balance",
                  }}
                >
                  {seg.text}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      {/* Final line */}
      <div
        aria-hidden={!reachedBeginning}
        className="pointer-events-none fixed inset-x-0 top-8 z-30 flex justify-center px-6"
        style={{
          opacity: reachedBeginning && activeIndex === 0 ? 1 : 0,
          transform:
            reachedBeginning && activeIndex === 0
              ? "translateY(0)"
              : "translateY(-8px)",
          transition: "opacity 1800ms ease 400ms, transform 1800ms ease 400ms",
        }}
      >
        <p
          className="text-center text-sm uppercase tracking-[0.3em] sm:text-base"
          style={{ color: "var(--story-accent)" }}
        >
          {FINAL_LINE}
        </p>
      </div>
    </div>
  );
}
