import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { PLAYERS, type Player } from "@/data/players";

export type TeamSlots = (Player | null)[];

interface TeamCtx {
  slots: TeamSlots;
  captainId: string | null;
  selectedCount: number;
  isInTeam: (id: string) => boolean;
  addPlayerToSlot: (player: Player, slotIndex: number) => boolean;
  removeFromSlot: (slotIndex: number) => void;
  setCaptain: (id: string) => void;
  reset: () => void;
  randomize: () => void;
  suggestXI: () => void;
  result: AnalysisResult | null;
  setResult: (r: AnalysisResult | null) => void;
}

export interface AnalysisResult {
  overall: number;
  batting: number;
  bowling: number;
  experience: number;
  teamTag: string;
  verdict: string;
  reactions: string[];
}

const Ctx = createContext<TeamCtx | null>(null);

const EMPTY_SLOTS: TeamSlots = Array(11).fill(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<TeamSlots>(EMPTY_SLOTS);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const isInTeam = useCallback((id: string) => slots.some((p) => p?.id === id), [slots]);

  const addPlayerToSlot = useCallback(
    (player: Player, slotIndex: number) => {
      if (slots.some((p) => p?.id === player.id)) return false;
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = player;
        return next;
      });
      return true;
    },
    [slots]
  );

  const removeFromSlot = useCallback((slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      const removed = next[slotIndex];
      if (removed && captainId === removed.id) setCaptainId(null);
      next[slotIndex] = null;
      return next;
    });
  }, [captainId]);

  const setCaptain = useCallback((id: string) => setCaptainId(id), []);

  const reset = useCallback(() => {
    setSlots(EMPTY_SLOTS);
    setCaptainId(null);
    setResult(null);
  }, []);

  const randomize = useCallback(() => {
    const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5).slice(0, 11);
    setSlots(shuffled);
    setCaptainId(shuffled[0].id);
  }, []);

  const suggestXI = useCallback(() => {
    // top-rated balanced team: 1 WK, 4 BAT, 3 AR, 3 BOWL when possible
    const byRating = [...PLAYERS].sort((a, b) => b.rating - a.rating);
    const pick = (role: string, n: number) =>
      byRating.filter((p) => p.role === role).slice(0, n);
    const xi: Player[] = [
      ...pick("WK", 1),
      ...pick("BAT", 4),
      ...pick("AR", 3),
      ...pick("BOWL", 3),
    ];
    while (xi.length < 11) {
      const next = byRating.find((p) => !xi.includes(p));
      if (!next) break;
      xi.push(next);
    }
    const final = xi.slice(0, 11);
    setSlots(final);
    setCaptainId(final.find((p) => p.id === "msd")?.id ?? final[0].id);
  }, []);

  const selectedCount = slots.filter(Boolean).length;

  return (
    <Ctx.Provider
      value={{
        slots, captainId, selectedCount,
        isInTeam, addPlayerToSlot, removeFromSlot,
        setCaptain, reset, randomize, suggestXI,
        result, setResult,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTeam must be inside TeamProvider");
  return ctx;
}
