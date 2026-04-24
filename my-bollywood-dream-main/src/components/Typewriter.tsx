import { useEffect, useState } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onDone?: () => void;
}

export function Typewriter({ text, speed = 28, className, onDone }: TypewriterProps) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, onDone]);

  return (
    <span className={className}>
      {shown}
      <span className="inline-block w-[2px] h-[1em] align-middle bg-gold ml-1 animate-pulse" />
    </span>
  );
}
