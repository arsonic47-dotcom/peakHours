"use client";

import { useMemo, useState, useCallback } from "react";
import type { StudySession } from "@/types";
import { useRouter } from "next/navigation";

interface StreakCalendarProps {
  sessions: StudySession[];
}

interface DayData {
  date: Date;
  minutes: number;
  dateKey: string;
}

const COLORS = [
  "bg-primary-50 dark:bg-primary-950",
  "bg-primary-200 dark:bg-primary-800",
  "bg-primary-400 dark:bg-primary-600",
  "bg-primary-600 dark:bg-primary-400",
  "bg-primary-800 dark:bg-primary-200",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getColor(minutes: number, max: number): string {
  if (minutes === 0) return "bg-surface-secondary";
  const ratio = max > 0 ? minutes / max : 0;
  const idx = Math.min(Math.floor(ratio * COLORS.length), COLORS.length - 1);
  return COLORS[idx];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function StreakCalendar({ sessions }: StreakCalendarProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ day: DayData; x: number; y: number } | null>(null);

  const { days, maxMinutes } = useMemo(() => {
    const dailyMap = new Map<string, number>();

    for (const s of sessions) {
      const key = s.started_at.slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) || 0) + s.duration_minutes);
    }

    const today = new Date();
    const daysArr: DayData[] = [];
    let max = 0;

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = formatDate(d);
      const minutes = dailyMap.get(key) || 0;
      if (minutes > max) max = minutes;
      daysArr.push({ date: d, minutes, dateKey: key });
    }

    return { days: daysArr, maxMinutes: max };
  }, [sessions]);

  const weeks = useMemo(() => {
    const result: (DayData | null)[][] = [];
    let week: (DayData | null)[] = [];

    const firstDay = days[0].date.getDay();
    const monIndex = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < monIndex; i++) {
      week.push(null);
    }

    for (const day of days) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      result.push(week);
    }

    return result;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels: { text: string; col: number }[] = [];
    let prevMonth = -1;

    for (let w = 0; w < weeks.length; w++) {
      const realDays = weeks[w].filter((d): d is DayData => d !== null);
      if (realDays.length === 0) continue;
      const midDay = realDays[Math.floor(realDays.length / 2)];
      if (midDay && midDay.date.getMonth() !== prevMonth) {
        prevMonth = midDay.date.getMonth();
        labels.push({ text: MONTH_LABELS[prevMonth], col: w });
      }
    }

    return labels;
  }, [weeks]);

  const handleMouseEnter = useCallback((day: DayData, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ day, x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin pb-2">
        <div className="min-w-[720px]">
          <div className="flex ml-10 mb-1 text-xs text-text-tertiary">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="text-left"
                style={{ marginLeft: m.col > 0 ? `${(m.col - (monthLabels[i - 1]?.col ?? 0) - 1) * 12}px` : undefined }}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            <div className="flex flex-col gap-0.5 mr-1 text-[10px] text-text-tertiary leading-[12px]">
              {DAY_LABELS.map((l) => (
                <div key={l} className="h-3 flex items-center justify-end pr-1">
                  {l}
                </div>
              ))}
            </div>

            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) =>
                    day === null ? (
                      <div key={`${wi}-${di}`} className="w-3 h-3" />
                    ) : (
                      <div
                        key={`${wi}-${di}`}
                        className={`w-3 h-3 rounded-sm cursor-pointer transition-colors duration-150 ${getColor(day.minutes, maxMinutes)}`}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => router.push(`/journal?date=${day.dateKey}`)}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 mt-3 text-xs text-text-tertiary ml-10">
            <span>Less</span>
            {COLORS.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-surface border border-border rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap text-xs pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
        >
          <p className="text-text-primary font-medium">
            {tooltip.day.date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-text-secondary text-[10px]">
            {tooltip.day.minutes > 0 ? `${tooltip.day.minutes} min` : "No activity"}
          </p>
        </div>
      )}
    </div>
  );
}
