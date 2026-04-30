import { useEffect, useState } from "react";

interface Echo { id: number; word: string; x: number; y: number; dx: number; dy: number; }

export function WordEchoes({ words }: { words: string[] }) {
  const [echoes, setEchoes] = useState<Echo[]>([]);

  useEffect(() => {
    if (!words.length) return;
    let id = 0;
    const interval = setInterval(() => {
      const word = words[Math.floor(Math.random() * words.length)];
      const e: Echo = {
        id: id++,
        word,
        x: 10 + Math.random() * 80,
        y: 20 + Math.random() * 60,
        dx: (Math.random() - 0.5) * 120,
        dy: -40 - Math.random() * 80,
      };
      setEchoes((prev) => [...prev.slice(-6), e]);
      setTimeout(() => {
        setEchoes((prev) => prev.filter((p) => p.id !== e.id));
      }, 6000);
    }, 1800);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {echoes.map((e) => (
        <span
          key={e.id}
          className="absolute font-display italic text-2xl md:text-4xl glow-text animate-word-echo"
          style={{
            left: `${e.x}%`,
            top: `${e.y}%`,
            color: "var(--glow)",
            ["--echo-x" as any]: `${e.dx}px`,
            ["--echo-y" as any]: `${e.dy}px`,
          }}
        >
          {e.word}
        </span>
      ))}
    </div>
  );
}
