import { BarChart3, HelpCircle, Calendar, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  mode: "daily" | "random";
  onModeChange: (m: "daily" | "random") => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
}

export const Header = ({ mode, onModeChange, onOpenStats, onOpenHelp }: HeaderProps) => {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-3">
        <Button variant="ghost" size="icon" onClick={onOpenHelp} aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold tracking-wider sm:text-2xl">
            WordGuess Challenge
          </h1>
          <div className="mt-1 inline-flex rounded-full border border-border p-0.5 text-xs">
            <button
              onClick={() => onModeChange("daily")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 transition-colors",
                mode === "daily" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" /> Daily
            </button>
            <button
              onClick={() => onModeChange("random")}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 transition-colors",
                mode === "random" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <Shuffle className="h-3 w-3" /> Random
            </button>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onOpenStats} aria-label="Stats">
          <BarChart3 className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
