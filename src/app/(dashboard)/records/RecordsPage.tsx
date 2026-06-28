"use client";

import { useMemo } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { computeRecords } from "@/lib/calculations/records";
import { formatDuration, formatDate } from "@/lib/utils/format";
import {
  Clock, Flame, Calendar, TrendingUp, Zap, Target, Award,
} from "lucide-react";

const recordConfig = [
  { key: "longestSession" as const, icon: Clock, label: "Longest Session", fmt: (v: any) => v ? formatDuration(v.minutes) : "--", sub: (v: any) => v ? formatDate(v.date) : "No data" },
  { key: "bestDay" as const, icon: Flame, label: "Best Day", fmt: (v: any) => v ? `${v.hours.toFixed(1)}h` : "--", sub: (v: any) => v ? formatDate(v.date) : "No data" },
  { key: "bestWeek" as const, icon: Calendar, label: "Best Week", fmt: (v: any) => v ? `${v.hours.toFixed(1)}h` : "--", sub: (v: any) => v ? `Week of ${formatDate(v.startDate)}` : "No data" },
  { key: "bestMonth" as const, icon: TrendingUp, label: "Best Month", fmt: (v: any) => v ? `${v.hours.toFixed(1)}h` : "--", sub: (v: any) => v ? v.month : "No data" },
  { key: "longestStreak" as const, icon: Zap, label: "Longest Streak", fmt: (v: any) => v ? `${v.days} days` : "--", sub: (v: any) => v ? formatDate(v.endDate) : "No data" },
  { key: "fastest100Hours" as const, icon: Award, label: "Fastest 100 Hours", fmt: (v: any) => v ? `${v.days} days` : "--", sub: (v: any) => v ? formatDate(v.achievedAt) : "Keep climbing" },
];

export function RecordsPage() {
  const { sessions } = useSessionStore();
  const records = useMemo(() => computeRecords(sessions), [sessions]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Personal Records</h1>
        <p className="text-text-secondary mt-1">Your greatest achievements on the mountain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordConfig.map((r) => {
          const value = records[r.key];
          const Icon = r.icon;
          return (
            <Card key={r.key} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <CardDescription>{r.label}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{r.fmt(value)}</CardTitle>
              <p className="text-xs text-text-tertiary mt-1">{r.sub(value)}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <CardTitle className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-primary-600" />
            Current Streak
          </CardTitle>
          <p className="text-4xl font-bold text-text-primary">
            {records.currentStreak > 0 ? `${records.currentStreak} days` : "Start today!"}
          </p>
          <p className="text-sm text-text-tertiary mt-1">
            {records.currentStreak > 0
              ? "Keep the fire burning!"
              : "Study today to start a new streak."}
          </p>
        </Card>
      </div>
    </div>
  );
}
