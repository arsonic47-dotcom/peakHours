"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useUIStore } from "@/lib/store/uiStore";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { DailyCheckinModal } from "@/components/dashboard/DailyCheckinModal";
import { JourneyMap } from "@/components/dashboard/JourneyMap";
import { useQuote } from "@/lib/hooks/useQuote";
import { formatDuration, formatXP } from "@/lib/utils/format";
import { getLevel, getLevelTitle, getNextLevelXP, XP_PER_HOUR } from "@/lib/constants/levels";
import {
  Timer,
  Mountain,
  Flame,
  Sparkles,
  Clock,
  BookOpen,
  Trophy,
  Quote,
} from "lucide-react";
import Link from "next/link";

export function DashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const { sessions, setSessions, setLoading, loading } = useSessionStore();
  const { setDailyCheckinOpen } = useUIStore();
  const [profile, setProfile] = useState<any>(null);
  const { quote, loading: quoteLoading } = useQuote();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        router.push("/login");
        return;
      }

      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      const today = new Date().toISOString().split("T")[0];
      const { data: checkin } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (!checkin) {
        setDailyCheckinOpen(true);
      }

      const { data: sessionsData } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (sessionsData) setSessions(sessionsData);
      setLoading(false);
    };

    loadData();
  }, []);

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalHours = totalMinutes / 60;
  const totalXP = Math.floor(totalHours * XP_PER_HOUR);
  const currentLevel = getLevel(totalXP);
  const levelTitle = getLevelTitle(currentLevel.level);
  const { current, next, progress } = getNextLevelXP(totalXP);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMinutes = sessions
    .filter((s) => new Date(s.started_at) >= today)
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weekMinutes = sessions
    .filter((s) => new Date(s.started_at) >= startOfWeek)
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  const targetHours = profile?.target_hours || 2500;
  const progressPct = Math.min((totalHours / targetHours) * 100, 100);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" variant="rectangular" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          {quoteLoading ? (
            <Skeleton className="h-[60px] rounded-2xl max-w-xl mt-3" variant="rectangular" />
          ) : (
            <div className="mt-3 flex gap-3 items-start bg-surface-secondary/60 border border-border rounded-2xl px-5 py-4 max-w-xl">
              <Quote className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-text-secondary leading-relaxed italic">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="text-xs text-text-tertiary mt-1">&mdash; {quote.author}</p>
              </div>
            </div>
          )}
        </div>
        <Link href="/timer">
          <Button size="lg" className="gap-2">
            <Timer size={18} />
            Start Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <CardDescription>Today</CardDescription>
              <CardTitle className="text-2xl">{formatDuration(todayMinutes)}</CardTitle>
            </div>
          </div>
          <ProgressBar value={todayMinutes} max={120} size="sm" variant="primary" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Flame className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-2xl">{formatDuration(weekMinutes)}</CardTitle>
            </div>
          </div>
          <ProgressBar value={weekMinutes} max={600} size="sm" variant="warning" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Mountain className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardDescription>Total Hours</CardDescription>
              <CardTitle className="text-2xl">{totalHours.toFixed(1)}</CardTitle>
            </div>
          </div>
          <ProgressBar value={totalHours} max={targetHours} size="sm" variant="success" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardDescription>Level {currentLevel.level}</CardDescription>
              <CardTitle className="text-xl">{levelTitle}</CardTitle>
            </div>
          </div>
          <ProgressBar value={current} max={next} size="sm" variant="gradient" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Journey to the Summit</CardTitle>
            <Badge variant="primary">{progressPct.toFixed(0)}% Complete</Badge>
          </div>
          <JourneyMap progress={totalHours / targetHours} hours={totalHours} targetHours={targetHours} />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="text-xs text-text-tertiary mb-1">XP Earned</p>
              <p className="text-lg font-bold text-text-primary">{formatXP(totalXP)}</p>
            </div>
            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="text-xs text-text-tertiary mb-1">Sessions</p>
              <p className="text-lg font-bold text-text-primary">{sessions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <div className="space-y-3">
            <Link href="/timer">
              <Button variant="secondary" className="w-full justify-start gap-3" size="lg">
                <Timer size={18} />
                Start Focus Timer
              </Button>
            </Link>
            <Link href="/journal">
              <Button variant="secondary" className="w-full justify-start gap-3" size="lg">
                <BookOpen size={18} />
                Write Journal Entry
              </Button>
            </Link>
            <Link href="/records">
              <Button variant="secondary" className="w-full justify-start gap-3" size="lg">
                <Trophy size={18} />
                Personal Records
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <DailyCheckinModal />
    </div>
  );
}
