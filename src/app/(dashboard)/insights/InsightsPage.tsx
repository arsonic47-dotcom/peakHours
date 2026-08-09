"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/store/sessionStore";
import { computeInsights, computeTodayProjection } from "@/lib/calculations/insights";
import { formatDuration, formatDate } from "@/lib/utils/format";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Lightbulb, Calendar, Clock, Moon, TrendingUp, Target, Trophy,
  Flame, Mountain, Brain, CalendarClock,
} from "lucide-react";

const iconMap: Record<string, React.FC<any>> = {
  lightbulb: Lightbulb, calendar: Calendar, clock: Clock,
  moon: Moon, trending: TrendingUp, target: Target, trophy: Trophy,
  flame: Flame, mountain: Mountain, brain: Brain, calendarClock: CalendarClock,
};

export function InsightsPage() {
  const { sessions } = useSessionStore();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !cancelled) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const insights = useMemo(
    () => computeInsights(sessions, profile?.target_hours || 2500),
    [sessions, profile?.target_hours]
  );

  const projection = useMemo(
    () => computeTodayProjection(sessions, profile?.target_hours || 2500),
    [sessions, profile?.target_hours]
  );

  const projectionText = (() => {
    if (projection.noStudyToday) {
      return "Start a session today to see your projection.";
    }
    if (projection.targetReached) {
      return `You've already reached your ${profile?.target_hours || 2500}h target \u2014 you did it!`;
    }
    const pace = formatDuration(projection.todayMinutes);
    const target = profile?.target_hours || 2500;
    const parts: string[] = [];
    if (projection.months > 0) parts.push(`${projection.months} month${projection.months > 1 ? "s" : ""}`);
    if (projection.days > 0) parts.push(`${projection.days} day${projection.days > 1 ? "s" : ""}`);
    const eta = parts.length > 0 ? parts.join(", ") : "1 day";
    return `Studying ${pace}/day, you'll reach your ${target}h target in ~${eta}.`;
  })();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Smart Insights</h1>
        <p className="text-text-secondary mt-1">Data-driven reflections on your study patterns.</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
            <CalendarClock className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <CardDescription>Today&rsquo;s Pace</CardDescription>
            <p className="text-text-primary font-medium mt-1">
              Today: {formatDuration(projection.todayMinutes)} studied
            </p>
            <p className="text-sm text-text-secondary mt-1">{projectionText}</p>
            {!projection.noStudyToday && !projection.targetReached && projection.finishDate && (
              <p className="text-sm text-text-tertiary mt-1">
                Estimated finish: {formatDate(projection.finishDate)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {insights.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" variant="rectangular" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const Icon = iconMap[insight.icon] || Lightbulb;
            return (
              <Card key={insight.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <CardDescription>{insight.label}</CardDescription>
                    <p className="text-text-primary font-medium mt-1">{insight.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
