import { useEffect, useRef, type ReactNode } from "react";
import { behavior } from "@/lib/behavior";
import { useBehavior } from "@/hooks/use-behavior";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  hideable?: boolean; // disappears at phase 4+ if skipped
}

export function Section({ id, eyebrow, title, children, hideable }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const s = useBehavior();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            behavior.markSectionSeen(id);
            el.dataset.visible = "true";
          } else if (el.dataset.visible === "true") {
            behavior.markSectionLeft(id);
            el.dataset.visible = "false";
          }
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  const hidden = hideable && s.phase >= 4;
  const blurred = s.scrollSpeed > 3500 && s.phase >= 2;

  return (
    <section
      ref={ref}
      id={id}
      className="relative mx-auto w-full max-w-3xl px-6 py-28 md:py-40"
      style={{
        filter: blurred ? "blur(6px)" : undefined,
        transition: "filter 0.6s var(--ease-cinema)",
      }}
    >
      {hidden ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-10 text-center backdrop-blur">
          <p
            className="text-lg font-light text-muted-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            You missed it.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
            Content hidden — you were moving too fast
          </p>
        </div>
      ) : (
        <>
          {eyebrow && (
            <div className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h2 className="text-balance text-4xl font-light leading-[1.05] md:text-6xl">
            {title}
          </h2>
          <div className="mt-8 space-y-6 text-lg leading-relaxed text-foreground/80 md:text-xl">
            {children}
          </div>
        </>
      )}
    </section>
  );
}
