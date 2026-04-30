import { useEffect, useMemo, useRef } from "react";

type Props = {
  text: string;
  input: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  focusKey?: number;
};

export function TypingArea({ text, input, onChange, disabled, focusKey }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled, focusKey]);

  const chars = useMemo(() => text.split(""), [text]);

  return (
    <div
      className="relative cursor-text rounded-2xl border border-border bg-card/60 p-6 sm:p-10 shadow-card backdrop-blur-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <p className="font-mono text-xl sm:text-2xl leading-relaxed tracking-wide select-none">
        {chars.map((ch, i) => {
          const typed = input[i];
          let cls = "type-char";
          if (typed != null) {
            cls += typed === ch ? " correct" : " wrong";
          }
          if (i === input.length && !disabled) cls += " current";
          return (
            <span key={i} className={cls}>
              {ch === " " ? "\u00A0" : ch}
            </span>
          );
        })}
      </p>

      <input
        ref={inputRef}
        type="text"
        value={input}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Typing input"
      />
    </div>
  );
}
