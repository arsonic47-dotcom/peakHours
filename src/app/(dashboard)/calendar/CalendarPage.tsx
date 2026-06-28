"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/store/sessionStore";
import { StreakCalendar } from "@/components/dashboard/StreakCalendar";
import { FocusDistribution } from "@/components/dashboard/FocusDistribution";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Calendar, Clock } from "lucide-react";
import { DailyCheckinModal } from "@/components/dashboard/DailyCheckinModal";

export function CalendarPage() {
  const supabase = createClient();
  const { sessions, setSessions, setLoading, loading } = useSessionStore();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (data) setSessions(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[340px] rounded-2xl" variant="rectangular" />
        <Skeleton className="h-[300px] rounded-2xl" variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Activity Calendar</h1>
        <p className="text-text-secondary mt-1">Your study activity over the past year.</p>
      </div>

      <Card className="p-6">
        <CardTitle className="flex items-center gap-2 mb-6">
          <Calendar size={18} className="text-primary-600" />
          Streak Calendar
        </CardTitle>
        <StreakCalendar sessions={sessions} />
      </Card>

      <Card className="p-6">
        <CardTitle className="flex items-center gap-2 mb-6">
          <Clock size={18} className="text-primary-600" />
          Focus Time Distribution
        </CardTitle>
        <FocusDistribution sessions={sessions} />
      </Card>

      <DailyCheckinModal />
    </div>
  );
}
