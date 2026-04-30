import { Button } from "@/components/ui/button";
import { MODES, type Mode } from "@/lib/generators";

interface Props {
  value: Mode;
  onChange: (m: Mode) => void;
}

export function ModeSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <Button
          key={m.id}
          size="sm"
          variant={value === m.id ? "default" : "outline"}
          onClick={() => onChange(m.id)}
          className={value === m.id ? "bg-gradient-neon text-neon-foreground shadow-glow" : ""}
        >
          <span className="mr-1.5">{m.emoji}</span> {m.label}
        </Button>
      ))}
    </div>
  );
}
