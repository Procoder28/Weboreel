import { motion } from "framer-motion";

export function CountdownRing({
  remaining,
  total,
  size = 120,
}: {
  remaining: number;
  total: number;
  size?: number;
}) {
  const ratio = Math.max(0, Math.min(1, remaining / total));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);

  // Color transitions: green -> yellow -> red
  const color =
    remaining > total * 0.5
      ? "var(--success)"
      : remaining > total * 0.2
        ? "var(--warning)"
        : "var(--destructive)";

  const urgent = remaining <= 10;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={urgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={urgent ? { duration: 0.6, repeat: Infinity } : undefined}
      >
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color }}
        >
          {Math.ceil(remaining)}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          seconds
        </span>
      </motion.div>
    </div>
  );
}
