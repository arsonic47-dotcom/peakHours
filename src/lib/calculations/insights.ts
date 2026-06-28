import type { StudySession } from "@/types";
import { formatDuration } from "@/lib/utils/format";

export interface Insight {
  id: string;
  icon: string;
  label: string;
  value: string;
}

export function computeInsights(sessions: StudySession[], targetHours: number): Insight[] {
  if (sessions.length < 3) {
    return [
      { id: "placeholder", icon: "lightbulb", label: "More data needed", value: "Complete at least 3 sessions to see insights." },
    ];
  }

  const insights: Insight[] = [];

  const sorted = [...sessions].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  const dayOfWeekMinutes = new Map<number, number>();
  const dayOfWeekCount = new Map<number, number>();
  const hourlyMap = new Map<number, number>();
  const totalSessions = sessions.length;
  let totalMinutes = 0;

  for (const s of sessions) {
    const d = new Date(s.started_at);
    const day = d.getDay();
    const hour = d.getHours();
    totalMinutes += s.duration_minutes;

    dayOfWeekMinutes.set(day, (dayOfWeekMinutes.get(day) || 0) + s.duration_minutes);
    dayOfWeekCount.set(day, (dayOfWeekCount.get(day) || 0) + 1);
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + s.duration_minutes);
  }

  let bestDay: number | null = null;
  let bestDayAvg = 0;
  for (const [day, minutes] of dayOfWeekMinutes) {
    const count = dayOfWeekCount.get(day) || 1;
    const avg = minutes / count;
    if (avg > bestDayAvg) {
      bestDayAvg = avg;
      bestDay = day;
    }
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (bestDay !== null) {
    insights.push({
      id: "best-day",
      icon: "calendar",
      label: "Best Study Day",
      value: `You study best on ${dayNames[bestDay]}. Avg ${formatDuration(Math.round(bestDayAvg))} per session.`,
    });
  }

  const avgSessionLength = totalMinutes / totalSessions;
  insights.push({
    id: "avg-session",
    icon: "clock",
    label: "Average Session",
    value: `Your sessions average ${formatDuration(Math.round(avgSessionLength))}.`,
  });

  let peakHour: number | null = null;
  let peakMinutes = 0;
  for (const [hour, minutes] of hourlyMap) {
    if (minutes > peakMinutes) {
      peakMinutes = minutes;
      peakHour = hour;
    }
  }

  if (peakHour !== null) {
    const ampm = peakHour >= 12 ? "PM" : "AM";
    const hour12 = peakHour % 12 || 12;
    insights.push({
      id: "peak-time",
      icon: "moon",
      label: "Favorite Study Time",
      value: `You usually study around ${hour12}:00 ${ampm}.`,
    });
  }

  const dates = [...new Set(sorted.map((s) => new Date(s.started_at).toISOString().split("T")[0]))];
  const totalDays = dates.length;
  const avgDaily = totalDays > 0 ? totalMinutes / 60 / totalDays : 0;
  insights.push({
    id: "avg-daily",
    icon: "trending",
    label: "Average Per Day",
    value: `You study ${avgDaily.toFixed(1)} hours per active day.`,
  });

  if (targetHours > 0) {
    const totalHours = totalMinutes / 60;
    const remaining = targetHours - totalHours;
    if (remaining > 0) {
      const daysLeft = Math.ceil(remaining / avgDaily);
      insights.push({
        id: "projection",
        icon: "target",
        label: "Summit Projection",
        value: `At your current pace, you'll reach the summit in ~${daysLeft} active days.`,
      });
    } else {
      insights.push({
        id: "completed",
        icon: "trophy",
        label: "Summit Reached!",
        value: "You've reached your target hours. Congratulations!",
      });
    }
  }

  return insights;
}
