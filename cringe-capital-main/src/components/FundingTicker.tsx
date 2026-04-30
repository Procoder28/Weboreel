import { useEffect, useState } from "react";
import { generateTickerItem } from "@/lib/generators";

export function FundingTicker() {
  const [items, setItems] = useState<string[]>(() => Array.from({ length: 12 }, generateTickerItem));

  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) => [...prev.slice(1), generateTickerItem()]);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  // duplicate for seamless marquee
  const loop = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden border-y border-border bg-navy text-navy-foreground">
      <div className="absolute left-0 top-0 z-10 flex h-full items-center gap-2 bg-gradient-neon px-3 text-xs font-bold uppercase tracking-wider">
        <span className="size-2 animate-pulse rounded-full bg-white" /> Live Funding
      </div>
      <div className="flex gap-8 whitespace-nowrap py-2 pl-44 text-sm" style={{ animation: "marquee 60s linear infinite" }}>
        {loop.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span className="text-neon">●</span>
            <span className="opacity-90">{it}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
