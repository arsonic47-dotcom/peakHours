"use client";

import { useState, useEffect, useMemo } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDuration } from "@/lib/utils/format";
import { ScrollText, Clock, Flame, Calendar, Award, Sun, BarChart3, Download, Share2 } from "lucide-react";

export function ReviewPage() {
  const { sessions } = useSessionStore();
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentYear(new Date().getFullYear());
      setMounted(true);
    });
  }, []);

  const review = useMemo(() => {
    const yearSessions = sessions.filter((s) => new Date(s.started_at).getFullYear() === currentYear);
    if (yearSessions.length === 0) return null;

    const totalHours = yearSessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60;
    const totalSessions = yearSessions.length;

    const sorted = [...yearSessions].sort((a, b) =>
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );

    const dailyMap = new Map<string, number>();
    for (const s of sorted) {
      const day = new Date(s.started_at).toISOString().split("T")[0];
      dailyMap.set(day, (dailyMap.get(day) || 0) + s.duration_minutes);
    }

    let streak = 1;
    let longestStreak = 1;
    const dates = [...dailyMap.keys()].sort();
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) { streak++; longestStreak = Math.max(longestStreak, streak); }
      else { streak = 1; }
    }

    const monthlyMap = new Map<string, number>();
    for (const [date, minutes] of dailyMap) {
      const month = date.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + minutes);
    }

    let bestMonth = "";
    let bestMonthHours = 0;
    for (const [month, hours] of monthlyMap) {
      if (hours > bestMonthHours) {
        bestMonthHours = hours;
        bestMonth = month;
      }
    }

    const hourlyMap = new Map<number, number>();
    for (const s of sorted) {
      const hour = new Date(s.started_at).getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    }

    let favoriteHour = 0;
    let maxCount = 0;
    for (const [hour, count] of hourlyMap) {
      if (count > maxCount) { maxCount = count; favoriteHour = hour; }
    }
    const ampm = favoriteHour >= 12 ? "PM" : "AM";
    const hour12 = favoriteHour % 12 || 12;

    const avgPerDay = totalHours / Math.max(dailyMap.size, 1);

    return {
      totalHours,
      totalSessions,
      longestStreak,
      bestMonth,
      bestMonthHours: bestMonthHours / 60,
      favoriteTime: `${hour12}:00 ${ampm}`,
      avgPerDay,
      activeDays: dailyMap.size,
    };
  }, [sessions, currentYear]);

  if (!mounted) {
    return (
      <div className="animate-fade-in">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-[400px] rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{currentYear} in Review</h1>
          <p className="text-text-secondary mt-1">Your year of growth and discipline.</p>
        </div>
        {review && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="gap-2">
              <Download size={14} />
              Save
            </Button>
            <Button variant="secondary" size="sm" className="gap-2">
              <Share2 size={14} />
              Share
            </Button>
          </div>
        )}
      </div>

      {!review ? (
        <Card className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <ScrollText className="h-16 w-16 text-primary-200 mx-auto mb-4" />
            <p className="text-text-secondary">No sessions recorded for {currentYear}</p>
            <p className="text-sm text-text-tertiary mt-2">Start studying to see your year in review.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-1">{currentYear} Summary</h2>
            <p className="text-primary-200 text-sm mb-6">Here&apos;s what you accomplished.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-3xl font-bold">{review.totalHours.toFixed(0)}</p>
                <p className="text-primary-200 text-sm">Hours Studied</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{review.totalSessions}</p>
                <p className="text-primary-200 text-sm">Sessions</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{review.activeDays}</p>
                <p className="text-primary-200 text-sm">Active Days</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{review.longestStreak}</p>
                <p className="text-primary-200 text-sm">Best Streak</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <CardDescription>Best Month</CardDescription>
              </div>
              <CardTitle className="text-xl">{review.bestMonth}</CardTitle>
              <p className="text-sm text-text-tertiary">{review.bestMonthHours.toFixed(1)} hours</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                  <Sun className="h-5 w-5 text-sky-600" />
                </div>
                <CardDescription>Favorite Time</CardDescription>
              </div>
              <CardTitle className="text-xl">{review.favoriteTime}</CardTitle>
              <p className="text-sm text-text-tertiary">Most productive hour</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                </div>
                <CardDescription>Avg Per Day</CardDescription>
              </div>
              <CardTitle className="text-xl">{review.avgPerDay.toFixed(1)}h</CardTitle>
              <p className="text-sm text-text-tertiary">On active days</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
