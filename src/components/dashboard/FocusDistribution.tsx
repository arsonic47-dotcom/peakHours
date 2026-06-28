"use client";

import { useMemo } from "react";
import type { StudySession } from "@/types";

interface FocusDistributionProps {
  sessions: StudySession[];
}

interface HourData {
  hour: number;
  minutes: number;
  label: string;
}

const HOUR_LABELS = [
  "12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a",
  "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p",
  "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p",
];

const PERIODS = [
  { label: "Night", start: 0, end: 5, color: "bg-indigo-500" },
  { label: "Morning", start: 6, end: 11, color: "bg-amber-500" },
  { label: "Afternoon", start: 12, end: 17, color: "bg-sky-500" },
  { label: "Evening", start: 18, end: 23, color: "bg-primary-500" },
];

export function FocusDistribution({ sessions }: FocusDistributionProps) {
  const hourlyData = useMemo(() => {
    const map = new Map<number, number>();
    for (let i = 0; i < 24; i++) map.set(i, 0);

    for (const s of sessions) {
      const hour = new Date(s.started_at).getHours();
      map.set(hour, (map.get(hour) || 0) + s.duration_minutes);
    }

    const data: HourData[] = [];
    let max = 0;
    for (let i = 0; i < 24; i++) {
      const minutes = map.get(i) || 0;
      if (minutes > max) max = minutes;
      data.push({ hour: i, minutes, label: HOUR_LABELS[i] });
    }

    return { data, max };
  }, [sessions]);

  if (hourlyData.max === 0) {
    return (
      <p className="text-sm text-text-tertiary text-center py-8">
        No session data yet. Start studying to see your focus time distribution.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {PERIODS.map((period) => {
        const periodData = hourlyData.data.slice(period.start, period.end + 1);
        return (
          <div key={period.label}>
            <p className="text-xs font-medium text-text-tertiary mb-2">{period.label}</p>
            <div className="space-y-1">
              {periodData.map((d) => {
                const pct = hourlyData.max > 0 ? (d.minutes / hourlyData.max) * 100 : 0;
                const hours = (d.minutes / 60).toFixed(1);
                return (
                  <div key={d.hour} className="flex items-center gap-2 group">
                    <span className="w-8 text-[10px] text-text-tertiary text-right shrink-0">
                      {d.label}
                    </span>
                    <div className="flex-1 h-5 rounded-md bg-surface-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-md transition-all duration-500 ${period.color}`}
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                    <span className="w-10 text-[10px] text-text-tertiary text-left shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.minutes > 0 ? `${hours}h` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
