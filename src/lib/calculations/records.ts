import type { StudySession, DailyCheckIn } from "@/types";

export interface ComputedRecords {
  longestSession: { minutes: number; date: string } | null;
  bestDay: { hours: number; date: string } | null;
  bestWeek: { hours: number; startDate: string } | null;
  bestMonth: { hours: number; month: string } | null;
  mostConsistentMonth: { variance: number; month: string } | null;
  longestStreak: { days: number; endDate: string } | null;
  currentStreak: number;
  fastest100Hours: { days: number; achievedAt: string } | null;
}

export function computeRecords(sessions: StudySession[]): ComputedRecords {
  if (sessions.length === 0) {
    return {
      longestSession: null, bestDay: null, bestWeek: null, bestMonth: null,
      mostConsistentMonth: null, longestStreak: null, currentStreak: 0, fastest100Hours: null,
    };
  }

  const longestSession = sessions.reduce((best, s) =>
    s.duration_minutes > best.duration_minutes ? s : best, sessions[0]);

  const dailyMap = new Map<string, number>();
  const sorted = [...sessions].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  for (const s of sorted) {
    const day = new Date(s.started_at).toISOString().split("T")[0];
    dailyMap.set(day, (dailyMap.get(day) || 0) + s.duration_minutes);
  }

  let bestDay: { hours: number; date: string } | null = null;
  for (const [date, minutes] of dailyMap) {
    const hours = minutes / 60;
    if (!bestDay || hours > bestDay.hours) {
      bestDay = { hours, date };
    }
  }

  const weeklyMap = new Map<string, number>();
  for (const [date, minutes] of dailyMap) {
    const d = new Date(date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().split("T")[0];
    weeklyMap.set(key, (weeklyMap.get(key) || 0) + minutes);
  }

  let bestWeek: { hours: number; startDate: string } | null = null;
  for (const [startDate, minutes] of weeklyMap) {
    const hours = minutes / 60;
    if (!bestWeek || hours > bestWeek.hours) {
      bestWeek = { hours, startDate };
    }
  }

  const monthlyMap = new Map<string, number>();
  for (const [date, minutes] of dailyMap) {
    const month = date.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + minutes);
  }

  let bestMonth: { hours: number; month: string } | null = null;
  for (const [month, minutes] of monthlyMap) {
    const hours = minutes / 60;
    if (!bestMonth || hours > bestMonth.hours) {
      bestMonth = { hours, month };
    }
  }

  let mostConsistentMonth: { variance: number; month: string } | null = null;
  for (const [month, _total] of monthlyMap) {
    const daysInMonth = Object.entries(Object.fromEntries(dailyMap))
      .filter(([d]) => d.startsWith(month))
      .map(([_, m]) => m);
    if (daysInMonth.length < 2) continue;
    const mean = daysInMonth.reduce((a, b) => a + b, 0) / daysInMonth.length;
    const variance = daysInMonth.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / daysInMonth.length;
    if (!mostConsistentMonth || variance < mostConsistentMonth.variance) {
      mostConsistentMonth = { variance, month };
    }
  }

  const dates = [...new Set(sorted.map((s) => new Date(s.started_at).toISOString().split("T")[0]))].sort();
  let longestStreak: { days: number; endDate: string } | null = null;
  let currentStreak = 0;

  if (dates.length > 0) {
    let streak = 1;
    let streakEnd = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
        streakEnd = dates[i];
      } else {
        if (!longestStreak || streak > longestStreak.days) {
          longestStreak = { days: streak, endDate: streakEnd };
        }
        streak = 1;
        streakEnd = dates[i];
      }
    }
    if (!longestStreak || streak > longestStreak.days) {
      longestStreak = { days: streak, endDate: streakEnd };
    }

    const today = new Date().toISOString().split("T")[0];
    currentStreak = 0;
    const checkDate = new Date();
    while (true) {
      const key = checkDate.toISOString().split("T")[0];
      if (dailyMap.has(key)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let fastest100Hours: { days: number; achievedAt: string } | null = null;
  let cumulative = 0;
  let startTime = sorted[0]?.started_at;
  for (const s of sorted) {
    if (!startTime) startTime = s.started_at;
    cumulative += s.duration_minutes / 60;
    if (cumulative >= 100) {
      const start = new Date(startTime);
      const end = new Date(s.ended_at);
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      fastest100Hours = { days, achievedAt: s.ended_at };
      break;
    }
  }

  return {
    longestSession: { minutes: longestSession.duration_minutes, date: longestSession.started_at },
    bestDay,
    bestWeek,
    bestMonth,
    mostConsistentMonth,
    longestStreak,
    currentStreak,
    fastest100Hours,
  };
}
