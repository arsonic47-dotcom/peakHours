import type { StudySession } from "@/types";
import { formatDuration, formatDate, formatXP } from "@/lib/utils/format";
import { getLevelFromHours, getLevelTitle, getXPForLevel } from "@/lib/constants/levels";

export interface Insight {
  id: string;
  icon: string;
  label: string;
  value: string;
}

const REGIONS = [
  "Base Camp", "Low Forest", "Mid Ridge", "Snow Line",
  "High Pass", "Summit Zone", "Peak",
];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getUniqueDates(sorted: StudySession[]): string[] {
  const set = new Set<string>();
  for (const s of sorted) {
    set.add(s.started_at.split("T")[0]);
  }
  return [...set].sort();
}

function getStreaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  let current = 0;
  const last = dates[dates.length - 1];
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const diff = (new Date(dates[i + 1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
      if (Math.round(diff) === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

function getLastCompleteWeeks(sessions: StudySession[]): { hours: number[]; labels: string[] } {
  const weeklyMap = new Map<string, number>();
  for (const s of sessions) {
    const ws = getWeekStart(new Date(s.started_at));
    weeklyMap.set(ws, (weeklyMap.get(ws) || 0) + s.duration_minutes / 60);
  }

  const currentWeekStart = getWeekStart(new Date());
  const sortedWeeks = [...weeklyMap.entries()]
    .filter(([ws]) => ws < currentWeekStart)
    .sort(([a], [b]) => b.localeCompare(a));

  const hours = sortedWeeks.slice(0, 2).map(([, h]) => h);
  const labels = sortedWeeks.slice(0, 2).map(([ws]) => {
    const d = new Date(ws);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  return { hours, labels };
}

function getBestWeek(sessions: StudySession[]): { hours: number; label: string } {
  const weeklyMap = new Map<string, number>();
  for (const s of sessions) {
    const ws = getWeekStart(new Date(s.started_at));
    weeklyMap.set(ws, (weeklyMap.get(ws) || 0) + s.duration_minutes / 60);
  }

  let bestWeek = "";
  let bestHours = 0;
  for (const [ws, h] of weeklyMap) {
    if (h > bestHours) {
      bestHours = h;
      bestWeek = ws;
    }
  }

  const d = new Date(bestWeek);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return { hours: bestHours, label };
}

export function computeInsights(sessions: StudySession[], targetHours: number): Insight[] {
  if (sessions.length < 3) {
    return [
      { id: "placeholder", icon: "lightbulb", label: "More data needed", value: "Complete at least 3 sessions to see insights." },
    ];
  }

  const insights: Insight[] = [];

  const sorted = [...sessions].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  const uniqueDates = getUniqueDates(sorted);

  const dayOfWeekMinutes = new Map<number, number>();
  const dayOfWeekCount = new Map<number, number>();
  const hourlyMap = new Map<number, number>();
  const modeDurations = new Map<string, number[]>();
  const totalSessions = sessions.length;
  let totalMinutes = 0;
  let longestSession = 0;
  let longestSessionDate = "";

  for (const s of sessions) {
    const d = new Date(s.started_at);
    const day = d.getDay();
    const hour = d.getHours();
    totalMinutes += s.duration_minutes;

    if (s.duration_minutes > longestSession) {
      longestSession = s.duration_minutes;
      longestSessionDate = s.started_at;
    }

    dayOfWeekMinutes.set(day, (dayOfWeekMinutes.get(day) || 0) + s.duration_minutes);
    dayOfWeekCount.set(day, (dayOfWeekCount.get(day) || 0) + 1);
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + s.duration_minutes);

    if (!modeDurations.has(s.mode)) modeDurations.set(s.mode, []);
    modeDurations.get(s.mode)!.push(s.duration_minutes);
  }

  const totalHours = totalMinutes / 60;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // --- Existing: Best Study Day ---
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
  if (bestDay !== null) {
    insights.push({
      id: "best-day",
      icon: "calendar",
      label: "Best Study Day",
      value: `You study best on ${dayNames[bestDay]}. Avg ${formatDuration(Math.round(bestDayAvg))} per session.`,
    });
  }

  // --- Existing: Average Session ---
  const avgSessionLength = totalMinutes / totalSessions;
  insights.push({
    id: "avg-session",
    icon: "clock",
    label: "Average Session",
    value: `Your sessions average ${formatDuration(Math.round(avgSessionLength))}.`,
  });

  // --- Existing: Peak Time ---
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

  // --- 1. Pace Check ---
  if (targetHours > 0 && uniqueDates.length > 0) {
    const firstDate = new Date(uniqueDates[0]);
    const daysSinceFirst = Math.max(1, Math.round((Date.now() - firstDate.getTime()) / 86400000));
    const avgHoursPerDay = totalHours / daysSinceFirst;
    const avgWeeklyHours = avgHoursPerDay * 7;

    if (totalHours < targetHours) {
      const remaining = targetHours - totalHours;
      const weeksAtPace = Math.ceil(remaining / avgWeeklyHours);
      insights.push({
        id: "pace-check",
        icon: "target",
        label: "Pace Check",
        value: `You average ${avgWeeklyHours.toFixed(1)} hours/week. At this pace, you\u2019ll reach your target in ~${weeksAtPace} weeks.`,
      });
    } else {
      insights.push({
        id: "pace-check",
        icon: "target",
        label: "Pace Check",
        value: `You\u2019ve already reached your target of ${targetHours} hours. Keep going!`,
      });
    }
  }

  // --- 2. Momentum (Streaks) ---
  const { current: currentStreak, longest: longestStreak } = getStreaks(uniqueDates);
  if (currentStreak > 0 && longestStreak > 0) {
    insights.push({
      id: "momentum",
      icon: "flame",
      label: "Current Streak",
      value: currentStreak >= longestStreak
        ? `${currentStreak} days in a row \u2014 personal best! Keep it going!`
        : `${currentStreak} days in a row. Longest streak: ${longestStreak} days.`,
    });
  } else if (longestStreak > 0) {
    insights.push({
      id: "momentum",
      icon: "flame",
      label: "Current Streak",
      value: `No active streak. Your best was ${longestStreak} days. Start a new one today!`,
    });
  }

  // --- 3. Weekly Trend ---
  const { hours: weeklyHours, labels: weekLabels } = getLastCompleteWeeks(sessions);
  if (weeklyHours.length >= 2) {
    const last = weeklyHours[0];
    const prev = weeklyHours[1];
    const diff = last - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
    const direction = diff >= 0 ? "up" : "down";
    insights.push({
      id: "weekly-trend",
      icon: "trending",
      label: "Weekly Trend",
      value: `Last week: ${last.toFixed(1)}h. Previous: ${prev.toFixed(1)}h. That\u2019s ${direction} ${Math.abs(pct)}%.`,
    });
  } else if (weeklyHours.length === 1) {
    insights.push({
      id: "weekly-trend",
      icon: "trending",
      label: "Weekly Trend",
      value: `Last week: ${weeklyHours[0].toFixed(1)}h. More data needed for a comparison.`,
    });
  }

  // --- 4. Personal Bests ---
  const { hours: bestWeekHours, label: bestWeekLabel } = getBestWeek(sessions);
  const bests: string[] = [];
  bests.push(`Longest session: ${formatDuration(longestSession)}`);
  if (longestSessionDate) {
    bests[0] += ` (${formatDate(longestSessionDate)})`;
  }
  if (bestWeekHours > 0) bests.push(`Best week: ${bestWeekHours.toFixed(1)}h (${bestWeekLabel})`);
  if (longestStreak > 0) bests.push(`Best streak: ${longestStreak} days`);
  insights.push({
    id: "personal-bests",
    icon: "trophy",
    label: "Personal Bests",
    value: bests.join(". "),
  });

  // --- 5. Level & Region ---
  const level = getLevelFromHours(totalHours);
  const levelTitle = getLevelTitle(level);
  const xp = Math.floor(totalMinutes * 100 / 60);
  const nextLevelXP = getXPForLevel(level + 1);
  const currentLevelXP = getXPForLevel(level);
  const xpToNext = nextLevelXP - currentLevelXP;
  const xpProgress = nextLevelXP > currentLevelXP
    ? Math.min(100, Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))
    : 100;

  const progress = targetHours > 0 ? totalHours / targetHours : 0;
  const regionIndex = Math.min(Math.floor(progress * 7), 6);
  const regionPct = Math.round(((progress * 7) - regionIndex) * 100);

  let regionText = `Region: ${REGIONS[regionIndex]}`;
  if (regionIndex < REGIONS.length - 1) {
    regionText += ` (${regionPct}% through)`;
  } else {
    regionText += " \u2014 You\u2019re at the summit!";
  }

  insights.push({
    id: "level-region",
    icon: "mountain",
    label: "Level & Region",
    value: `Level ${level} \u2014 ${levelTitle}. ${xpProgress}% to next level. ${regionText}`,
  });

  // --- 6. Mode Performance ---
  let bestMode = "";
  let bestModeAvg = 0;
  let overallAvg = avgSessionLength;
  for (const [mode, durations] of modeDurations) {
    if (durations.length < 2) continue;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    if (avg > bestModeAvg) {
      bestModeAvg = avg;
      const modeLabels: Record<string, string> = {
        pomodoro: "Pomodoro", "fifty-ten": "50/10", "ninety-twenty": "90/20", custom: "Custom",
      };
      bestMode = modeLabels[mode] || mode;
    }
  }
  if (bestMode && bestModeAvg > overallAvg) {
    insights.push({
      id: "mode-performance",
      icon: "brain",
      label: "Best Timer Mode",
      value: `Your longest sessions use ${bestMode} mode (avg ${formatDuration(Math.round(bestModeAvg))} vs ${formatDuration(Math.round(overallAvg))} overall).`,
    });
  }

  // --- 7. Consistency ---
  const lookbackDays = 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const recentDates = uniqueDates.filter((d) => d >= cutoffStr);
  const pctRecent = Math.round((recentDates.length / lookbackDays) * 100);
  insights.push({
    id: "consistency",
    icon: "calendar",
    label: "Consistency",
    value: `Studied ${recentDates.length} of the last ${lookbackDays} days (${pctRecent}%).`,
  });

  return insights;
}
