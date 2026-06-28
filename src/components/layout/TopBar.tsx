"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { useUIStore } from "@/lib/store/uiStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { Moon, Sun, Menu, Sparkles } from "lucide-react";
import { formatXP } from "@/lib/utils/format";
import { getLevel, getLevelTitle, getNextLevelXP, XP_PER_HOUR } from "@/lib/constants/levels";

export function TopBar() {
  const { theme, toggleTheme, setSidebarOpen } = useUIStore();
  const { sessions } = useSessionStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalHours = totalMinutes / 60;
  const totalXP = Math.floor(totalHours * XP_PER_HOUR);
  const level = getLevel(totalXP);
  const { current, next, progress } = getNextLevelXP(totalXP);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface/80 backdrop-blur-lg px-6">
      <button
        onClick={() => setSidebarOpen(true)}
        className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary transition-colors lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3 rounded-xl bg-surface-secondary border border-border px-4 py-2">
        <Sparkles size={16} className="text-primary-500" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            Lvl {Math.max(level.level, getLevel(totalXP).level)}
          </span>
          <span className="text-xs text-text-tertiary">•</span>
          <span className="text-xs text-text-secondary">
            {formatXP(totalXP)} XP
          </span>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="rounded-xl p-2.5 text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
      >
        {!mounted ? <div className="w-[18px] h-[18px]" /> : theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  );
}
