import { useRef, useState, type ReactNode, type CSSProperties } from "react";
import { audio } from "@/lib/audio-engine";
import { behavior } from "@/lib/behavior";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost";
}

export function DodgeButton({ children, onClick, className = "", variant = "primary" }: Props) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const clickTimes = useRef<number[]>([]);

  const base =
    "relative inline-flex items-center justify-center rounded-full px-8 py-4 text-sm uppercase tracking-[0.25em] transition-all duration-500";
  const variants = {
    primary:
      "bg-foreground text-background hover:bg-foreground/90 shadow-[var(--shadow-glow)]",
    ghost: "border border-border bg-transparent text-foreground hover:bg-card",
  };

  const handleClick = () => {
    const now = performance.now();
    clickTimes.current.push(now);
    clickTimes.current = clickTimes.current.filter((t) => now - t < 1200);

    if (clickTimes.current.length >= 3) {
      // dodge
      audio.click(true);
      setOffset({
        x: (Math.random() - 0.5) * 160,
        y: (Math.random() - 0.5) * 80,
      });
      behavior.setMessage("Stop clicking.");
      setTimeout(() => setOffset({ x: 0, y: 0 }), 600);
      return;
    }
    audio.click(false);
    onClick?.();
  };

  const style: CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
  };

  return (
    <button
      onClick={handleClick}
      className={`${base} ${variants[variant]} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}
