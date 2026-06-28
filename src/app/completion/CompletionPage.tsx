"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useUIStore } from "@/lib/store/uiStore";
import { useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { computeRecords } from "@/lib/calculations/records";
import { formatDate, formatDuration } from "@/lib/utils/format";
import { motion } from "framer-motion";
import {
  Mountain, Award, Download, Share2, Sparkles, Flame, Clock, Calendar, CheckCircle,
} from "lucide-react";

export function CompletionPage() {
  const { sessions } = useSessionStore();
  const { showToast } = useUIStore();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [completionDate, setCompletionDate] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setCompletionDate(new Date().toISOString());
    });
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    };
    load();
  }, []);

  const totalMinutes = sessions.reduce((acc: number, s: any) => acc + s.duration_minutes, 0);
  const totalHours = totalMinutes / 60;
  const targetHours = profile?.target_hours || 2500;
  const daysSinceStart = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sorted = [...sessions].sort((a: any, b: any) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    const start = new Date(sorted[0].started_at);
    const end = new Date(sorted[sorted.length - 1].ended_at);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [sessions]);

  const records = useMemo(() => computeRecords(sessions), [sessions]);

  const isCompleted = totalHours >= targetHours;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-primary-600 mx-auto mb-4 flex items-center justify-center">
            <Mountain className="h-12 w-12 text-white" />
          </div>
          <p className="text-text-secondary">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Mountain className="h-16 w-16 text-primary-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Journey Not Complete</h1>
          <p className="text-text-secondary mb-6">
            You&apos;ve studied {totalHours.toFixed(1)} of {targetHours} hours. Keep climbing!
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-4 py-12">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-primary-600 mx-auto mb-6 flex items-center justify-center shadow-glow animate-float">
            <Mountain className="h-12 w-12 text-white" />
          </div>

          <h1 className="text-5xl font-bold text-text-primary mb-3">Congratulations!</h1>
          <p className="text-xl text-text-secondary mb-2">You completed {targetHours} hours.</p>
          <p className="text-text-tertiary text-lg mb-8 max-w-lg mx-auto">
            You didn&apos;t just finish studying. You built discipline.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12 flex-wrap">
            <Button size="lg" className="gap-2">
              <Download size={18} />
              Download Certificate
            </Button>
            <Button size="lg" variant="secondary" className="gap-2">
              <Share2 size={18} />
              Share Achievement
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 text-center">
            <Clock className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{totalHours.toFixed(0)}</p>
            <p className="text-xs text-text-tertiary">Total Hours</p>
          </Card>
          <Card className="p-5 text-center">
            <Calendar className="h-6 w-6 text-primary-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{daysSinceStart}</p>
            <p className="text-xs text-text-tertiary">Total Days</p>
          </Card>
          <Card className="p-5 text-center">
            <Flame className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{records.longestStreak?.days || 0}</p>
            <p className="text-xs text-text-tertiary">Best Streak</p>
          </Card>
          <Card className="p-5 text-center">
            <Award className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{sessions.length}</p>
            <p className="text-xs text-text-tertiary">Sessions</p>
          </Card>
        </div>

        <Card className="p-8 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="text-success" size={20} />
            <h2 className="text-lg font-bold text-text-primary">Completion Certificate</h2>
          </div>

          <div className="bg-surface-secondary rounded-2xl border border-border p-8 text-center mb-6">
            <Mountain className="h-12 w-12 text-primary-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-text-primary mb-1">Certificate of Completion</h3>
            <p className="text-text-secondary mb-4">This certifies that</p>
            <p className="text-3xl font-bold text-text-primary mb-4">{profile?.display_name || "Climber"}</p>
            <p className="text-text-secondary mb-1">has completed</p>
            <p className="text-xl font-semibold text-primary-600 mb-4">{targetHours} hours of focused study</p>
            <p className="text-sm text-text-tertiary">Completed on {completionDate ? formatDate(completionDate) : ""}</p>
          </div>

          <div className="flex justify-center">
            <Button className="gap-2">
              <Download size={16} />
              Download as PDF
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
