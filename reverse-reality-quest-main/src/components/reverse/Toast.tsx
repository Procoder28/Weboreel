import { useEffect, useState } from "react";

type Toast = { id: number; text: string };
let pushFn: ((t: string) => void) | null = null;

export function pushToast(text: string) {
  pushFn?.(text);
}

export function ToastLayer() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    pushFn = (text: string) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, text }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 1800);
    };
    return () => { pushFn = null; };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-40 flex flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="animate-fade-up rounded-full border border-accent/40 bg-background/70 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-accent backdrop-blur-md"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
