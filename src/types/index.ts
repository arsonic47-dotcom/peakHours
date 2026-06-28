export interface Profile {
  id: string;
  display_name: string;
  target_hours: number;
  avatar_config: AvatarConfig;
  created_at: string;
  updated_at: string;
}

export interface AvatarConfig {
  hat?: string | null;
  backpack?: string | null;
  jacket?: string | null;
  walking_stick?: string | null;
  glasses?: string | null;
  flag?: string | null;
  glow?: string | null;
  trail?: string | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  duration_minutes: number;
  started_at: string;
  ended_at: string;
  mode: TimerMode;
  note?: string;
  created_at: string;
}

export type TimerMode = "pomodoro" | "fifty-ten" | "ninety-twenty" | "custom";

export interface TimerConfig {
  work: number;
  break: number;
}

export interface TimerPreset {
  id: string;
  name: string;
  work: number;
  break: number;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  type: "auto_milestone" | "manual";
  title: string;
  content: string;
  icon?: string;
  milestone_hours?: number;
  milestone_type?: MilestoneType;
  user_note?: string;
  created_at: string;
}

export type MilestoneType = "hours" | "streak" | "region" | "session" | "journey_start";

export interface DailyCheckIn {
  id: string;
  user_id: string;
  date: string;
  mood: 1 | 2 | 3 | 4;
  goal?: string;
  created_at: string;
}

export interface Level {
  level: number;
  title: string;
  xp_needed: number;
  cumulative_hours: number;
}

export type Mood = 1 | 2 | 3 | 4;

export interface Insight {
  id: string;
  type: string;
  label: string;
  value: string;
  icon: string;
  trend?: "up" | "down" | "neutral";
}

export interface YearReview {
  year: number;
  total_hours: number;
  sessions_completed: number;
  longest_streak: number;
  best_month: string;
  best_month_hours: number;
  favorite_study_time: string;
  achievements_unlocked: number;
  avg_hours_per_day: number;
}
