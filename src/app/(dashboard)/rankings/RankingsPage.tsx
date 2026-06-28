"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils/cn";
import { CalendarDays, Medal, Trophy, Users } from "lucide-react";

type RankingScope = "friends" | "global";
type RankingPeriod = "week" | "month" | "year";

interface RankingRow {
  rank: number;
  user_id: string;
  display_name: string;
  total_minutes: number;
  total_hours: number;
}

const scopeOptions: { id: RankingScope; label: string }[] = [
  { id: "friends", label: "Friends" },
  { id: "global", label: "Global" },
];

const periodOptions: { id: RankingPeriod; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

function getPeriodRange(period: RankingPeriod) {
  const now = new Date();
  const start = new Date(now);

  if (period === "week") {
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);
    return { start, end };
  }

  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 1);
  return { start, end };
}

function formatRange(start: Date, end: Date) {
  const inclusiveEnd = new Date(end);
  inclusiveEnd.setDate(end.getDate() - 1);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${inclusiveEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

export function RankingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useUIStore();
  const [scope, setScope] = useState<RankingScope>("friends");
  const [period, setPeriod] = useState<RankingPeriod>("week");
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const displayNameCounts = useMemo(
    () =>
      rows.reduce<Record<string, number>>((counts, row) => {
        counts[row.display_name] = (counts[row.display_name] || 0) + 1;
        return counts;
      }, {}),
    [rows]
  );

  const loadRankings = useCallback(
    async (cancelled: () => boolean) => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_rankings", {
        ranking_scope: scope,
        period_start: range.start.toISOString(),
        period_end: range.end.toISOString(),
      });

      if (cancelled()) return;

      if (error) {
        showToast(error.message || "Failed to load rankings", "error");
        setRows([]);
      } else {
        setRows((data || []) as RankingRow[]);
      }
      setLoading(false);
    },
    [range.end, range.start, scope, showToast, supabase]
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void loadRankings(() => cancelled);
    });
    return () => {
      cancelled = true;
    };
  }, [loadRankings]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) {
        setCurrentUserId(user?.id || null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rankings</h1>
          <p className="text-text-secondary mt-1">Compare climbing pace across friends or the full PeakHours community.</p>
        </div>
        <Badge variant="info" className="w-fit gap-1.5">
          <CalendarDays size={13} />
          {formatRange(range.start, range.end)}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-fit gap-1.5 rounded-xl border border-border bg-surface-secondary p-1">
          {scopeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setScope(option.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                scope === option.id
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex w-fit gap-1.5 rounded-xl border border-border bg-surface-secondary p-1">
          {periodOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPeriod(option.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                period === option.id
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-5">
          <CardTitle className="flex items-center gap-2">
            {scope === "friends" ? <Users size={18} className="text-primary-600" /> : <Trophy size={18} className="text-primary-600" />}
            {scope === "friends" ? "Friends Leaderboard" : "Global Leaderboard"}
          </CardTitle>
          <CardDescription className="mt-1">
            Ranked by completed study time in the selected period.
          </CardDescription>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-xl" variant="rectangular" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <Medal className="mx-auto mb-3 h-12 w-12 text-primary-200" />
            <CardTitle className="text-base">No rankings yet</CardTitle>
            <CardDescription className="mt-1">Complete a study session to start climbing the board.</CardDescription>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.user_id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 p-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold",
                    row.rank === 1
                      ? "bg-amber-100 text-amber-700"
                      : row.rank === 2
                        ? "bg-surface-tertiary text-text-primary"
                        : row.rank === 3
                          ? "bg-orange-100 text-orange-700"
                          : "bg-surface-secondary text-text-secondary"
                  )}
                >
                  #{row.rank}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-text-primary">{row.display_name}</p>
                    {row.user_id === currentUserId && <Badge variant="primary">You</Badge>}
                  </div>
                  <p className="text-xs text-text-tertiary">
                    {row.total_minutes} focused minutes
                    {displayNameCounts[row.display_name] > 1 ? ` · ID ${row.user_id.slice(0, 8)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-text-primary">{formatDuration(row.total_minutes)}</p>
                  <p className="text-xs text-text-tertiary">{Number(row.total_hours).toFixed(1)} hours</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
