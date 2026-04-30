import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/components/Board";
import { Keyboard } from "@/components/Keyboard";
import { Header } from "@/components/Header";
import { StatsDialog } from "@/components/StatsDialog";
import { HelpDialog } from "@/components/HelpDialog";
import { toast } from "sonner";
import {
  evaluateGuess,
  loadStats,
  recordResult,
  type LetterStatus,
  type Stats,
} from "@/lib/wordleLogic";
import { getDailyKey, getDailyWord, getRandomWord, VALID_GUESSES } from "@/lib/words";

type Mode = "daily" | "random";

interface SavedGame {
  answer: string;
  guesses: string[];
  finished: boolean;
  won: boolean;
}

const dailyStorageKey = () => `wordguess_daily_${getDailyKey()}`;

const loadDaily = (): SavedGame | null => {
  try {
    const raw = localStorage.getItem(dailyStorageKey());
    return raw ? (JSON.parse(raw) as SavedGame) : null;
  } catch {
    return null;
  }
};

const Index = () => {
  const [mode, setMode] = useState<Mode>("daily");
  const [answer, setAnswer] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [shakeRow, setShakeRow] = useState(false);
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);

  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ won: boolean; answer: string } | null>(null);

  const recordedRef = useRef(false);

  // Initialize / switch mode
  useEffect(() => {
    recordedRef.current = false;
    setCurrentGuess("");
    setResultPopup(null);
    if (mode === "daily") {
      const word = getDailyWord();
      const saved = loadDaily();
      if (saved && saved.answer === word) {
        setAnswer(word);
        setGuesses(saved.guesses);
        setFinished(saved.finished);
        setWon(saved.won);
        recordedRef.current = saved.finished; // already counted previously
      } else {
        setAnswer(word);
        setGuesses([]);
        setFinished(false);
        setWon(false);
      }
    } else {
      setAnswer(getRandomWord());
      setGuesses([]);
      setFinished(false);
      setWon(false);
    }
  }, [mode]);

  // Persist daily progress
  useEffect(() => {
    if (mode !== "daily" || !answer) return;
    const data: SavedGame = { answer, guesses, finished, won };
    localStorage.setItem(dailyStorageKey(), JSON.stringify(data));
  }, [mode, answer, guesses, finished, won]);

  const statuses: LetterStatus[][] = useMemo(
    () => guesses.map((g) => evaluateGuess(g, answer)),
    [guesses, answer]
  );

  const letterStatuses = useMemo(() => {
    const map: Record<string, LetterStatus> = {};
    const rank: Record<LetterStatus, number> = { empty: 0, absent: 1, present: 2, correct: 3 };
    guesses.forEach((g, idx) => {
      const s = statuses[idx];
      g.split("").forEach((ch, i) => {
        const prev = map[ch];
        if (!prev || rank[s[i]] > rank[prev]) map[ch] = s[i];
      });
    });
    return map;
  }, [guesses, statuses]);

  const currentRow = guesses.length;

  const triggerShake = useCallback(() => {
    setShakeRow(true);
    setTimeout(() => setShakeRow(false), 500);
  }, []);

  const handleSubmit = useCallback(() => {
    if (finished) return;
    if (currentGuess.length !== 5) {
      triggerShake();
      toast("Not enough letters");
      return;
    }
    if (!VALID_GUESSES.has(currentGuess)) {
      triggerShake();
      toast("Not in word list");
      return;
    }
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    const isWin = currentGuess === answer;
    const isLastTry = newGuesses.length === 6;

    if (isWin || isLastTry) {
      setFinished(true);
      setWon(isWin);
      // Wait for flip animation before showing popup
      setTimeout(() => {
        if (!recordedRef.current) {
          const updated = recordResult(isWin, newGuesses.length);
          setStats(updated);
          recordedRef.current = true;
        }
        setResultPopup({ won: isWin, answer });
        setStatsOpen(true);
      }, 5 * 250 + 400);
    }
  }, [currentGuess, finished, guesses, answer, triggerShake]);

  const handleKey = useCallback(
    (key: string) => {
      if (finished) return;
      if (key === "ENTER") {
        handleSubmit();
        return;
      }
      if (key === "BACK") {
        setCurrentGuess((g) => g.slice(0, -1));
        return;
      }
      if (/^[a-z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((g) => g + key);
      }
    },
    [finished, currentGuess, handleSubmit]
  );

  // Physical keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("ENTER");
      } else if (e.key === "Backspace") {
        handleKey("BACK");
      } else {
        const k = e.key.toLowerCase();
        if (/^[a-z]$/.test(k)) handleKey(k);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const handlePlayAgain = () => {
    setStatsOpen(false);
    setResultPopup(null);
    setAnswer(getRandomWord());
    setGuesses([]);
    setCurrentGuess("");
    setFinished(false);
    setWon(false);
    recordedRef.current = false;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        mode={mode}
        onModeChange={setMode}
        onOpenStats={() => setStatsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <main className="flex flex-1 flex-col justify-between gap-4 py-3">
        <div className="flex flex-1 items-center justify-center">
          <Board
            guesses={guesses}
            statuses={statuses}
            currentGuess={currentGuess}
            currentRow={currentRow}
            shakeRow={shakeRow}
            won={won}
          />
        </div>

        <Keyboard onKey={handleKey} letterStatuses={letterStatuses} />
      </main>

      <StatsDialog
        open={statsOpen}
        onOpenChange={(v) => {
          setStatsOpen(v);
          if (!v) setResultPopup(null);
        }}
        stats={stats}
        result={resultPopup}
        onPlayAgain={finished ? handlePlayAgain : undefined}
        canPlayAgain={finished && (mode === "random" || true)}
      />

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default Index;
